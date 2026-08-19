import React from "react";
import Link from "next/link";
import { Metadata } from "next";
import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Percent,
  Receipt,
  CheckCircle2,
  Clock,
  HelpCircle,
  PackageSearch,
} from "lucide-react";
import { getSystemSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Delivery & Shipping Fee | OM AUTOMATION",
  description:
    "Check our shipping charges, delivery timeframes, tracking guidance, and delivery policies for industrial automation components.",
};

export default async function DeliveryPage() {
  const settings = await getSystemSettings();
  return (
    <div className="bg-white text-slate-900 min-h-screen">
      {/* Main Delivery Page Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 space-y-12">
        {/* Page Title */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 font-heading tracking-tight">
            Shipping Fee
          </h1>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto font-body">
            Transparent shipping rates and delivery schedules for all industrial hardware and automation orders.
          </p>
        </div>

        {/* Shipping Fee Table (Matches Reference Screenshot 1) */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider font-mono">
                <th className="py-4 px-6">Order Value</th>
                <th className="py-4 px-6">Shipping Charges</th>
                <th className="py-4 px-6">Delivery Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-medium text-slate-700 font-mono">
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-6">Upto Rs.500</td>
                <td className="py-4 px-6 font-bold text-slate-900">Rs.100</td>
                <td className="py-4 px-6">Standard</td>
              </tr>
              <tr className="hover:bg-slate-50/80 transition-colors">
                <td className="py-4 px-6">Rs.500 - Rs.2000</td>
                <td className="py-4 px-6 font-bold text-slate-900">Rs.50</td>
                <td className="py-4 px-6">Standard</td>
              </tr>
              <tr className="hover:bg-amber-50/50 bg-slate-50/40 transition-colors">
                <td className="py-4 px-6 font-bold text-emerald-700">Above Rs.2000</td>
                <td className="py-4 px-6 font-black text-emerald-600 uppercase tracking-wider">
                  Free
                </td>
                <td className="py-4 px-6 font-semibold text-sky-600">Expedited</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Shipping FAQ Content Sections (Matches Reference Screenshots 1 & 2) */}
        <div className="space-y-10 pt-4 border-t border-slate-100">
          {/* Section 1: IS SHIPPING FREE? */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-500" />
              IS SHIPPING FREE?
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-body">
              If Order Value is less than Rs. 500 then Shipping will be Rs. 100.
              <br />
              Order Value is between Rs. 500 to Rs. 2000 then Shipping will be Rs. 50.
              <br />
              Order Value more than Rs. 2000 then Shipping will be Free.
            </p>
          </div>

          {/* Section 2: WHEN WILL I RECEIVE MY ORDER? */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-500" />
              WHEN WILL I RECEIVE MY ORDER?
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-body">
              Orders are shipped out directly from any of our warehouses and they will do everything they can to get you your order as fast as they can! Due to the popularity of our offers, please allow an estimated 3-8 days for your order to arrive.
            </p>
          </div>

          {/* Section 3: CAN I TRACK MY ORDER? */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-emerald-500" />
              CAN I TRACK MY ORDER?
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-body">
              YES, you will receive AWB number (within 1 - 2 days) once you place an order. You can track your order on our{" "}
              <Link href="/orders" className="text-sky-600 underline font-semibold hover:text-sky-800">
                Tracking Page
              </Link>{" "}
              with the help of AWB number. If still you face issue in tracking your orders, feel free to call or WhatsApp us at <a href={`tel:${settings.support_phone.replace(/\s+/g, '')}`} className="text-sky-600 underline font-semibold hover:text-sky-800">{settings.support_phone}</a>.
            </p>
          </div>

          {/* Section 4: WHAT HAPPENS IF MY ORDER GETS STUCK OR LOST IN THE MAIL? */}
          <div className="space-y-3">
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 uppercase font-mono tracking-tight flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-rose-500" />
              WHAT HAPPENS IF MY ORDER GETS STUCK OR LOST IN THE MAIL?
            </h3>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-body">
              All of our orders are sent with insured shipping and handling. If an order gets stuck somewhere, sent back or even lost during the delivery process, we apologize! The postal service is out of our control. However, in cases like this, because the packages are insured, we will send you a new package with quicker shipping and full tracking, if possible. Please see our refund and return policy for when these might be applicable to shipping situations.
            </p>
          </div>
        </div>
      </div>

      {/* Value Propositions Bar Above Footer (Matches Reference Screenshot 3) */}
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
