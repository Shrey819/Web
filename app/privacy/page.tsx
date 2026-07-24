import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">Home</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Privacy Policy</span>
        </nav>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
          <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 pb-3 border-b border-slate-100">
            Privacy Policy
          </h1>
          <p>
            At Propel Automation, we respect the privacy of our corporate buyers and engineering clients. This Policy details what corporate profile telemetry data we collect and how we ensure secure transactions.
          </p>
          <h3 className="font-bold text-slate-900">1. Information Collection</h3>
          <p>
            We collect company name, tax identification details, business address, corporate email, and list of specified hardware part numbers solely for generating B2B quotation PDFs and fulfilling logistical shipments.
          </p>
          <h3 className="font-bold text-slate-900">2. Security Compliance</h3>
          <p>
            Fulfillment processes are ISO 9001 and ITAR/EAR compliant. Net-30 purchase order credentials are cryptographically protected.
          </p>
        </div>
      </div>
    </div>
  );
}
