"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { ChevronRight, ShieldCheck, CheckCircle2, CreditCard, Building2, Loader2, DollarSign, FileText, AlertTriangle, Lock, Phone, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createOrderAction } from "@/app/actions/order";
import { SystemSettings } from "@/lib/settings";
import { PhoneInput } from "@/components/ui/PhoneInput";

interface CheckoutClientProps {
  settings: SystemSettings;
}

export function CheckoutClient({ settings }: CheckoutClientProps) {
  const { items, getSubtotal, getDiscountAmount, getTotal, clearCart } = useCartStore();
  const { addToast } = useToastStore();
  const { user } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    total: number;
    paymentMethodLabel: string;
    paymentReference: string;
  } | null>(null);

  // If COD is disabled in settings, default to 'po' or 'card'
  const initialPaymentMethod = settings.cod_enabled ? "cod" : "po";

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    companyName: "",
    email: user?.email || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "India",
    paymentMethod: initialPaymentMethod as "cod" | "po" | "card",
    poNumber: "",
    cardNumber: "",
  });

  // Restore saved shipping address draft from localStorage on refresh (excluding phone)
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("om_checkout_shipping_draft");
      if (saved) {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          fullName: parsed.fullName || prev.fullName,
          companyName: parsed.companyName || "",
          email: parsed.email || prev.email,
          street: parsed.street || "",
          city: parsed.city || "",
          state: parsed.state || "",
          zip: parsed.zip || "",
          country: parsed.country || "India",
          phone: "", // Require user to refill mobile number on refresh as requested
        }));
      }
    } catch (e) {
      console.error("Failed to restore checkout draft:", e);
    }
  }, []);

  // Save address draft to localStorage whenever fields update (excluding phone)
  useEffect(() => {
    try {
      const draft = {
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
      };
      localStorage.setItem("om_checkout_shipping_draft", JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save checkout draft:", e);
    }
  }, [formData.fullName, formData.companyName, formData.email, formData.street, formData.city, formData.state, formData.zip, formData.country]);

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const total = getTotal();

  const isBelowMinOrder = total > 0 && total < settings.min_order_value;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      addToast("warning", "Cart Empty", "Please add items to cart before placing an order.");
      return;
    }

    if (settings.maintenance_mode) {
      addToast("error", "Maintenance Active", "Checkout is temporarily paused for system upgrades.");
      return;
    }

    if (isBelowMinOrder) {
      addToast("warning", "Minimum Order Value", `Minimum order value is ${formatCurrency(settings.min_order_value)}.`);
      return;
    }

    if (formData.paymentMethod === "cod" && !settings.cod_enabled) {
      addToast("error", "Payment Disabled", "Cash on Delivery is currently disabled by store administrator.");
      return;
    }

    const phoneDigits = formData.phone.replace(/[^\d]/g, "");
    if (phoneDigits.length < 9) {
      addToast("warning", "Incomplete Phone Number", "Please enter a valid mobile number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await createOrderAction({
        userId: user?.id,
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        paymentMethod: formData.paymentMethod,
        poNumber: formData.poNumber,
        cardNumber: formData.cardNumber,
        items: items.map((item) => ({
          productId: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          price: item.variant ? item.variant.price : item.product.basePrice,
          quantity: item.quantity,
          variantId: item.variant?.id,
        })),
      });

      if (res.success && res.orderId) {
        try {
          localStorage.removeItem("om_checkout_shipping_draft");
          const stored = JSON.parse(localStorage.getItem("om-automation-placed-orders") || "[]");
          if (!stored.includes(res.orderId)) {
            stored.push(res.orderId);
            localStorage.setItem("om-automation-placed-orders", JSON.stringify(stored));
          }
        } catch (e) {
          console.error(e);
        }

        setOrderDetails({
          orderId: res.orderId,
          total: res.total || total,
          paymentMethodLabel: res.paymentMethodLabel || (formData.paymentMethod === "cod" ? "Cash on Delivery" : "Purchase Order"),
          paymentReference: res.paymentReference || res.orderId,
        });
        setOrderPlaced(true);
        clearCart();
        addToast("success", "Order Placed & Saved!", `Order ${res.orderId} recorded in database.`);
      } else {
        addToast("error", "Order Placement Failed", res.error || "Could not save order.");
      }
    } catch (err) {
      console.error("Order submit error:", err);
      addToast("error", "Order Error", "Failed to submit order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFieldMissing = (val: string) => showValidationErrors && !val.trim();

  if (orderPlaced && orderDetails) {
    return (
      <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-2 type-label text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Real Database Order Created
          </span>

          <h1 className="text-3xl font-mono font-extrabold text-slate-900">
            Thank You for Your Order!
          </h1>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-3 text-left">
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Order Reference #:</span>
              <span className="font-bold text-slate-900 font-mono">{orderDetails.orderId}</span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Customer / Account:</span>
              <span className="font-bold text-slate-900">{formData.companyName || formData.fullName}</span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Payment Terms:</span>
              <span className="font-bold text-sky-700">{orderDetails.paymentMethodLabel}</span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-bold text-slate-900 font-mono">{formatCurrency(orderDetails.total)}</span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Dispatch Status:</span>
              <span className="font-bold text-emerald-600">Processing in Database Warehouse</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-4">
            <Link
              href={`/orders`}
              className="px-6 py-3 rounded-full bg-slate-900 text-white type-button shadow-md hover:bg-slate-800"
            >
              Track Order in Customer Portal
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
      <div className="content-shell space-y-6">
        {/* Maintenance Banner */}
        {settings.maintenance_mode && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-amber-900 flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs font-semibold">
              <span className="font-bold uppercase tracking-wider block">Storefront Maintenance Mode Active</span>
              Order placement is temporarily paused while administrators upgrade backend inventory databases.
            </div>
          </div>
        )}

        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/cart" className="hover:text-slate-900">
            Cart
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Checkout</span>
        </nav>

        <h1 className="text-3xl font-mono font-extrabold text-slate-900">
          Hardware Procurement Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Checkout Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg space-y-6">
            {/* Step Indicators */}
            <div className="grid grid-cols-3 gap-2 pb-6 border-b border-slate-100 font-mono text-xs text-center">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-2 rounded-xl font-bold transition-colors ${
                  step === 1 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                1. Shipping Address
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`py-2 rounded-xl font-bold transition-colors ${
                  step === 2 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                2. Payment Options
              </button>
              <button
                type="button"
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
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-600" /> Corporate Shipping Address
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">
                      <span className="text-rose-500 font-bold">*</span> Required Fields
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                        Full Name <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className={`w-full p-3 rounded-2xl border focus:outline-none transition-all ${
                          isFieldMissing(formData.fullName)
                            ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                            : "border-slate-200 focus:border-sky-500"
                        }`}
                        required
                      />
                      {isFieldMissing(formData.fullName) && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Full Name is required
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold uppercase tracking-wider text-slate-600">Company / Organisation</label>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md font-bold uppercase">Optional</span>
                      </div>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g. Om Automation Pvt Ltd"
                        className="w-full p-3 rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                      />
                    </div>

                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                        Corporate Email <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. rahul@company.com"
                        className={`w-full p-3 rounded-2xl border focus:outline-none transition-all ${
                          isFieldMissing(formData.email)
                            ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                            : "border-slate-200 focus:border-sky-500"
                        }`}
                        required
                      />
                      {isFieldMissing(formData.email) && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Corporate Email is required
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                        Direct Mobile Phone Number <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                      />
                      {isFieldMissing(formData.phone) && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Phone Number is required
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                      Street Address / Building / GIDC Industrial Area <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g. Plot 42, GIDC Electronics Estate, Sector 26"
                      className={`w-full p-3 text-xs rounded-2xl border focus:outline-none transition-all ${
                        isFieldMissing(formData.street)
                          ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                          : "border-slate-200 focus:border-sky-500"
                      }`}
                      required
                    />
                    {isFieldMissing(formData.street) && (
                      <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Street address is required
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                        City / District <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g. Gandhinagar"
                        className={`w-full p-3 rounded-2xl border focus:outline-none transition-all ${
                          isFieldMissing(formData.city)
                            ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                            : "border-slate-200 focus:border-sky-500"
                        }`}
                        required
                      />
                      {isFieldMissing(formData.city) && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> City is required
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                        State <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        placeholder="e.g. Gujarat"
                        className={`w-full p-3 rounded-2xl border focus:outline-none transition-all ${
                          isFieldMissing(formData.state)
                            ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                            : "border-slate-200 focus:border-sky-500"
                        }`}
                        required
                      />
                      {isFieldMissing(formData.state) && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> State is required
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                        PIN Code (6 Digits) <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.zip}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 6);
                          setFormData({ ...formData, zip: digits });
                        }}
                        placeholder="e.g. 382028"
                        maxLength={6}
                        className={`w-full p-3 rounded-2xl border focus:outline-none transition-all font-mono tracking-wider ${
                          isFieldMissing(formData.zip)
                            ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                            : "border-slate-200 focus:border-sky-500"
                        }`}
                        required
                      />
                      {isFieldMissing(formData.zip) && (
                        <span className="text-[10px] text-rose-500 font-bold mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> PIN Code is required
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowValidationErrors(true);
                      if (!formData.fullName || !formData.email || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.zip) {
                        addToast("warning", "Required Fields Missing", "Please fill in all highlighted required shipping address fields.");
                        return;
                      }
                      const phoneDigits = formData.phone.replace(/[^\d]/g, "");
                      if (phoneDigits.length < 10) {
                        addToast("warning", "Incomplete Phone Number", "Please enter a valid 10-digit Indian mobile number.");
                        return;
                      }
                      if (formData.country === "India" && !/^\d{6}$/.test(formData.zip.trim())) {
                        addToast("warning", "Invalid PIN Code", "Please enter a valid 6-digit Indian PIN code (e.g. 382028).");
                        return;
                      }
                      setShowValidationErrors(false);
                      setStep(2);
                    }}
                    className="w-full py-3.5 rounded-full bg-slate-900 text-white type-button mt-4 hover:bg-slate-800 shadow-md transition-all active:scale-[0.99]"
                  >
                    Continue to Payment Options →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-sky-600" /> Payment Terms & Method Selection
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* COD Option - Disabled if admin settings cod_enabled is false */}
                    <div
                      onClick={() => {
                        if (settings.cod_enabled) {
                          setFormData({ ...formData, paymentMethod: "cod" });
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all ${
                        !settings.cod_enabled
                          ? "opacity-45 bg-slate-100 border-slate-200 cursor-not-allowed"
                          : formData.paymentMethod === "cod"
                          ? "border-emerald-600 bg-emerald-50/50 font-bold ring-2 ring-emerald-500/20 cursor-pointer"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-slate-900 flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-emerald-600" /> Cash on Delivery
                        </span>
                        {formData.paymentMethod === "cod" && settings.cod_enabled && (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        )}
                        {!settings.cod_enabled && (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight block mt-1">
                        {settings.cod_enabled
                          ? "Pay cash or cheque on freight delivery at dock"
                          : "Disabled by Store Administrator"}
                      </span>
                    </div>

                    <label
                      onClick={() => setFormData({ ...formData, paymentMethod: "po" })}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1.5 transition-colors ${
                        formData.paymentMethod === "po"
                          ? "border-sky-600 bg-sky-50/50 font-bold ring-2 ring-sky-500/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-slate-900 flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-sky-600" /> Net-30 PO
                        </span>
                        {formData.paymentMethod === "po" && (
                          <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight">Invoice billed to corporate credit line</span>
                    </label>

                    <label
                      onClick={() => setFormData({ ...formData, paymentMethod: "card" })}
                      className={`p-4 rounded-2xl border cursor-pointer flex flex-col gap-1.5 transition-colors ${
                        formData.paymentMethod === "card"
                          ? "border-indigo-600 bg-indigo-50/50 font-bold ring-2 ring-indigo-500/20"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm text-slate-900 flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-indigo-600" /> Corporate Card
                        </span>
                        {formData.paymentMethod === "card" && (
                          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 leading-tight">Visa, MasterCard, AMEX, P-Card</span>
                    </label>
                  </div>

                  {formData.paymentMethod === "po" && (
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">PO Number</label>
                      <input
                        type="text"
                        value={formData.poNumber}
                        onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                        placeholder="e.g. PO-2026-88491"
                        className="w-full p-3 font-mono rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  )}

                  {formData.paymentMethod === "card" && (
                    <div>
                      <label className="font-semibold uppercase tracking-wider text-slate-500 mb-1 block">Card Number</label>
                      <input
                        type="text"
                        value={formData.cardNumber}
                        onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                        placeholder="•••• •••• •••• 4242"
                        className="w-full p-3 font-mono rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
                        required
                      />
                    </div>
                  )}

                  {formData.paymentMethod === "cod" && settings.cod_enabled && (
                    <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Cash on Delivery selected. Pay cash or company check when shipment arrives.</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-2/3 py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800"
                    >
                      Review Order →
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-xs">
                  <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Review & Confirm Hardware Order
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-900">{formData.companyName || formData.fullName}</span>
                      <span className="font-mono text-emerald-600 font-bold uppercase">
                        {formData.paymentMethod === "cod" ? "Cash on Delivery" : formData.paymentMethod === "po" ? formData.poNumber : "Corporate Card"}
                      </span>
                    </div>
                    <div className="text-slate-600">{formData.street}, {formData.city}, {formData.state} {formData.zip}</div>
                    <div className="text-slate-500 font-mono flex items-center gap-2">
                      <span>Contact: {formData.fullName} ({formData.email})</span>
                      <span className="text-sky-600 font-bold">• {formData.phone}</span>
                    </div>
                  </div>

                  {isBelowMinOrder && (
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Minimum order value is {formatCurrency(settings.min_order_value)}. Please add more items to cart to place order.</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 py-3.5 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                      disabled={isSubmitting}
                    >
                      ← Edit Payment
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isBelowMinOrder || settings.maintenance_mode}
                      className="w-2/3 py-3.5 rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-bold shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>Saving Order to Database...</span>
                        </>
                      ) : (
                        <span>Confirm & Place Order</span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* Right Summary */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-4">
            <h3 className="font-bold text-base text-slate-900 font-mono pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Cart Summary</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full" suppressHydrationWarning>
                {mounted ? items.length : 0} items
              </span>
            </h3>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {mounted && items.length > 0 ? (
                items.map((item) => {
                  const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                  const itemPrice = item.variant ? item.variant.price : item.product.basePrice;
                  return (
                    <div key={itemId} className="flex items-center justify-between text-xs">
                      <div className="min-w-0 pr-2">
                        <div className="font-bold text-slate-900 truncate">{item.product.name} {item.variant && `- ${item.variant.name}`}</div>
                        <div className="text-[10px] text-slate-500 font-mono">Qty: {item.quantity}</div>
                      </div>
                      <div className="font-mono font-bold text-slate-900 shrink-0" suppressHydrationWarning>
                        {formatCurrency(itemPrice * item.quantity)}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-400 py-4 text-center italic">
                  {mounted ? "No items in cart" : "Loading cart summary..."}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono" suppressHydrationWarning>
                  {mounted ? formatCurrency(subtotal) : formatCurrency(0)}
                </span>
              </div>
              {mounted && discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-bold">
                  <span>Discount</span>
                  <span className="font-mono" suppressHydrationWarning>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2 border-t border-slate-200">
                <span>Total</span>
                <span className="font-mono text-sky-700" suppressHydrationWarning>
                  {mounted ? formatCurrency(total) : formatCurrency(0)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
