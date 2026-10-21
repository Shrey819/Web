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
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  PackageCheck,
  Sparkles,
} from "lucide-react";
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
 * Individual Category Station situated along the 3000px vertical Y-axis.
 * As the user scrolls naturally down the page, its 3D angle smoothly transitions:
 * Entering from below: +120°
 * Centered in viewport: 0° (Facing forward, 100% opacity, sharp)
 * Scrolled past above: -120°
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

  // Track station position as it travels through the viewport during natural scroll
  const { scrollYProgress } = useScroll({
    target: stationRef,
    offset: ["start end", "end start"],
  });

  // 3D Angle Calculation:
  // When at bottom of viewport (0.15): rotated at +120deg (or receded in 3D circle)
  // When at center of viewport (0.45 - 0.55): strictly 0deg (Facing forward)
  // When at top of viewport (0.85): rotated at -120deg (receded in 3D circle)
  const rotateY = useTransform(
    scrollYProgress,
    [0.1, 0.42, 0.58, 0.9],
    [120, 0, 0, -120]
  );

  const translateZ = useTransform(
    scrollYProgress,
    [0.1, 0.42, 0.58, 0.9],
    [-100, 0, 0, -100]
  );

  const stationOpacity = useTransform(
    scrollYProgress,
    [0.1, 0.35, 0.65, 0.9],
    [0.4, 1.0, 1.0, 0.4]
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

  // Horizontal product swap strictly within the 500x800px frame
  const handleSwap = (delta: number) => {
    if (!hasProducts || products.length <= 1) return;
    setSwipeDirection(delta > 0 ? 1 : -1);
    onProductChange(category.id, delta);
  };

  // Touch swipe handling on the 500x800 frame
  const touchStartXRef = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) touchStartXRef.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(diffX) > 40) {
      handleSwap(diffX < 0 ? 1 : -1);
    }
    touchStartXRef.current = null;
  };

  const productPrice = currentProduct
    ? (currentProduct.basePrice || (currentProduct as any).price)
    : undefined;

  // Frame slide animation variants:
  // Outgoing image slides left and disappears from left edge
  // Incoming image enters from right edge
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
      className="relative w-full min-h-[650px] flex flex-col items-center justify-center my-12 sm:my-16"
    >
      {/* Station Vertical Anchor Node on the Central Spine */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-6 flex items-center gap-2 pointer-events-none z-10">
        <span className="w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-100" />
        <span className="font-mono text-[10px] font-bold text-slate-400 bg-white/90 px-2 py-0.5 rounded border border-slate-200">
          NODE 0{index + 1} // Y: {index * 700}PX
        </span>
      </div>

      {/* -------------------------------------------------------------------
          1. CATEGORY NAME (Prominently displayed ABOVE the central frame)
         ------------------------------------------------------------------- */}
      <div className="text-center max-w-3xl mx-auto px-4 mb-6 z-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
          <Layers className="w-3.5 h-3.5 text-sky-600" />
          <span>
            Category 0{index + 1} of 0{totalCategories} // {category.badge}
          </span>
        </div>

        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
          {category.name}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mt-1 line-clamp-2">
          {category.description}
        </p>
      </div>

      {/* -------------------------------------------------------------------
          2. CENTRAL 500x800PX 3D FRAME & PRODUCT DETAILS TO THE RIGHT
         ------------------------------------------------------------------- */}
      <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 px-4 z-20">
        {/* 3D Perspective Container */}
        <div
          className="relative flex items-center justify-center shrink-0 w-full max-w-[340px] sm:max-w-[440px] lg:max-w-[500px]"
          style={{
            perspective: "1200px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          {/* Rotating 3D Shell tied to scroll distance along the Y-axis */}
          <motion.div
            style={
              shouldReduceMotion
                ? {}
                : {
                    rotateY,
                    translateZ,
                    opacity: stationOpacity,
                    transformStyle: "preserve-3d",
                  }
            }
            className="relative w-full flex items-center justify-center"
          >
            {/* ---------------------------------------------------------------
                THE EXACT 500px * 800px MASKED VIEWPORT FRAME (overflow: hidden)
                Horizontal product swap happens strictly inside this frame box!
               --------------------------------------------------------------- */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-[320px] sm:w-[440px] lg:w-[500px] h-[480px] sm:h-[620px] lg:h-[750px] max-h-[80vh] bg-white rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden flex flex-col items-center justify-between p-4 sm:p-6"
              style={{
                boxShadow:
                  "0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 40px -10px rgba(2, 132, 199, 0.08)",
              }}
            >
              {/* Subtle Ambient Blueprint Grid inside frame */}
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.02]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #0f172a 1px, transparent 1px),
                    linear-gradient(to bottom, #0f172a 1px, transparent 1px)
                  `,
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Frame Header Tag */}
              <div className="relative z-10 w-full flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2">
                <span>500×800 FRAME</span>
                <span className="text-sky-600 font-semibold">{category.badge}</span>
              </div>

              {/* -------------------------------------------------------------
                  HORIZONTAL SLIDE STAGE INSIDE THE 500x800 FRAME ONLY:
                  Old image slides left & disappears; new image enters from right!
                 ------------------------------------------------------------- */}
              <div className="relative w-full flex-1 overflow-hidden flex items-center justify-center my-2">
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
                      opacity: { duration: 0.22 },
                    }}
                    className="absolute inset-0 w-full h-full flex flex-col items-center justify-center"
                  >
                    <div className="relative w-full h-full flex items-center justify-center">
                      <Image
                        src={displayImageSrc}
                        alt={currentProduct?.name || category.name}
                        fill
                        sizes="(max-width: 640px) 320px, (max-width: 1024px) 440px, 500px"
                        className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.14)] pointer-events-none p-2 sm:p-4"
                        priority={index === 0}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Soft Ground Floor Shadow under active frame product */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-3 bg-slate-900/10 rounded-full blur-md pointer-events-none" />
              </div>

              {/* Horizontal Product Pagination Controls in Frame Base */}
              {hasProducts && products.length > 1 && (
                <div className="relative z-20 w-full flex items-center justify-between pt-2 border-t border-slate-100 px-2">
                  <button
                    onClick={() => handleSwap(-1)}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                    title="Previous Product (Slide in from left)"
                    aria-label="Previous Product"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    {products.map((p, pIdx) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const delta = pIdx - activeProductIndex;
                          if (delta !== 0) handleSwap(delta);
                        }}
                        className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                          activeProductIndex === pIdx
                            ? "w-6 bg-sky-600"
                            : "w-1.5 bg-slate-200 hover:bg-slate-300"
                        }`}
                        title={`Select ${p.name}`}
                        aria-label={`Select product ${p.name}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleSwap(1)}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                    title="Next Product (Slide in from right)"
                    aria-label="Next Product"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* -------------------------------------------------------------------
            3. PRODUCT DETAILS PANEL (Positioned to the RIGHT of the frame)
           ------------------------------------------------------------------- */}
        <div className="w-full lg:max-w-[420px] flex flex-col justify-center space-y-4 text-left px-2 sm:px-4 z-20 shrink-0">
          {currentProduct ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`prod-card-${currentProduct.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.28, ease: "easeOut" }}
                className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
              >
                {/* Category & Product Index Tag */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 uppercase tracking-wider">
                    {category.name}
                  </span>
                  <span className="font-mono text-[11px] text-slate-400 font-semibold">
                    PRODUCT 0{activeProductIndex + 1} // 0{products.length}
                  </span>
                </div>

                {/* Product Title & SKU */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                    {currentProduct.name}
                  </h3>
                  {currentProduct.sku && (
                    <span className="font-mono text-xs text-slate-400 block mt-1">
                      SKU: {currentProduct.sku}
                    </span>
                  )}
                </div>

                {/* Product Short Description */}
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                  {currentProduct.shortDescription ||
                    currentProduct.description ||
                    "Engineered for sub-micron positioning repeatability and high dynamic load capacities in demanding industrial automation."}
                </p>

                {/* Price & Action Row */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    {productPrice ? (
                      <div className="space-y-0.5">
                        <span className="block font-mono text-[10px] text-slate-400 uppercase font-bold">
                          Price
                        </span>
                        <span className="font-mono text-lg sm:text-xl font-extrabold text-slate-900">
                          ₹{Number(productPrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                        OEM In Stock
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/product/${currentProduct.slug || currentProduct.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-sky-600 transition-colors shadow-md hover:shadow-sky-600/20"
                  >
                    <span>VIEW PRODUCT</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Graceful Empty State if category has no products yet */
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 inline-flex">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>CATALOG READY</span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                {category.name}
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Precision hardware solutions configured to your machine specifications. Explore full category inventory or submit technical drawings for custom sizing.
              </p>

              <div className="pt-2">
                <Link
                  href={`/category/${category.slug || category.id}`}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-sky-600 transition-colors shadow-md"
                >
                  <span>BROWSE CATEGORY</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* User Hint */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-1">
            <span>◄ Swipe 500px frame to change product ►</span>
            <span>Scroll naturally for next category</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main 3D Category Distribution Section.
 * Takes the whole 3000px height along the Y-axis.
 * DOES NOT stop/freeze the screen while scrolling (no sticky locking).
 * The user scrolls down naturally through the 3000px track.
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

  // Independent Product Index for each category (preserves state when scrolling away and back)
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
      className="relative w-full min-h-[3000px] bg-white text-slate-900 border-b border-slate-200/90 select-none py-16"
    >
      {/* Precision Drafting Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)
          `,
          backgroundSize: "32px 32px",
        }}
      />

      {/* Central Vertical Guide Bar / Spine along the entire 3000px height */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-transparent via-sky-500/30 to-transparent pointer-events-none hidden md:block" />

      {/* Section Global Header */}
      <div className="relative z-20 text-center max-w-2xl mx-auto px-4 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-semibold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          <span>Industrial 3D Distribution // 3000px Vertical Track</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          Explore Hardware Domains by Scrolling
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Scroll down naturally through the vertical stations. Swipe any central frame horizontally to inspect products.
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          CATEGORY STATIONS (Placed along the 3000px vertical Y-axis)
          c1: 0 - 500px
          c2: 700 - 1200px
          c3: 1400 - 1900px
          c4: 2100 - 2600px+
         --------------------------------------------------------------------- */}
      <div className="relative z-10 w-full flex flex-col justify-around min-h-[2800px]">
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
