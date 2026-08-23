"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useToastStore } from "@/store/useToastStore";
import { Sparkles, ChevronRight, FileText, Upload, CheckCircle2, PhoneCall, ShieldCheck, Loader2 } from "lucide-react";
import { createQuoteAction } from "@/app/actions/quote";

function QuoteForm() {
  const searchParams = useSearchParams();
  const initialNotes = searchParams.get("notes") || "";
  const initialScope = searchParams.get("scope") || "";

  const { addToast } = useToastStore();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rfqNumber, setRfqNumber] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    partNumbers: initialNotes,
    quantityRequired: "10-50 Units",
    projectScope: initialScope,
  });

  useEffect(() => {
    if (initialNotes && !formData.partNumbers) {
      setFormData(prev => ({ ...prev, partNumbers: initialNotes }));
    }
  }, [initialNotes]);

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await createQuoteAction({
        company: formData.companyName,
        name: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        notes: `Part Numbers / Requirements: ${formData.partNumbers}`,
        items: [
          {
            name: formData.partNumbers || "Bulk Hardware Quote Request",
            quantity: 1,
            notes: formData.partNumbers,
          },
        ],
      });

      if (res.success && res.quoteId) {
        setRfqNumber(res.quoteId);
        setSubmitted(true);
        addToast("success", "RFQ Saved to Database!", `Quote reference ${res.quoteId} received by engineering.`);
      } else {
        addToast("error", "Submission Failed", res.error || "Failed to submit quote request.");
      }
    } catch (err) {
      console.error("Quote submission error:", err);
      addToast("error", "Error", "An error occurred while submitting RFQ.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Request Bulk Quote</span>
        </nav>

        {submitted ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xl space-y-6">
            <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h1 className="text-3xl font-mono font-extrabold text-slate-900">
              Bulk Quote Request Received!
            </h1>

            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your Request for Quotation <strong className="font-mono text-sky-700">{rfqNumber}</strong> has been logged in our database and routed to our B2B industrial engineering team.
            </p>

            <div className="pt-4">
              <Link
                href="/products"
                className="px-8 py-3 rounded-full bg-slate-900 text-white type-button shadow-md hover:bg-slate-800"
              >
                Return to Hardware Catalog
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-8">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 type-label text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                <Sparkles className="w-3.5 h-3.5" /> Direct B2B Pricing Portal
              </span>
              <h1 className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 tracking-tight">
                Request a Custom Bulk Quotation (RFQ)
              </h1>
              <p className="text-xs text-slate-600">
                Submit multi-line bill of materials (BOM), project specifications, or scheduled release orders for tiered volume pricing.
              </p>
            </div>

            <form onSubmit={handleSubmitQuote} className="space-y-6 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Corporate / Organization Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Packaging Solutions"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="s.jenkins@apex-packaging.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Direct Phone Line *</label>
                  <input
                    type="text"
                    required
                    placeholder="1-800-555-0199"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Requested Part Numbers & Quantities *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste your BOM list or model numbers (e.g. Siemens S7-1200 CPU x 25 units, OMRON E2B Proximity Sensor x 100 units)..."
                  value={formData.partNumbers}
                  onChange={(e) => setFormData({ ...formData, partNumbers: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving RFQ to Database...</span>
                  </>
                ) : (
                  <span>Submit RFQ for 2-Hour Response</span>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={
      <div className="bg-[#faf9f5] min-h-screen py-20 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
      </div>
    }>
      <QuoteForm />
    </Suspense>
  );
}
