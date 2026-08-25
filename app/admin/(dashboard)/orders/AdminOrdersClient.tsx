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
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Customer Orders</span>
            <div className="text-2xl font-mono font-extrabold text-slate-900 dark:text-white">{totalOrdersCount}</div>
            <div className="text-[10px] text-blue-600 dark:text-blue-400 font-mono">100% Database Synced</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Total Order Revenue</span>
            <div className="text-xl font-mono font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenue)}</div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Gross Database Subtotal</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Pending COD Cash</span>
            <div className="text-xl font-mono font-extrabold text-amber-600 dark:text-amber-400">{formatCurrency(pendingCodAmount)}</div>
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">{pendingCodOrders.length} Pending Shipments</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Active Freight Shipments</span>
            <div className="text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{inTransitCount}</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">In Transit with Waybill</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
            <Truck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search order ID, company, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {["all", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors uppercase whitespace-nowrap cursor-pointer ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Orders Master Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400 font-mono text-[11px] font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Order ID & Date</th>
                <th className="py-3 px-4">Customer & Company</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Dispatch Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 font-mono">
                    No matching customer orders found in database.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => setInspectingOrder(ord)}
                        className="font-mono font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 text-left block cursor-pointer"
                      >
                        {ord.id}
                      </button>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 dark:text-white">{ord.shippingCompany || ord.shippingFullName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{ord.shippingFullName}</div>
                      <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{ord.shippingPhone || "+91 9876543210"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border font-mono text-[11px] ${
                        ord.paymentMethod.toLowerCase().includes("cod")
                          ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-bold"
                          : "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400"
                      }`}>
                        {ord.paymentMethod.toLowerCase().includes("cod") ? (
                          <DollarSign className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <FileText className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        )}
                        {ord.paymentMethod}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(ord.total)}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold uppercase border ${
                        ord.status === "DELIVERED" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" :
                        ord.status === "SHIPPED" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" :
                        ord.status === "CANCELLED" ? "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30" :
                        "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                      }`}>
                        {ord.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectingOrder(ord)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Inspect Order Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ord)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer font-medium"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8 relative text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <div className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold uppercase">Customer Order Record</div>
                <h2 className="text-xl font-mono font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  Order #{inspectingOrder.id}
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono font-bold uppercase border ${
                    inspectingOrder.status === "DELIVERED" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30" :
                    inspectingOrder.status === "SHIPPED" ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/30" :
                    "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                  }`}>
                    {inspectingOrder.status}
                  </span>
                </h2>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Shipping Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> Customer & Account
                </div>
                <div className="text-slate-900 dark:text-white font-bold">{inspectingOrder.shippingCompany || inspectingOrder.shippingFullName}</div>
                <div className="text-slate-500 dark:text-slate-400">Contact: {inspectingOrder.shippingFullName}</div>
                <div className="text-slate-700 dark:text-slate-300 font-mono flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone: <a href={`tel:${inspectingOrder.shippingPhone || '+91 9876543210'}`} className="text-blue-600 dark:text-blue-400 font-bold hover:underline">{inspectingOrder.shippingPhone || "+91 9876543210"}</a></span>
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono">
                  Payment: <span className="text-emerald-700 dark:text-emerald-400 font-bold">{inspectingOrder.paymentMethod}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-blue-600 dark:text-blue-400 font-mono flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Delivery Dock Address
                </div>
                <div className="text-slate-700 dark:text-slate-300">
                  {inspectingOrder.shippingStreet}, {inspectingOrder.shippingCity}, {inspectingOrder.shippingState} {inspectingOrder.shippingZip}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono">
                  Carrier: <span className="text-slate-900 dark:text-white font-semibold">{inspectingOrder.carrier}</span> ({inspectingOrder.trackingNumber})
                </div>
              </div>
            </div>

            {/* Purchased Items Breakdown Table */}
            <div className="space-y-3">
              <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white">Purchased Line Items ({inspectingOrder.items?.length || inspectingOrder.itemCount})</h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {inspectingOrder.items && inspectingOrder.items.length > 0 ? (
                  inspectingOrder.items.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{item.name}</div>
                        <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500">SKU: {item.sku} • Qty: {item.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 dark:text-white text-right">
                        {formatCurrency(item.price * item.quantity)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-slate-400 dark:text-slate-500 font-mono text-xs">
                    Line item breakdown not available
                  </div>
                )}
              </div>

              {/* Financial Totals */}
              <div className="max-w-xs ml-auto space-y-1.5 text-xs font-mono text-slate-600 dark:text-slate-400 pt-2">
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
                <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span>Grand Total:</span>
                  <span className="text-emerald-700 dark:text-emerald-400">{formatCurrency(inspectingOrder.total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-800">
              <Link
                href={`/orders/${inspectingOrder.id}`}
                target="_blank"
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                View Customer Storefront Page <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                onClick={() => {
                  const ord = inspectingOrder;
                  setInspectingOrder(null);
                  handleOpenEdit(ord);
                }}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Update Order Status & Freight
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGISTICS & STATUS UPDATER MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">
                Update Order #{editingOrder.id}
              </h3>
              <button onClick={() => setEditingOrder(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStatus} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Order Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                >
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Freight Carrier</label>
                <input
                  type="text"
                  value={newCarrier}
                  onChange={(e) => setNewCarrier(e.target.value)}
                  placeholder="e.g. Express Air Freight"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Waybill / Tracking #</label>
                <input
                  type="text"
                  value={newTrackingNumber}
                  onChange={(e) => setNewTrackingNumber(e.target.value)}
                  placeholder="e.g. 1Z9999999999999999"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingOrder(null)}
                  className="w-1/3 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="w-2/3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
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
