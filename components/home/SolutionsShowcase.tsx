"use client";

import Link from "next/link";
import { Factory, Box, Activity, Truck, Settings, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function SolutionsShowcase() {
  const verticals = [
    {
      id: "manufacturing",
      title: "Automotive & Discrete Manufacturing",
      icon: Factory,
      description: "Ultra-fast PROFINET PLCs, laser positioning, and heavy robotic servo axes for high-speed vehicle assembly lines.",
      stats: "0.08ms Execution Speed",
      color: "from-blue-600/20 via-slate-900 to-slate-950",
    },
    {
      id: "packaging",
      title: "High-Speed Bottling & Packaging",
      icon: Box,
      description: "Synchronized multi-axis motion, vision rejection optical sensors, and IP69K washdown VFD drives.",
      stats: "1,200 PPM Capacity",
      color: "from-emerald-600/20 via-slate-900 to-slate-950",
    },
    {
      id: "process",
      title: "Process & Fluid Automation",
      icon: Activity,
      description: "Hermetic pressure transmitters, SIL3 safety interlocks, and continuous flow monitoring for oil & chemical vats.",
      stats: "SIL3 / IP69K Rated",
      color: "from-amber-600/20 via-slate-900 to-slate-950",
    },
    {
      id: "material-handling",
      title: "Warehouse & Material Handling",
      icon: Truck,
      description: "Variable frequency drives for heavy conveyors, automated sorters, and laser barcode pallet positioning.",
      stats: "24/7 Heavy Duty",
      color: "from-purple-600/20 via-slate-900 to-slate-950",
    },
  ];

  return (
    <section className="py-24 bg-slate-950 text-white border-b border-slate-900 relative overflow-hidden">
      <div className="content-shell relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20">
            <Settings className="w-3.5 h-3.5" />
            Tailored Industry Vertical Solutions
          </span>
          <h2 className="section-title font-mono text-white">
            Engineered for Demanding Industrial Vertical Ecosystems
          </h2>
          <p className="text-sm text-slate-300">
            Explore turnkey hardware bills-of-materials optimized for high throughput, heavy environmental washdown, and zero unplanned downtime.
          </p>
        </div>

        {/* 4 Immersive Industry Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {verticals.map((v, idx) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`group relative bg-gradient-to-br ${v.color} rounded-3xl p-8 border border-slate-800 hover:border-sky-500/60 shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-sky-400 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <Icon className="w-7 h-7" />
                    </div>
                    <span className="type-technical font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      {v.stats}
                    </span>
                  </div>

                  <h3 className="type-section-title text-white mb-3 group-hover:text-sky-400 transition-colors">
                    {v.title}
                  </h3>

                  <p className="text-xs text-slate-300 leading-relaxed mb-8">
                    {v.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-white group-hover:text-sky-400">
                  <span>View Vertical Architecture BOM</span>
                  <div className="w-8 h-8 rounded-full bg-slate-900 group-hover:bg-sky-500 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
