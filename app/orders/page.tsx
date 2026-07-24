"use client";

import Link from "next/link";
import { ChevronRight, Package, ArrowRight, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const mockOrders = [
    {
      id: "ORD-88491",
      date: "July 18, 2026",
      status: "Shipped",
      total: 1850.00,
      itemCount: 4,
      trackingNumber: "1Z9999999999999999",
      carrier: "Express Air Freight",
    },
    {
      id: "ORD-76210",
      date: "June 24, 2026",
      status: "Delivered",
      total: 4290.00,
      itemCount: 12,
      trackingNumber: "1Z8888888888888888",
      carrier: "Dedicated Freight LTL",
    },
    {
      id: "ORD-55102",
      date: "May 10, 2026",
      status: "Delivered",
      total: 620.00,
      itemCount: 2,
      trackingNumber: "1Z7777777777777777",
      carrier: "Standard Ground",
    },
  ];

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/profile" className="hover:text-slate-900">
            Profile
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Order History</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-mono font-extrabold text-slate-900">
            Corporate Order History & Tracking
          </h1>
          <p className="type-body-small text-slate-500 mt-1">
            Track real-time carrier delivery timelines, download tax invoices, and reorder hardware BOMs.
          </p>
        </div>

        <div className="space-y-4">
          {mockOrders.map((ord) => (
            <div
              key={ord.id}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="space-y-1 w-full sm:w-auto">
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-base text-slate-900">{ord.id}</span>
                  <span className="bg-sky-500/10 text-sky-700 type-technical font-bold px-3 py-0.5 rounded-full border border-sky-500/20">
                    {ord.status}
                  </span>
                </div>
                <div className="type-body-small text-slate-500 font-mono">
                  Placed on {ord.date} • {ord.itemCount} Line Items
                </div>
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-sky-600" /> Carrier: {ord.carrier} ({ord.trackingNumber})
                </div>
              </div>

              <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                <div className="text-right">
                  <div className="type-body-small text-slate-400 font-mono">Total Paid</div>
                  <div className="type-product-title font-mono text-slate-900">
                    {formatCurrency(ord.total)}
                  </div>
                </div>

                <Link
                  href={`/orders/${ord.id}`}
                  className="py-2.5 px-5 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button flex items-center gap-1.5 shadow-md"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
