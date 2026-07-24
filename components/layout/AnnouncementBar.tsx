"use client";

import { Truck, ShieldCheck, PhoneCall, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AnnouncementBar() {
  return (
    <div className="bg-slate-950 text-slate-300 type-caption py-2 border-b border-slate-800/80">
      <div className="content-shell flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-6 overflow-hidden">
          <div className="flex items-center gap-2 text-sky-400 font-medium">
            <Truck className="w-3.5 h-3.5" />
            <span>Same-Day Dispatch on In-Stock Orders Before 4 PM EST</span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>100% Factory Genuine Industrial Hardware</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-slate-400 type-caption shrink-0">
          <div className="hidden lg:flex items-center gap-1.5 hover:text-white transition-colors">
            <PhoneCall className="w-3.5 h-3.5 text-sky-400" />
            <span>Engineering Support: 1-800-555-AUTO</span>
          </div>
          <Link
            href="/quote"
            className="inline-flex items-center gap-1 font-semibold text-sky-400 hover:text-sky-300 transition-colors"
          >
            <span>Request Bulk RFQ</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
