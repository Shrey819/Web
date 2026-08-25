"use client";

import React, { useMemo, useState, useRef, useEffect } from "react";
import Image from "next/image";
import { CinematicProduct } from "./cinematicProducts";

interface CinematicProductStageProps {
  products: CinematicProduct[];
  progress: number; // Continuous progress float
  isReducedMotion?: boolean;
}

// System A — Main Hero Products 3D Horizontal Circle / Sine-Cosine Orbit Engine
function getCenterHeroStyle(dist: number) {
  const absDist = Math.abs(dist);
  const angleRad = dist * (Math.PI / 3.2);

  const radiusX = 460; // Horizontal sine/cosine arc movement
  const radiusZ = 200; // 3D depth recession into Z-space

  const translateX = Math.sin(angleRad) * radiusX;
  const translateZ = (Math.cos(angleRad) - 1) * radiusZ;
  const translateY = Math.sin(angleRad) * 20;

  // Scale: 1.0 at front center, shrinks as it recedes along 3D horizontal orbit
  const scale = Math.max(0.45, 1.0 - absDist * 0.28);
  const rotateY = -Math.sin(angleRad) * 22; // 3D rotation following curve
  const opacity = Math.max(0, Math.min(1.0, 1.15 - absDist * 0.35));
  const zIndex = Math.max(1, Math.round(50 - absDist * 15));

  return {
    transform: `translate3d(${translateX.toFixed(1)}px, ${translateY.toFixed(1)}px, ${translateZ.toFixed(1)}px) scale(${scale.toFixed(3)}) rotateY(${rotateY.toFixed(1)}deg)`,
    opacity,
    zIndex,
    absDist,
  };
}

// System B — Independent Draggable Small Background Product Tile with Physics Fling & Bounce
interface DraggableAmbientTileProps {
  id: string;
  product: CinematicProduct;
  initialBaseX: number;
  initialBaseY: number;
  scale: number;
  depthOpacity: number;
  phaseX: number;
  phaseY: number;
  freqX: number;
  freqY: number;
  amplitudeX: number;
  amplitudeY: number;
  progress: number;
  stageRef: React.RefObject<HTMLDivElement | null>;
}

const DraggableAmbientTile: React.FC<DraggableAmbientTileProps> = ({
  product,
  initialBaseX,
  initialBaseY,
  scale,
  depthOpacity,
  phaseX,
  phaseY,
  freqX,
  freqY,
  amplitudeX,
  amplitudeY,
  progress,
  stageRef,
}) => {
  // Persistent user base position offset for THIS SPECIFIC TILE ONLY
  const [baseOffset, setBaseOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSliding, setIsSliding] = useState<boolean>(false);
  const [hasBeenMoved, setHasBeenMoved] = useState<boolean>(false);

  // Velocity tracking and physics animation refs
  const pointerHistoryRef = useRef<Array<{ t: number; x: number; y: number }>>([]);
  const physicsAnimRef = useRef<number | null>(null);

  // Clean up physics loop on unmount
  useEffect(() => {
    return () => {
      if (physicsAnimRef.current !== null) {
        cancelAnimationFrame(physicsAnimRef.current);
      }
    };
  }, []);

  // Launch Inertial Fling Physics Loop with Dynamic Stage Bounds & Frame-Rate Independent Damping
  const startFlingPhysics = (initialVx: number, initialVy: number) => {
    setIsSliding(true);
    let vx = initialVx;
    let vy = initialVy;
    let lastTime = performance.now();

    const damping = 4.2; // Exponential velocity decay rate (s^-1)
    const restitution = 0.35; // Softened wall reflection bounce coefficient

    const physicsStep = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05); // Cap max dt to 50ms
      lastTime = now;

      // 1. Dynamic Stage Boundaries Calculation (Responsive to screen size)
      const stageElement = stageRef.current;
      let minX = -650;
      let maxX = 650;
      let minY = -380;
      let maxY = 380;

      if (stageElement) {
        const rect = stageElement.getBoundingClientRect();
        const halfW = rect.width / 2 - 80;
        const halfH = rect.height / 2 - 55;
        minX = -halfW - initialBaseX;
        maxX = halfW - initialBaseX;
        minY = -halfH - initialBaseY;
        maxY = halfH - initialBaseY;
      }

      setBaseOffset((prev) => {
        let newX = prev.x + vx * dt;
        let newY = prev.y + vy * dt;

        // Calculate speed-proportional dynamic bounce restitution (0.20 for slow to 0.70 for high speed impact)
        const impactSpeed = Math.hypot(vx, vy);
        const impactRatio = Math.max(0.2, Math.min(1.0, impactSpeed / 1200));
        const dynamicRestitution = 0.20 + impactRatio * 0.50;

        // 2. Dynamic Frame Wall Reflection Bounce Logic
        if (newX > maxX) {
          newX = maxX;
          vx = -Math.abs(vx) * dynamicRestitution;
        } else if (newX < minX) {
          newX = minX;
          vx = Math.abs(vx) * dynamicRestitution;
        }

        if (newY > maxY) {
          newY = maxY;
          vy = -Math.abs(vy) * dynamicRestitution;
        } else if (newY < minY) {
          newY = minY;
          vy = Math.abs(vy) * dynamicRestitution;
        }

        return { x: newX, y: newY };
      });

      // 3. Frame-Rate Independent Damping
      const dampFactor = Math.exp(-damping * dt);
      vx *= dampFactor;
      vy *= dampFactor;

      const currentSpeed = Math.hypot(vx, vy);
      if (currentSpeed > 12) {
        physicsAnimRef.current = requestAnimationFrame(physicsStep);
      } else {
        physicsAnimRef.current = null;
        setIsSliding(false);
      }
    };

    physicsAnimRef.current = requestAnimationFrame(physicsStep);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();

    // Cancel any active fling slide
    if (physicsAnimRef.current !== null) {
      cancelAnimationFrame(physicsAnimRef.current);
      physicsAnimRef.current = null;
    }

    const pointerId = e.pointerId;
    try {
      e.currentTarget.setPointerCapture(pointerId);
    } catch {}

    const startPX = e.clientX;
    const startPY = e.clientY;
    const startOffsetX = baseOffset.x;
    const startOffsetY = baseOffset.y;

    pointerHistoryRef.current = [{ t: performance.now(), x: startPX, y: startPY }];
    setIsDragging(true);
    setIsSliding(false);

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (moveEv.pointerId !== pointerId) return;

      const now = performance.now();
      const px = moveEv.clientX;
      const py = moveEv.clientY;

      // Buffer last 100ms pointer samples for velocity estimation
      const history = pointerHistoryRef.current;
      history.push({ t: now, x: px, y: py });
      while (history.length > 1 && now - history[0].t > 100) {
        history.shift();
      }

      const dx = px - startPX;
      const dy = py - startPY;

      setBaseOffset({
        x: startOffsetX + dx,
        y: startOffsetY + dy,
      });
    };

    const handlePointerUp = (upEv: PointerEvent) => {
      if (upEv.pointerId !== pointerId) return;

      try {
        e.currentTarget.releasePointerCapture(pointerId);
      } catch {}

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);

      setIsDragging(false);
      setHasBeenMoved(true);

      // Estimate release velocity
      const history = pointerHistoryRef.current;
      if (history.length >= 2) {
        const first = history[0];
        const last = history[history.length - 1];
        const dt = (last.t - first.t) / 1000;
        if (dt > 0.008) {
          let vx = (last.x - first.x) / dt;
          let vy = (last.y - first.y) / dt;

          const speed = Math.hypot(vx, vy);
          const maxSpeed = 1800; // Clamp max launch speed
          if (speed > maxSpeed) {
            vx = (vx / speed) * maxSpeed;
            vy = (vy / speed) * maxSpeed;
          }

          if (speed > 60) {
            startFlingPhysics(vx, vy);
          }
        }
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Autonomous float pauses ONLY FOR THIS TILE while it is actively being dragged or fling-sliding
  const isMovingUser = isDragging || isSliding;
  const organicX = isMovingUser ? 0 : Math.sin(progress * freqX + phaseX) * amplitudeX;
  const organicY = isMovingUser ? 0 : Math.cos(progress * freqY + phaseY) * amplitudeY;

  // Rendered Position = Base Position + User Drag/Fling Offset + Organic Float
  const finalX = initialBaseX + baseOffset.x + organicX;
  const finalY = initialBaseY + baseOffset.y + organicY;

  return (
    <div
      role="button"
      tabIndex={0}
      suppressHydrationWarning
      aria-label={`Draggable background product ${product.name}`}
      onPointerDown={handlePointerDown}
      className={`absolute w-32 sm:w-40 h-20 sm:h-26 rounded-2xl border transition-colors shadow-2xl hidden sm:flex items-center justify-center pointer-events-auto select-none group touch-none ${
        isDragging
          ? "border-amber-400 bg-slate-900/95 cursor-grabbing ring-2 ring-amber-400/60 shadow-[0_0_30px_rgba(245,158,11,0.5)] scale-110"
          : isSliding
          ? "border-amber-400/80 bg-slate-900/90 ring-1 ring-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]"
          : "border-amber-500/35 bg-slate-900/85 backdrop-blur-md cursor-grab hover:border-amber-400 hover:scale-105"
      }`}
      style={{
        transform: `translate3d(${finalX.toFixed(1)}px, ${finalY.toFixed(1)}px, 0px) scale(${
          isDragging ? (scale * 1.12).toFixed(3) : scale.toFixed(3)
        })`,
        opacity: isDragging || isSliding ? 1.0 : depthOpacity,
        zIndex: isDragging ? 100 : isSliding ? 80 : 15,
        touchAction: "none",
        willChange: "transform",
      }}
    >
      <Image
        src={product.image}
        alt={product.name}
        fill
        className="object-contain p-2.5 opacity-90 group-hover:opacity-100 transition-opacity filter drop-shadow-md pointer-events-none"
      />
      {/* Drop Status Indicator Dot */}
      <div
        className={`absolute bottom-1 right-1 w-2.5 h-2.5 rounded-full transition-all ${
          isDragging
            ? "bg-amber-300 scale-125 shadow-[0_0_8px_rgba(252,211,77,0.9)]"
            : isSliding
            ? "bg-amber-400 animate-ping"
            : hasBeenMoved
            ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
            : "bg-amber-400/60 group-hover:bg-amber-400"
        }`}
      />
    </div>
  );
};

export const CinematicProductStage: React.FC<CinematicProductStageProps> = ({
  products,
  progress,
  isReducedMotion = false,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const numProducts = products.length;

  // System B — Small floating background products data
  const ambientTiles = useMemo(() => {
    return Array.from({ length: 14 }).map((_, idx) => {
      const angle = (idx / 14) * Math.PI * 2;
      const radiusX = 540 + (idx % 4) * 60;
      const radiusY = 220 + (idx % 3) * 40;

      // Deterministic pseudo-random seeds per tile for unique organic trajectories
      const seed1 = Math.sin(idx * 12.9898 + 78.233) * 43758.5453;
      const seed2 = Math.cos(idx * 4.1414 + 12.12) * 23421.1212;
      const seed3 = Math.sin(idx * 8.88 + 3.14) * 11111.11;

      const phaseX = (Math.abs(seed1) % 1) * Math.PI * 2;
      const phaseY = (Math.abs(seed2) % 1) * Math.PI * 2;
      const freqX = 0.06 + (Math.abs(seed1) % 0.12);
      const freqY = 0.05 + (Math.abs(seed2) % 0.10);
      const amplitudeX = 35 + (Math.abs(seed3) % 45);
      const amplitudeY = 25 + (Math.abs(seed1) % 35);

      return {
        id: `ambient-tile-${idx}`,
        baseX: Math.cos(angle) * radiusX,
        baseY: Math.sin(angle) * radiusY - 20,
        prodIdx: idx % numProducts,
        scale: 0.35 + (idx % 3) * 0.08,
        depthOpacity: 0.75 + (idx % 3) * 0.1,
        phaseX,
        phaseY,
        freqX,
        freqY,
        amplitudeX,
        amplitudeY,
      };
    });
  }, [numProducts]);

  // Reduced motion fallback
  if (isReducedMotion) {
    const activeIdx = ((Math.floor(progress) % numProducts) + numProducts) % numProducts;
    const currentProduct = products[activeIdx];
    return (
      <div className="relative w-full h-full flex items-center justify-center bg-slate-950 p-6">
        <div className="relative w-72 sm:w-96 aspect-square rounded-3xl overflow-hidden border border-amber-500/30 bg-slate-900/90 shadow-2xl p-6 flex items-center justify-center">
          <Image
            src={currentProduct.image}
            alt={currentProduct.name}
            fill
            className="object-contain p-4"
            priority
          />
        </div>
      </div>
    );
  }

  // System A — Main Hero Products 3D Horizontal Circle Orbit Keys
  const centerK = Math.floor(progress);
  const heroKeys = [centerK - 2, centerK - 1, centerK, centerK + 1, centerK + 2];

  return (
    <div
      ref={stageRef}
      className="relative w-full h-full flex items-center justify-center overflow-hidden bg-slate-950 select-none"
    >
      {/* 1. Cinematic Background Lighting & Golden Floor Spotlight */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Top ambient luxury glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[550px] bg-amber-600/10 rounded-full blur-[150px]" />

        {/* Central warm spotlight cone */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[1050px] h-[700px] bg-radial from-amber-500/15 via-amber-900/5 to-transparent blur-3xl rounded-full" />

        {/* Floor reflection grid line & spotlight highlight */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-64 bg-gradient-to-t from-amber-500/10 via-slate-900/20 to-transparent blur-xl border-t border-amber-500/10" />

        {/* Subtle radial spotlight ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-amber-500/10 rounded-full blur-sm" />
      </div>

      {/* 2. System B — Independent Draggable Small Background Products with Fling & Wall Bounce Physics */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        {ambientTiles.map((tile) => (
          <DraggableAmbientTile
            key={tile.id}
            id={tile.id}
            product={products[tile.prodIdx]}
            initialBaseX={tile.baseX}
            initialBaseY={tile.baseY}
            scale={tile.scale}
            depthOpacity={tile.depthOpacity}
            phaseX={tile.phaseX}
            phaseY={tile.phaseY}
            freqX={tile.freqX}
            freqY={tile.freqY}
            amplitudeX={tile.amplitudeX}
            amplitudeY={tile.amplitudeY}
            progress={progress}
            stageRef={stageRef}
          />
        ))}
      </div>

      {/* 3. System A — Main Hero Products 3D Horizontal Circle / Sine-Cosine Orbit */}
      <div className="relative w-full max-w-7xl h-[480px] sm:h-[560px] flex items-center justify-center perspective-[1200px] preserve-3d z-20 pointer-events-none">
        {heroKeys.map((K) => {
          const productIndex = ((K % numProducts) + numProducts) % numProducts;
          const product = products[productIndex];
          const dist = K - progress;
          const style = getCenterHeroStyle(dist);

          if (style.opacity <= 0.001) return null;

          const isActive = style.absDist < 0.3;

          return (
            <div
              key={K}
              className="absolute w-72 sm:w-[380px] aspect-square transition-shadow duration-300 pointer-events-auto"
              style={{
                transform: style.transform,
                opacity: style.opacity,
                zIndex: style.zIndex,
                willChange: "transform, opacity",
              }}
            >
              <div
                className={`relative w-full h-full rounded-3xl p-6 sm:p-8 flex items-center justify-center border transition-all duration-500 ${
                  isActive
                    ? "bg-slate-900/90 border-amber-500/60 shadow-[0_0_60px_rgba(245,158,11,0.35)] backdrop-blur-md opacity-100"
                    : "bg-slate-950/20 border-slate-700/40 shadow-lg backdrop-blur-sm opacity-70"
                }`}
              >
                {/* Accent glow corner badge for active center hero */}
                {isActive && (
                  <div
                    className="absolute -top-1 -right-1 w-24 h-24 rounded-tr-3xl bg-radial from-amber-400/20 to-transparent pointer-events-none"
                    style={{
                      backgroundColor: product.accentColor
                        ? `${product.accentColor}15`
                        : undefined,
                    }}
                  />
                )}

                {/* Main Product Image */}
                <div
                  className={`relative w-full h-full flex items-center justify-center transition-opacity duration-300 ${
                    isActive ? "opacity-100" : "opacity-80"
                  }`}
                >
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 280px, 380px"
                    className={`object-contain transition-transform duration-300 ${
                      isActive
                        ? "drop-shadow-[0_15px_35px_rgba(0,0,0,0.85)] scale-100"
                        : "drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)] scale-95"
                    }`}
                    priority={isActive}
                  />
                </div>

                {/* Active Floor Halo Ring */}
                {isActive && (
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-3/4 h-8 bg-amber-500/25 rounded-full blur-xl pointer-events-none" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Subtle Bottom Stage Base Line */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-64 h-1 bg-gradient-to-r from-transparent via-amber-500/40 to-transparent rounded-full" />
    </div>
  );
};
