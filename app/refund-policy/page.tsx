import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import { ChevronRight, Receipt, RotateCcw, Percent, CheckCircle2 } from "lucide-react";
import { getSystemSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Refund Policy | OM AUTOMATION",
  description: "Check our return, replacement, and refund policies for OM AUTOMATION orders.",
};

export default async function RefundPage() {
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
          <span className="text-slate-900 font-bold">Refund Policy</span>
        </nav>
      </div>

      {/* Content Card */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="bg-white rounded-3xl p-6 sm:p-12 border border-slate-200 shadow-xl space-y-8 text-sm leading-relaxed">
          <div className="border-b border-slate-100 pb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight font-heading">
              Refund Policy
            </h1>
            <p className="text-xs text-slate-500 font-mono mt-2">
              Last updated: July 6, 2026
            </p>
          </div>

          <div className="space-y-6 text-slate-600 font-body">
            <p>
              We have a 07-day return policy, which means you have 07 days after receiving your item to request a return.
            </p>
            <p>
              To be eligible for a return, your item must be in the same condition that you received it, unworn or unused, with tags, and in its original packaging. You’ll also need the receipt or proof of purchase, or you can provide your Order ID.
            </p>
            <p>
              To start a return, you can contact us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-sky-600 underline font-semibold hover:text-sky-800">
                {supportEmail}
              </a>. If your return is accepted, we’ll send you a return shipping label, as well as instructions on how and where to send your package. We will try to arrange the pickup of return items for your convenience. Items sent back to us without first requesting a return will not be accepted.
            </p>
            <p>
              You can always contact us for any return question at{" "}
              <a href={`mailto:${supportEmail}`} className="text-sky-600 underline font-semibold hover:text-sky-800">
                {supportEmail}
              </a>.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Damages and issues
            </h3>
            <p>
              Please inspect your order upon reception and if possible make a video of the package while opening and contact us immediately if the item is defective, damaged or if you receive the wrong item, so that we can evaluate the issue and make it right.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Exceptions / non-returnable items
            </h3>
            <p>
              Certain types of items cannot be returned, like perishable goods (such as food, flowers, or plants), custom products (such as special orders or personalized items), and personal care goods (such as beauty products). We also do not accept returns for hazardous materials, flammable liquids, or gases. Please get in touch if you have questions or concerns about your specific item.
            </p>
            <p>
              Unfortunately, we cannot accept returns on sale items or gift cards.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Exchanges
            </h3>
            <p>
              The fastest way to ensure you get what you want is to return the item you have, and once the return is accepted, make a separate purchase for the new item.
            </p>

            <h3 className="text-lg font-bold text-slate-900 font-heading pt-2">
              Refunds
            </h3>
            <p>
              We will notify you once we’ve received and inspected your return, and let you know if the refund was approved or not. If approved, you’ll be automatically refunded on your original payment method. Please remember it can take some time for your bank or credit card company to process and post the refund too.
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
