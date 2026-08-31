"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, useMotionValue, useTransform, useReducedMotion, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Layers, Hand } from "lucide-react";
import {
  TopFundamentalsConfig,
  DEFAULT_TOP_FUNDAMENTALS,
} from "@/lib/homepage";

// Style mappings for card color themes
const THEME_STYLES = {
  blue: {
    cardBg: "bg-gradient-to-br from-[#0052fe] via-[#0047df] to-[#0235a8]",
    cardBorder: "border-blue-400/30",
    shadow: "shadow-[0_25px_60px_-15px_rgba(0,82,254,0.45)]",
    pillBg: "bg-white text-[#0052fe] font-bold",
    titleText: "text-white",
    descText: "text-blue-100/90",
    numberText: "text-blue-200/60",
    accentGlow: "rgba(0, 82, 254, 0.3)",
  },
  slate: {
    cardBg: "bg-gradient-to-br from-[#1e293b] via-[#172033] to-[#0f172a]",
    cardBorder: "border-slate-600/50",
    shadow: "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.65)]",
    pillBg: "bg-slate-700/80 text-slate-200 border border-slate-500/40 font-semibold",
    titleText: "text-white",
    descText: "text-slate-300",
    numberText: "text-slate-500",
    accentGlow: "rgba(30, 41, 59, 0.4)",
  },
  white: {
    cardBg: "bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#f1f5f9]",
    cardBorder: "border-slate-300/80 shadow-md",
    shadow: "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.45)]",
    pillBg: "bg-slate-900 text-white font-bold",
    titleText: "text-slate-900",
    descText: "text-slate-600",
    numberText: "text-slate-400",
    accentGlow: "rgba(255, 255, 255, 0.2)",
  },
  carbon: {
    cardBg: "bg-gradient-to-br from-[#111622] via-[#0b0f17] to-[#05070c]",
    cardBorder: "border-slate-700/60",
    shadow: "shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]",
    pillBg: "bg-white/10 text-slate-200 border border-white/20 font-semibold",
    titleText: "text-white",
    descText: "text-slate-400",
    numberText: "text-slate-600",
    accentGlow: "rgba(17, 22, 34, 0.5)",
  },
};

export function TopFundamentals({ config }: { config?: TopFundamentalsConfig }) {
  const currentConfig = config || DEFAULT_TOP_FUNDAMENTALS;
  const items = (currentConfig.items && currentConfig.items.length > 0)
    ? currentConfig.items
    : DEFAULT_TOP_FUNDAMENTALS.items;

  const totalCards = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);

  // Motion values for smooth physical drag on the front card
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Dynamic tilt & scale during drag
  const dynamicRotate = useTransform(
    [dragX, dragY],
    ([x, y]: number[]) => (x * 0.08) + (y * 0.02)
  );
  const dynamicScale = useTransform(
    [dragX, dragY],
    ([x, y]: number[]) => Math.max(0.92, 1 - (Math.hypot(x, y) / 1400))
  );

  const handleNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % totalCards);
  }, [totalCards]);

  const handlePrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards);
  }, [totalCards]);

  // Keyboard navigation when section is focused / visible
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        handleNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        handlePrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrev]);

  // Drag handlers for mouse & touch pointer events
  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    const distance = Math.hypot(info.offset.x, info.offset.y);
    const velocity = Math.hypot(info.velocity.x, info.velocity.y);

    // Swipe threshold: 100px distance or quick flick velocity (>= 400px/s)
    if (distance >= 100 || velocity >= 400) {
      // If dragged left, upward, or downward with negative x, cycle to next
      if (info.offset.x < -20 || (Math.abs(info.offset.x) <= 20 && info.offset.y !== 0)) {
        handleNext();
      } else if (info.offset.x > 20) {
        handlePrev();
      } else {
        handleNext();
      }
    }

    // Reset motion values
    dragX.set(0);
    dragY.set(0);
  };

  // Helper to compute deterministic radial fan placement for every card
  const getCardStyle = (index: number) => {
    // Relative position from active index: 0 = front card, 1..total-1 = background cards
    const rawDiff = (index - activeIndex + totalCards) % totalCards;
    
    // Convert to symmetric relative offset: 0, +1, -1, +2, -2, +3, -3, +4, -4, 5
    // so cards fan out symmetrically on both left and right sides behind front
    let relOffset = 0;
    if (rawDiff === 0) {
      relOffset = 0;
    } else if (rawDiff <= Math.floor(totalCards / 2)) {
      relOffset = rawDiff; // +1, +2, +3, +4, +5
    } else {
      relOffset = rawDiff - totalCards; // -4, -3, -2, -1
    }

    const isFront = relOffset === 0;
    const absOffset = Math.abs(relOffset);

    // Progressive rotation angle: roughly 12° to 14° per step
    let rotateAngle = relOffset * 13.5;
    if (shouldReduceMotion) {
      rotateAngle = relOffset * 3;
    }

    // Radial translate offsets to produce genuine circular rosette depth
    const rad = (rotateAngle * Math.PI) / 180;
    const radiusPush = absOffset * 3.5;
    const xOffset = Math.sin(rad) * radiusPush;
    const yOffset = Math.abs(Math.cos(rad)) * (absOffset * 1.5);

    // Scale descends gently as card moves deeper into stack
    const scale = isFront ? 1 : Math.max(0.85, 1 - absOffset * 0.035);

    // Z-index: front card is highest (50), descending toward back
    const zIndex = isFront ? 50 : Math.max(1, 40 - absOffset * 4);

    // Opacity: high visibility for all visible cards in the rosette
    const opacity = isFront ? 1 : Math.max(0.7, 1 - absOffset * 0.05);

    return {
      isFront,
      rotateAngle,
      xOffset,
      yOffset,
      scale,
      zIndex,
      opacity,
      absOffset,
    };
  };

  const activeFormattedNumber = String(activeIndex + 1).padStart(2, "0");
  const totalFormattedNumber = String(totalCards).padStart(2, "0");

  return (
    <section
      id="sec-top-fundamentals"
      ref={containerRef}
      className="relative w-full py-20 md:py-28 bg-[#000000] text-white overflow-hidden border-b border-neutral-800 select-none"
    >
      {/* Background High-Tech Atmospheric Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[850px] md:h-[850px] bg-blue-600/10 rounded-full blur-[140px]" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-sky-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="content-shell relative z-10 flex flex-col items-center">
        {/* Section Header */}
        <div className="text-center max-w-3xl mb-12 md:mb-16 px-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 text-sky-400 text-xs font-mono font-semibold uppercase tracking-wider mb-4 shadow-sm">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>{currentConfig.eyebrow || "ENGINEERING PRINCIPLES"}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-4">
            {currentConfig.title || "TOP 10 FUNDAMENTALS"}
          </h2>

          <p className="text-sm md:text-base text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            {currentConfig.subtitle ||
              "Core engineering laws governing deterministic control, high-speed motion, signal isolation, and industrial reliability."}
          </p>
        </div>

        {/* Central Radial Rosette Card Deck */}
        <div className="relative w-full flex items-center justify-center min-h-[460px] sm:min-h-[500px] md:min-h-[560px] py-4">
          <div className="relative w-[280px] xs:w-[310px] sm:w-[340px] md:w-[380px] h-[390px] xs:h-[420px] sm:h-[450px] md:h-[490px] flex items-center justify-center">
            {items.map((item, idx) => {
              const { isFront, rotateAngle, xOffset, yOffset, scale, zIndex, opacity } =
                getCardStyle(idx);
              const theme = THEME_STYLES[item.colorTheme] || THEME_STYLES.blue;

              if (isFront) {
                // Active Front Card with omnidirectional drag physics
                return (
                  <motion.div
                    key={item.id || idx}
                    drag
                    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    dragElastic={0.85}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    style={{
                      x: dragX,
                      y: dragY,
                      rotate: dynamicRotate,
                      scale: dynamicScale,
                      zIndex: 50,
                      touchAction: "none",
                    }}
                    animate={{
                      scale: 1,
                      rotate: 0,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 26,
                    }}
                    className={`absolute inset-0 rounded-3xl p-6 sm:p-8 flex flex-col justify-between cursor-grab active:cursor-grabbing border ${theme.cardBorder} ${theme.cardBg} ${theme.shadow} backdrop-blur-sm transition-shadow duration-300`}
                    role="region"
                    aria-label={`Fundamental card ${idx + 1}: ${item.title}`}
                  >
                    {/* Top Row: Tag & Index */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] sm:text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-sm ${theme.pillBg}`}
                      >
                        {item.tag}
                      </span>
                      <span className={`text-xs font-mono font-bold tracking-widest ${theme.numberText}`}>
                        {item.number || String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>

                    {/* Middle: Punchy Core Question / Title */}
                    <div className="my-auto py-3">
                      <h3
                        className={`text-xl sm:text-2xl md:text-[26px] font-bold leading-tight tracking-tight ${theme.titleText}`}
                      >
                        {item.title}
                      </h3>
                    </div>

                    {/* Bottom: Technical Insight / Explanation */}
                    <div className="pt-4 border-t border-white/10 flex flex-col gap-2">
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme.descText}`}>
                        {item.description}
                      </p>
                    </div>

                    {/* Drag Hint Overlay Indicator */}
                    {isDragging && (
                      <div className="absolute inset-0 rounded-3xl bg-black/20 pointer-events-none flex items-center justify-center">
                        <div className="px-4 py-2 rounded-full bg-black/70 backdrop-blur-md text-white text-xs font-mono font-medium flex items-center gap-2 border border-white/20">
                          <Hand className="w-3.5 h-3.5 animate-pulse" />
                          <span>Release to switch</span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              }

              // Background Cards in the Radial Rosette Fan
              return (
                <motion.div
                  key={item.id || idx}
                  onClick={() => setActiveIndex(idx)}
                  animate={{
                    rotate: rotateAngle,
                    x: xOffset,
                    y: yOffset,
                    scale: scale,
                    opacity: opacity,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 28,
                  }}
                  style={{
                    zIndex: zIndex,
                    transformOrigin: "center 85%",
                  }}
                  className={`absolute inset-0 rounded-3xl p-6 sm:p-8 flex flex-col justify-between border cursor-pointer ${theme.cardBorder} ${theme.cardBg} ${theme.shadow} hover:opacity-100 transition-opacity`}
                  role="button"
                  tabIndex={0}
                  aria-label={`Jump to Fundamental ${idx + 1}: ${item.tag}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setActiveIndex(idx);
                    }
                  }}
                >
                  {/* Top Tag & Number */}
                  <div className="flex items-center justify-between pointer-events-none">
                    <span
                      className={`text-[11px] sm:text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full ${theme.pillBg}`}
                    >
                      {item.tag}
                    </span>
                    <span className={`text-xs font-mono font-bold ${theme.numberText}`}>
                      {item.number || String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Title Preview */}
                  <div className="my-auto py-2 pointer-events-none">
                    <h3 className={`text-lg sm:text-xl font-bold leading-snug line-clamp-3 ${theme.titleText}`}>
                      {item.title}
                    </h3>
                  </div>

                  {/* Bottom Divider */}
                  <div className="pt-3 border-t border-white/10 pointer-events-none opacity-40">
                    <div className="h-2 w-16 rounded-full bg-white/20" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Navigation & Controls Section (Matching Reference '< Swipe >') */}
        <div className="mt-8 flex flex-col items-center gap-4">
          {/* '< Swipe >' Pill Bar */}
          <div className="inline-flex items-center gap-6 px-6 py-2.5 rounded-full bg-neutral-900/90 border border-neutral-800 shadow-lg text-neutral-300">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded-full hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              aria-label="Previous fundamental card"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-xs sm:text-sm font-medium tracking-wide text-neutral-400 select-none">
              Swipe
            </span>

            <button
              onClick={handleNext}
              className="p-1.5 rounded-full hover:bg-neutral-800 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500/50"
              aria-label="Next fundamental card"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Position Progress Indicator (01 / 10) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold tracking-widest text-neutral-400">
              <span className="text-white">{activeFormattedNumber}</span>
              <span className="mx-1 text-neutral-600">/</span>
              <span>{totalFormattedNumber}</span>
            </span>

            {/* Micro Dot Indicators */}
            <div className="flex items-center gap-1.5 ml-2">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 focus:outline-none ${
                    i === activeIndex
                      ? "w-6 bg-sky-500"
                      : "w-1.5 bg-neutral-800 hover:bg-neutral-600"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
