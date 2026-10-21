"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionValueEvent,
  useReducedMotion,
} from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Layers,
  Sparkles,
  PackageCheck,
  Tag,
  SlidersHorizontal,
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
  const sectionRef = useRef<HTMLDivElement>(null);

  // 1. Resolve categories and active products
  const resolvedCategories = useMemo(() => {
    return resolve3DCategories(categories, products);
  }, [categories, products]);

  const numCategories = resolvedCategories.length;

  // 2. Exact Vertical Scroll Budget:
  // First 500px for C1 (0-500px, 0deg)
  // 500-700px: 120deg rotation from C1 to C2 (200px transition)
  // 700-1200px: C2 stationary at 0deg (500px window)
  // 1200-1400px: 120deg rotation from C2 to C3 (200px transition)
  // 1400-1900px: C3 stationary at 0deg (500px window)
  // 1900-2100px: 120deg rotation from C3 to C4 (200px transition)
  // 2100-2600px: C4 stationary at 0deg (500px window)
  const activeWindowPx = 500;
  const transitionWindowPx = 200;
  const stepDistancePx = activeWindowPx + transitionWindowPx; // 700px per category cycle

  // Total scroll distance: for 4 categories = (3 * 700) + 500 = 2600px
  const totalScrollPx = useMemo(() => {
    if (numCategories <= 1) return 1000;
    return (numCategories - 1) * stepDistancePx + activeWindowPx;
  }, [numCategories, stepDistancePx, activeWindowPx]);

  // Construct deterministic piecewise scroll progress and angle mapping
  const { scrollPoints, anglePoints } = useMemo(() => {
    const sp: number[] = [];
    const ap: number[] = [];

    if (numCategories <= 1) {
      return { scrollPoints: [0, 1], anglePoints: [0, 0] };
    }

    for (let i = 0; i < numCategories; i++) {
      const activeStartPx = i * stepDistancePx;
      const activeEndPx = activeStartPx + activeWindowPx;
      const baseAngle = -i * 120;

      // Start of active 500px plateau
      sp.push(Math.min(1.0, activeStartPx / totalScrollPx));
      ap.push(baseAngle);

      // End of active 500px plateau
      sp.push(Math.min(1.0, activeEndPx / totalScrollPx));
      ap.push(baseAngle);
    }

    // Ensure monotonically non-decreasing unique points
    const cleanSp: number[] = [];
    const cleanAp: number[] = [];
    for (let i = 0; i < sp.length; i++) {
      const p = Math.max(0, Math.min(1, sp[i]));
      if (cleanSp.length === 0 || p > cleanSp[cleanSp.length - 1] + 0.0001) {
        cleanSp.push(p);
        cleanAp.push(ap[i]);
      } else if (p === cleanSp[cleanSp.length - 1]) {
        cleanAp[cleanAp.length - 1] = ap[i];
      }
    }
    if (cleanSp[cleanSp.length - 1] < 1.0) {
      cleanSp.push(1.0);
      cleanAp.push(cleanAp[cleanAp.length - 1]);
    }

    return { scrollPoints: cleanSp, anglePoints: cleanAp };
  }, [numCategories, stepDistancePx, activeWindowPx, totalScrollPx]);

  // Framer Motion Page Scroll Tracking
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Linear scroll-linked rotation transform across the 2600px budget
  const scrollRotation = useTransform(scrollYProgress, scrollPoints, anglePoints);

  // Active Category State
  const [activeCategoryIdx, setActiveCategoryIdx] = useState<number>(0);
  const [scrollPixelDisplay, setScrollPixelDisplay] = useState<number>(0);

  // 3. Horizontal Product Browsing State
  // Independent product index for each category
  const [categoryProductIndex, setCategoryProductIndex] = useState<Record<string, number>>({});
  // Swipe direction: +1 = right-to-left (next product enters from right, old exits to left)
  //                  -1 = left-to-right (prev product enters from left, old exits to right)
  const [swipeDirection, setSwipeDirection] = useState<number>(1);

  // Synchronize active category index from vertical page scroll
  useMotionValueEvent(scrollYProgress, "change", (latestProgress) => {
    const currentPx = Math.round(latestProgress * totalScrollPx);
    setScrollPixelDisplay(currentPx);

    // Identify which category zone we are currently in
    // Midpoint between Ci and Ci+1 is at: i * 700 + 600px
    let matchedIndex = 0;
    for (let i = 0; i < numCategories; i++) {
      const thresholdStart = i * stepDistancePx - transitionWindowPx / 2;
      const thresholdEnd = (i + 1) * stepDistancePx - transitionWindowPx / 2;
      if (currentPx >= thresholdStart && (i === numCategories - 1 || currentPx < thresholdEnd)) {
        matchedIndex = i;
        break;
      }
    }

    if (matchedIndex !== activeCategoryIdx) {
      setActiveCategoryIdx(matchedIndex);
    }
  });

  // Active Category & Selected Product
  const activeCategory: ResolvedCategory3D =
    resolvedCategories[activeCategoryIdx] || resolvedCategories[0];

  const currentProductIdx = activeCategory ? (categoryProductIndex[activeCategory.id] || 0) : 0;
  const activeProduct: Product | undefined =
    activeCategory?.products && activeCategory.products.length > 0
      ? activeCategory.products[currentProductIdx % activeCategory.products.length]
      : undefined;

  // Horizontal product swap handler strictly within the 500x800px frame
  const changeProduct = useCallback(
    (delta: number) => {
      if (!activeCategory || !activeCategory.products || activeCategory.products.length <= 1) return;

      const totalProds = activeCategory.products.length;
      setSwipeDirection(delta > 0 ? 1 : -1);

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

  // Jump to specific category by scrolling the page
  const scrollToCategory = useCallback(
    (targetIndex: number) => {
      if (!sectionRef.current) return;
      const sectionTop = sectionRef.current.offsetTop;
      const targetPx = targetIndex * stepDistancePx + 250; // middle of the 500px window
      window.scrollTo({
        top: sectionTop + targetPx,
        behavior: "smooth",
      });
    },
    [stepDistancePx]
  );

  // Keyboard navigation: ArrowUp/Down for category, ArrowLeft/Right for horizontal product swap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const inView = rect.top <= window.innerHeight * 0.5 && rect.bottom >= window.innerHeight * 0.5;
      if (!inView) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = Math.min(numCategories - 1, activeCategoryIdx + 1);
        scrollToCategory(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = Math.max(0, activeCategoryIdx - 1);
        scrollToCategory(prev);
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
  }, [activeCategoryIdx, numCategories, scrollToCategory, changeProduct]);

  // Touch drag tracking for the 500x800px horizontal frame
  const touchStartXRef = useRef<number | null>(null);
  const handleFrameTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartXRef.current = e.touches[0].clientX;
    }
  };
  const handleFrameTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const endX = e.changedTouches[0].clientX;
    const diffX = endX - touchStartXRef.current;
    if (Math.abs(diffX) > 40) {
      if (diffX < 0) {
        // Swiped Left -> advance product (next product enters from right, old exits left)
        changeProduct(1);
      } else {
        // Swiped Right -> previous product (enters from left, old exits right)
        changeProduct(-1);
      }
    }
    touchStartXRef.current = null;
  };

  // Image source resolution
  const centerImageSrc =
    activeProduct?.images?.[0]?.url ||
    activeCategory?.image ||
    FALLBACK_CATEGORY_IMAGES.default;

  const prevIdx = (activeCategoryIdx - 1 + numCategories) % numCategories;
  const nextIdx = (activeCategoryIdx + 1) % numCategories;
  const prevCategory = resolvedCategories[prevIdx];
  const nextCategory = resolvedCategories[nextIdx];

  const leftImageSrc = prevCategory?.image || FALLBACK_CATEGORY_IMAGES.default;
  const rightImageSrc = nextCategory?.image || FALLBACK_CATEGORY_IMAGES.default;

  // Active Product Price display
  const activeProductPrice = activeProduct
    ? (activeProduct.basePrice || (activeProduct as any).price)
    : undefined;

  // Under prefers-reduced-motion: unpin, fluid height, clean instant transitions
  if (shouldReduceMotion) {
    return (
      <section
        data-scene="category-distribution-3d"
        className="relative w-full py-16 bg-white text-slate-900 border-b border-slate-200"
      >
        <div className="content-shell max-w-5xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="font-mono text-xs font-bold text-sky-600 uppercase tracking-widest bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              INDUSTRIAL CATEGORY DOMAINS
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900">
              {activeCategory.name}
            </h2>
            <p className="text-sm text-slate-600">{activeCategory.description}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {resolvedCategories.map((c, i) => (
              <button
                key={c.id}
                onClick={() => setActiveCategoryIdx(i)}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                  activeCategoryIdx === i
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* 500x800px Frame Fallback */}
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
            <div className="relative w-full max-w-[480px] h-[400px] sm:h-[500px] bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center p-6">
              <Image
                src={centerImageSrc}
                alt={activeProduct?.name || activeCategory.name}
                fill
                className="object-contain p-4"
              />
            </div>

            <div className="w-full max-w-[420px] bg-white border border-slate-200 p-6 rounded-2xl shadow-lg space-y-4 text-left">
              <span className="font-mono text-xs font-bold text-sky-600 uppercase">
                {activeCategory.name}
              </span>
              <h3 className="text-2xl font-bold text-slate-900">
                {activeProduct?.name || activeCategory.name}
              </h3>
              <p className="text-sm text-slate-600">
                {activeProduct?.shortDescription || activeProduct?.description || activeCategory.description}
              </p>
              {activeProductPrice && (
                <div className="text-xl font-bold text-slate-900">
                  ₹{Number(activeProductPrice).toLocaleString("en-IN")}
                </div>
              )}
              {activeProduct && (
                <Link
                  href={`/product/${activeProduct.slug || activeProduct.id}`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-sky-600 transition-colors"
                >
                  <span>VIEW PRODUCT</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // =========================================================================
  // PRODUCTION PINNED 3D Y-AXIS STAGE WITH 2600PX SCROLL BUDGET & 500x800PX FRAME
  // =========================================================================
  return (
    <section
      ref={sectionRef}
      data-scene="category-distribution-3d"
      style={{ height: `calc(${totalScrollPx}px + 100vh)` }}
      className="relative w-full bg-white text-slate-900 border-b border-slate-200/90 select-none"
    >
      {/* Pinned Viewport Container */}
      <div className="sticky top-0 w-full h-screen overflow-hidden flex flex-col justify-between py-6 sm:py-8">
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

        {/* Ambient Cobalt Blue Light Diffusion Behind Stage */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[650px] pointer-events-none transition-all duration-700 ease-out"
          style={{
            background:
              "radial-gradient(ellipse at center, rgba(2, 132, 199, 0.08) 0%, rgba(14, 165, 233, 0.03) 45%, transparent 70%)",
          }}
        />

        {/* Technical HUD Metadata Indicators */}
        <div className="absolute top-4 left-6 hidden md:flex items-center gap-2 pointer-events-none font-mono text-[10px] text-slate-400 uppercase tracking-widest z-30">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
          <span>Y-AXIS 120° ROTATION // 500PX ACTIVE • 200PX TRANSITION</span>
        </div>
        <div className="absolute top-4 right-6 hidden md:flex items-center gap-4 pointer-events-none font-mono text-[10px] text-slate-400 uppercase tracking-widest z-30">
          <span>SCROLL: {scrollPixelDisplay}px / {totalScrollPx}px</span>
          <span>DOMAIN: 0{activeCategoryIdx + 1} // 0{numCategories}</span>
        </div>

        {/* -------------------------------------------------------------------
            1. CATEGORY NAME (Prominently placed ABOVE central image)
           ------------------------------------------------------------------- */}
        <div className="relative z-30 text-center max-w-3xl mx-auto px-4 shrink-0">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-50 border border-sky-200/80 text-sky-700 text-xs font-mono font-semibold uppercase tracking-wider shadow-sm mb-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-600" />
            <span>
              Category Domain 0{activeCategoryIdx + 1} of 0{numCategories}
            </span>
          </div>

          {/* Active Category Name (Updates dynamically as carousel rotates) */}
          <motion.div
            key={`title-${activeCategory.id}`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h2
              data-el="active-category-title"
              className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight"
            >
              {activeCategory.name}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto line-clamp-1 mt-0.5">
              {activeCategory.description}
            </p>
          </motion.div>

          {/* Scroll Timeline Stepper Dots */}
          <div className="flex items-center justify-center gap-2 pt-1.5">
            {resolvedCategories.map((c, i) => (
              <button
                key={c.id}
                onClick={() => scrollToCategory(i)}
                className={`transition-all duration-300 rounded-full cursor-pointer ${
                  activeCategoryIdx === i
                    ? "w-8 h-1.5 bg-sky-600 shadow-sm shadow-sky-600/30"
                    : "w-1.5 h-1.5 bg-slate-300 hover:bg-slate-400"
                }`}
                title={`Jump to ${c.name} (${i * stepDistancePx}px)`}
                aria-label={`Jump to ${c.name}`}
              />
            ))}
          </div>
        </div>

        {/* -------------------------------------------------------------------
            2. CENTRAL 3D STAGE & 500x800PX HORIZONTAL SWAP FRAME
           ------------------------------------------------------------------- */}
        <div className="relative z-20 w-full max-w-7xl mx-auto flex-1 flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-12 px-4 min-h-0">
          {/* Vertical Stepper Quick Links (Desktop left column) */}
          <div className="hidden xl:flex flex-col items-center gap-3 shrink-0">
            <button
              onClick={() => scrollToCategory(Math.max(0, activeCategoryIdx - 1))}
              disabled={activeCategoryIdx === 0}
              className="p-2.5 rounded-full bg-white border border-slate-300 shadow-sm text-slate-700 hover:text-sky-600 hover:border-sky-500 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Previous Category (-120°)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>

            <span className="font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest writing-vertical rotate-180 py-1">
              SCROLL TIMELINE
            </span>

            <button
              onClick={() => scrollToCategory(Math.min(numCategories - 1, activeCategoryIdx + 1))}
              disabled={activeCategoryIdx === numCategories - 1}
              className="p-2.5 rounded-full bg-white border border-slate-300 shadow-sm text-slate-700 hover:text-sky-600 hover:border-sky-500 transition-all disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              title="Next Category (+120°)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          {/* 3D PERSPECTIVE SHELL */}
          <div
            data-el="category-carousel-3d"
            className="relative flex items-center justify-center shrink-0 w-full max-w-[340px] sm:max-w-[460px] lg:max-w-[500px]"
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
            }}
          >
            {/* 3D Shell rotating around Y-axis controlled by vertical scroll */}
            <motion.div
              style={{
                transformStyle: "preserve-3d",
                rotateY: scrollRotation,
              }}
              className="relative w-full flex items-center justify-center pointer-events-none"
            >
              {/* SLOT 1: PREVIOUS CATEGORY (-120 deg) */}
              <div
                onClick={() => scrollToCategory((activeCategoryIdx - 1 + numCategories) % numCategories)}
                className="absolute w-[240px] sm:w-[300px] h-[320px] sm:h-[420px] flex flex-col items-center justify-center p-4 bg-white/75 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-lg cursor-pointer pointer-events-auto transition-opacity duration-300 hover:opacity-75"
                style={{
                  transform: "rotateY(-120deg) translateZ(140px)",
                  opacity: 0.35,
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="relative w-full h-[220px] sm:h-[280px] flex items-center justify-center">
                  <Image
                    src={leftImageSrc}
                    alt={prevCategory?.name || "Previous Category"}
                    fill
                    sizes="300px"
                    className="object-contain filter grayscale contrast-75 drop-shadow-sm"
                  />
                </div>
                <span className="font-mono text-xs font-bold text-slate-500 mt-2 truncate max-w-full">
                  {prevCategory?.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">-120°</span>
              </div>

              {/* SLOT 2: NEXT CATEGORY (+120 deg) */}
              <div
                onClick={() => scrollToCategory((activeCategoryIdx + 1) % numCategories)}
                className="absolute w-[240px] sm:w-[300px] h-[320px] sm:h-[420px] flex flex-col items-center justify-center p-4 bg-white/75 backdrop-blur-sm rounded-3xl border border-slate-200/80 shadow-lg cursor-pointer pointer-events-auto transition-opacity duration-300 hover:opacity-75"
                style={{
                  transform: "rotateY(120deg) translateZ(140px)",
                  opacity: 0.35,
                  backfaceVisibility: "hidden",
                }}
              >
                <div className="relative w-full h-[220px] sm:h-[280px] flex items-center justify-center">
                  <Image
                    src={rightImageSrc}
                    alt={nextCategory?.name || "Next Category"}
                    fill
                    sizes="300px"
                    className="object-contain filter grayscale contrast-75 drop-shadow-sm"
                  />
                </div>
                <span className="font-mono text-xs font-bold text-slate-500 mt-2 truncate max-w-full">
                  {nextCategory?.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">+120°</span>
              </div>

              {/* -------------------------------------------------------------
                  SLOT 0: CENTER ACTIVE CATEGORY (0 deg)
                  CONTAINS THE EXACT 500px * 800px MASKED HORIZONTAL FRAME
                 ------------------------------------------------------------- */}
              <div
                onTouchStart={handleFrameTouchStart}
                onTouchEnd={handleFrameTouchEnd}
                className="relative w-[320px] sm:w-[440px] lg:w-[500px] h-[440px] sm:h-[580px] lg:h-[680px] xl:h-[750px] max-h-[75vh] bg-white rounded-3xl border border-slate-200/90 shadow-2xl pointer-events-auto z-40 overflow-hidden flex flex-col items-center justify-between p-4 sm:p-6"
                style={{
                  transform: "rotateY(0deg) translateZ(140px)",
                  opacity: 1,
                  backfaceVisibility: "hidden",
                  boxShadow:
                    "0 25px 60px -15px rgba(15, 23, 42, 0.12), 0 0 40px -10px rgba(2, 132, 199, 0.08)",
                }}
              >
                {/* Subtle Inner Frame Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-sky-500/[0.02] to-transparent rounded-3xl pointer-events-none" />

                {/* Frame Header Spec Tag */}
                <div className="relative z-10 w-full flex items-center justify-between text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider px-2">
                  <span>500×800 FRAME // ACTIVE</span>
                  <span>{activeCategory.badge}</span>
                </div>

                {/* -----------------------------------------------------------
                    THE HORIZONTAL SLIDE STAGE (Inside 500x800 Frame Only)
                    1st image slides left & disappears; 2nd enters from right!
                   ----------------------------------------------------------- */}
                <div className="relative w-full flex-1 overflow-hidden flex items-center justify-center my-2">
                  <AnimatePresence initial={false} custom={swipeDirection} mode="popLayout">
                    <motion.div
                      key={`frame-slide-${activeCategory.id}-${currentProductIdx}`}
                      custom={swipeDirection}
                      variants={{
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
                      }}
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
                          src={centerImageSrc}
                          alt={activeProduct?.name || activeCategory.name}
                          fill
                          sizes="(max-width: 640px) 320px, (max-width: 1024px) 440px, 500px"
                          className="object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.14)] pointer-events-none"
                          priority
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Elliptical Grounding Shadow Under Frame */}
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-48 sm:w-64 h-3 bg-slate-900/10 rounded-full blur-md pointer-events-none" />
                </div>

                {/* Horizontal Product Navigation Controls in Frame Base */}
                {activeCategory.products && activeCategory.products.length > 1 && (
                  <div className="relative z-20 w-full flex items-center justify-between pt-2 border-t border-slate-100 px-2">
                    <button
                      onClick={() => changeProduct(-1)}
                      className="p-1.5 rounded-full bg-slate-100 hover:bg-sky-100 text-slate-700 hover:text-sky-700 transition-colors cursor-pointer"
                      title="Previous Product (Slide in from left)"
                      aria-label="Previous Product"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-1.5">
                      {activeCategory.products.map((p, pIdx) => (
                        <button
                          key={p.id}
                          onClick={() => {
                            setSwipeDirection(pIdx > currentProductIdx ? 1 : -1);
                            setCategoryProductIndex((prevMap) => ({
                              ...prevMap,
                              [activeCategory.id]: pIdx,
                            }));
                          }}
                          className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                            currentProductIdx === pIdx
                              ? "w-6 bg-sky-600"
                              : "w-1.5 bg-slate-200 hover:bg-slate-300"
                          }`}
                          title={`Select ${p.name}`}
                          aria-label={`Select product ${p.name}`}
                        />
                      ))}
                    </div>

                    <button
                      onClick={() => changeProduct(1)}
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
              3. PRODUCT DETAILS PANEL (Positioned to the RIGHT of the centered frame)
             ------------------------------------------------------------------- */}
          <div
            data-el="active-product-details"
            className="w-full lg:max-w-[420px] flex flex-col justify-center space-y-4 text-left px-2 sm:px-4 z-20 shrink-0"
          >
            {activeProduct ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`prod-info-${activeProduct.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4"
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
                      {activeProductPrice ? (
                        <div className="space-y-0.5">
                          <span className="block font-mono text-[10px] text-slate-400 uppercase font-bold">
                            Price
                          </span>
                          <span className="font-mono text-lg sm:text-xl font-extrabold text-slate-900">
                            ₹{Number(activeProductPrice).toLocaleString("en-IN")}
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
              <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
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

            {/* Mobile Swipe Guidance Note */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-1 pt-1">
              <span>◄ Swipe 500px frame for products ►</span>
              <span>Scroll down for next category</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
