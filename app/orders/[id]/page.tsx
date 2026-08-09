import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByIdAction } from "@/app/actions/order";
import { ChevronRight, CheckCircle2, Truck, Package, Clock, ShieldCheck, Download, Building2, MapPin, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;
  const order = await getOrderByIdAction(id);

  if (!order) {
    return notFound();
  }

  const isDelivered = order.status === "DELIVERED";
  const isShipped = order.status === "SHIPPED" || isDelivered;

  const timeline = [
    { status: "Order Received & Verified in PostgreSQL", date: order.createdAt ? new Date(order.createdAt).toLocaleString() : "Logged", done: true },
    { status: "Warehouse Inventory Allocation & Serial Scan", date: "Verified Stock", done: true },
    { status: `Freight Dispatch (${order.carrier})`, date: `Carrier: ${order.carrier}`, done: isShipped },
    { status: `Delivered to Destination Dock (${order.trackingNumber})`, date: isDelivered ? "Delivered" : "In Transit", done: isDelivered },
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
          <span className="text-slate-900 font-bold">{order.id}</span>
        </nav>

        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-xl space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="type-technical font-bold uppercase text-sky-600">
                Live Database Shipment Record
              </span>
              <h1 className="text-2xl sm:text-3xl font-mono font-extrabold text-slate-900 flex items-center gap-3">
                Order: {order.id}
                <span className={`text-xs px-3 py-1 rounded-full font-sans font-bold border ${
                  order.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  order.status === "SHIPPED" ? "bg-sky-50 text-sky-700 border-sky-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {order.status}
                </span>
              </h1>
            </div>
            <button className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button flex items-center gap-2 shadow-md">
              <Download className="w-4 h-4 text-sky-400" /> Download Tax Invoice (PDF)
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Payment Method Details */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" /> Payment & Billing
              </div>
              <div className="text-slate-700 font-semibold">{order.paymentMethod}</div>
              <div className="text-slate-500 font-mono">Ref: {order.paymentReference}</div>
              <div className="text-[11px] text-emerald-700 font-bold uppercase pt-1">
                Status: {order.paymentStatus}
              </div>
            </div>

            {/* Carrier & Tracking */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" /> Dispatch & Freight
              </div>
              <div className="text-slate-700 font-semibold">{order.carrier}</div>
              <div className="text-slate-500 font-mono">Waybill / TRK: {order.trackingNumber}</div>
            </div>

            {/* Shipping Address */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 font-mono flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" /> Shipping Dock Destination
              </div>
              <div className="text-slate-900 font-bold">{order.shippingCompany || order.shippingFullName}</div>
              <div className="text-slate-600">{order.shippingStreet}, {order.shippingCity}, {order.shippingState} {order.shippingZip}</div>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 font-mono">Ordered Line Items ({order.items.length})</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between text-xs hover:bg-slate-50/50">
                  <div>
                    <div className="font-bold text-slate-900">{item.name}</div>
                    <div className="font-mono text-[10px] text-slate-500">SKU: {item.sku} • Qty: {item.quantity}</div>
                  </div>
                  <div className="text-right font-mono font-bold text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Totals Summary */}
            <div className="max-w-xs ml-auto space-y-1.5 text-xs font-mono pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST (18%):</span>
                <span>{formatCurrency(order.tax)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Freight:</span>
                <span>{order.shippingCost === 0 ? "FREE" : formatCurrency(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm pt-2 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-sky-700">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <h3 className="font-bold text-sm text-slate-900 font-mono">Real-Time Transit Progress</h3>
            <div className="space-y-4">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-mono text-xs ${
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
