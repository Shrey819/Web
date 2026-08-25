"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { PromoBannerConfig, DEFAULT_PROMO_BANNER } from "@/lib/homepage";

export function PromoBanner({ config }: { config?: PromoBannerConfig }) {
  const current = config || DEFAULT_PROMO_BANNER;

  return (
    <section className="py-20 bg-slate-950 text-white border-b border-slate-900 relative overflow-hidden">
      <div className="content-shell relative z-10">
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              {current.badge || "Volume Procurement Discounts"}
            </span>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight font-mono">
              {current.title || "Planning Large Machine Builds or Plant Retrofits?"}
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              {current.description ||
                "Unlock tiered volume discounts starting at 10+ units per line item. Access dedicated account managers, scheduled multi-shipment releases, and net-30 terms."}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href={current.primaryCtaUrl || "/quote"}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-extrabold text-xs shadow-xl transition-all hover:scale-105"
              >
                <span>{current.primaryCtaText || "Submit Bill of Materials (RFQ)"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={current.secondaryCtaUrl || "/contact"}
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-slate-800 hover:bg-slate-700 text-white type-button border border-slate-700 transition-colors"
              >
                <span>{current.secondaryCtaText || "Speak with an Application Engineer"}</span>
              </Link>
            </div>
          </div>

          {/* Right Visual */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-2xl">
              <img
                src={current.image || "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1000&auto=format&fit=crop&q=80"}
                alt="Promo banner visual"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

