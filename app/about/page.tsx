import Link from "next/link";
import { ChevronRight, Award, ShieldCheck, Cpu, Globe, Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">About Propel Automation</span>
        </nav>

        {/* Hero */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-14 border border-slate-800 shadow-2xl mb-12 relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20">
              <Award className="w-3.5 h-3.5" /> ISO 9001:2026 Certified Distribution
            </span>
            <h1 className="text-3xl sm:text-5xl font-mono font-extrabold text-white tracking-tight">
              Powering Global Factory Automation & Robotics
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Propel Automation is the premier B2B e-commerce platform for industrial control hardware, supplying over 2,500 manufacturing plants across automotive, packaging, material handling, and chemical processing verticals.
            </p>
          </div>
        </div>

        {/* Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-mono">100% Genuine OEM Assurance</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every sensor, PLC, and drive is sourced directly from authorized Siemens, Omron, ABB, Schneider, and Rockwell manufacturing channels.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-mono">Dedicated Engineering Team</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our in-house staff of certified controls engineers assists with legacy cross-referencing, GSDML parameterization, and network topology design.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900 font-mono">Global Fulfillment Infrastructure</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Distribution hubs in Chicago, Frankfurt, and Singapore enable same-day dispatch and guaranteed 24-hour express air delivery.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
