import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireCustomer } from "@/lib/auth-checks";
import { getOrderByIdAction } from "@/app/actions/order";
import { CustomerOrderTracking } from "@/components/orders/CustomerOrderTracking";
import { ChevronRight, CheckCircle2, Truck, Package, Clock, ShieldCheck, Building2, MapPin, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const { id } = await params;

  // Unauthenticated visitors are redirected to login with callbackUrl
  let user;
  try {
    user = await requireCustomer();
  } catch {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/orders/${id}`)}`);
  }

  // Authenticated customer/admin: getOrderByIdAction enforces ownership.
  // Returns null for non-existent order or cross-customer access -> 404 notFound (zero existence leakage).
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
    <div className="bg-[#faf9f5] min-h-screen py-4 sm:py-10 border-b border-slate-200">
      <div className="content-shell space-y-5 sm:space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/orders" className="hover:text-slate-900">
            Orders
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold">{order.id}</span>
        </nav>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200 shadow-md sm:shadow-xl space-y-5 sm:space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-sky-600">
                Shipment Record
              </span>
              <h1 className="text-xl sm:text-3xl font-bold text-slate-900 flex flex-wrap items-center gap-2 sm:gap-3 mt-0.5">
                Order: {order.id}
                <span className={`text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                  order.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  order.status === "SHIPPED" ? "bg-sky-50 text-sky-700 border-sky-200" :
                  "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {order.status}
                </span>
              </h1>
            </div>
            <CustomerOrderTracking
              orderId={order.id}
              invoiceUrl={order.invoiceUrl || undefined}
              awbCode={order.awbCode || undefined}
              carrier={order.carrier}
              trackingData={order.trackingData}
              status={order.status}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6 text-xs">
            {/* Payment Method Details */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-sky-600" /> Payment & Billing
              </div>
              <div className="text-slate-700 font-semibold">{order.paymentMethod}</div>
              <div className="text-slate-500">Ref: {order.paymentReference}</div>
              <div className="text-[10px] text-emerald-700 font-bold uppercase pt-0.5">
                Status: {order.paymentStatus}
              </div>
            </div>

            {/* Carrier & Tracking */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" /> Dispatch & Freight
              </div>
              <div className="text-slate-700 font-semibold">{order.carrier}</div>
              {order.etd && (
                <div className="text-emerald-700 text-[10px] font-bold">
                  Est. Delivery: {order.etd}
                </div>
              )}
              <div className="text-slate-500">TRK: {order.trackingNumber}</div>
            </div>

            {/* Shipping Address */}
            <div className="p-3.5 sm:p-5 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-600" /> Delivery Address
              </div>
              <div className="text-slate-900 font-bold">{order.shippingCompany || order.shippingFullName}</div>
              <div className="text-slate-600 leading-relaxed">{order.shippingStreet}, {order.shippingCity}, {order.shippingState} {order.shippingZip}</div>
            </div>
          </div>

          {/* Line Items Table with Chosen Variants */}
          <div className="space-y-3 sm:space-y-4 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">Ordered Items ({order.items.length})</h3>
            <div className="border border-slate-200 rounded-xl sm:rounded-2xl overflow-hidden divide-y divide-slate-100 bg-white">
              {order.items.map((item: any) => {
                const rawName = item.name || "Industrial Component";
                let note = item.buyerNote;
                let cleanName = rawName;

                const noteMatch = cleanName.match(/\s*\[(?:Model\/Note|Note):\s*(.*?)\]/i) || cleanName.match(/\s*\((?:Model\/Note|Note):\s*(.*?)\)/i);
                if (noteMatch) {
                  if (!note) note = noteMatch[1].trim();
                  cleanName = cleanName.replace(noteMatch[0], "").trim();
                }

                const match = cleanName.match(/^(.*?)\s*\((.*?)\)$/);
                const baseName = match ? match[1].trim() : cleanName;
                const nameOptions = match
                  ? match[2].split(/[,/]/).map((s: string) => {
                      const parts = s.split(":");
                      return parts.length === 2
                        ? { name: parts[0].trim(), value: parts[1].trim() }
                        : { name: "Variant", value: s.trim() };
                    })
                  : [];

                const combinedAttrs = (item.attributes && item.attributes.length > 0)
                  ? item.attributes
                  : nameOptions;

                return (
                  <div key={item.id} className="p-3 sm:p-4 flex items-start justify-between gap-3 text-xs hover:bg-slate-50/50">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">{baseName}</div>

                      {/* Buyer Provided Note */}
                      {note && (
                        <div className="inline-flex items-start gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                          <span className="font-bold text-[10px] uppercase text-amber-800">Note:</span>
                          <span className="italic text-slate-700">{note}</span>
                        </div>
                      )}
                      
                      {combinedAttrs.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          {combinedAttrs.map((attr: any, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-medium border border-blue-200"
                            >
                              <span className="text-slate-500">{attr.name}:</span>
                              <span className="font-bold">{attr.value}</span>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="text-[10px] sm:text-[11px] text-slate-500 flex items-center gap-1.5 pt-0.5">
                        <span>SKU: {item.sku}</span>
                        <span>•</span>
                        <span>Qty: {item.quantity}</span>
                        <span>•</span>
                        <span>Unit: {formatCurrency(item.price)}</span>
                      </div>
                    </div>
                    <div className="text-right font-bold text-slate-900 text-xs sm:text-sm shrink-0 pt-0.5">
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order Totals Summary */}
            <div className="max-w-xs ml-auto space-y-1 text-xs pt-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-900">{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Shipping Freight:</span>
                <span className="font-medium text-emerald-600">{order.shippingCost === 0 ? "FREE" : formatCurrency(order.shippingCost)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 text-sm sm:text-base pt-1.5 border-t border-slate-200">
                <span>Grand Total:</span>
                <span className="text-sky-700">{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-3 sm:space-y-4 pt-4 sm:pt-6 border-t border-slate-100">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900">Transit Progress</h3>
            <div className="space-y-3 sm:space-y-4">
              {timeline.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3 sm:gap-4">
                  <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 text-xs ${
                    step.done ? "bg-emerald-500 text-slate-950 font-bold" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step.done ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : idx + 1}
                  </div>
                  <div>
                    <div className={`text-xs sm:text-sm font-semibold ${step.done ? "text-slate-900" : "text-slate-500"}`}>
                      {step.status}
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400">{step.date}</div>
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
