"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUserStore } from "@/store/useUserStore";
import { getUserOrdersAction } from "@/app/actions/order";
import { ChevronRight, Truck, ArrowRight, Package, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function OrdersPage() {
  const { user } = useUserStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let placedOrderIds: string[] = [];
    try {
      placedOrderIds = JSON.parse(localStorage.getItem("om-automation-placed-orders") || "[]");
    } catch (e) {
      console.error("Failed to parse placed order IDs:", e);
    }

    setIsLoading(true);
    getUserOrdersAction(user?.id, user?.email, placedOrderIds).then((res) => {
      if (res.success && res.orders) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
      setIsLoading(false);
    });
  }, [user?.id, user?.email]);

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Order History</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-mono font-extrabold text-slate-900">
            Order History & Logistics Tracking
          </h1>
          <p className="type-body-small text-slate-500 mt-1">
            Track your placed orders, Cash on Delivery status, and freight shipments.
          </p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm flex items-center justify-center gap-2 text-slate-500 font-mono text-xs">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" />
            <span>Loading your order history...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
                <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 font-mono">No Orders Placed Yet</h3>
                <p className="text-xs text-slate-500">
                  You have not placed any orders yet. Add products to your cart to test Cash on Delivery or Net-30 PO checkout.
                </p>
                <Link href="/products" className="inline-block px-6 py-2.5 rounded-full bg-slate-900 text-white type-button">
                  Browse Hardware Catalog
                </Link>
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4"
                >
                  <div className="space-y-1 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-base text-slate-900">{ord.id}</span>
                      <span className={`type-technical font-bold px-3 py-0.5 rounded-full border ${
                        ord.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                        ord.status === "SHIPPED" ? "bg-sky-50 text-sky-700 border-sky-200" :
                        "bg-amber-50 text-amber-700 border-amber-200"
                      }`}>
                        {ord.status}
                      </span>
                    </div>
                    <div className="type-body-small text-slate-500 font-mono">
                      Placed on {ord.date} • {ord.itemCount} Line Items
                    </div>
                    <div className="text-xs font-semibold text-slate-700 flex items-center gap-2 pt-0.5">
                      <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-mono text-[10px]">
                        {ord.paymentMethod}
                      </span>
                      <span className="flex items-center gap-1 text-slate-500">
                        <Truck className="w-3.5 h-3.5 text-sky-600" /> Carrier: {ord.carrier} ({ord.trackingNumber})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <div className="type-body-small text-slate-400 font-mono">Total Amount</div>
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
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
