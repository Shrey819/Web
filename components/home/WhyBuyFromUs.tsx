"use client";

import { ShieldCheck, Headphones, Zap, FileText, Lock, Globe } from "lucide-react";

export function WhyBuyFromUs() {
  const guarantees = [
    {
      icon: ShieldCheck,
      title: "100% Genuine OEM Hardware",
      description: "Direct factory sourced from Siemens, Omron, ABB, Schneider, and Allen-Bradley. Full manufacturer warranties.",
    },
    {
      icon: Headphones,
      title: "Certified Engineering Support",
      description: "Direct line access to application engineers for cross-referencing obsolete parts and debugging GSD files.",
    },
    {
      icon: Zap,
      title: "Same-Day Dispatch",
      description: "Orders placed before 4:00 PM EST ship same day via express air freight or dedicated LTL carrier.",
    },
    {
      icon: FileText,
      title: "Instant Bulk RFQ Quotes",
      description: "Submit multi-line bill of materials (BOM) for volume pricing responses within 2 business hours.",
    },
    {
      icon: Lock,
      title: "Flexible B2B Payment Terms",
      description: "Accepted credit cards, P-Cards, wire transfers, and Net-30 invoice credit lines for verified corporate accounts.",
    },
    {
      icon: Globe,
      title: "Worldwide Export Compliance",
      description: "Complete international documentation including Certificates of Origin and HS tariff classification.",
    },
  ];

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="content-shell">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="type-label text-sky-600">
            The Propel Advantage
          </span>
          <h2 className="type-display-section text-slate-900">
            Why Enterprise Engineers Choose Propel Auto
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {guarantees.map((item, i) => {
            const Icon = item.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-3xl bg-slate-50 border border-slate-200/80 hover:border-sky-500/40 hover:bg-white hover:shadow-xl transition-all duration-300 space-y-3"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center shadow-md">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
