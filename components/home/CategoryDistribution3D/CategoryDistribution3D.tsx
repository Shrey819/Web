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

/**
 * Individual Category Station.
 * - Image rotates in 3D about the pivot axis: x = center, z = -50px.
 * - No outer box, borders, or dead space: just the image itself.
 * - Horizontal product swap slides outgoing product left and brings incoming product from right.
 * - Category name (above) and Product name (to the right) ONLY show when the image angle is between -20° and +20°.
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

  // Horizontal product swap strictly within the image frame
  const handleSwap = (delta: number) => {
    if (!hasProducts || products.length <= 1) return;
    setSwipeDirection(delta > 0 ? 1 : -1);
    onProductChange(category.id, delta);
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
          2. CENTER IMAGE & PRODUCT NAME TO THE RIGHT
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
          {/* Rotates about axis: x = center, z = -50px */}
          <motion.div
            style={
              shouldReduceMotion
                ? {}
                : {
                    transformOrigin: "50% 50% -50px",
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
              className="group relative w-[220px] sm:w-[250px] lg:w-[260px] h-[150px] sm:h-[175px] lg:h-[190px] overflow-hidden flex items-center justify-center select-none"
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
                      sizes="260px"
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
            3. PRODUCT NAME (To the right of the image, shows ONLY between -20° and 20°)
           ----------------------------------------------------------------- */}
        {currentProduct && (
          <>
            {/* Desktop / Tablet view: directly to the right */}
            <motion.div
              style={{
                opacity: detailsOpacity,
                pointerEvents: shouldReduceMotion ? "auto" : pointerEvents,
              }}
              className="hidden sm:block absolute left-[calc(50%+145px)] top-1/2 -translate-y-1/2 max-w-[260px] text-left z-20"
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
 * Takes the full scaled vertical track without locking scroll.
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
      className="relative w-full min-h-[1500px] bg-white text-slate-900 border-b border-slate-200/90 select-none py-10"
    >
      {/* Precision Drafting Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Central Vertical Guide Bar / Spine along the entire vertical height */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-sky-500/30 to-transparent pointer-events-none hidden md:block" />

      {/* Section Global Header */}
      <div className="relative z-20 text-center max-w-xl mx-auto px-4 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-1">
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
