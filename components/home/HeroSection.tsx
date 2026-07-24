"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles, ShieldCheck, Truck, Cpu, Zap, Activity } from "lucide-react";
import { motion } from "framer-motion";
import { generateProductSvg } from "@/lib/svgPlaceholders";
import { CursorRepelText } from "@/components/ui/CursorRepelText";

export function HeroSection() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const x = (clientX - left) / width - 0.5;
    const y = (clientY - top) / height - 0.5;
    setMousePos({ x, y });
  };

  return (
    <section
      onMouseMove={handleMouseMove}
      className="relative bg-slate-950 text-white min-h-[calc(100svh-110px)] flex items-center py-12 lg:py-16 overflow-hidden border-b border-slate-800"
    >
      {/* Background Glows & Technical Grid */}
      <div className="absolute inset-0 bg-tech-grid-dark opacity-30 pointer-events-none" />
      <div
        className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-tr from-sky-600/20 via-cyan-500/10 to-emerald-500/20 blur-[140px] rounded-full pointer-events-none transition-transform duration-700 ease-out"
        style={{
          transform: `translate(calc(-50% + ${mousePos.x * 40}px), calc(-50% + ${mousePos.y * 40}px))`,
        }}
      />

      <div className="content-shell relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center min-h-[calc(100svh-160px)]">
          {/* Left Hero Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            {/* Eyebrow Label */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 backdrop-blur-md"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="type-label text-slate-300">
                2026 Industrial Distribution Platform
              </span>
            </motion.div>

            {/* Expressive Editorial Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="type-display-hero text-white tracking-tight"
            >
              Precision Automation. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-cyan-300 to-emerald-400">
                Engineered for Uptime.
              </span>
            </motion.h1>

            {/* Supporting Copy */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="type-body-large text-slate-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed"
            >
              <CursorRepelText 
                text="Direct factory distribution for 1,500+ industrial sensors, PLCs, safety controllers, and heavy-duty variable frequency drives. Certified OEM genuine hardware with immediate B2B dispatch." 
              />
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link
                href="/products"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 type-button shadow-xl shadow-sky-500/20 transition-all hover:scale-105"
              >
                <span>Browse Products Catalog</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/quote"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button border border-slate-700/80 transition-all hover:scale-105"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Request Bulk Quote (RFQ)</span>
              </Link>
            </motion.div>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 type-caption text-slate-400 max-w-lg mx-auto lg:mx-0"
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Same-Day Dispatch</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>100% Factory Genuine</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400 shrink-0" />
                <span>24/7 Tech Support</span>
              </div>
            </motion.div>
          </div>

          {/* Right Floating Composition */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Main Center Card */}
            <motion.div
              style={{
                x: mousePos.x * -25,
                y: mousePos.y * -25,
              }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="relative w-full max-w-xl aspect-4/3 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 border border-slate-700/60 shadow-2xl overflow-hidden"
            >
              <Image
                src={generateProductSvg("plcs", "SIEMENS S7-1200 CPU", "6ES7214-1AG40-0XB0", 1)}
                alt="SIEMENS S7-1200 Controller"
                fill
                className="object-cover rounded-2xl"
                unoptimized
              />

              {/* Status Tag Overlay */}
              <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="type-label text-sky-400">
                    Siemens SIMATIC S7-1200 CPU
                  </div>
                  <div className="type-technical font-bold text-white">
                    PROFINET Real-Time Controller
                  </div>
                </div>
                <div className="type-label text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Ready
                </div>
              </div>
            </motion.div>

            {/* Floating Top Satellite Card */}
            <motion.div
              style={{
                x: mousePos.x * 30,
                y: mousePos.y * 30,
              }}
              transition={{ type: "spring", damping: 25, stiffness: 120 }}
              className="absolute -top-6 -right-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-3 hidden sm:flex"
            >
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="type-body-small font-bold text-white">4mm Optical Laser</div>
                <div className="type-technical text-slate-400">IO-Link v1.1 Active</div>
              </div>
            </motion.div>

            {/* Floating Bottom Satellite Card */}
            <motion.div
              style={{
                x: mousePos.x * -35,
                y: mousePos.y * -35,
              }}
              transition={{ type: "spring", damping: 20, stiffness: 110 }}
              className="absolute -bottom-6 -left-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-xl flex items-center gap-3 hidden sm:flex"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <div className="type-body-small font-bold text-white">ABB ACS380 VFD Drive</div>
                <div className="type-technical text-slate-400">Safe Torque Off (STO) SIL3</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
