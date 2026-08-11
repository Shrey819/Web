"use client";

import { useState } from "react";
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Edit3, 
  X, 
  Loader2, 
  DollarSign, 
  FileText,
  Eye,
  TrendingUp,
  MapPin,
  Building2,
  Calendar,
  ExternalLink,
  Phone
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { updateOrderStatusAction } from "@/app/actions/order";
import Link from "next/link";

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
}

interface OrderRow {
  id: string;
  status: string;
  subtotal: number;
  tax: number;
  shippingCost: number;
  total: number;
  shippingFullName: string;
  shippingCompany?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
  shippingPhone?: string;
  createdAt: string;
  paymentMethod: string;
  paymentReference: string;
  paymentStatus?: string;
  carrier: string;
  trackingNumber: string;
  itemCount: number;
  items?: OrderItem[];
}

export function AdminOrdersClient({ initialOrders }: { initialOrders: OrderRow[] }) {
  const [orders, setOrders] = useState<OrderRow[]>(initialOrders);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [inspectingOrder, setInspectingOrder] = useState<OrderRow | null>(null);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [newCarrier, setNewCarrier] = useState("");
  const [newTrackingNumber, setNewTrackingNumber] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Compute KPI Statistics
  const totalOrdersCount = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.status !== "CANCELLED" ? o.total : 0), 0);
  const pendingCodOrders = orders.filter((o) => o.paymentMethod.toLowerCase().includes("cod") && o.status !== "DELIVERED");
  const pendingCodAmount = pendingCodOrders.reduce((sum, o) => sum + o.total, 0);
  const inTransitCount = orders.filter((o) => o.status === "SHIPPED").length;

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== "all" && ord.status.toLowerCase() !== statusFilter.toLowerCase()) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchId = ord.id.toLowerCase().includes(q);
      const matchName = ord.shippingFullName?.toLowerCase().includes(q);
      const matchCompany = ord.shippingCompany?.toLowerCase().includes(q);
      const matchTrk = ord.trackingNumber?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchCompany && !matchTrk) return false;
    }
    return true;
  });

  const handleOpenEdit = (ord: OrderRow) => {
    setEditingOrder(ord);
    setNewStatus(ord.status);
    setNewCarrier(ord.carrier || "Express Air Freight");
    setNewTrackingNumber(ord.trackingNumber || `TRK-${ord.id}`);
  };

  const handleSaveStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    setIsUpdating(true);
    try {
      const res = await updateOrderStatusAction(editingOrder.id, newStatus, newCarrier, newTrackingNumber);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === editingOrder.id
              ? { ...o, status: newStatus, carrier: newCarrier, trackingNumber: newTrackingNumber }
              : o
          )
        );
        if (inspectingOrder?.id === editingOrder.id) {
          setInspectingOrder((prev) => prev ? { ...prev, status: newStatus, carrier: newCarrier, trackingNumber: newTrackingNumber } : null);
        }
        setEditingOrder(null);
      } else {
        alert(res.error || "Failed to update order status");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while updating order");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top KPI Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Total Customer Orders</span>
            <div className="text-2xl font-mono font-extrabold text-white">{totalOrdersCount}</div>
            <div className="text-[10px] text-sky-400 font-mono">100% Database Synced</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Total Order Revenue</span>
            <div className="text-xl font-mono font-extrabold text-emerald-400">{formatCurrency(totalRevenue)}</div>
            <div className="text-[10px] text-emerald-500 font-mono">Gross Database Subtotal</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Pending COD Cash</span>
            <div className="text-xl font-mono font-extrabold text-amber-400">{formatCurrency(pendingCodAmount)}</div>
            <div className="text-[10px] text-amber-500 font-mono">{pendingCodOrders.length} Pending COD Shipments</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-400">Active Freight Shipments</span>
            <div className="text-2xl font-mono font-extrabold text-indigo-400">{inTransitCount}</div>
            <div className="text-[10px] text-indigo-400 font-mono">In Transit with Waybill</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, company, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors uppercase whitespace-nowrap ${
                statusFilter === st
                  ? "bg-sky-500 text-slate-950 shadow-md"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Orders Master Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 font-mono">
                <th className="py-3.5 px-4">Order ID & Date</th>
                <th className="py-3.5 px-4">Customer & Company</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Dispatch Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 font-mono">
                    No matching customer orders found in PostgreSQL database.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setInspectingOrder(ord)}
                        className="font-mono font-bold text-white hover:text-sky-400 text-left block"
                      >
                        {ord.id}
                      </button>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{ord.shippingCompany || ord.shippingFullName}</div>
                      <div className="text-[10px] text-slate-500">{ord.shippingFullName}</div>
                      <div className="text-[11px] font-mono text-sky-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                        <span>{ord.shippingPhone || "+91 9876543210"}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[11px] ${
                        ord.paymentMethod.toLowerCase().includes("cod")
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 font-bold"
                          : "bg-sky-500/10 border-sky-500/20 text-sky-400"
                      }`}>
                        {ord.paymentMethod.toLowerCase().includes("cod") ? (
                          <DollarSign className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <FileText className="w-3 h-3 text-sky-400" />
                        )}
                        {ord.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {formatCurrency(ord.total)}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                        ord.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        ord.status === "SHIPPED" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingOrder(ord)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ord)}
                          className="p-2 rounded-lg bg-slate-800 hover:bg-sky-600/20 text-slate-300 hover:text-sky-400 transition-colors inline-flex items-center gap-1 text-xs"
                          title="Update Freight & Status"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Status</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* INSPECT ORDER MODAL (Full Line Items Breakdown) */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-sky-400 font-bold uppercase">Customer Order Record</div>
                <h2 className="text-xl font-mono font-extrabold text-white flex items-center gap-2">
                  Order #{inspectingOrder.id}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border ${
                    inspectingOrder.status === "DELIVERED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    inspectingOrder.status === "SHIPPED" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                    "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {inspectingOrder.status}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-sky-400 font-mono flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Customer & Account
                </div>
                <div className="text-white font-bold">{inspectingOrder.shippingCompany || inspectingOrder.shippingFullName}</div>
                <div className="text-slate-400">Contact: {inspectingOrder.shippingFullName}</div>
                <div className="text-slate-300 font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>Phone: <a href={`tel:${inspectingOrder.shippingPhone || '+91 9876543210'}`} className="text-sky-400 font-bold hover:underline">{inspectingOrder.shippingPhone || "+91 9876543210"}</a></span>
                </div>
                <div className="text-slate-400 font-mono">
                  Payment: <span className="text-emerald-400 font-bold">{inspectingOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <div className="font-bold text-sky-400 font-mono flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Delivery Dock Address
                </div>
                <div className="text-slate-300">
                  {inspectingOrder.shippingStreet}, {inspectingOrder.shippingCity}, {inspectingOrder.shippingState} {inspectingOrder.shippingZip}
                </div>
                <div className="text-slate-400 font-mono">
                  Carrier: <span className="text-white">{inspectingOrder.carrier}</span> ({inspectingOrder.trackingNumber})
                </div>
              </div>
            </div>

            {/* Purchased Items Breakdown Table */}
            <div className="space-y-3">
              <h3 className="font-mono font-bold text-sm text-slate-200">Purchased Line Items ({inspectingOrder.items?.length || inspectingOrder.itemCount})</h3>
              <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-800 bg-slate-950">
                {inspectingOrder.items && inspectingOrder.items.length > 0 ? (
                  inspectingOrder.items.map((item) => (
                    <div key={item.id} className="p-3.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-white">{item.name}</div>
                        <div className="font-mono text-[10px] text-slate-400">SKU: {item.sku} • Qty: {item.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-white text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-500 font-mono text-xs">
                    Line item breakdown not available
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="max-w-xs ml-auto space-y-1.5 text-xs font-mono text-slate-300 pt-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(inspectingOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST Tax (18%):</span>
                  <span>{formatCurrency(inspectingOrder.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Freight:</span>
                  <span>{inspectingOrder.shippingCost === 0 ? "FREE" : formatCurrency(inspectingOrder.shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-emerald-400">{formatCurrency(inspectingOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <Link
                href={`/orders/${inspectingOrder.id}`}
                target="_blank"
                className="text-xs text-sky-400 hover:underline flex items-center gap-1"
              >
                View Customer Storefront Page <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => {
                  const ord = inspectingOrder;
                  setInspectingOrder(null);
                  handleOpenEdit(ord);
                }}
                className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md"
              >
                Update Order Status & Freight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGISTICS & STATUS UPDATER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-lg text-white">
                Update Order #{editingOrder.id}
              </h3>
              <button onClick={() => setEditingOrder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-mono font-bold uppercase text-slate-400 block mb-1">Order Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-sky-500"
                >
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="font-mono font-bold uppercase text-slate-400 block mb-1">Freight Carrier</label>
                <input
                  type="text"
                  value={newCarrier}
                  onChange={(e) => setNewCarrier(e.target.value)}
                  placeholder="e.g. Express Air Freight"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="font-mono font-bold uppercase text-slate-400 block mb-1">Waybill / Tracking #</label>
                <input
                  type="text"
                  value={newTrackingNumber}
                  onChange={(e) => setNewTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z9999999999999999"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-2/3 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
