"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Radio, Cpu, Zap, CheckCircle2, ArrowRight } from "lucide-react";
import { generateProductSvg } from "@/lib/svgPlaceholders";
import { StickyShowcaseConfig, DEFAULT_STICKY_SHOWCASE } from "@/lib/homepage";

export function StickyShowcase({ config }: { config?: StickyShowcaseConfig }) {
  const currentConfig = config || DEFAULT_STICKY_SHOWCASE;
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      id: "step-1",
      number: "01",
      icon: Radio,
      title: "Precision Sensing & Real-Time Telemetry",
      subtitle: "IP69K Sub-Millimeter Detection",
      description:
        "Smart optical lasers and inductive transducers detect component positions and surface flaws, feeding high-frequency I/O telemetry straight into IO-Link masters.",
      highlights: currentConfig.bullets?.length
        ? currentConfig.bullets.slice(0, 3)
        : [
            "Class 1 laser beams detect sub-0.1mm height variance",
            "Continuous 150°C heat-resistant housing options",
            "IO-Link v1.1 dynamic thresholding",
          ],
      productSvg: generateProductSvg("sensors", "KEYENCE LR-TB5000 TOF Laser", "LR-TB5000", 1),
    },
    {
      id: "step-2",
      number: "02",
      icon: Cpu,
      title: "Deterministic CPU Execution & Motion Planning",
      subtitle: "0.08ms Execution Speed",
      description:
        "Modular PLCs process incoming sensor inputs through TIA Portal and Studio 5000 ladder logic, executing motion profile calculations in microseconds.",
      highlights: [
        "PROFINET IRT and EtherCAT real-time master ports",
        "Up to 32 axis synchronized motion curves",
        "Integrated dual WebVisu diagnostic web server",
      ],
      productSvg: generateProductSvg("plcs", "SIEMENS SIMATIC S7-1200 CPU", "6ES7214-1AG40-0XB0", 1),
    },
    {
      id: "step-3",
      number: "03",
      icon: Zap,
      title: "High-Torque Motor Control & Safe Motion",
      subtitle: "SIL3 Safe Torque Off (STO)",
      description:
        "Variable frequency drives and AC servo amplifiers convert low-voltage PLC commands into precise AC power to modulate motor torque and prevent overshoot.",
      highlights: [
        "Heavy duty 150% overload for 60 seconds",
        "Built-in EMC filter Class A & braking resistor",
        "Safe Torque Off (STO) hardware interlock",
      ],
      productSvg: generateProductSvg("drives", "ABB ACS380 Machinery VFD", "ACS380-0401-017A-4", 1),
    },
  ];

  return (
    <section className="py-24 bg-slate-900 text-white border-b border-slate-800 min-h-[90svh] flex items-center">
      <div className="content-shell w-full">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="type-label text-sky-400">
            {currentConfig.eyebrow || "System Architecture Story"}
          </span>
          <h2 className="section-title font-mono text-white">
            {currentConfig.title || "How Integrated Hardware Powers Factory Automation"}
          </h2>
          {currentConfig.description && (
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto">
              {currentConfig.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Sticky Story Navigation & Content */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 space-y-6">
            <div className="space-y-4">
              {steps.map((step, idx) => {
                const Icon = step.icon;
                const isActive = activeStep === idx;

                return (
                  <div
                    key={step.id}
                    onClick={() => setActiveStep(idx)}
                    className={`cursor-pointer p-6 rounded-3xl border transition-all duration-300 ${
                      isActive
                        ? "bg-slate-800 border-sky-500 shadow-xl"
                        : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs font-bold text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                          STAGE {step.number}
                        </span>
                        <h4 className="font-bold text-base text-white">{step.title}</h4>
                      </div>
                      <Icon className={`w-5 h-5 ${isActive ? "text-sky-400" : "text-slate-500"}`} />
                    </div>

                    {isActive && (
                      <div className="mt-3 space-y-3 pt-3 border-t border-slate-700/60">
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {step.description}
                        </p>
                        <div className="space-y-1.5">
                          {step.highlights.map((h, i) => (
                            <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{h}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Changing Product Cards */}
          <div className="lg:col-span-7">
            <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <span className="type-technical font-semibold uppercase text-sky-400">
                  {steps[activeStep].subtitle}
                </span>
                <span className="type-technical text-slate-500">
                  Stage {activeStep + 1} of 3
                </span>
              </div>

              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 mb-6 shadow-inner">
                {currentConfig.image && activeStep === 0 ? (
                  <img
                    src={currentConfig.image}
                    alt={steps[activeStep].title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={steps[activeStep].productSvg}
                    alt={steps[activeStep].title}
                    fill
                    className="object-cover transition-all duration-500"
                    unoptimized
                  />
                )}
              </div>

              <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-2">
                <h3 className="font-bold text-lg text-white">
                  {steps[activeStep].title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {steps[activeStep].description}
                </p>

                {currentConfig.ctaText && (
                  <div className="pt-2">
                    <Link
                      href={currentConfig.ctaUrl || "/products"}
                      className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <span>{currentConfig.ctaText}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
