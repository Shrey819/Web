"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { StorefrontCategory } from "@/lib/storefront";
import { Product } from "@/types";
import {
  resolve3DCategories,
  ResolvedCategory3D,
  FALLBACK_CATEGORY_IMAGES,
} from "./category3DData";

interface CategoryDistribution3DProps {
  categories?: StorefrontCategory[];
  products?: Product[];
  config?: any;
}

interface FloatingElementConfig {
  id: string;
  top: string;
  left?: string;
  right?: string;
  type: "crosshair" | "dial" | "badge" | "diamond" | "trace";
  content: string;
  subContent?: string;
  duration: number;
  delay: number;
  rotateRange: [number, number, number];
}

const FLOATING_BG_ELEMENTS: FloatingElementConfig[] = [
  {
    id: "fl-1",
    top: "7%",
    left: "5%",
    type: "crosshair",
    content: "+ [ X: 042.8 | Y: 110.2 ]",
    subContent: "AXIS-REF-01",
    duration: 11,
    delay: 0,
    rotateRange: [-3, 3, -3],
  },
  {
    id: "fl-2",
    top: "14%",
    right: "6%",
    type: "dial",
    content: "Ø 45.00mm",
    subContent: "RUNOUT ±0.002",
    duration: 13,
    delay: 1.5,
    rotateRange: [0, 8, 0],
  },
  {
    id: "fl-3",
    top: "27%",
    left: "7%",
    type: "badge",
    content: "C5 GROUND LEAD",
    subContent: "PITCH: 5.0mm",
    duration: 10,
    delay: 2,
    rotateRange: [-2, 2, -2],
  },
  {
    id: "fl-4",
    top: "39%",
    right: "8%",
    type: "diamond",
    content: "⌖ SERVO-SYNC",
    subContent: "4000 RPM // CANopen",
    duration: 12,
    delay: 0.8,
    rotateRange: [-4, 4, -4],
  },
  {
    id: "fl-5",
    top: "53%",
    left: "6%",
    type: "trace",
    content: "SIGNAL: IP65",
    subContent: "4-20mA / MODBUS",
    duration: 14,
    delay: 2.5,
    rotateRange: [0, 4, 0],
  },
  {
    id: "fl-6",
    top: "66%",
    right: "5%",
    type: "crosshair",
    content: "+ [ Z: -25.000mm ]",
    subContent: "ORBIT-PLANE",
    duration: 11.5,
    delay: 1.2,
    rotateRange: [-3, 3, -3],
  },
  {
    id: "fl-7",
    top: "78%",
    left: "8%",
    type: "badge",
    content: "TOLERANCE: CLASS P",
    subContent: "DIN 69051",
    duration: 12.5,
    delay: 3,
    rotateRange: [-2, 2, -2],
  },
  {
    id: "fl-8",
    top: "90%",
    right: "7%",
    type: "diamond",
    content: "◇ ISO-9001:2015",
    subContent: "CALIBRATED 2026",
    duration: 13.5,
    delay: 1.8,
    rotateRange: [-4, 4, -4],
  },
];

/**
 * Floating Technical Element rendered in the background.
 */
function FloatingElementItem({
  element,
  shouldReduceMotion,
}: {
  element: FloatingElementConfig;
  shouldReduceMotion: boolean | null;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none z-10 hidden md:block"
      style={{
        top: element.top,
        left: element.left,
        right: element.right,
      }}
      animate={
        shouldReduceMotion
          ? {}
          : {
              y: [-7, 7, -7],
              x: [-4, 4, -4],
              rotate: element.rotateRange,
            }
      }
      transition={{
        duration: element.duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: element.delay,
      }}
    >
      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/70 backdrop-blur-[3px] border border-slate-300/60 shadow-sm opacity-50 hover:opacity-85 transition-opacity">
        {element.type === "crosshair" && (
          <span className="w-2 h-2 text-sky-600 font-bold text-xs leading-none">+</span>
        )}
        {element.type === "dial" && (
          <span className="w-2.5 h-2.5 rounded-full border border-sky-500/80 border-dashed" />
        )}
        {element.type === "badge" && (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />
        )}
        {element.type === "diamond" && (
          <span className="w-2 h-2 rotate-45 border border-sky-600 bg-sky-100" />
        )}
        {element.type === "trace" && (
          <span className="w-2 h-2 rounded-sm bg-slate-300 ring-1 ring-slate-400" />
        )}
        <div className="font-mono text-[9px] leading-tight text-slate-600">
          <div className="font-semibold text-slate-800">{element.content}</div>
          {element.subContent && (
            <div className="text-[8px] text-slate-400">{element.subContent}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Individual Category Station.
 * - Reduced horizontal orbit distance: pivot axis at (x = center, z = -25px).
 * - Reduced horizontal gap: product name sits snugly at (50% + 115px).
 * - Horizontal scroll / two-finger trackpad swipe directly swaps products.
 * - Category name and product name ONLY show when image angle is between -20° and +20°.
 */
function CategoryStation({
  category,
  index,
  totalCategories,
  activeProductIndex,
  onProductChange,
  shouldReduceMotion,
}: {
  category: ResolvedCategory3D;
  index: number;
  totalCategories: number;
  activeProductIndex: number;
  onProductChange: (categoryId: string, delta: number) => void;
  shouldReduceMotion: boolean | null;
}) {
  const stationRef = useRef<HTMLDivElement>(null);
  const [swipeDirection, setSwipeDirection] = useState<number>(1);

  // Track station position as it travels naturally through the viewport
  const { scrollYProgress } = useScroll({
    target: stationRef,
    offset: ["start end", "end start"],
  });

  // 3D Angle Calculation:
  // Enters from bottom: +120°
  // Center of viewport: 0°
  // Exits to top: -120°
  const rotateY = useTransform(
    scrollYProgress,
    [0.15, 0.5, 0.85],
    [120, 0, -120]
  );

  // Details Visibility:
  // Shows category name and product name ONLY when angle is between -20° and +20°
  const rawDetailsOpacity = useTransform(
    rotateY,
    [-120, -25, -20, 20, 25, 120],
    [0, 0, 1, 1, 0, 0]
  );
  const detailsOpacity = shouldReduceMotion ? 1 : rawDetailsOpacity;
  const pointerEvents = useTransform(rawDetailsOpacity, (v) =>
    v > 0.5 ? "auto" : "none"
  );

  const products = category.products || [];
  const hasProducts = products.length > 0;
  const currentProduct = hasProducts
    ? products[activeProductIndex % products.length]
    : undefined;

  // Active image: selected product image if available, else category hero image
  const displayImageSrc =
    currentProduct?.images?.[0]?.url ||
    category.image ||
    FALLBACK_CATEGORY_IMAGES.default;

  // Horizontal product swap
  const handleSwap = useCallback(
    (delta: number) => {
      if (!hasProducts || products.length <= 1) return;
      setSwipeDirection(delta > 0 ? 1 : -1);
      onProductChange(category.id, delta);
    },
    [hasProducts, products.length, category.id, onProductChange]
  );

  // -------------------------------------------------------------------------
  // Horizontal Scroll handler (trackpad two-finger swipe, horizontal mouse wheel, Shift+Wheel)
  // -------------------------------------------------------------------------
  const lastWheelTimeRef = useRef<number>(0);
  const accumulatedDeltaXRef = useRef<number>(0);

  const handleWheel = (e: React.WheelEvent) => {
    // Determine horizontal intent:
    // If horizontal scroll is dominant, or Shift key is pressed
    const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
    const delta = isHorizontal ? e.deltaX : e.shiftKey ? e.deltaY : 0;

    if (Math.abs(delta) < 14) return;

    accumulatedDeltaXRef.current += delta;
    const now = Date.now();

    // Trigger swap once threshold is reached with a 320ms cooldown
    if (Math.abs(accumulatedDeltaXRef.current) > 28) {
      if (now - lastWheelTimeRef.current > 320) {
        const direction = accumulatedDeltaXRef.current > 0 ? 1 : -1;
        handleSwap(direction);
        lastWheelTimeRef.current = now;
        accumulatedDeltaXRef.current = 0;
      }
    }
  };

  // Touch swipe handling directly on the image
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diffX) > 30) {
      handleSwap(diffX < 0 ? 1 : -1);
    }
    touchStartXRef.current = null;
  };

  // Slide animation variants for horizontal product swapping:
  // Outgoing image slides left and disappears; incoming image enters from right
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <div
      ref={stationRef}
      onWheel={handleWheel}
      className="relative w-full min-h-[300px] flex flex-col items-center justify-center my-8 sm:my-12"
    >
      {/* -------------------------------------------------------------------
          1. CATEGORY NAME (Centered ABOVE image, shows ONLY between -20° and 20°)
         ------------------------------------------------------------------- */}
      <motion.div
        style={{
          opacity: detailsOpacity,
          pointerEvents: shouldReduceMotion ? "auto" : pointerEvents,
        }}
        className="text-center px-4 mb-3 z-20"
      >
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {category.name}
        </h2>
      </motion.div>

      {/* -------------------------------------------------------------------
          2. CENTER IMAGE & PRODUCT NAME (Tighter horizontal lockup)
         ------------------------------------------------------------------- */}
      <div className="relative w-full max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-center px-4 z-20">
        {/* 3D Perspective Stage for Image */}
        <div
          className="relative flex items-center justify-center shrink-0"
          style={{
            perspective: "800px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          {/* Rotates about reduced axis: x = center, z = -25px (tighter horizontal deflection) */}
          <motion.div
            style={
              shouldReduceMotion
                ? {}
                : {
                    transformOrigin: "50% 50% -25px",
                    transformStyle: "preserve-3d",
                    rotateY,
                  }
            }
            className="relative flex items-center justify-center"
          >
            {/* Direct image frame: no outer card box, no border, no artificial padding */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="group relative w-[210px] sm:w-[240px] lg:w-[250px] h-[145px] sm:h-[165px] lg:h-[180px] overflow-hidden flex items-center justify-center select-none cursor-grab active:cursor-grabbing"
              title="Scroll horizontally or swipe to inspect products"
            >
              <AnimatePresence initial={false} custom={swipeDirection} mode="popLayout">
                <motion.div
                  key={`prod-img-${category.id}-${activeProductIndex}`}
                  custom={swipeDirection}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 32 },
                    opacity: { duration: 0.2 },
                  }}
                  className="absolute inset-0 w-full h-full flex items-center justify-center"
                >
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src={displayImageSrc}
                      alt={currentProduct?.name || category.name}
                      fill
                      sizes="250px"
                      className="object-contain drop-shadow-md pointer-events-none"
                      priority={index === 0}
                    />
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Minimal Desktop Hover Arrows for Horizontal Swapping */}
              {hasProducts && products.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwap(-1);
                    }}
                    className="absolute left-1 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Previous Product"
                    aria-label="Previous Product"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSwap(1);
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 z-30 p-1.5 rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    title="Next Product"
                    aria-label="Next Product"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* -----------------------------------------------------------------
            3. PRODUCT NAME (Reduced horizontal distance: sits snugly right next to image)
           ----------------------------------------------------------------- */}
        {currentProduct && (
          <>
            {/* Desktop / Tablet view: directly to the right with snug gap */}
            <motion.div
              style={{
                opacity: detailsOpacity,
                pointerEvents: shouldReduceMotion ? "auto" : pointerEvents,
              }}
              className="hidden sm:block absolute left-[calc(50%+115px)] top-1/2 -translate-y-1/2 max-w-[240px] text-left z-20"
            >
              <Link
                href={`/product/${currentProduct.slug || currentProduct.id}`}
                className="group block"
              >
                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                  {currentProduct.name}
                </h3>
              </Link>
            </motion.div>

            {/* Mobile phone view: neatly below */}
            <motion.div
              style={{
                opacity: detailsOpacity,
                pointerEvents: shouldReduceMotion ? "auto" : pointerEvents,
              }}
              className="sm:hidden text-center mt-3 px-4 z-20"
            >
              <Link
                href={`/product/${currentProduct.slug || currentProduct.id}`}
                className="group inline-block"
              >
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors leading-snug">
                  {currentProduct.name}
                </h3>
              </Link>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Main 3D Category Distribution Section.
 * Features:
 * - Enhanced background theme with industrial border vignette and perimeter glow lines.
 * - Floating precision engineering background elements that subtly move.
 * - Reduced horizontal distance and horizontal scroll product cycling.
 */
export function CategoryDistribution3D({
  categories = [],
  products = [],
  config,
}: CategoryDistribution3DProps) {
  const shouldReduceMotion = useReducedMotion();

  // Resolve categories and active products
  const resolvedCategories = useMemo(() => {
    return resolve3DCategories(categories, products);
  }, [categories, products]);

  // Independent Product Index for each category
  const [categoryProductIndex, setCategoryProductIndex] = useState<Record<string, number>>({});

  const handleProductChange = useCallback((categoryId: string, delta: number) => {
    setCategoryProductIndex((prevMap) => {
      const currentIdx = prevMap[categoryId] || 0;
      const targetCategory = resolvedCategories.find((c) => c.id === categoryId);
      const total = targetCategory?.products?.length || 1;
      const nextIdx = (currentIdx + delta + total) % total;
      return {
        ...prevMap,
        [categoryId]: nextIdx,
      };
    });
  }, [resolvedCategories]);

  return (
    <section
      data-scene="category-distribution-3d"
      className="relative w-full min-h-[1500px] bg-gradient-to-b from-slate-100/70 via-white to-slate-100/70 text-slate-900 border-b border-slate-300/80 select-none py-10 overflow-hidden"
    >
      {/* -------------------------------------------------------------------
          BACKGROUND ENHANCEMENT: VIGNETTE & INDUSTRIAL THEME TOWARDS BORDERS
         ------------------------------------------------------------------- */}

      {/* Precision Drafting Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Radial Border Vignette: Darkens subtly towards perimeter edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 92% 76% at 50% 50%, rgba(255, 255, 255, 0) 35%, rgba(241, 245, 249, 0.45) 65%, rgba(226, 232, 240, 0.75) 85%, rgba(203, 213, 225, 0.95) 100%)
          `,
        }}
      />

      {/* Left & Right Edge Depth Accents */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-slate-200/60 via-slate-100/20 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-slate-200/60 via-slate-100/20 to-transparent pointer-events-none" />

      {/* Top and Bottom Perimeter Precision Glow Lines */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent pointer-events-none" />

      {/* Technical Corner Brackets */}
      <div className="absolute top-4 left-4 pointer-events-none hidden sm:flex items-start gap-1 font-mono text-[9px] text-slate-400">
        <span className="text-sky-600 font-bold">┌</span>
        <span>SEC: 3D-ORBIT // OM-PRECISION</span>
      </div>
      <div className="absolute top-4 right-4 pointer-events-none hidden sm:flex items-start gap-1 font-mono text-[9px] text-slate-400">
        <span>SYS: ACTIVE-TRACK</span>
        <span className="text-sky-600 font-bold">┐</span>
      </div>
      <div className="absolute bottom-4 left-4 pointer-events-none hidden sm:flex items-end gap-1 font-mono text-[9px] text-slate-400">
        <span className="text-sky-600 font-bold">└</span>
        <span>TOL: ±0.002MM // DIN-69051</span>
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none hidden sm:flex items-end gap-1 font-mono text-[9px] text-slate-400">
        <span>END TRACK // 1500PX</span>
        <span className="text-sky-600 font-bold">┘</span>
      </div>

      {/* Central Vertical Guide Bar / Spine along the entire vertical height */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-sky-500/35 to-transparent pointer-events-none hidden md:block" />

      {/* -------------------------------------------------------------------
          RANDOMLY FLOATING SLIGHTLY MOVING BACKGROUND ELEMENTS
         ------------------------------------------------------------------- */}
      {FLOATING_BG_ELEMENTS.map((el) => (
        <FloatingElementItem
          key={el.id}
          element={el}
          shouldReduceMotion={shouldReduceMotion}
        />
      ))}

      {/* Section Global Header */}
      <div className="relative z-20 text-center max-w-xl mx-auto px-4 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-1">
          <Sparkles className="w-3 h-3 text-sky-600" />
          <span>Industrial 3D Distribution</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Explore Hardware Domains
        </h2>
      </div>

      {/* ---------------------------------------------------------------------
          CATEGORY STATIONS (Vertical distribution along the natural scroll)
         --------------------------------------------------------------------- */}
      <div className="relative z-10 w-full flex flex-col justify-around min-h-[1350px]">
        {resolvedCategories.map((category, index) => (
          <CategoryStation
            key={category.id}
            category={category}
            index={index}
            totalCategories={resolvedCategories.length}
            activeProductIndex={categoryProductIndex[category.id] || 0}
            onProductChange={handleProductChange}
            shouldReduceMotion={shouldReduceMotion}
          />
        ))}
      </div>
    </section>
  );
}
