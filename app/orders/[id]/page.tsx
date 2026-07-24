"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronRight, CheckCircle2, Truck, Package, Clock, ShieldCheck, Download } from "lucide-react";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = use(params);

  const timeline = [
    { status: "Order Received & Verified", date: "July 18, 09:15 AM", done: true },
    { status: "Warehouse Pick & Serial Scan", date: "July 18, 11:30 AM", done: true },
    { status: "Out for Express Freight Dispatch", date: "July 18, 02:45 PM", done: true },
    { status: "In Transit to Destination Facility", date: "July 19, 06:20 AM", done: true },
    { status: "Delivered to Loading Dock", date: "Expected Today", done: false },
  ];

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/orders" className="hover:text-slate-900">
            Orders
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">{id}</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="type-technical font-bold uppercase text-sky-600">
                Live Shipment Tracking
              </span>
              <h1 className="text-2xl font-mono font-extrabold text-slate-900">
                Order Reference: {id}
              </h1>
            </div>
            <button className="px-4 py-2 rounded-full bg-slate-900 text-white type-button flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Download Tax Invoice (PDF)
            </button>
          </div>

          {/* Timeline */}
          <div className="space-y-6">
            <h3 className="font-bold text-sm text-slate-900 font-mono">Real-Time Transit Progress</h3>
            <div className="space-y-4">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    step.done ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step.done ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                  </div>
                  <div>
                    <div className={`type-button ${step.done ? "text-slate-900" : "text-slate-500"}`}>
                      {step.status}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">{step.date}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
