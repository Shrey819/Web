import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Receipt, RotateCcw, Percent, CheckCircle2 } from "lucide-react";
import { getSystemSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Shipping Policy | OM AUTOMATION",
  description: "Check shipping charges, delivery timeframes, tracking guidance, and delivery policies for OM AUTOMATION orders.",
};

export default async function ShippingPolicyPage() {
  const settings = await getSystemSettings();
  const supportEmail = settings.support_email || "omautomation2012@gmail.com";
  const storeName = settings.store_name || "OM Automation";

  return (
    <div className="bg-[#faf9f5] min-h-screen text-slate-800 font-sans">
      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <nav className="flex items-center gap-2 text-xs font-mono text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Shipping Policy</span>
        </nav>
      </div>

      {/* Content Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-xl space-y-8 text-sm leading-relaxed">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Shipping Policy
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-2">
              Last updated: July 6, 2026
            </p>
          </div>

          <div className="space-y-6 text-slate-600 font-body">
            <p>
              Thank you for visiting and shopping at{" "}
              <a href="https://omautomation.in" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold hover:text-sky-800">
                omautomation.in
              </a>. Following are the terms and conditions that constitute our Shipping Policy.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Shipment processing time
            </h3>
            <p>
              All orders are processed within 2-3 business days. Orders are not shipped or delivered on weekends or holidays.
            </p>
            <p>
              If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery. If there will be a significant delay in shipment of your order, we will contact you via email or telephone.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Shipment to Pin Codes
            </h3>
            <p>
              <a href="https://omautomation.in" target="_blank" rel="noopener noreferrer" className="text-sky-600 underline font-semibold hover:text-sky-800">
                omautomation.in
              </a>{" "}
              ships to addresses within India.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Shipment confirmation & Order tracking
            </h3>
            <p>
              You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Damages
            </h3>
            <p>
              Kindly make an unboxing video and If you received your order damaged, please contact us so that we can investigate the issue and provide you with a replacement. Please save all packaging materials and damaged goods before filing a claim.
            </p>
          </div>
        </div>
      </div>

      {/* Value Props */}
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
