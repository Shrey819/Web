import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Terms & Conditions</span>
        </nav>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 pb-3 border-b border-slate-100">
            Terms & Conditions of Sale
          </h1>
          <p>
            The following terms govern all sales of industrial automation components, sensors, PLCs, and power drives distributed by Propel Automation.
          </p>
          <h3 className="font-bold text-slate-900">1. Corporate Account Credit</h3>
          <p>
            Approved B2B Net-30 purchase orders are billed to the registered corporate address. Outstanding balances are subject to standard late fees and credit holds.
          </p>
          <h3 className="font-bold text-slate-900">2. Warranty Claims & Advanced Replacements</h3>
          <p>
            All hardware is backed by our standard 2-Year or 3-Year advanced replacement warranty. If failure occurs during active operation, we dispatch immediate replacements before receiving the failed unit.
          </p>
        </div>
      </div>
    </div>
  );
}
