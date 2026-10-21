"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useTransform, MotionValue } from "framer-motion";
import { ArrowDown, ArrowRight, Layers, CheckCircle } from "lucide-react";
import { ASSEMBLY_COMPONENTS } from "./assemblyData";
import { AssemblyComponent } from "./AssemblyComponent";

interface AssemblySceneProps {
  scrollProgress: MotionValue<number>;
  isReducedMotion?: boolean;
}

export function AssemblyScene({
  scrollProgress,
  isReducedMotion = false,
}: AssemblySceneProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // 1. Intro Text (0% to 12%, strictly 0 after 12%)
  const introOpacity = useTransform(scrollProgress, [0, 0.05, 0.12, 0.15, 1.0], [1, 1, 0, 0, 0]);
  const introY = useTransform(scrollProgress, [0, 0.12], [0, -30]);

  // 2. Assembly HUD Badge values (Progress maps 0 to 0.65)
  const progressPercent = useTransform(scrollProgress, [0, 0.65], [0, 100]);
  const hudOpacity = useTransform(scrollProgress, [0, 0.04, 0.10, 0.62, 0.68, 1.0], [0, 0, 1, 1, 0, 0]);

  // 3. STEP 1: Center Machine Reveal (0.71 to 0.79) — Machine appears CENTERED
  // 4. STEP 2: Reveal Split (0.80 to 0.88) — Desktop: Left Glide / Mobile: Upper Glide
  const finalImageOpacity = useTransform(scrollProgress, [0, 0.71, 0.79, 1.0], [0, 0, 1, 1]);
  const finalImageScale = useTransform(scrollProgress, [0, 0.71, 0.79, 1.0], [1.08, 1.08, 1.0, 1.0]);
  const finalImageX = useTransform(
    scrollProgress,
    [0, 0.71, 0.80, 0.88, 1.0],
    isMobile ? ["0%", "0%", "0%", "0%", "0%"] : ["0%", "0%", "0%", "-22%", "-22%"]
  );
  const finalImageY = useTransform(
    scrollProgress,
    [0, 0.71, 0.79, 0.80, 0.88, 1.0],
    isMobile ? ["65px", "65px", "65px", "65px", "0px", "0px"] : ["0px", "0px", "0px", "0px", "0px", "0px"]
  );

  const finalImageBlur = useTransform(
    scrollProgress,
    [0, 0.71, 0.79, 1.0],
    ["blur(10px)", "blur(10px)", "blur(0px)", "blur(0px)"]
  );

  // 5. STEP 2: Specs & CTA Overlay — STRICTLY 0 UNTIL 0.80, then slides into position
  const finalTextOpacity = useTransform(scrollProgress, [0, 0.80, 0.88, 1.0], [0, 0, 1, 1]);
  const finalTextX = useTransform(
    scrollProgress,
    [0, 0.80, 0.88, 1.0],
    isMobile ? ["0%", "0%", "0%", "0%"] : ["10%", "10%", "22%", "22%"]
  );
  const finalTextY = useTransform(
    scrollProgress,
    [0, 0.80, 0.88, 1.0],
    isMobile ? [50, 50, 0, 0] : [0, 0, 0, 0]
  );

  // 6. HUD progress percentage and bar width transforms (top level for Rules of Hooks)
  const progressText = useTransform(progressPercent, (v) => `${Math.min(100, Math.round(v))}%`);
  const progressWidth = useTransform(progressPercent, (v) => `${Math.min(100, v)}%`);

  // =========================================================================
  // REDUCED MOTION STATIC FALLBACK:
  // Immediately render assembled machine + spec card, no pinning, no floating parts
  // =========================================================================
  if (isReducedMotion) {
    return (
      <div className="relative w-full bg-[#f8f8f8] text-slate-900 px-4 sm:px-8 py-10 max-w-7xl mx-auto rounded-3xl border border-slate-300/80 shadow-sm space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 inline-block">
            PRECISION ENGINEERED
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Every component has a purpose.
          </h2>
          <p className="text-sm text-slate-600">
            Industrial CNC machining centers and power drive assemblies delivering sub-micron positioning accuracy.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
          {/* Machine Photo */}
          <div
            data-el="final-machine"
            className="relative w-full max-w-[420px] lg:w-1/2 h-[300px] sm:h-[400px] flex items-center justify-center"
          >
            <Image
              src="/images/product-assembly/final-machine.jpg"
              alt="Engineered Industrial Machine"
              fill
              className="object-contain rounded-2xl drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
              priority
              unoptimized
            />
          </div>

          {/* Technical Specs Card */}
          <div
            data-el="specs-card"
            className="w-full max-w-[440px] lg:w-[480px] bg-white border border-slate-300/90 p-6 sm:p-8 rounded-2xl shadow-xl space-y-4 text-left"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                FACTORY CERTIFIED
              </span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Designed for accuracy, repeatability & reliable performance.
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our multi-axis CNC machining centers deliver sub-micron positioning accuracy under demanding factory operations.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="block font-mono text-[10px] text-slate-400 font-bold uppercase">Spindle Speed</span>
                <span className="font-mono text-sm font-extrabold text-slate-900">24,000 RPM</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="block font-mono text-[10px] text-slate-400 font-bold uppercase">Repeatability</span>
                <span className="font-mono text-sm font-extrabold text-amber-600">±0.002 mm</span>
              </div>
            </div>
            <div className="pt-2">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-lg w-full sm:w-auto text-center"
              >
                <span>EXPLORE MACHINE</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* HUD Indicator */}
        <div
          data-el="assembly-hud"
          className="flex items-center justify-center gap-3 pt-2 text-xs font-mono font-bold text-slate-500"
        >
          <Layers className="w-4 h-4 text-amber-500" />
          <span>SYS.CAD // ASSEMBLED 100%</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // MOBILE VIEW (< 768px): Fluid 2-step card without scroll locking
  // =========================================================================
  if (isMobile) {
    return (
      <div className="relative w-full bg-[#f8f8f8] text-slate-900 px-4 py-8 space-y-6">
        {/* Intro */}
        <div className="text-center space-y-2">
          <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 inline-block">
            PRECISION ENGINEERED
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Every component has a purpose.
          </h2>
          <p className="text-xs text-slate-600">
            High-tolerance industrial CNC architecture engineered for 24,000 RPM precision.
          </p>
        </div>

        {/* Step 1: CAD Assembled Machine */}
        <div
          data-el="final-machine"
          className="relative w-full h-[240px] flex items-center justify-center bg-white/70 rounded-2xl border border-slate-200/80 p-4 shadow-sm"
        >
          <Image
            src="/images/product-assembly/final-machine.jpg"
            alt="Engineered Industrial Machine"
            fill
            className="object-contain rounded-xl drop-shadow-md"
            priority
            unoptimized
          />
        </div>

        {/* Step 2: Technical Specs & CTA Card */}
        <div
          data-el="specs-card"
          className="w-full bg-white border border-slate-300/90 p-5 rounded-2xl shadow-xl space-y-3"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              FACTORY CERTIFIED
            </span>
          </div>

          <h3 className="text-base font-extrabold text-slate-900 tracking-tight leading-snug">
            Designed for accuracy, repeatability & reliable performance.
          </h3>

          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="block font-mono text-[9px] text-slate-400 font-bold uppercase">Spindle Speed</span>
              <span className="font-mono text-xs font-extrabold text-slate-900">24,000 RPM</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
              <span className="block font-mono text-[9px] text-slate-400 font-bold uppercase">Repeatability</span>
              <span className="font-mono text-xs font-extrabold text-amber-600">±0.002 mm</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-amber-600 transition-colors shadow-lg w-full text-center"
            >
              <span>EXPLORE MACHINE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* HUD Indicator */}
        <div
          data-el="assembly-hud"
          className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-slate-500"
        >
          <Layers className="w-3.5 h-3.5 text-amber-500" />
          <span>SYS.CAD // ASSEMBLED 100%</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // DESKTOP FULL SCROLL-LINKED CHOREOGRAPHY (Pinned 220vh - 250vh)
  // =========================================================================
  return (
    <div className="relative w-full h-full bg-[#f8f8f8] text-slate-900 overflow-hidden flex flex-col items-center justify-center select-none border-y border-slate-300/60">
      {/* Background Engineering Grid */}
      <div className="absolute inset-0 bg-tech-grid-light opacity-50 pointer-events-none" />
      
      {/* Ambient Depth Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-slate-900/5 to-slate-900/10 pointer-events-none" />

      {/* Industrial Viewport HUD Brackets */}
      <div className="absolute top-6 left-6 flex items-center gap-2 pointer-events-none z-50">
        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-500">
          SYS.CAD // ASSEMBLE_V4.2
        </span>
      </div>
      <div className="absolute top-6 right-6 font-mono text-[10px] font-bold text-slate-400 uppercase tracking-widest pointer-events-none hidden sm:block z-50">
        PRECISION TOLERANCE: ±0.005mm
      </div>
      <div className="absolute bottom-6 left-6 pointer-events-none hidden md:block z-50">
        <div className="flex items-center gap-3 font-mono text-[10px] font-bold text-slate-500">
          <span>X: 1040.0</span>
          <span>Y: 820.5</span>
          <span>Z: 410.2</span>
        </div>
      </div>

      {/* STAGE 1: INTRO TEXT (0% - 12%, 100% hidden after 12%) */}
      <motion.div
        initial={{ opacity: 1 }}
        style={{ opacity: introOpacity, y: introY }}
        className="absolute z-40 text-center max-w-2xl px-6 pointer-events-none flex flex-col items-center space-y-4 pt-16 sm:pt-0"
      >
        <span className="font-mono text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
          PRECISION ENGINEERED
        </span>
        <h2 className="type-display-section text-slate-900 tracking-tight font-extrabold">
          Every component has a purpose.
        </h2>
        <p className="type-body-regular text-slate-600 max-w-lg">
          Explore the internal engineering architecture by scrolling to assemble each precision part into the complete machine.
        </p>

        {/* Scroll Indicator */}
        <div className="pt-4 flex flex-col items-center gap-2 text-slate-500 font-mono text-xs font-bold">
          <span>SCROLL TO ASSEMBLE</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center bg-white/90 shadow-sm text-slate-700"
          >
            <ArrowDown className="w-4 h-4" />
          </motion.div>
        </div>
      </motion.div>

      {/* STAGE 2: FLOATING COMPONENTS ASSEMBLY CANVAS (6% - 65%, gone by 0.71) */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex items-center justify-center overflow-hidden">
        {ASSEMBLY_COMPONENTS.map((config) => (
          <AssemblyComponent
            key={config.id}
            config={config}
            progress={scrollProgress}
            isMobile={false}
          />
        ))}
      </div>

      {/* Dynamic Assembly Progress HUD Badge */}
      <motion.div
        data-el="assembly-hud"
        initial={{ opacity: 0 }}
        style={{ opacity: hudOpacity }}
        className="absolute bottom-8 right-6 md:right-12 z-40 bg-white/95 backdrop-blur-md border border-slate-300/80 rounded-2xl p-3.5 shadow-xl pointer-events-none hidden sm:flex items-center gap-4"
      >
        <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
          <Layers className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-6">
            <span className="font-mono text-[10px] font-bold uppercase text-slate-500">
              Assembly Progress
            </span>
            <motion.span className="font-mono text-xs font-bold text-amber-600">
              {progressText}
            </motion.span>
          </div>
          <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              style={{ width: progressWidth }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* STAGE 3 & 4: TWO-STEP FINAL HERO REVEAL */}
      <div className="absolute inset-0 z-30 flex flex-col lg:flex-row items-center justify-center pt-24 sm:pt-28 lg:pt-0 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pointer-events-none">
        {/* Machine Photo */}
        <motion.div
          data-el="final-machine"
          initial={{ opacity: 0 }}
          style={{
            opacity: finalImageOpacity,
            scale: finalImageScale,
            x: finalImageX,
            y: finalImageY,
            filter: finalImageBlur,
          }}
          className="relative w-full max-w-[340px] sm:max-w-[440px] lg:max-w-none lg:w-1/2 h-[26vh] min-h-[180px] sm:h-[34vh] lg:h-[72vh] flex items-center justify-center shrink-0 pointer-events-none"
        >
          <Image
            src="/images/product-assembly/final-machine.jpg"
            alt="Engineered Industrial Machine"
            fill
            className="object-contain rounded-2xl mix-blend-multiply drop-shadow-[0_20px_40px_rgba(0,0,0,0.18)]"
            priority
            unoptimized
          />
        </motion.div>

        {/* Technical Specs & CTA Card: STRICTLY 0 UNTIL 0.80, then slides into RIGHT SIDE */}
        <motion.div
          data-el="specs-card"
          initial={{ opacity: 0 }}
          style={{
            opacity: finalTextOpacity,
            x: finalTextX,
            y: finalTextY,
          }}
          className="w-full max-w-[360px] sm:max-w-[440px] lg:w-[480px] xl:w-[520px] pointer-events-auto shrink-0 z-50 mt-2 sm:mt-4 lg:mt-0"
        >
          <div className="bg-white/95 backdrop-blur-2xl border border-slate-300/90 p-4 sm:p-6 lg:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-2.5 sm:space-y-4 lg:space-y-5 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full border border-amber-500/20">
                ENGINEERED FOR PRECISION
              </span>
            </div>

            <h3 className="text-base sm:text-lg lg:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Designed for accuracy, repeatability & reliable performance.
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed line-clamp-2 sm:line-clamp-none">
              Our multi-axis CNC machining centers and power drive assemblies deliver sub-micron positioning accuracy under demanding factory operations.
            </p>

            {/* Engineering Highlights */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-1.5 sm:pt-2 border-t border-slate-200/80">
              <div className="bg-slate-50/80 p-2 sm:p-3 rounded-xl border border-slate-200/80 space-y-0.5">
                <span className="block font-mono text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Spindle Speed</span>
                <span className="font-mono text-xs sm:text-sm font-extrabold text-slate-900">24,000 RPM</span>
              </div>
              <div className="bg-slate-50/80 p-2 sm:p-3 rounded-xl border border-slate-200/80 space-y-0.5">
                <span className="block font-mono text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Repeatability</span>
                <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-600">±0.002 mm</span>
              </div>
            </div>

            <div className="pt-1 sm:pt-2 flex items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3.5 rounded-xl bg-slate-900 text-white font-bold text-xs sm:text-sm hover:bg-amber-600 transition-colors shadow-xl hover:shadow-amber-600/20 w-full sm:w-auto text-center"
              >
                <span>EXPLORE MACHINE</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
