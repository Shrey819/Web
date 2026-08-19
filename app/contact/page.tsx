import React from "react";
import { Metadata } from "next";
import { ContactForms } from "@/components/contact/ContactForms";
import { Receipt, RotateCcw, Percent, CheckCircle2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us | OM AUTOMATION",
  description:
    "Get in touch with Om Automation sales and engineering support teams. Send inquiries or subscribe to promotional updates.",
};

export default function ContactPage() {
  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* Hero Header Banner (Matches Reference Screenshot 1) */}
      <section className="relative w-full h-64 sm:h-80 md:h-96 bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Background Support Representative Image (Uploaded human support team calling on headsets) */}
        <img
          src="/images/contact/hero-support.jpg"
          alt="Customer Support Representatives Calling"
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-slate-950/70" />

        <div className="relative z-10 text-center px-4 space-y-2">
          <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight font-heading">
            Contact Us
          </h1>
        </div>
      </section>

      {/* Main Content & Forms Section */}
      <section className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <ContactForms />
      </section>

      {/* Value Propositions Bar Above Footer (Matches Reference Screenshot 4) */}
      <section className="bg-slate-50 border-t border-slate-200 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          {/* Feature 1 */}
          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              GST Input Credit
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              Get GST invoice and save up to 18% on your purchases.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              7-Day Return
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              If you receive defective Product, return it within 7 Days and Get 100% refund.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <Percent className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              Lowest Prices
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              We are offering Products at Lowest Prices in the Industry.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="flex flex-col items-center space-y-2 p-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-800 shadow-sm mb-1">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-base text-slate-900 font-heading">
              Highest Quality
            </h4>
            <p className="text-xs text-slate-600 font-body leading-relaxed max-w-xs">
              We strive to provide best quality product.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
