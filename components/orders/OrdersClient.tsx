"use client";

import Link from "next/link";
import { ChevronRight, Truck, ArrowRight, Package } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrdersClientProps {
  initialOrders: any[];
}

export function OrdersClient({ initialOrders }: OrdersClientProps) {
  const orders = initialOrders;

  return (
    <div className="bg-[#faf9f5] min-h-screen py-4 sm:py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-3 sm:mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold">Order History</span>
        </nav>

        <div className="mb-4 sm:mb-8">
          <h1 className="text-xl sm:text-3xl font-bold text-slate-900">
            Order History & Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track your placed orders, Cash on Delivery status, and freight shipments.
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="font-bold text-base sm:text-lg text-slate-800">No Orders Placed Yet</h3>
              <p className="text-xs text-slate-500">
                You have not placed any orders yet. Add products to your cart to checkout.
              </p>
              <Link href="/products" className="inline-block px-6 py-2.5 rounded-xl sm:rounded-full bg-slate-900 text-white font-semibold text-xs sm:text-sm">
                Browse Hardware Catalog
              </Link>
            </div>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm sm:shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="space-y-1.5 w-full sm:w-auto">
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-sm sm:text-base text-slate-900">{ord.id}</span>
                    <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                      ord.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                      ord.status === "SHIPPED" ? "bg-sky-50 text-sky-700 border-sky-200" :
                      "bg-amber-50 text-amber-700 border-amber-200"
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Placed on {ord.date || (ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : "Recent")} • {ord.itemCount || (ord.items ? ord.items.length : 0)} Items
                  </div>
                  <div className="text-xs font-medium text-slate-700 flex flex-wrap items-center gap-2 pt-0.5">
                    <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[10px]">
                      {ord.paymentMethod}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Truck className="w-3.5 h-3.5 text-sky-600" /> Carrier: {ord.carrier}
                    </span>
                    {ord.etd && (
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                        Est. Delivery: {ord.etd}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-left sm:text-right">
                    <div className="text-[10px] sm:text-xs text-slate-400">Total Amount</div>
                    <div className="font-bold text-sm sm:text-base text-slate-900">
                      {formatCurrency(ord.total)}
                    </div>
                  </div>

                  <Link
                    href={`/orders/${ord.id}`}
                    className="py-2 px-4 rounded-xl sm:rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
