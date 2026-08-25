"use client";

import { ShieldCheck, Headphones, Zap, FileText, Lock, Globe } from "lucide-react";
import { WhyBuyItem, DEFAULT_WHY_BUY } from "@/lib/homepage";

const ICONS = [ShieldCheck, Zap, Headphones, FileText, Lock, Globe];

interface WhyBuyFromUsProps {
  items?: WhyBuyItem[];
  eyebrow?: string;
  title?: string;
}

export function WhyBuyFromUs({ items, eyebrow, title }: WhyBuyFromUsProps) {
  const currentItems = items && items.length > 0 ? items : DEFAULT_WHY_BUY;

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="content-shell">
        <div className="text-center max-w-6xl mx-auto mb-16 space-y-3">
          <span className="type-label text-amber-600 font-mono font-bold tracking-widest uppercase">
            {eyebrow || "VALUE GUARANTEE"}
          </span>
          <h2 className="type-display-section text-slate-900 leading-tight">
            {title || "Why Leading Engineering Teams Choose OM AUTOMATION"}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {currentItems.map((item, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <div
                key={item.id || i}
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
