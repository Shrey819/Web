"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useTransform, MotionValue } from "framer-motion";
import { ArrowDown, ArrowRight, Layers } from "lucide-react";
import { ASSEMBLY_COMPONENTS } from "./assemblyData";
import { AssemblyComponent } from "./AssemblyComponent";

interface AssemblySceneProps {
  scrollProgress: MotionValue<number>;
}

export function AssemblyScene({ scrollProgress }: AssemblySceneProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
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

      {/* ===================================================
          STAGE 1: INTRO TEXT (0% - 12%, 100% hidden after 12%)
         =================================================== */}
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

      {/* ===================================================
          STAGE 2: FLOATING COMPONENTS ASSEMBLY CANVAS (6% - 65%, completely gone by 0.71)
         =================================================== */}
      <div className="relative w-full h-full max-w-7xl mx-auto flex items-center justify-center overflow-hidden">
        {ASSEMBLY_COMPONENTS.map((config) => (
          <AssemblyComponent
            key={config.id}
            config={config}
            progress={scrollProgress}
            isMobile={isMobile}
          />
        ))}
      </div>

      {/* Dynamic Assembly Progress HUD Badge */}
      <motion.div
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
              {useTransform(progressPercent, (v) => `${Math.min(100, Math.round(v))}%`)}
            </motion.span>
          </div>
          <div className="w-36 h-1.5 bg-slate-200 rounded-full overflow-hidden">
            <motion.div
              style={{ width: useTransform(progressPercent, (v) => `${Math.min(100, v)}%`) }}
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full"
            />
          </div>
        </div>
      </motion.div>

      {/* ===================================================
          STAGE 3 & 4: TWO-STEP FINAL HERO REVEAL
          Step 1 (0.71-0.79): Center Machine Reveal (100% centered)
          Step 2 (0.80-0.88): Machine glides to LEFT (Desktop) / glides UP (Mobile)
                             Right Card slides into RIGHT (Desktop) / slides UP (Mobile)
         =================================================== */}
      <div className="absolute inset-0 z-30 flex flex-col lg:flex-row items-center justify-center pt-24 sm:pt-28 lg:pt-0 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto pointer-events-none">
        {/* Machine Photo */}
        <motion.div
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

        {/* Technical Specs & CTA Card: STRICTLY 0 UNTIL 0.80, then slides into RIGHT SIDE / DOWN SIDE */}
        <motion.div
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
