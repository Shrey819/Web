"use client";

import React, { useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Sparkles, Tag, CheckCircle, Play, Pause } from "lucide-react";
import { CinematicProduct, CINEMATIC_PRODUCTS } from "./cinematicProducts";
import { CinematicProductStage } from "./CinematicProductStage";
import { OrbitStageConfig, DEFAULT_ORBIT_STAGE } from "@/lib/homepage";

interface CinematicProductSectionProps {
  products?: CinematicProduct[];
  autoRotateSpeed?: number; // Product cycles per second
  config?: OrbitStageConfig;
}

export const CinematicProductSection: React.FC<CinematicProductSectionProps> = ({
  products = CINEMATIC_PRODUCTS,
  autoRotateSpeed = 0.35,
  config,
}) => {
  const currentConfig = config || DEFAULT_ORBIT_STAGE;
  const shouldReduceMotion = useReducedMotion();
  const [progressValue, setProgressValue] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // If config provides products, merge or use them
  const displayProducts: CinematicProduct[] =
    currentConfig.products && currentConfig.products.length > 0
      ? currentConfig.products.map((p, idx) => ({
          id: p.id || `cine-${idx}`,
          sku: p.sku || `SKU-${idx + 1}`,
          name: p.name,
          category: p.category,
          subtitle: p.subtitle,
          description: "",
          price: p.price,
          specs: p.specs || [],
          image: p.image || CINEMATIC_PRODUCTS[idx % CINEMATIC_PRODUCTS.length].image,
        }))
      : products;

  const numProducts = displayProducts.length;

  // Continuous Time-Based Animation Loop (Uninterrupted 3D Orbital Motion)
  useEffect(() => {
    if (shouldReduceMotion || !isPlaying) return;

    let animFrameId: number;
    let lastTimestamp: number | null = null;

    const updateLoop = (timestamp: number) => {
      if (lastTimestamp !== null) {
        const deltaSec = (timestamp - lastTimestamp) / 1000;
        setProgressValue((prev) => prev + deltaSec * autoRotateSpeed);
      }
      lastTimestamp = timestamp;
      animFrameId = requestAnimationFrame(updateLoop);
    };

    animFrameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, autoRotateSpeed, shouldReduceMotion]);

  // Synchronized active product index
  const activeIndex =
    ((Math.floor(progressValue + 0.5) % numProducts) + numProducts) % numProducts;
  const activeProduct = displayProducts[activeIndex] || displayProducts[0];

  // Direct dot click navigation to jump to product
  const handleSelectProduct = (targetIdx: number) => {
    const currentBase = Math.floor(progressValue / numProducts) * numProducts;
    setProgressValue(currentBase + targetIdx);
  };

  return (
    <section className="relative w-full py-12 sm:py-20 bg-slate-950 text-white font-sans border-b border-slate-800/80 overflow-hidden min-h-[90vh] flex flex-col justify-between">
      {/* Hidden preloader */}
      <div className="hidden" aria-hidden="true">
        {displayProducts.map((p) => (
          <Image key={`preload-${p.id}`} src={p.image} alt="" width={1} height={1} priority />
        ))}
      </div>

      {/* 1. Header Area: Category & Headline */}
      <div className="relative z-50 text-center max-w-3xl mx-auto space-y-2.5 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{currentConfig.eyebrow || "Autonomous 3D Product Showcase"}</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
          {currentConfig.title || "Speak with precision components that power automation"}
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto hidden sm:block">
          {currentConfig.subtitle ||
            "Continuous 3D horizontal orbital product movement. Uninterrupted autonomous rotation."}
        </p>
      </div>

      {/* 2. Central 3D Product Stage (Uninterrupted Motion Engine) */}
      <div className="relative flex-1 w-full my-4 flex items-center justify-center">
        <CinematicProductStage
          products={displayProducts}
          progress={progressValue}
          isReducedMotion={shouldReduceMotion ?? false}
        />
      </div>

      {/* 3. Bottom Information Bar: Active Product Details & Dot Navigation */}
      <div className="relative z-50 max-w-4xl mx-auto w-full text-center space-y-4 px-4">
        {/* Active Product Info */}
        <div className="space-y-1.5 transition-all duration-300">
          <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
            <Tag className="w-3.5 h-3.5" />
            <span>{activeProduct.category}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{activeProduct.sku}</span>
          </div>

          <h3 className="text-xl sm:text-3xl font-bold text-white tracking-tight">
            {activeProduct.name}
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto line-clamp-1">
            {activeProduct.subtitle}
          </p>

          {/* Specifications Rail */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <span className="text-base sm:text-lg font-extrabold font-mono text-amber-400 bg-amber-500/10 px-3 py-0.5 rounded-lg border border-amber-500/20">
              {activeProduct.price}
            </span>
            {(activeProduct.specs || []).map((spec, i) => (
              <div
                key={i}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
              >
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                <span className="text-slate-400">{spec.label}:</span>
                <span className="font-semibold text-white">{spec.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Circular Pagination Dots & Play/Pause Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          {/* Play/Pause Toggle */}
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title={isPlaying ? "Pause Rotation" : "Play Rotation"}
            suppressHydrationWarning
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Pagination Track */}
          <div className="flex items-center gap-1.5">
            {displayProducts.map((p, idx) => {
              const isDotActive = activeIndex === idx;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectProduct(idx)}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    isDotActive
                      ? "w-8 bg-amber-400 shadow-md shadow-amber-400/40"
                      : "w-2 bg-slate-700 hover:bg-slate-500"
                  }`}
                  aria-label={`Jump to ${p.name}`}
                  suppressHydrationWarning
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
