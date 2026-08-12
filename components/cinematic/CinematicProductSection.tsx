"use client";

import React, { useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import { Sparkles, Tag, CheckCircle, Play, Pause } from "lucide-react";
import { CinematicProduct, CINEMATIC_PRODUCTS } from "./cinematicProducts";
import { CinematicProductStage } from "./CinematicProductStage";

interface CinematicProductSectionProps {
  products?: CinematicProduct[];
  autoRotateSpeed?: number; // Product cycles per second
}

export const CinematicProductSection: React.FC<CinematicProductSectionProps> = ({
  products = CINEMATIC_PRODUCTS,
  autoRotateSpeed = 0.35,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [progressValue, setProgressValue] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const numProducts = products.length;

  // Continuous Time-Based Animation Loop (Uninterrupted 3D Orbital Motion)
  useEffect(() => {
    if (shouldReduceMotion || !isPlaying) return;

    let animFrameId: number;
    let lastTimestamp: number | null = null;

    const updateLoop = (timestamp: number) => {
      if (lastTimestamp !== null) {
        const deltaSec = (timestamp - lastTimestamp) / 1000;
        // Increment continuous progress continuously over time
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
  const activeProduct = products[activeIndex] || products[0];

  // Direct dot click navigation to jump to product
  const handleSelectProduct = (targetIdx: number) => {
    const currentBase = Math.floor(progressValue / numProducts) * numProducts;
    setProgressValue(currentBase + targetIdx);
  };

  return (
    <section className="relative w-full py-12 sm:py-20 bg-slate-950 text-white font-sans border-b border-slate-800/80 overflow-hidden min-h-[90vh] flex flex-col justify-between">
      {/* Hidden preloader for loop boundary images to prevent network flash */}
      <div className="hidden" aria-hidden="true">
        {products.map((p) => (
          <Image key={`preload-${p.id}`} src={p.image} alt="" width={1} height={1} priority />
        ))}
      </div>

      {/* 1. Header Area: Category & Headline */}
      <div className="relative z-50 text-center max-w-3xl mx-auto space-y-2.5 px-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider shadow-inner">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Autonomous 3D Product Showcase</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono">
          Speak with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
            precision components
          </span>{" "}
          that power automation
        </h2>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto hidden sm:block">
          Continuous 3D horizontal orbital product movement. Uninterrupted autonomous rotation.
        </p>
      </div>

      {/* 2. Central 3D Product Stage (Uninterrupted Motion Engine) */}
      <div className="relative flex-1 w-full my-4 flex items-center justify-center">
        <CinematicProductStage
          products={products}
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
            {activeProduct.specs.map((spec, i) => (
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
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
            title={isPlaying ? "Pause Rotation" : "Play Rotation"}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Product Dots */}
          <div className="flex items-center gap-2">
            {products.map((p, idx) => {
              const isCurrent = activeIndex === idx;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    isCurrent
                      ? "w-8 bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.7)]"
                      : "w-2.5 bg-slate-700 hover:bg-slate-500"
                  }`}
                  title={`Select ${p.name}`}
                />
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
