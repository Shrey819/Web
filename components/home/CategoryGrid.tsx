"use client";

import Link from "next/link";
import { ArrowRight, Cpu, Radio, Zap, Layers, Disc, RotateCw } from "lucide-react";
import { motion } from "framer-motion";
import { CategoryGridConfig, DEFAULT_CATEGORY_GRID } from "@/lib/homepage";

const CATEGORY_ICONS: Record<string, any> = {
  ballscrew: Disc,
  ballscrews: Disc,
  "linear-guideway": Layers,
  "linear-guideways": Layers,
  actuators: Zap,
  sensors: Radio,
  plcs: Cpu,
  drives: RotateCw,
};

export function CategoryGrid({ config }: { config?: CategoryGridConfig }) {
  const currentConfig = config || DEFAULT_CATEGORY_GRID;
  const categories = currentConfig.categories || DEFAULT_CATEGORY_GRID.categories;

  return (
    <section className="py-8 sm:py-16 md:py-20 bg-[#faf9f5] text-slate-900 border-b border-slate-200">
      <div className="content-shell">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-sky-600 mb-1.5 uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5" />
              <span>{currentConfig.eyebrow || "Core Hardware Categories"}</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              {currentConfig.title || "Shop by Industrial Domain"}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md leading-relaxed">
            {currentConfig.subtitle ||
              "High-precision ballscrews, heavy-duty linear guideways, and multi-axis actuators engineered for zero-backlash CNC motion and plant automation."}
          </p>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {categories.map((cat, idx) => {
            const Icon = CATEGORY_ICONS[cat.slug] || CATEGORY_ICONS[cat.id] || Cpu;

            return (
              <motion.div
                key={cat.id || idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
              >
                <Link
                  href={`/category/${cat.slug || cat.id}`}
                  className="group relative flex flex-col justify-between h-full bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 md:p-8 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-sky-500/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle Background Accent Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${
                      cat.accentColor || "from-sky-500/10 to-transparent"
                    } opacity-40 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                  />

                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-10">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <span className="text-[11px] sm:text-xs font-semibold uppercase px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {cat.itemCount}+ Items
                      </span>
                    </div>

                    {/* Category Title & Badge */}
                    <div className="mb-2 sm:mb-3 relative z-10">
                      <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-sky-600 block">
                        {cat.badge}
                      </span>
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 group-hover:text-sky-600 transition-colors mt-0.5">
                        {cat.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4 sm:mb-6 relative z-10">
                      {cat.description}
                    </p>

                    {/* Subcategories list */}
                    <div className="space-y-1.5 sm:space-y-2 mb-6 sm:mb-8 relative z-10">
                      {(cat.subcategories || []).slice(0, 4).map((sub) => (
                        <div
                          key={sub}
                          className="text-xs text-slate-700 font-medium flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                          <span className="truncate">{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Footer CTA Arrow */}
                  <div className="flex items-center justify-between pt-3.5 sm:pt-4 border-t border-slate-100 relative z-10 text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
                    <span>Explore Category</span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
