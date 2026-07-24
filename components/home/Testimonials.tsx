"use client";

import { Star, ShieldCheck, Building2 } from "lucide-react";

export function Testimonials() {
  const reviews = [
    {
      name: "David Kress",
      role: "Lead Automation Systems Engineer",
      company: "Precision Robotics & Motion Corp",
      review: "Propel Auto saved our bottling line retrofit when a major drive failed. Same-day dispatch meant the replacement ABB ACS380 arrived in 18 hours. Exceptional technical support.",
      rating: 5,
    },
    {
      name: "Sarah Jenkins",
      role: "Director of Plant Procurement",
      company: "Apex Packaging Solutions Ltd",
      review: "Their B2B RFQ portal is fast and transparent. We uploaded a 45-line item BOM for Siemens PLCs and photoelectric sensors and received custom tier pricing within 45 minutes.",
      rating: 5,
    },
    {
      name: "Viktor Petrov",
      role: "Senior Controls Architect",
      company: "Vanguard CNC Machinery",
      review: "Finding genuine, factory-new Mitsubishi servo amplifiers with valid GSD files used to take weeks. Propel's inventory visibility and documentation downloads are best-in-class.",
      rating: 5,
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="content-shell">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="type-label text-sky-600">
            Verified Enterprise Feedback
          </span>
          <h2 className="type-display-section text-slate-900">
            Trusted by Controls Engineers & Plant Procurement Managers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((r, i) => (
            <div
              key={i}
              className="bg-slate-50 rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-md hover:shadow-xl transition-all space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center gap-1 text-amber-400">
                  {[...Array(r.rating)].map((_, s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &quot;{r.review}&quot;
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-900 text-sky-400 font-bold flex items-center justify-center font-mono text-sm">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <h4 className="type-button text-slate-900">{r.name}</h4>
                  <div className="text-[11px] text-slate-500">{r.role}</div>
                  <div className="text-[10px] font-mono text-sky-600 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3 h-3" /> {r.company}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
