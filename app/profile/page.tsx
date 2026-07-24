"use client";

import Link from "next/link";
import { User, Building2, ShieldCheck, CreditCard, MapPin, Package, FileText, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProfilePage() {
  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Corporate Profile Portal</span>
        </nav>

        <div className="bg-slate-950 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center font-mono">
              AM
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="type-section-title font-mono text-white">Alex Miller</h1>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                  Verified B2B Buyer
                </span>
              </div>
              <p className="type-body-small text-slate-400 font-mono">Lead Automation Engineer • Industrial Motion Systems LLC</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Link
              href="/orders"
              className="px-5 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white type-button shadow-md"
            >
              View Orders & Tracking
            </Link>
            <Link
              href="/quote"
              className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 type-button"
            >
              Submit RFQ BOM
            </Link>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">Approved Net-30 Credit Line</h3>
            <div className="type-section-title font-mono text-emerald-600">{formatCurrency(4250000)}</div>
            <p className="type-body-small text-slate-500">Active credit line available for instant purchase orders.</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">Total Orders Processed</h3>
            <div className="type-section-title font-mono text-slate-900">14 Orders</div>
            <p className="type-body-small text-slate-500">100% on-time delivery rate across active shipments.</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">Account Manager</h3>
            <div className="text-sm font-bold text-slate-900">Dr. Marcus Vance (AE-409)</div>
            <p className="type-body-small text-slate-500">Direct Line: 1-800-555-AUTO ext 409</p>
          </div>
        </div>
      </div>
    </div>
  );
}
