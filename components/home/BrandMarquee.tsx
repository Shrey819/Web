"use client";

import { BRANDS } from "@/data/brands";
import { ShieldCheck } from "lucide-react";

export function BrandMarquee() {
  const marqueeItems = [...BRANDS, ...BRANDS, ...BRANDS];

  return (
    <section className="bg-slate-900 border-b border-slate-800 py-6 overflow-hidden">
      <div className="content-shell mb-3 flex items-center justify-between">
        <span className="text-[11px] font-mono uppercase font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
          Authorized OEM Brand Distribution Partners
        </span>
        <span className="text-[10px] font-mono text-slate-500 hidden sm:inline">
          [Placeholder brand names marked for official licensing reference]
        </span>
      </div>

      <div className="relative w-full overflow-hidden flex">
        {/* Gradient Fades on Edges */}
        <div className="absolute top-0 bottom-0 left-0 w-24 bg-gradient-to-r from-slate-900 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-slate-900 to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-12 whitespace-nowrap">
          {marqueeItems.map((brand, idx) => (
            <div
              key={`${brand.id}-${idx}`}
              className="flex items-center gap-3 px-6 py-2 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <span className="font-mono font-extrabold text-base tracking-wider uppercase">
                {brand.name}
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                ({brand.country})
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
