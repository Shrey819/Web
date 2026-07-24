"use client";

import Link from "next/link";
import Image from "next/image";
import { CATEGORIES } from "@/data/categories";
import { ArrowRight, Cpu, Radio, Zap, Layers } from "lucide-react";
import { motion } from "framer-motion";

export function CategoryGrid() {
  const categoryIcons = {
    sensors: Radio,
    plcs: Cpu,
    drives: Zap,
  };

  return (
    <section className="py-20 bg-[#faf9f5] text-slate-900 border-b border-slate-200">
      <div className="content-shell">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 type-label text-sky-600 mb-2">
              <Layers className="w-4 h-4" />
              <span>Core Hardware Categories</span>
            </div>
            <h2 className="type-display-section text-slate-900">
              Shop by Industrial Domain
            </h2>
          </div>
          <p className="text-sm text-slate-600 max-w-md">
            Architect your control system with 1,500+ stocked components classified by sensing precision, PLC logic execution, and power drive specs.
          </p>
        </div>

        {/* 3 Main Category Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {CATEGORIES.map((cat, idx) => {
            const Icon = categoryIcons[cat.id as keyof typeof categoryIcons] || Cpu;

            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  className="group relative flex flex-col justify-between h-full bg-white rounded-3xl p-8 border border-slate-200/90 shadow-lg hover:shadow-2xl hover:border-sky-500/50 transition-all duration-300 overflow-hidden"
                >
                  {/* Subtle Background Accent Gradient */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${cat.accentColor} opacity-50 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`}
                  />

                  <div>
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-6 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-mono text-xs font-bold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                        {cat.itemCount}+ Items
                      </span>
                    </div>

                    {/* Category Title & Badge */}
                    <div className="mb-3 relative z-10">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600">
                        {cat.badge}
                      </span>
                      <h3 className="type-section-title text-slate-900 group-hover:text-sky-600 transition-colors mt-0.5">
                        {cat.name}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-6 relative z-10">
                      {cat.description}
                    </p>

                    {/* Subcategories list */}
                    <div className="space-y-2 mb-8 relative z-10">
                      {cat.subcategories.slice(0, 4).map((sub) => (
                        <div
                          key={sub}
                          className="text-xs text-slate-700 font-medium flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                          <span>{sub}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Footer CTA Arrow */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100 relative z-10 type-button text-slate-900 group-hover:text-sky-600 transition-colors">
                    <span>Explore Category</span>
                    <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-sky-600 group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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
