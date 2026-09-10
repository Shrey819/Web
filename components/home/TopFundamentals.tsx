"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Hand, Layers } from "lucide-react";
import {
  TopFundamentalsConfig,
  DEFAULT_TOP_FUNDAMENTALS,
} from "@/lib/homepage";

// Themes designed to match alternating colors (White, Blue, Slate, Carbon)
const THEME_STYLES = {
  white: {
    cardBg: "bg-gradient-to-br from-[#ffffff] via-[#f8fafc] to-[#eef2f6]",
    cardBorder: "border-slate-300/90 shadow-2xl",
    shadow: "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.4)]",
    pillBg: "bg-slate-900 text-white font-semibold",
    titleText: "text-slate-950",
    descText: "text-slate-600",
    numberText: "text-slate-400",
    divider: "border-slate-200",
  },
  blue: {
    cardBg: "bg-gradient-to-br from-[#0052fe] via-[#0047df] to-[#0235a8]",
    cardBorder: "border-blue-400/40 shadow-2xl",
    shadow: "shadow-[0_20px_50px_-10px_rgba(0,82,254,0.45)]",
    pillBg: "bg-white text-[#0052fe] font-bold",
    titleText: "text-white",
    descText: "text-blue-100/90",
    numberText: "text-blue-200/60",
    divider: "border-white/15",
  },
  slate: {
    cardBg: "bg-gradient-to-br from-[#1e293b] via-[#172033] to-[#0f172a]",
    cardBorder: "border-slate-600/60 shadow-2xl",
    shadow: "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.65)]",
    pillBg: "bg-slate-700/80 text-slate-200 border border-slate-500/40 font-semibold",
    titleText: "text-white",
    descText: "text-slate-300",
    numberText: "text-slate-400",
    divider: "border-white/10",
  },
  carbon: {
    cardBg: "bg-gradient-to-br from-[#12161f] via-[#0d1118] to-[#07090e]",
    cardBorder: "border-slate-700/70 shadow-2xl",
    shadow: "shadow-[0_20px_50px_-10px_rgba(0,0,0,0.85)]",
    pillBg: "bg-white/10 text-slate-200 border border-white/20 font-semibold",
    titleText: "text-white",
    descText: "text-slate-400",
    numberText: "text-slate-500",
    divider: "border-white/10",
  },
};

interface TossingCardState {
  id: string;
  dropX: number;
  dropY: number;
  dropRotate: number;
  flyOutX: number;
  flyOutY: number;
  finalRotate: number;
}

export function TopFundamentals({ config }: { config?: TopFundamentalsConfig }) {
  const currentConfig = config || DEFAULT_TOP_FUNDAMENTALS;
  const items =
    currentConfig.items && currentConfig.items.length > 0
      ? currentConfig.items
      : DEFAULT_TOP_FUNDAMENTALS.items;

  const totalCards = items.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [tossingCard, setTossingCard] = useState<TossingCardState | null>(null);
  const isTransitioningRef = useRef(false);

  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);

  // Dynamic tilt angle during drag
  const dynamicRotate = useTransform([dragX, dragY], ([x, y]: number[]) => x * 0.07 + y * 0.02);

  // Clockwise fan step angle around center pivot (50% 50%)
  const STEP_ANGLE = 8.5;

  const triggerSwap = useCallback(
    (
      tossParams: {
        dropX: number;
        dropY: number;
        dropRotate: number;
        flyOutX: number;
        flyOutY: number;
      } | null = null,
      direction = 1
    ) => {
      if (isTransitioningRef.current || totalCards === 0) return;
      isTransitioningRef.current = true;

      const currentCard = items[activeIndex];
      const finalOrder = totalCards - 1; // resting at the bottom of the deck
      const finalRotate = -finalOrder * STEP_ANGLE; // e.g. -76.5°

      const toss = tossParams || {
        dropX: 0,
        dropY: 0,
        dropRotate: 0,
        flyOutX: direction === 1 ? 390 : -390,
        flyOutY: 15,
      };

      // Card starts from the EXACT dropped position (dropX, dropY, dropRotate) without resetting
      setTossingCard({
        id: currentCard?.id || String(activeIndex),
        dropX: toss.dropX,
        dropY: toss.dropY,
        dropRotate: toss.dropRotate,
        flyOutX: toss.flyOutX,
        flyOutY: toss.flyOutY,
        finalRotate,
      });

      // Advance to the NEXT/PREV card
      setActiveIndex((prev) =>
        direction === 1 ? (prev + 1) % totalCards : (prev - 1 + totalCards) % totalCards
      );
      dragX.set(0);
      dragY.set(0);

      // Settle into final resting slot at the bottom of the deck
      setTimeout(() => {
        setTossingCard(null);
        isTransitioningRef.current = false;
      }, 530);
    },
    [activeIndex, items, totalCards, dragX, dragY]
  );

  const handleNext = useCallback(() => {
    triggerSwap(null, 1);
  }, [triggerSwap]);

  const handlePrev = useCallback(() => {
    if (isTransitioningRef.current || totalCards === 0) return;
    isTransitioningRef.current = true;
    setActiveIndex((prev) => (prev - 1 + totalCards) % totalCards);
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 350);
  }, [totalCards]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName || "")) return;
      if (e.key === "ArrowRight" || e.key === "ArrowDown") handleNext();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") handlePrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleNext, handlePrev]);

  // Center-Pivot Clockwise Spiral Geometry: Pure Rotation around 50% 50%
  const getCardStyle = (index: number) => {
    const order = (index - activeIndex + totalCards) % totalCards;
    const isFront = order === 0;

    // Clockwise rotation: -order * 8.5deg gives generous spacing between layers
    const rotateAngle = isFront ? 0 : -order * STEP_ANGLE;

    // Z-Index descends from 50 down to (50 - totalCards + 1)
    const zIndex = 50 - order;

    // Subtle opacity for depth
    const opacity = isFront ? 1 : Math.max(0.85, 1 - order * 0.015);

    return { isFront, rotateAngle, zIndex, opacity, order };
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);

    // Capture the exact drop position in pixels where user released the card
    const dropX = info.offset.x;
    const dropY = info.offset.y;
    const dist = Math.hypot(dropX, dropY);
    const vel = Math.hypot(info.velocity.x, info.velocity.y);

    if (dist >= 48 || vel >= 200) {
      // User dropped with swipe intent: continue animation directly from (dropX, dropY, dropRotate)
      const isRight = dropX !== 0 ? dropX > 0 : info.velocity.x >= 0;
      const flyOutX = isRight ? Math.max(dropX + 160, 390) : Math.min(dropX - 160, -390);
      const flyOutY =
        dropY * 0.5 + (info.velocity.y ? Math.max(-80, Math.min(80, info.velocity.y * 0.08)) : 10);
      const dropRotate = dropX * 0.07 + dropY * 0.02;

      triggerSwap(
        {
          dropX,
          dropY,
          dropRotate,
          flyOutX,
          flyOutY,
        },
        1
      );
    } else {
      // User cancelled drag: smoothly spring back to center directly from current drop position
      animate(dragX, 0, { type: "spring", stiffness: 400, damping: 28 });
      animate(dragY, 0, { type: "spring", stiffness: 400, damping: 28 });
    }
  };

  const activeFormattedNumber = String(activeIndex + 1).padStart(2, "0");
  const totalFormattedNumber = String(totalCards).padStart(2, "0");

  return (
    <section
      id="sec-top-fundamentals"
      className="relative w-full py-10 sm:py-14 md:py-16 bg-[#05070D] text-white overflow-hidden select-none flex flex-col items-center border-b border-slate-800/80"
    >
      {/* Ambient background glow & tech pattern */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] sm:w-[650px] sm:h-[650px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-15 pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 sm:mb-12 md:mb-14 z-10 px-4 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-cyan-400 text-[11px] sm:text-xs font-mono mb-2 sm:mb-2.5 shadow-md">
          <Layers className="w-3.5 h-3.5" />
          <span>{currentConfig.eyebrow || "ENGINEERING PRINCIPLES"}</span>
        </div>
        <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
          {currentConfig.title || "TOP 10 FUNDAMENTALS"}
        </h2>
        <p className="text-[11px] sm:text-xs md:text-sm text-slate-400 mt-1 sm:mt-1.5 max-w-xl mx-auto leading-relaxed">
          {currentConfig.subtitle ||
            "Swipe or drag the front card to watch it realistic fly out and tuck behind into the clockwise spiral."}
        </p>
      </div>

      {/* Unified Deck Container - Center-Pivot Clockwise Swirl */}
      <div className="relative w-full flex items-center justify-center min-h-[370px] xs:min-h-[400px] sm:min-h-[440px] md:min-h-[480px] pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 z-10 overflow-visible">
        <div className="relative w-[270px] xs:w-[295px] sm:w-[335px] md:w-[370px] h-[320px] xs:h-[345px] sm:h-[380px] md:h-[410px] flex items-center justify-center">
          {items.map((item, idx) => {
            const { isFront, rotateAngle, zIndex, opacity } = getCardStyle(idx);
            const themeKey = (item.colorTheme || "white") as keyof typeof THEME_STYLES;
            const theme = THEME_STYLES[themeKey] || THEME_STYLES.blue;

            // 1. TOSSING CARD: Continuously animates from the exact drop coordinates (dropX, dropY, dropRotate)
            // through the flyOut apex and tucks into the final resting slot at the bottom of the rosette
            if (tossingCard && item.id === tossingCard.id) {
              return (
                <motion.div
                  key={`tossing-${tossingCard.id}`}
                  initial={{
                    x: tossingCard.dropX,
                    y: tossingCard.dropY,
                    rotate: tossingCard.dropRotate,
                    zIndex: 55,
                  }}
                  animate={{
                    x: [tossingCard.dropX, tossingCard.flyOutX, 0],
                    y: [tossingCard.dropY, tossingCard.flyOutY, 0],
                    rotate: [tossingCard.dropRotate, tossingCard.finalRotate],
                    zIndex: [55, 55, 40],
                    opacity: [1, 0.85, 0.85],
                  }}
                  transition={{
                    x: { duration: 0.52, times: [0, 0.36, 1], ease: ["easeOut", "easeInOut"] },
                    y: { duration: 0.52, times: [0, 0.36, 1], ease: ["easeOut", "easeInOut"] },
                    rotate: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
                    zIndex: { duration: 0.52, times: [0, 0.36, 1] },
                    opacity: { duration: 0.52, ease: "easeOut" },
                  }}
                  style={{
                    transformOrigin: "50% 50%",
                    touchAction: "none",
                  }}
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col justify-between border ${theme.cardBorder} ${theme.cardBg} ${theme.shadow} pointer-events-none`}
                >
                  <div className="flex justify-between items-center gap-2">
                    <span
                      className={`text-[10px] sm:text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${theme.pillBg}`}
                    >
                      {item.tag}
                    </span>
                    <span
                      className={`font-mono font-bold text-xs tracking-widest ${theme.numberText}`}
                    >
                      {item.number || String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div className="my-auto py-2 sm:py-3">
                    <h3
                      className={`text-base xs:text-lg sm:text-xl md:text-[22px] font-black leading-snug sm:leading-tight tracking-tight ${theme.titleText}`}
                    >
                      {item.title}
                    </h3>
                  </div>
                  <div className={`pt-2.5 sm:pt-3 border-t ${theme.divider} flex flex-col gap-1.5`}>
                    <p className={`text-[11px] sm:text-xs md:text-[13px] leading-relaxed line-clamp-3 ${theme.descText}`}>
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              );
            }

            // 2. ACTIVE FRONT CARD: Center-stage card with omnidirectional drag & dynamic tilt
            if (isFront) {
              return (
                <motion.div
                  key={item.id || idx}
                  drag={!isTransitioningRef.current}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  dragElastic={0.85}
                  onDragStart={() => setIsDragging(true)}
                  onDragEnd={handleDragEnd}
                  style={{
                    x: dragX,
                    y: dragY,
                    rotate: isDragging ? dynamicRotate : undefined,
                    zIndex: 50,
                    transformOrigin: "50% 50%",
                    touchAction: "none",
                  }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{
                    rotate: { duration: 0.32, ease: "easeOut" },
                  }}
                  className={`absolute inset-0 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col justify-between cursor-grab active:cursor-grabbing border ${theme.cardBorder} ${theme.cardBg} ${theme.shadow} backdrop-blur-sm`}
                  role="region"
                  aria-label={`Fundamental card ${idx + 1}: ${item.title}`}
                >
                  {/* Top Header Row */}
                  <div className="flex justify-between items-center gap-2">
                    <span
                      className={`text-[10px] sm:text-xs uppercase tracking-wider px-3 py-1 rounded-full shadow-sm ${theme.pillBg}`}
                    >
                      {item.tag}
                    </span>
                    <span
                      className={`font-mono font-bold text-xs tracking-widest ${theme.numberText}`}
                    >
                      {item.number || String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Main Question / Title */}
                  <div className="my-auto py-2 sm:py-3">
                    <h3
                      className={`text-base xs:text-lg sm:text-xl md:text-[22px] font-black leading-snug sm:leading-tight tracking-tight ${theme.titleText}`}
                    >
                      {item.title}
                    </h3>
                  </div>

                  {/* Bottom Answer / Technical Note */}
                  <div className={`pt-2.5 sm:pt-3 border-t ${theme.divider} flex flex-col gap-1.5`}>
                    <p className={`text-[11px] sm:text-xs md:text-[13px] leading-relaxed line-clamp-3 ${theme.descText}`}>
                      {item.description}
                    </p>
                  </div>

                  {/* Drag Prompt Overlay */}
                  {isDragging && (
                    <div className="absolute inset-0 bg-black/35 rounded-2xl sm:rounded-3xl flex items-center justify-center pointer-events-none">
                      <div className="px-3 py-1 rounded-full bg-black/90 text-white text-[11px] font-mono flex items-center gap-1.5 border border-white/20 shadow-xl">
                        <Hand className="w-3 h-3 animate-pulse text-cyan-400" />
                        <span>Release to swap card</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            }

            // 3. STACKED CARDS: Clockwise Center-Pivot Spiral. Normal rotation.
            return (
              <motion.div
                key={item.id || idx}
                initial={{
                  rotate: rotateAngle,
                  opacity,
                }}
                onClick={() => {
                  if (!isTransitioningRef.current) {
                    setActiveIndex(idx);
                  }
                }}
                animate={{
                  rotate: rotateAngle,
                  opacity,
                }}
                transition={{
                  rotate: { duration: 0.32, ease: "easeOut" },
                }}
                style={{
                  zIndex,
                  transformOrigin: "50% 50%",
                }}
                className={`absolute inset-0 rounded-2xl sm:rounded-3xl p-4 sm:p-5 md:p-6 flex flex-col justify-between border cursor-pointer ${theme.cardBorder} ${theme.cardBg} ${theme.shadow} hover:opacity-100 transition-opacity`}
                role="button"
                tabIndex={0}
                aria-label={`Jump to card ${idx + 1}: ${item.tag}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (!isTransitioningRef.current) setActiveIndex(idx);
                  }
                }}
              >
                {/* Header peek */}
                <div className="flex justify-between items-center pointer-events-none">
                  <span
                    className={`text-[10px] sm:text-xs uppercase tracking-wider px-3 py-1 rounded-full ${theme.pillBg}`}
                  >
                    {item.tag}
                  </span>
                  <span className={`font-mono font-bold text-xs ${theme.numberText}`}>
                    {item.number || String(idx + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* Question peek */}
                <div className="my-auto py-2 sm:py-3 pointer-events-none">
                  <h3
                    className={`text-base xs:text-lg sm:text-xl md:text-[22px] font-black leading-snug sm:leading-tight tracking-tight line-clamp-3 ${theme.titleText}`}
                  >
                    {item.title}
                  </h3>
                </div>

                {/* Bottom line peek */}
                <div
                  className={`pt-2.5 sm:pt-3 border-t ${theme.divider} flex flex-col gap-1.5 pointer-events-none`}
                >
                  <p
                    className={`text-[11px] sm:text-xs md:text-[13px] leading-relaxed ${theme.descText} line-clamp-2`}
                  >
                    {item.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Swipe Controls & Counter */}
      <div className="mt-5 sm:mt-6 flex flex-col items-center gap-2 sm:gap-2.5 z-10 px-4">
        <div className="inline-flex items-center gap-4 sm:gap-5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-slate-900 border border-slate-800 text-slate-300 shadow-md">
          <button
            onClick={handlePrev}
            disabled={isTransitioningRef.current}
            className="p-1 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Previous card"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hover:text-cyan-400" />
          </button>
          <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-slate-400">
            Swipe or Drag Deck
          </span>
          <button
            onClick={handleNext}
            disabled={isTransitioningRef.current}
            className="p-1 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Next card"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 hover:text-cyan-400" />
          </button>
        </div>

        {/* Counter & Indicator dots */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="text-[11px] sm:text-xs font-mono tracking-widest text-slate-400">
            <span className="text-white font-bold">{activeFormattedNumber}</span> /{" "}
            {totalFormattedNumber}
          </span>
          <div className="flex items-center gap-1.5 ml-1 sm:ml-2">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  if (!isTransitioningRef.current) setActiveIndex(i);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  i === activeIndex ? "w-5 sm:w-6 bg-cyan-400" : "w-1.5 bg-slate-800 hover:bg-slate-600"
                }`}
                aria-label={`Jump to card ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TopFundamentals;
