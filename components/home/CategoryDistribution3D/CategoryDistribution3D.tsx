"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  Sparkles,
  ExternalLink,
  SlidersHorizontal,
  PackageCheck,
  Tag,
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

export function CategoryDistribution3D({
  categories = [],
  products = [],
  config,
}: CategoryDistribution3DProps) {
  const shouldReduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement | null>(null);

  // 1. Resolve categories and active products
  const resolvedCategories = React.useMemo(() => {
    return resolve3DCategories(categories, products);
  }, [categories, products]);

  const numCategories = resolvedCategories.length;

  // 2. Active Category Index & Authoritative 3D Rotation State
  // Step is strictly 120 degrees per category
  const [activeCategoryIdx, setActiveCategoryIdx] = useState<number>(0);
  const [rotationAngle, setRotationAngle] = useState<number>(0);

  // 3. Independent Product Selection Index for EACH Category
  // Key: categoryId, Value: productIndex
  const [categoryProductIndex, setCategoryProductIndex] = useState<Record<string, number>>({});

  // 4. Scroll debounce/lock refs to prevent gesture skipping
  const isRotatingRef = useRef<boolean>(false);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  // Active Category & Current Product
  const activeCategory: ResolvedCategory3D =
    resolvedCategories[activeCategoryIdx] || resolvedCategories[0];

  const currentProductIdx = activeCategory ? (categoryProductIndex[activeCategory.id] || 0) : 0;
  const activeProduct: Product | undefined =
    activeCategory?.products && activeCategory.products.length > 0
      ? activeCategory.products[currentProductIdx % activeCategory.products.length]
      : undefined;

  // Change category safely by delta (+1 for down/next, -1 for up/prev)
  const changeCategory = useCallback(
    (delta: number) => {
      if (numCategories <= 1 || isRotatingRef.current) return;

      isRotatingRef.current = true;
      setActiveCategoryIdx((prev) => {
        const next = (prev + delta + numCategories) % numCategories;
        return next;
      });

      // Down (+1 delta) rotates carousel by -120deg to bring next panel to center
      // Up (-1 delta) rotates carousel by +120deg
      setRotationAngle((prev) => prev - delta * 120);

      setTimeout(() => {
        isRotatingRef.current = false;
      }, 650);
    },
    [numCategories]
  );

  // Change product in active category horizontally
  const changeProduct = useCallback(
    (delta: number) => {
      if (!activeCategory || !activeCategory.products || activeCategory.products.length <= 1) return;

      const totalProds = activeCategory.products.length;
      setCategoryProductIndex((prevMap) => {
        const currentIdx = prevMap[activeCategory.id] || 0;
        const nextIdx = (currentIdx + delta + totalProds) % totalProds;
        return {
          ...prevMap,
          [activeCategory.id]: nextIdx,
        };
      });
    },
    [activeCategory]
  );

  // Keyboard navigation when user is focused within section
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if mouse is hovering over section or section is in viewport
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight * 0.7 && rect.bottom > window.innerHeight * 0.3;
      if (!inView) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        changeCategory(1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        changeCategory(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        changeProduct(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        changeProduct(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeCategory, changeProduct]);

  // Wheel handling with threshold accumulation and boundary release
  const wheelAccumulatorRef = useRef<number>(0);
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Only capture deliberate vertical wheel gestures inside the stage
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) * 1.5) {
      wheelAccumulatorRef.current += e.deltaY;

      if (Math.abs(wheelAccumulatorRef.current) > 70) {
        if (!isRotatingRef.current) {
          if (wheelAccumulatorRef.current > 0) {
            changeCategory(1);
          } else {
            changeCategory(-1);
          }
        }
        wheelAccumulatorRef.current = 0;
      }
    } else if (Math.abs(e.deltaX) > 40) {
      // Horizontal swipe on trackpad changes products
      if (e.deltaX > 0) {
        changeProduct(1);
      } else {
        changeProduct(-1);
      }
    }
  };

  // Touch gesture handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    touchStartYRef.current = e.touches[0].clientY;
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartYRef.current === null || touchStartXRef.current === null) return;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;

    const diffY = touchEndY - touchStartYRef.current;
    const diffX = touchEndX - touchStartXRef.current;

    if (Math.abs(diffY) > Math.abs(diffX) && Math.abs(diffY) > 50) {
      if (diffY < 0) {
        changeCategory(1); // Swipe up -> next category down
      } else {
        changeCategory(-1); // Swipe down -> prev category up
      }
    } else if (Math.abs(diffX) > 50) {
      if (diffX < 0) {
        changeProduct(1); // Swipe left -> next product
      } else {
        changeProduct(-1); // Swipe right -> prev product
      }
    }

    touchStartYRef.current = null;
    touchStartXRef.current = null;
  };

  // Calculate the 3 slots for visual rendering:
  // Slot 0: Center (0 deg) -> active category
  // Slot 1: Right (+120 deg) -> next category
  // Slot 2: Left (-120 deg) -> prev category
  const prevIdx = (activeCategoryIdx - 1 + numCategories) % numCategories;
  const nextIdx = (activeCategoryIdx + 1) % numCategories;

  const prevCategory = resolvedCategories[prevIdx];
  const nextCategory = resolvedCategories[nextIdx];

  // Primary image for center slot: active product image if available, else category hero image
  const centerImageSrc =
    activeProduct?.images?.[0]?.url ||
    activeCategory?.image ||
    FALLBACK_CATEGORY_IMAGES.default;

  const leftImageSrc = prevCategory?.image || FALLBACK_CATEGORY_IMAGES.default;
  const rightImageSrc = nextCategory?.image || FALLBACK_CATEGORY_IMAGES.default;

  return (
    <section
      ref={sectionRef}
      data-scene="category-distribution-3d"
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full py-16 sm:py-24 bg-white text-slate-900 border-b border-slate-200/90 overflow-hidden select-none"
    >
      {/* =========================================================================
          BACKGROUND INDUSTRIAL ATMOSPHERE (White Base + Subtle Blueprint Grid)
         ========================================================================= */}
      {/* Precision Drafting Grid */}
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

      {/* Ambient Cobalt Blue Light Diffusion Behind Center Stage */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] pointer-events-none transition-all duration-700 ease-out"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(2, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.03) 45%, transparent 70%)",
        }}
      />

      {/* Subtle Engineering Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-900/[0.015] to-slate-900/[0.04] pointer-events-none" />

      {/* Decorative Technical Viewport Metadata */}
      <div className="absolute top-6 left-6 hidden md:flex items-center gap-2 pointer-events-none font-mono text-[10px] text-slate-400 uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
        <span>3D.SYS // Y-AXIS 120° CAROUSEL</span>
      </div>
      <div className="absolute top-6 right-6 hidden md:flex items-center gap-3 pointer-events-none font-mono text-[10px] text-slate-400 uppercase tracking-widest">
        <span>STEP: 120°</span>
        <span>RADIUS: 140PX</span>
        <span>DOMAIN: {activeCategoryIdx + 1}/{numCategories}</span>
      </div>

      <div className="content-shell relative z-10">
        {/* =========================================================================
            HEADER & CATEGORY TITLE (Prominently placed ABOVE central image)
           ========================================================================= */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8 sm:mb-12">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-mono font-semibold uppercase tracking-wider shadow-sm">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>
              Category Domain 0{activeCategoryIdx + 1} of 0{numCategories}
            </span>
          </div>

          {/* Active Category Name (Updated automatically upon vertical 120° rotation) */}
          <motion.div
            key={`cat-title-${activeCategory.id}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            <h2
              data-el="active-category-title"
              className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight"
            >
              {activeCategory.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto mt-2 leading-relaxed">
              {activeCategory.description}
            </p>
          </motion.div>

          {/* Category Vertical Rotation Stepper Pills */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {resolvedCategories.map((c, i) => (
              <button
                key={c.id}
                onClick={() => {
                  const delta = i - activeCategoryIdx;
                  if (delta !== 0) changeCategory(delta);
                }}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeCategoryIdx === i
                    ? "w-8 h-2 bg-sky-600 shadow-sm shadow-sky-600/30"
                    : "w-2 h-2 bg-slate-300 hover:bg-slate-400"
                }`}
                title={`Jump to ${c.name}`}
                aria-label={`Select category ${c.name}`}
              />
            ))}
          </div>
        </div>

        {/* =========================================================================
            3D VERTICAL Y-AXIS CAROUSEL STAGE & PRODUCT BROWSER
           ========================================================================= */}
        <div className="relative w-full max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12">
          {/* Vertical Stepper Controls (Left side on desktop) */}
          <div className="hidden lg:flex flex-col items-center gap-3 z-30 shrink-0">
            <button
              onClick={() => changeCategory(-1)}
              className="p-2.5 rounded-full bg-white border border-slate-300 shadow-sm text-slate-700 hover:text-sky-600 hover:border-sky-500 hover:shadow-md transition-all active:scale-95 cursor-pointer"
              title="Previous Category (-120° rotation)"
              aria-label="Previous Category"
            >
              <ChevronUp className="w-5 h-5" />
            </button>

            <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest writing-vertical rotate-180 py-2">
              SCROLL // VERTICAL
            </span>

            <button
              onClick={() => changeCategory(1)}
              className="p-2.5 rounded-full bg-white border border-slate-300 shadow-sm text-slate-700 hover:text-sky-600 hover:border-sky-500 hover:shadow-md transition-all active:scale-95 cursor-pointer"
              title="Next Category (+120° rotation)"
              aria-label="Next Category"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* -----------------------------------------------------------------------
              3D PERSPECTIVE STAGE (Center Slot at 0°, Left at -120°, Right at +120°)
             ----------------------------------------------------------------------- */}
          <div
            data-el="category-carousel-3d"
            className="relative w-full max-w-[460px] sm:max-w-[520px] lg:max-w-[480px] h-[360px] sm:h-[420px] md:h-[460px] flex items-center justify-center shrink-0"
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
            }}
          >
            {/* The 3D Rotating Shell */}
            <motion.div
              animate={
                shouldReduceMotion
                  ? { opacity: 1 }
                  : {
                      rotateY: rotationAngle,
                    }
              }
              transition={{
                duration: shouldReduceMotion ? 0.2 : 0.65,
                ease: [0.22, 1, 0.36, 1], // Smooth signature easing
              }}
              style={{
                transformStyle: "preserve-3d",
              }}
              className="relative w-full h-full flex items-center justify-center pointer-events-none"
            >
              {/* SLOT 1: PREVIOUS CATEGORY (at -120 degrees) */}
              <div
                onClick={() => changeCategory(-1)}
                className="absolute w-[240px] sm:w-[280px] h-[300px] sm:h-[350px] flex flex-col items-center justify-center p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-md cursor-pointer pointer-events-auto transition-opacity duration-300 hover:opacity-70"
                style={{
                  transform: "rotateY(-120deg) translateZ(140px)",
                  opacity: 0.35,
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="relative w-full h-[200px] flex items-center justify-center">
                  <Image
                    src={leftImageSrc}
                    alt={prevCategory?.name || "Previous Category"}
                    fill
                    sizes="280px"
                    className="object-contain filter grayscale contrast-75 drop-shadow-sm"
                  />
                </div>
                <span className="font-mono text-xs font-bold text-slate-500 mt-2 truncate max-w-full text-center">
                  {prevCategory?.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">-120°</span>
              </div>

              {/* SLOT 2: NEXT CATEGORY (at +120 degrees) */}
              <div
                onClick={() => changeCategory(1)}
                className="absolute w-[240px] sm:w-[280px] h-[300px] sm:h-[350px] flex flex-col items-center justify-center p-4 bg-white/70 backdrop-blur-sm rounded-2xl border border-slate-200/80 shadow-md cursor-pointer pointer-events-auto transition-opacity duration-300 hover:opacity-70"
                style={{
                  transform: "rotateY(120deg) translateZ(140px)",
                  opacity: 0.35,
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="relative w-full h-[200px] flex items-center justify-center">
                  <Image
                    src={rightImageSrc}
                    alt={nextCategory?.name || "Next Category"}
                    fill
                    sizes="280px"
                    className="object-contain filter grayscale contrast-75 drop-shadow-sm"
                  />
                </div>
                <span className="font-mono text-xs font-bold text-slate-500 mt-2 truncate max-w-full text-center">
                  {nextCategory?.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">+120°</span>
              </div>

              {/* SLOT 0: CENTER ACTIVE CATEGORY & SELECTED PRODUCT (at 0 degrees) */}
              <div
                className="absolute w-[300px] sm:w-[380px] md:w-[420px] h-[340px] sm:h-[400px] md:h-[420px] flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-slate-200 shadow-2xl pointer-events-auto z-40 transition-shadow duration-300 hover:shadow-sky-500/10"
                style={{
                  transform: "rotateY(0deg) translateZ(140px)",
                  opacity: 1,
                  backfaceVisibility: "hidden",
                }}
              >
                {/* Subtle Inner Card Lighting */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/[0.03] to-transparent rounded-3xl pointer-events-none" />

                {/* Primary Centered Cutout Image (400px desktop target, object-contain) */}
                <div className="relative w-full h-[260px] sm:h-[300px] md:h-[320px] flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`center-img-${activeCategory.id}-${activeProduct?.id || "default"}`}
                      initial={{ opacity: 0, scale: 0.94 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.94 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="relative w-full h-full flex items-center justify-center"
                    >
                      <Image
                        src={centerImageSrc}
                        alt={activeProduct?.name || activeCategory.name}
                        fill
                        sizes="(max-width: 640px) 300px, 420px"
                        className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.12)] pointer-events-none"
                        priority
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Soft Elliptical Grounding Floor Shadow */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-3 bg-slate-900/10 rounded-full blur-md pointer-events-none" />

                {/* Horizontal Product Pagination Indicator under Central Image */}
                {activeCategory.products && activeCategory.products.length > 1 && (
                  <div className="relative z-20 flex items-center gap-3 pt-2">
                    <button
                      onClick={() => changeProduct(-1)}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                      title="Previous Product"
                      aria-label="Previous Product"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1">
                      {activeCategory.products.map((p, pIdx) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setCategoryProductIndex((prevMap) => ({
                              ...prevMap,
                              [activeCategory.id]: pIdx,
                            }));
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            currentProductIdx === pIdx
                              ? "w-5 bg-sky-600"
                              : "w-1.5 bg-slate-200 hover:bg-slate-300"
                          }`}
                          title={`Select ${p.name}`}
                          aria-label={`Select product ${p.name}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => changeProduct(1)}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-600 hover:text-sky-700 transition-colors cursor-pointer"
                      title="Next Product"
                      aria-label="Next Product"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* -----------------------------------------------------------------------
              PRODUCT DETAILS PANEL (Positioned to the RIGHT of the centered image)
             ----------------------------------------------------------------------- */}
          <div
            data-el="active-product-details"
            className="w-full lg:max-w-[420px] flex flex-col justify-center space-y-4 text-left px-2 sm:px-4 z-20"
          >
            {activeProduct ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`prod-info-${activeProduct.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-xl space-y-4"
                >
                  {/* Category & Product Index Tag */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
                    <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100 uppercase tracking-wider">
                      {activeCategory.name}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 font-semibold">
                      PRODUCT 0{currentProductIdx + 1} // 0{activeCategory.products.length}
                    </span>
                  </div>

                  {/* Product Title */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
                      {activeProduct.name}
                    </h3>
                    {activeProduct.sku && (
                      <span className="font-mono text-xs text-slate-400 block mt-1">
                        SKU: {activeProduct.sku}
                      </span>
                    )}
                  </div>

                  {/* Product Short Description */}
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-3">
                    {activeProduct.shortDescription ||
                      activeProduct.description ||
                      "Engineered for sub-micron positioning repeatability and high dynamic load capacities in demanding industrial automation."}
                  </p>

                  {/* Price & Action Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      {(activeProduct.basePrice || (activeProduct as any).price) ? (
                        <div className="space-y-0.5">
                          <span className="block font-mono text-[10px] text-slate-400 uppercase font-bold">
                            Price
                          </span>
                          <span className="font-mono text-lg sm:text-xl font-extrabold text-slate-900">
                            ₹{Number(activeProduct.basePrice || (activeProduct as any).price).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ) : (
                        <span className="font-mono text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                          OEM In Stock
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/product/${activeProduct.slug || activeProduct.id}`}
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
              <div className="bg-white/90 backdrop-blur-md border border-slate-200/90 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-md border border-amber-200 inline-flex">
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>CATALOG READY</span>
                </div>

                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {activeCategory.name}
                </h3>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Precision hardware solutions configured to your machine specifications. Explore full category inventory or submit technical drawings for custom sizing.
                </p>

                <div className="pt-2">
                  <Link
                    href={`/category/${activeCategory.slug || activeCategory.id}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-sky-600 transition-colors shadow-md"
                  >
                    <span>BROWSE CATEGORY</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            )}

            {/* Mobile Category Navigation Controls (Visible on smaller screens) */}
            <div className="flex lg:hidden items-center justify-between pt-2">
              <button
                onClick={() => changeCategory(-1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 text-xs font-bold border border-slate-200"
              >
                <ChevronUp className="w-4 h-4" />
                <span>PREV CATEGORY</span>
              </button>

              <button
                onClick={() => changeCategory(1)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 text-slate-700 text-xs font-bold border border-slate-200"
              >
                <span>NEXT CATEGORY</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
