"use client";

import { motion } from "framer-motion";
import { Package, ShieldCheck, Clock, Award } from "lucide-react";

export function StatsSection() {
  const stats = [
    { label: "Industrial Components", value: "2,000+", detail: "Sensors, PLCs, VFDs & Servos", icon: Package },
    { label: "OEM Brand Partners", value: "50+", detail: "Siemens, Omron, ABB & Rockwell", icon: ShieldCheck },
    { label: "Same-Day Dispatch", value: "99.8%", detail: "Orders before 4 PM EST", icon: Award },
    { label: "B2B Quote Turnaround", value: "< 2 Hours", detail: "Formal pricing & BOM estimates", icon: Clock },
  ];

  return (
    <section className="py-16 bg-slate-950 text-white border-b border-slate-800">
      <div className="content-shell">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((st, i) => {
            const Icon = st.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2 text-center"
              >
                <div className="w-10 h-10 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold font-mono text-white tracking-tight">
                  {st.value}
                </div>
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  {st.label}
                </div>
                <div className="text-[11px] text-slate-500">{st.detail}</div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
