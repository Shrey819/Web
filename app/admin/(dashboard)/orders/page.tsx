"use server";

import { getAllOrdersAdminAction } from "@/app/actions/order";
import { AdminOrdersClient } from "./AdminOrdersClient";

export default async function AdminOrdersPage() {
  const { orders } = await getAllOrdersAdminAction();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-mono font-extrabold text-white">Customer Orders & Freight Dispatch</h1>
        <p className="text-xs text-slate-400 mt-1">
          Manage real database customer orders, Cash on Delivery (COD) verifications, and freight tracking.
        </p>
      </div>

      <AdminOrdersClient initialOrders={orders} />
    </div>
  );
}
