"use client";

import { Star } from "lucide-react";
import { TestimonialItem, DEFAULT_TESTIMONIALS } from "@/lib/homepage";

interface TestimonialsProps {
  testimonials?: TestimonialItem[];
  eyebrow?: string;
  title?: string;
}

export function Testimonials({ testimonials, eyebrow, title }: TestimonialsProps) {
  const current = testimonials && testimonials.length > 0 ? testimonials : DEFAULT_TESTIMONIALS;

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="content-shell">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="type-label text-amber-600 font-mono font-bold tracking-widest uppercase">
            {eyebrow || "CLIENT FEEDBACK"}
          </span>
          <h2 className="type-display-section text-slate-900">
            {title || "Trusted by Industrial Automation Leaders"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {current.map((r, i) => (
            <div
              key={r.id || i}
              className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(Math.max(1, Math.min(5, r.rating || 5)))].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &quot;{r.quote}&quot;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-sky-400 font-bold flex items-center justify-center font-mono text-sm">
                  {r.author?.charAt(0) || "U"}
                </div>
                <div>
                  <h4 className="type-button text-slate-900">{r.author}</h4>
                  <div className="text-[11px] text-slate-500">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
