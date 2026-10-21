"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { CinematicProduct } from "./cinematicProducts";

interface CinematicProductStageProps {
  products: CinematicProduct[];
  progress?: number;
  isPlaying?: boolean;
  activeIndex?: number;
  onActiveIndexChange?: (index: number) => void;
  targetIndex?: number | null;
  onTargetIndexConsumed?: () => void;
  isReducedMotion?: boolean;
}

function getLocalFallback(src: string): string {
  if (!src) return "/cinematic-products/carbide-cutter-endmill.png";
  if (src.includes("carbide-endmill") || src.includes("endmill")) {
    return "/cinematic-products/carbide-cutter-endmill.png";
  }
  if (src.includes("carbide-insert") || src.includes("iscar-insert") || src.includes("insert")) {
    return "/cinematic-products/carbide-insert.png";
  }
  if (src.includes("spindle") || src.includes("servo") || src.includes("enclosure")) {
    return "/cinematic-products/spindle-servo-actuator.png";
  }
  if (src.includes("torx") || src.includes("screw") || src.includes("fastener")) {
    return "/cinematic-products/torx-screw-assembly.png";
  }
  if (src.includes("linear-rail") || src.includes("linear-guide") || src.includes("rail")) {
    return "/cinematic-products/linear-guide-rail.png";
  }
  if (src.includes("ballnose") || src.includes("router")) {
    return "/cinematic-products/ballnose-router-tool.png";
  }
  return "/cinematic-products/carbide-cutter-endmill.png";
}

const SafeStageImage: React.FC<{
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
}> = ({ src, alt, className, sizes, priority }) => {
  const [imgSrc, setImgSrc] = useState<string>(src || "/cinematic-products/carbide-cutter-endmill.png");
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    setImgSrc(src || "/cinematic-products/carbide-cutter-endmill.png");
    setHasError(false);
  }, [src]);

  return (
    <Image
      src={imgSrc}
      alt={alt}
      fill
      sizes={sizes || "(max-width: 640px) 160px, 260px"}
      className={className}
      priority={priority}
      onError={() => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(getLocalFallback(src));
        }
      }}
    />
  );
};

export const CinematicProductStage: React.FC<CinematicProductStageProps> = ({
  products,
  progress,
  isPlaying = true,
  onActiveIndexChange,
  targetIndex = null,
  onTargetIndexConsumed,
  isReducedMotion = false,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const cylinderRef = useRef<HTMLDivElement>(null);

  // If products length is small (< 6), repeat to form a rich full 3D cylinder
  const cylinderProducts = React.useMemo(() => {
    if (!products || products.length === 0) return [];
    if (products.length < 6) {
      return [...products, ...products, ...products].slice(0, 8);
    }
    return products;
  }, [products]);

  const numProducts = cylinderProducts.length;
  const stepAngle = 360 / Math.max(1, numProducts);

  // Synchronize external progress if supplied (e.g. from visual editor)
  useEffect(() => {
    if (progress !== undefined && !isDraggingRef.current && !isSeekingRef.current) {
      angleRef.current = -progress * stepAngle;
      if (cylinderRef.current) {
        cylinderRef.current.style.transform = `rotateX(-4deg) rotateY(${angleRef.current.toFixed(2)}deg)`;
      }
    }
  }, [progress, stepAngle]);

  // Responsive stage dimensions (desktop vs mobile)
  const [stageDimensions, setStageDimensions] = useState<{
    cardWidth: number;
    cardHeight: number;
    radius: number;
    perspective: number;
  }>({
    cardWidth: 230,
    cardHeight: 310,
    radius: 360,
    perspective: 1200,
  });

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Mobile
        const cardW = 150;
        const cardH = 210;
        // Radius based on count
        const rad = Math.max(190, Math.round(cardW / (2 * Math.tan(Math.PI / numProducts)) + 20));
        setStageDimensions({
          cardWidth: cardW,
          cardHeight: cardH,
          radius: rad,
          perspective: 800,
        });
      } else if (width < 1024) {
        // Tablet
        const cardW = 190;
        const cardH = 260;
        const rad = Math.max(270, Math.round(cardW / (2 * Math.tan(Math.PI / numProducts)) + 30));
        setStageDimensions({
          cardWidth: cardW,
          cardHeight: cardH,
          radius: rad,
          perspective: 1000,
        });
      } else {
        // Desktop
        const cardW = 230;
        const cardH = 310;
        const rad = Math.max(340, Math.round(cardW / (2 * Math.tan(Math.PI / numProducts)) + 40));
        setStageDimensions({
          cardWidth: cardW,
          cardHeight: cardH,
          radius: rad,
          perspective: 1200,
        });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [numProducts]);

  // Motion & Physics State stored in refs for 60/120fps direct DOM manipulation
  const angleRef = useRef<number>(0);
  const velocityRef = useRef<number>(14); // Initial cruising speed in deg/sec
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const dragStartAngleRef = useRef<number>(0);
  const pointerHistoryRef = useRef<Array<{ x: number; t: number }>>([]);
  const lastActiveIdxRef = useRef<number>(0);
  const [internalActiveIndex, setInternalActiveIndex] = useState<number>(0);

  // Target seek state (when clicking dot or jumping to product)
  const isSeekingRef = useRef<boolean>(false);
  const seekTargetAngleRef = useRef<number | null>(null);

  // Synchronize target index requests from parent
  useEffect(() => {
    if (targetIndex === null || targetIndex === undefined) return;

    const currentAngle = angleRef.current;
    // Normalized target angle where targetIndex is at front (angle 0)
    // At angle Ω, product i is at (i * stepAngle + Ω) = 0 => Ω = -i * stepAngle
    const desiredAngleRaw = -targetIndex * stepAngle;
    
    // Find closest modular equivalent to currentAngle
    const fullTurns = Math.round(currentAngle / 360) * 360;
    let closestTarget = fullTurns + (desiredAngleRaw % 360);
    while (closestTarget - currentAngle > 180) closestTarget -= 360;
    while (closestTarget - currentAngle < -180) closestTarget += 360;

    seekTargetAngleRef.current = closestTarget;
    isSeekingRef.current = true;

    if (onTargetIndexConsumed) {
      onTargetIndexConsumed();
    }
  }, [targetIndex, stepAngle, onTargetIndexConsumed]);

  // Click on a product card to rotate it directly to the front center
  const handleCardClick = useCallback(
    (idx: number) => {
      const currentAngle = angleRef.current;
      const desiredAngleRaw = -idx * stepAngle;
      const fullTurns = Math.round(currentAngle / 360) * 360;
      let closestTarget = fullTurns + (desiredAngleRaw % 360);
      while (closestTarget - currentAngle > 180) closestTarget -= 360;
      while (closestTarget - currentAngle < -180) closestTarget += 360;

      seekTargetAngleRef.current = closestTarget;
      isSeekingRef.current = true;
    },
    [stepAngle]
  );

  // Main 60fps/120fps continuous physics & rotation animation loop
  useEffect(() => {
    if (isReducedMotion) return;

    let animFrameId: number;
    let lastTimestamp: number = performance.now();

    const loop = (timestamp: number) => {
      // Clamp delta time to 80ms to avoid tab-switch physics jumps
      const dt = Math.min((timestamp - lastTimestamp) / 1000, 0.08);
      lastTimestamp = timestamp;

      if (!isDraggingRef.current) {
        if (isSeekingRef.current && seekTargetAngleRef.current !== null) {
          // Smooth spring-like ease to target index
          const diff = seekTargetAngleRef.current - angleRef.current;
          if (Math.abs(diff) < 0.15) {
            angleRef.current = seekTargetAngleRef.current;
            isSeekingRef.current = false;
            seekTargetAngleRef.current = null;
            velocityRef.current = isPlaying ? 14 : 0;
          } else {
            angleRef.current += diff * Math.min(1, dt * 7.5);
          }
        } else {
          // Base cruising speed: 14 deg/s when playing, 0 when paused
          const targetCruisingSpeed = isPlaying ? 14 : 0;

          // Realistic exponential deceleration toward targetCruisingSpeed
          // Friction = 2.2 allows high-speed swipes to spin with momentum and gradually settle back to normal speed
          const decayRate = 2.2;
          const decayFactor = Math.exp(-decayRate * dt);
          velocityRef.current = targetCruisingSpeed + (velocityRef.current - targetCruisingSpeed) * decayFactor;

          // Advance angle by current velocity
          angleRef.current += velocityRef.current * dt;
        }

        // Apply 3D rotation transform directly to DOM
        if (cylinderRef.current) {
          cylinderRef.current.style.transform = `rotateX(-4deg) rotateY(${angleRef.current.toFixed(2)}deg)`;
        }

        // Determine currently active front-facing card
        const rawIdx = Math.round(-angleRef.current / stepAngle);
        const activeIdx = ((rawIdx % numProducts) + numProducts) % numProducts;
        if (activeIdx !== lastActiveIdxRef.current) {
          lastActiveIdxRef.current = activeIdx;
          setInternalActiveIndex(activeIdx);
          if (onActiveIndexChange) {
            onActiveIndexChange(activeIdx);
          }
        }
      }

      animFrameId = requestAnimationFrame(loop);
    };

    animFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isPlaying, isReducedMotion, numProducts, stepAngle, onActiveIndexChange]);

  // Pointer drag event handlers for mouse & touch swipe
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const pointerId = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(pointerId);
    } catch {}

    isDraggingRef.current = true;
    isSeekingRef.current = false;
    seekTargetAngleRef.current = null;

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      time: performance.now(),
    };
    dragStartAngleRef.current = angleRef.current;
    pointerHistoryRef.current = [{ x: e.clientX, t: performance.now() }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    const now = performance.now();
    const dx = e.clientX - dragStartRef.current.x;

    // Drag sensitivity (degrees per pixel drag)
    const sensitivity = 0.38;
    angleRef.current = dragStartAngleRef.current + dx * sensitivity;

    // Apply transform in real-time
    if (cylinderRef.current) {
      cylinderRef.current.style.transform = `rotateX(-4deg) rotateY(${angleRef.current.toFixed(2)}deg)`;
    }

    // Update active index dynamically while dragging
    const rawIdx = Math.round(-angleRef.current / stepAngle);
    const activeIdx = ((rawIdx % numProducts) + numProducts) % numProducts;
    if (activeIdx !== lastActiveIdxRef.current) {
      lastActiveIdxRef.current = activeIdx;
      setInternalActiveIndex(activeIdx);
      if (onActiveIndexChange) {
        onActiveIndexChange(activeIdx);
      }
    }

    // Keep sliding window of pointer moves in the last 90ms for flick velocity calculation
    const history = pointerHistoryRef.current;
    history.push({ x: e.clientX, t: now });
    while (history.length > 2 && now - history[0].t > 90) {
      history.shift();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const totalDx = Math.abs(e.clientX - dragStartRef.current.x);
    const totalDy = Math.abs(e.clientY - dragStartRef.current.y);

    // If total movement was less than 6px, treat as a tap/click
    if (totalDx < 6 && totalDy < 6) {
      return;
    }

    // Calculate release flick velocity
    const history = pointerHistoryRef.current;
    if (history.length >= 2) {
      const first = history[0];
      const last = history[history.length - 1];
      const dt = (last.t - first.t) / 1000;
      if (dt > 0.012) {
        const vxPx = (last.x - first.x) / dt; // px / sec
        const sensitivity = 0.38;
        const vxDeg = vxPx * sensitivity; // deg / sec

        // Clamp max flick speed for comfortable physics
        const maxFlick = 600;
        velocityRef.current = Math.max(-maxFlick, Math.min(maxFlick, vxDeg));
      }
    }
  };

  // Accessibility reduced motion static view
  if (isReducedMotion) {
    const activeProduct = cylinderProducts[internalActiveIndex] || cylinderProducts[0];
    return (
      <div className="relative w-full h-[400px] flex items-center justify-center p-4">
        <div className="relative w-72 sm:w-80 aspect-square rounded-3xl overflow-hidden border border-amber-500/30 bg-slate-900/90 shadow-2xl p-6 flex flex-col items-center justify-center">
          <div className="relative w-full h-48">
            <SafeStageImage
              src={activeProduct.image}
              alt={activeProduct.name}
              className="object-contain p-4"
              priority
            />
          </div>
          <p className="mt-4 text-center font-bold text-white text-base">{activeProduct.name}</p>
          <span className="text-amber-400 font-mono font-semibold text-sm mt-1">{activeProduct.price}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={stageRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative w-full h-[420px] sm:h-[480px] flex items-center justify-center overflow-hidden select-none cursor-grab active:cursor-grabbing touch-pan-y"
      style={{
        perspective: `${stageDimensions.perspective}px`,
      }}
    >
      {/* 1. Cinematic Background Lighting & Floor Spotlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top ambient gold glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[850px] h-[500px] bg-amber-600/10 rounded-full blur-[140px]" />

        {/* Central warm spotlight cone */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[950px] h-[600px] bg-radial from-amber-500/15 via-amber-900/5 to-transparent blur-3xl rounded-full" />

        {/* Floor reflection grid line & spotlight highlight */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-48 bg-gradient-to-t from-amber-500/10 via-slate-900/20 to-transparent blur-xl border-t border-amber-500/15" />

        {/* Subtle circular stage floor ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] border border-amber-500/10 rounded-full blur-sm" />
      </div>

      {/* 2. Rotating 3D Cylindrical Wheel Container */}
      <div
        ref={cylinderRef}
        className="relative flex items-center justify-center"
        style={{
          width: `${stageDimensions.cardWidth}px`,
          height: `${stageDimensions.cardHeight}px`,
          transformStyle: "preserve-3d",
          transform: `rotateX(-4deg) rotateY(${angleRef.current}deg)`,
          willChange: "transform",
        }}
      >
        {cylinderProducts.map((product, idx) => {
          const itemAngle = idx * stepAngle;
          const isActive = internalActiveIndex === idx;

          return (
            <div
              key={`${product.id}-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick(idx);
              }}
              className={`absolute top-0 left-0 w-full h-full rounded-2xl sm:rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col justify-between p-3.5 sm:p-5 shadow-2xl backdrop-blur-md cursor-pointer group ${
                isActive
                  ? "border-amber-400 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/98 shadow-[0_15px_45px_rgba(245,158,11,0.35)] ring-1 ring-amber-400/60"
                  : "border-white/10 bg-gradient-to-b from-slate-900/85 via-slate-900/75 to-slate-950/90 hover:border-amber-400/50 shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
              }`}
              style={{
                transform: `rotateY(${itemAngle}deg) translateZ(${stageDimensions.radius}px)`,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                willChange: "transform",
              }}
            >
              {/* Subtle active highlight badge / category */}
              <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-mono tracking-wider font-semibold text-amber-400/90">
                <span className="truncate max-w-[120px]">{product.category || product.sku}</span>
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    isActive
                      ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)] scale-125"
                      : "bg-slate-600 group-hover:bg-amber-400/50"
                  }`}
                />
              </div>

              {/* Product Image Stage */}
              <div className="relative flex-1 w-full flex items-center justify-center p-2 sm:p-3 my-1">
                <SafeStageImage
                  src={product.image}
                  alt={product.name}
                  className={`object-contain transition-transform duration-300 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)] ${
                    isActive ? "scale-105" : "scale-95 group-hover:scale-100"
                  }`}
                  priority={idx < 4}
                />
              </div>

              {/* Card Footer: Product Title & Price */}
              <div className="pt-2 border-t border-slate-800/80 space-y-0.5">
                <p className="text-xs sm:text-sm font-bold text-white tracking-tight line-clamp-1">
                  {product.name}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-mono font-extrabold text-amber-400">
                    {product.price}
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-slate-400 uppercase">
                    {product.sku}
                  </span>
                </div>
              </div>

              {/* Active Golden Floor Spotlight Reflection inside Card */}
              {isActive && (
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-3/4 h-6 bg-amber-400/20 rounded-full blur-md pointer-events-none" />
              )}
            </div>
          );
        })}
      </div>

      {/* Subtle Bottom Stage Base Highlight */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-52 sm:w-72 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent rounded-full pointer-events-none" />
    </div>
  );
};
