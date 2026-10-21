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
 * Individual Category Station situated along the 1500px vertical Y-axis (reduced by 1/2 scale).
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

  // 3D Angle Calculation (1/2 scale: translateZ reduced from 100px to 50px)
  const rotateY = useTransform(
    scrollYProgress,
    [0.1, 0.42, 0.58, 0.9],
    [120, 0, 0, -120]
  );

  const translateZ = useTransform(
    scrollYProgress,
    [0.1, 0.42, 0.58, 0.9],
    [-50, 0, 0, -50]
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

  // Horizontal product swap strictly within the 250x400px frame
  const handleSwap = (delta: number) => {
    if (!hasProducts || products.length <= 1) return;
    setSwipeDirection(delta > 0 ? 1 : -1);
    onProductChange(category.id, delta);
  };

  // Touch swipe handling on the 250x400 frame
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
      className="relative w-full min-h-[360px] flex flex-col items-center justify-center my-6 sm:my-8"
    >
      {/* Station Vertical Anchor Node on the Central Spine (Scaled by 1/2) */}
      <div className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center gap-1.5 pointer-events-none z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-sky-500 ring-2 ring-sky-100" />
        <span className="font-mono text-[9px] font-bold text-slate-400 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200">
          NODE 0{index + 1} // Y: {index * 350}PX
        </span>
      </div>

      {/* -------------------------------------------------------------------
          1. CATEGORY NAME (Prominently displayed ABOVE the central frame)
         ------------------------------------------------------------------- */}
      <div className="text-center max-w-2xl mx-auto px-4 mb-3 sm:mb-4 z-20">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-1">
          <Layers className="w-3 h-3 text-sky-600" />
          <span>
            Category 0{index + 1} of 0{totalCategories} // {category.badge}
          </span>
        </div>

        <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {category.name}
        </h2>
        <p className="text-[11px] sm:text-xs text-slate-500 max-w-md mx-auto line-clamp-1">
          {category.description}
        </p>
      </div>

      {/* -------------------------------------------------------------------
          2. CENTRAL 250x400PX 3D FRAME & PRODUCT DETAILS TO THE RIGHT (1/2 Scale)
         ------------------------------------------------------------------- */}
      <div className="w-full max-w-4xl mx-auto flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8 px-4 z-20">
        {/* 3D Perspective Container (Scaled by 1/2) */}
        <div
          className="relative flex items-center justify-center shrink-0 w-full max-w-[220px] sm:max-w-[240px] lg:max-w-[260px]"
          style={{
            perspective: "900px",
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
                THE EXACT 250px * 400px MASKED VIEWPORT FRAME (1/2 Scale)
                Horizontal product swap happens strictly inside this frame box!
               --------------------------------------------------------------- */}
            <div
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="relative w-[210px] sm:w-[240px] lg:w-[250px] h-[280px] sm:h-[350px] lg:h-[390px] max-h-[60vh] bg-white rounded-2xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col items-center justify-between p-2.5 sm:p-3.5"
              style={{
                boxShadow:
                  "0 15px 35px -10px rgba(15, 23, 42, 0.1), 0 0 25px -8px rgba(2, 132, 199, 0.08)",
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
                  backgroundSize: "16px 16px",
                }}
              />

              {/* Frame Header Tag */}
              <div className="relative z-10 w-full flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider px-1">
                <span>250×400 FRAME</span>
                <span className="text-sky-600 font-semibold">{category.badge}</span>
              </div>

              {/* -------------------------------------------------------------
                  HORIZONTAL SLIDE STAGE INSIDE THE 250x400 FRAME ONLY:
                  Old image slides left & disappears; new image enters from right!
                 ------------------------------------------------------------- */}
              <div className="relative w-full flex-1 overflow-hidden flex items-center justify-center my-1">
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
                        sizes="250px"
                        className="object-contain drop-shadow-[0_12px_20px_rgba(0,0,0,0.12)] pointer-events-none p-1.5 sm:p-2"
                        priority={index === 0}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Soft Ground Floor Shadow under active frame product */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-32 sm:w-40 h-2 bg-slate-900/10 rounded-full blur-sm pointer-events-none" />
              </div>

              {/* Horizontal Product Pagination Controls in Frame Base */}
              {hasProducts && products.length > 1 && (
                <div className="relative z-20 w-full flex items-center justify-between pt-1.5 border-t border-slate-100 px-1">
                  <button
                    onClick={() => handleSwap(-1)}
                    className="p-1 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                    title="Previous Product (Slide in from left)"
                    aria-label="Previous Product"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-1">
                    {products.map((p, pIdx) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          const delta = pIdx - activeProductIndex;
                          if (delta !== 0) handleSwap(delta);
                        }}
                        className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                          activeProductIndex === pIdx
                            ? "w-4 bg-sky-600"
                            : "w-1 bg-slate-200 hover:bg-slate-300"
                        }`}
                        title={`Select ${p.name}`}
                        aria-label={`Select product ${p.name}`}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => handleSwap(1)}
                    className="p-1 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                    title="Next Product (Slide in from right)"
                    aria-label="Next Product"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* -------------------------------------------------------------------
            3. PRODUCT DETAILS PANEL (Positioned to the RIGHT of the frame)
           ------------------------------------------------------------------- */}
        <div className="w-full lg:max-w-[320px] flex flex-col justify-center space-y-2.5 text-left px-2 sm:px-3 z-20 shrink-0">
          {currentProduct ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={`prod-card-${currentProduct.id}`}
                initial={{ opacity: 0, x: 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -15 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-lg space-y-2.5"
              >
                {/* Category & Product Index Tag */}
                <div className="flex items-center justify-between gap-1.5 border-b border-slate-100 pb-2">
                  <span className="font-mono text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 uppercase tracking-wider">
                    {category.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 font-semibold">
                    0{activeProductIndex + 1} / 0{products.length}
                  </span>
                </div>

                {/* Product Title & SKU */}
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">
                    {currentProduct.name}
                  </h3>
                  {currentProduct.sku && (
                    <span className="font-mono text-[10px] text-slate-400 block mt-0.5">
                      SKU: {currentProduct.sku}
                    </span>
                  )}
                </div>

                {/* Product Short Description */}
                <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed line-clamp-2">
                  {currentProduct.shortDescription ||
                    currentProduct.description ||
                    "Engineered for sub-micron positioning repeatability."}
                </p>

                {/* Price & Action Row */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100">
                  <div>
                    {productPrice ? (
                      <div className="space-y-0.5">
                        <span className="block font-mono text-[9px] text-slate-400 uppercase font-bold">
                          Price
                        </span>
                        <span className="font-mono text-sm sm:text-base font-extrabold text-slate-900">
                          ₹{Number(productPrice).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        In Stock
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/product/${currentProduct.slug || currentProduct.id}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-sky-600 transition-colors shadow-sm"
                  >
                    <span>VIEW</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            /* Graceful Empty State if category has no products yet */
            <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 shadow-lg space-y-2.5">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-flex">
                <PackageCheck className="w-3 h-3" />
                <span>CATALOG READY</span>
              </div>

              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                {category.name}
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed">
                Precision hardware solutions configured to your machine specifications.
              </p>

              <div className="pt-1">
                <Link
                  href={`/category/${category.slug || category.id}`}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-sky-600 transition-colors shadow-sm"
                >
                  <span>BROWSE</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* User Hint */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 px-0.5">
            <span>◄ Swipe 250px frame ►</span>
            <span>Scroll for next</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Main 3D Category Distribution Section.
 * Scaled by 1/2:
 * Takes ~1500px height along the Y-axis.
 * DOES NOT stop/freeze the screen while scrolling (no sticky locking).
 * The user scrolls down naturally through the track.
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

      {/* Central Vertical Guide Bar / Spine along the entire 1500px height */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-transparent via-sky-500/30 to-transparent pointer-events-none hidden md:block" />

      {/* Section Global Header */}
      <div className="relative z-20 text-center max-w-xl mx-auto px-4 mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-1.5">
          <Sparkles className="w-3 h-3 text-sky-600" />
          <span>Industrial 3D Distribution // 1500px Scaled Track</span>
        </div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Explore Hardware Domains by Scrolling
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Scroll down naturally through the vertical stations. Swipe any central frame horizontally to inspect products.
        </p>
      </div>

      {/* ---------------------------------------------------------------------
          CATEGORY STATIONS (Placed along the 1500px vertical Y-axis, 1/2 Scale)
         --------------------------------------------------------------------- */}
      <div className="relative z-10 w-full flex flex-col justify-around min-h-[1400px]">
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
