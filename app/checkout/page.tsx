"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { ChevronRight, ShieldCheck, CheckCircle2, CreditCard, Building2, Truck, Lock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function CheckoutPage() {
  const { items, getSubtotal, getDiscountAmount, getTotal, clearCart } = useCartStore();
  const { addToast } = useToastStore();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "Alex Miller",
    companyName: "Industrial Motion Systems LLC",
    email: "a.miller@industrialmotion.com",
    phone: "1-800-555-0199",
    street: "100 Automation Parkway, Suite 400",
    city: "Chicago",
    state: "IL",
    zip: "60601",
    country: "United States",
    paymentMethod: "po",
    poNumber: "PO-2026-88491",
    cardNumber: "•••• •••• •••• 4242",
  });

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const total = getTotal();

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    setOrderId(newId);
    setOrderPlaced(true);
    clearCart();
    addToast("success", "Order Placed Successfully!", `B2B Purchase Order ${newId} confirmed.`);
  };

  if (orderPlaced) {
    return (
      <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-2 type-label text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Confirmed & Logged
          </span>

          <h1 className="text-3xl font-mono font-extrabold text-slate-900">
            Thank You for Your Order!
          </h1>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3 text-left">
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Order Reference #:</span>
              <span className="font-bold text-slate-900">{orderId}</span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">B2B Account:</span>
              <span className="font-bold text-slate-900">{formData.companyName}</span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Payment Terms:</span>
              <span className="font-bold text-slate-900">Net-30 Purchase Order ({formData.poNumber})</span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Estimated Dispatch:</span>
              <span className="font-bold text-emerald-600">Today before 4:00 PM EST</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Link
              href={`/orders`}
              className="px-6 py-3 rounded-full bg-slate-900 text-white type-button shadow-md"
            >
              Track Order in Dashboard
            </Link>
            <Link
              href="/products"
              className="px-6 py-3 rounded-full bg-slate-100 text-slate-800 type-button hover:bg-slate-200"
            >
              Continue Hardware Procurement
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/cart" className="hover:text-slate-900">
            Cart
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">B2B Checkout</span>
        </nav>

        <h1 className="text-3xl font-mono font-extrabold text-slate-900 mb-8">
          Enterprise B2B Checkout Simulation
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Checkout Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
            {/* Step Indicators */}
            <div className="grid grid-cols-3 gap-2 pb-6 border-b border-slate-100 font-mono text-xs text-center">
              <button
                onClick={() => setStep(1)}
                className={`py-2 rounded-xl font-bold transition-colors ${
                  step === 1 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                1. Shipping Address
              </button>
              <button
                onClick={() => setStep(2)}
                className={`py-2 rounded-xl font-bold transition-colors ${
                  step === 2 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                2. B2B Payment
              </button>
              <button
                onClick={() => setStep(3)}
                className={`py-2 rounded-xl font-bold transition-colors ${
                  step === 3 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                3. Final Review
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-sky-600" /> Corporate Shipping Address
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Full Name</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Company Name</label>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Corporate Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Direct Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Street Address / Bay</label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="w-full p-3 text-xs rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">City</label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">State</label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">ZIP Code</label>
                      <input
                        type="text"
                        value={formData.zip}
                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 rounded-full bg-slate-900 text-white type-button mt-4"
                  >
                    Continue to B2B Payment →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-600" /> B2B Payment Terms & Method
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <label
                      onClick={() => setFormData({ ...formData, paymentMethod: "po" })}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-colors ${
                        formData.paymentMethod === "po"
                          ? "border-sky-600 bg-sky-50/50 font-bold"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <span className="font-mono text-sm text-slate-900">Net-30 Purchase Order</span>
                      <span className="text-[11px] text-slate-500">Invoice billed directly to company account</span>
                    </label>

                    <label
                      onClick={() => setFormData({ ...formData, paymentMethod: "card" })}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1 transition-colors ${
                        formData.paymentMethod === "card"
                          ? "border-sky-600 bg-sky-50/50 font-bold"
                          : "border-slate-200 bg-slate-50"
                      }`}
                    >
                      <span className="font-mono text-sm text-slate-900">Corporate Credit Card</span>
                      <span className="text-[11px] text-slate-500">Visa, MasterCard, AMEX, P-Card</span>
                    </label>
                  </div>

                  {formData.paymentMethod === "po" ? (
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">PO Number</label>
                      <input
                        type="text"
                        value={formData.poNumber}
                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                        className="w-full p-3 font-mono rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Card Number</label>
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        className="w-full p-3 font-mono rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 rounded-full bg-slate-100 text-slate-700 font-bold"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-2/3 py-3 rounded-full bg-slate-900 text-white font-bold"
                    >
                      Review Order →
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Review & Confirm B2B Order
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-900">{formData.companyName}</span>
                      <span className="font-mono text-sky-600 font-bold">{formData.poNumber}</span>
                    </div>
                    <div className="text-slate-600">{formData.street}, {formData.city}, {formData.state} {formData.zip}</div>
                    <div className="text-slate-500">Contact: {formData.fullName} ({formData.email})</div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 py-3.5 rounded-full bg-slate-100 text-slate-700 font-bold"
                    >
                      ← Edit Payment
                    </button>
                    <button
                      type="submit"
                      className="w-2/3 py-3.5 rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 text-white font-bold shadow-xl"
                    >
                      Place B2B Purchase Order
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-4">
            <h3 className="font-bold text-base text-slate-900 font-mono pb-3 border-b border-slate-100">
              Cart Summary ({items.length})
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => {
                const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                const itemPrice = item.variant ? item.variant.price : item.product.basePrice;
                return (
                <div key={itemId} className="flex items-center justify-between text-xs">
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-900 truncate">{item.product.name} {item.variant && `- ${item.variant.name}`}</div>
                    <div className="text-[10px] text-slate-500 font-mono">Qty: {item.quantity}</div>
                  </div>
                  <div className="font-mono font-bold text-slate-900 shrink-0">
                    {formatCurrency(itemPrice * item.quantity)}
                  </div>
                </div>
              )})}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">{formatCurrency(subtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount</span>
                  <span className="font-mono">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono text-sky-700">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
