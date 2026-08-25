"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Factory,
  Box,
  Activity,
  Truck,
  Settings,
  ArrowRight,
  X,
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SolutionsShowcaseConfig,
  VerticalConfig,
  BOMItemConfig,
  DEFAULT_SOLUTIONS_SHOWCASE,
} from "@/lib/homepage";

const VERTICAL_ICONS: Record<string, any> = {
  manufacturing: Factory,
  packaging: Box,
  pharma: Activity,
  logistics: Truck,
};

export function SolutionsShowcase({ config }: { config?: SolutionsShowcaseConfig }) {
  const currentConfig = config || DEFAULT_SOLUTIONS_SHOWCASE;
  const verticals = currentConfig.verticals || DEFAULT_SOLUTIONS_SHOWCASE.verticals;
  const [selectedVertical, setSelectedVertical] = useState<VerticalConfig | null>(null);

  const getQuoteUrl = (v: VerticalConfig) => {
    const bomSummary = (v.bom || [])
      .map((item, i) => `${i + 1}. [${item.manufacturer}] ${item.partNo} - ${item.name} (${item.specs})`)
      .join("\n");
    return `/quote?notes=${encodeURIComponent(`Architectural BOM Request for ${v.title}:\n\n${bomSummary}`)}&scope=${encodeURIComponent(v.title)}`;
  };

  return (
    <section className="py-24 bg-slate-950 text-white border-b border-slate-900 relative overflow-hidden">
      <div className="content-shell relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20">
            <Settings className="w-3.5 h-3.5" />
            <span>{currentConfig.eyebrow || "Tailored Industry Vertical Solutions"}</span>
          </span>
          <h2 className="section-title font-mono text-white">
            {currentConfig.title || "Engineered for Demanding Industrial Vertical Ecosystems"}
          </h2>
          <p className="text-sm text-slate-300">
            {currentConfig.subtitle ||
              "Explore turnkey hardware bills-of-materials optimized for high throughput, heavy environmental washdown, and zero unplanned downtime."}
          </p>
        </div>

        {/* 4 Immersive Industry Panels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {verticals.map((v, idx) => {
            const Icon = VERTICAL_ICONS[v.id] || Factory;
            return (
              <motion.div
                key={v.id || idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`group relative bg-gradient-to-br ${
                  v.color || "from-blue-600/20 via-slate-900 to-slate-950"
                } rounded-3xl p-8 border border-slate-800 hover:border-sky-500/60 shadow-2xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer`}
                onClick={() => setSelectedVertical(v)}
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
                  <span className="group-hover:underline">View Vertical Architecture BOM</span>
                  <div className="w-8 h-8 rounded-full bg-slate-900 group-hover:bg-sky-500 group-hover:text-slate-950 flex items-center justify-center transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Interactive Vertical Architecture BOM Modal */}
      <AnimatePresence>
        {selectedVertical && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVertical(null)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 text-white my-8 max-h-[90vh] flex flex-col"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-slate-800 bg-slate-950/60 flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-sky-400 flex items-center justify-center shrink-0">
                    {(() => {
                      const Icon = VERTICAL_ICONS[selectedVertical.id] || Factory;
                      return <Icon className="w-7 h-7" />;
                    })()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {selectedVertical.stats}
                      </span>
                      <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        BOM V4.2 ARCHITECTURE
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-bold font-mono text-white">
                      {selectedVertical.title}
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVertical(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body: BOM Table */}
              <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400 mb-1">
                    System Architecture Scope
                  </h4>
                  <p className="text-sm text-slate-300">
                    {selectedVertical.description}
                  </p>
                </div>

                {/* BOM — card layout on mobile, table on sm+ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      Recommended Verified Bill of Materials (BOM)
                    </h4>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 ml-2">
                      {selectedVertical.bom?.length || 0} Critical Line Items
                    </span>
                  </div>

                  {/* ── MOBILE: Card-per-row layout ── */}
                  <div className="sm:hidden space-y-2">
                    {(selectedVertical.bom || []).map((item, i) => (
                      <div
                        key={i}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sky-400 font-mono font-bold text-xs leading-tight break-all">
                            {item.partNo}
                          </span>
                          <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700 font-mono shrink-0">
                            {item.manufacturer}
                          </span>
                        </div>
                        <p className="text-white text-xs font-medium leading-snug">
                          {item.name}
                        </p>
                        <p className="text-slate-400 text-[11px] leading-snug font-mono">
                          {item.specs}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ── DESKTOP: Full table ── */}
                  <div className="hidden sm:block border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/80">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-mono">
                        <tr>
                          <th className="py-3 px-4 font-semibold">Part Number</th>
                          <th className="py-3 px-4 font-semibold">Component Name</th>
                          <th className="py-3 px-4 font-semibold">Key Specifications</th>
                          <th className="py-3 px-4 font-semibold">Brand</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono">
                        {(selectedVertical.bom || []).map((item, i) => (
                          <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-sky-400 font-bold whitespace-nowrap">
                              {item.partNo}
                            </td>
                            <td className="py-3 px-4 text-white font-medium">
                              {item.name}
                            </td>
                            <td className="py-3 px-4 text-slate-400 text-[11px]">
                              {item.specs}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-block bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                                {item.manufacturer}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-sky-950/40 border border-sky-800/50 rounded-2xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-sky-200">
                    <span className="font-bold">Guaranteed Pin-to-Pin & Protocol Interoperability:</span>{" "}
                    All items in this architecture are pre-tested for timing synchronization, bus speed, and voltage compliance.
                  </div>
                </div>
              </div>

              {/* ── Footer Actions (redesigned, mobile-first) ── */}
              <div className="p-5 sm:p-6 border-t border-slate-800 bg-slate-950/80 space-y-3">
                {/* Browse link */}
                <Link
                  href={`/category/${selectedVertical.categorySlug}`}
                  className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 hover:text-sky-400 font-mono transition-colors"
                >
                  <span>Browse all {selectedVertical.categoryName}</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>

                {/* Action buttons */}
                <div className="flex items-center gap-3">
                  {/* Close */}
                  <button
                    type="button"
                    onClick={() => setSelectedVertical(null)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-bold font-mono tracking-wide transition-all"
                  >
                    <X className="w-3.5 h-3.5 text-slate-400" />
                    Close
                  </button>

                  {/* RFQ CTA */}
                  <Link
                    href={getQuoteUrl(selectedVertical)}
                    className="flex-[2] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-400 active:scale-95 text-slate-950 text-xs font-black font-mono tracking-wide shadow-lg shadow-sky-500/30 transition-all"
                  >
                    <Cpu className="w-3.5 h-3.5 shrink-0" />
                    <span className="whitespace-nowrap">Request Full Package RFQ</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
