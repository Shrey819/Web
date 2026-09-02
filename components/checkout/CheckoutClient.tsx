"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { 
  ChevronRight, 
  ShieldCheck, 
  CheckCircle2, 
  CreditCard, 
  Building2, 
  Loader2, 
  DollarSign, 
  FileText, 
  AlertTriangle, 
  Lock, 
  Phone, 
  AlertCircle, 
  Truck, 
  Zap, 
  MapPin, 
  Home, 
  Briefcase, 
  Plus, 
  Check, 
  Star 
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { createOrderAction } from "@/app/actions/order";
import { createRazorpayOrderAction, verifyAndCreatePrepaidOrderAction } from "@/app/actions/razorpay";
import { checkPincodeServiceabilityAction } from "@/app/actions/shiprocket";
import { getUserAddressesAction, AddressItem } from "@/app/actions/address";
import { SystemSettings } from "@/lib/settings";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { AddressLocationSelector } from "@/components/ui/AddressLocationSelector";
import { validatePincodeWithState } from "@/lib/indiaLocations";
import { DeliveryRangeResult } from "@/lib/shiprocket";

function loadRazorpayCheckoutScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(true));
      existingScript.addEventListener("error", () => resolve(false));
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

interface CheckoutClientProps {
  settings: SystemSettings;
}

const ADDRESS_TYPES = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Office", label: "Office", icon: Building2 },
  { id: "Work", label: "Work / Factory", icon: Briefcase },
  { id: "Other", label: "Other", icon: MapPin },
] as const;

export function CheckoutClient({ settings }: CheckoutClientProps) {
  const { items, getSubtotal, getDiscountAmount, getTotal, clearCart, syncLivePrices } = useCartStore();
  const { addToast } = useToastStore();
  const { user } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  const [pincodeStatus, setPincodeStatus] = useState<{
    loading: boolean;
    checked: boolean;
    serviceable?: boolean;
    message?: string;
    estimatedDays?: string;
    deliveryRange?: DeliveryRangeResult;
    courierName?: string;
  } | null>(null);

  const [orderDetails, setOrderDetails] = useState<{
    orderId: string;
    total: number;
    paymentMethodLabel: string;
    paymentReference: string;
    carrier?: string;
    deliveryRange?: DeliveryRangeResult;
  } | null>(null);

  // If COD is disabled in settings, default to 'prepaid'
  const initialPaymentMethod: "cod" | "prepaid" = settings.cod_enabled ? "cod" : "prepaid";

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    companyName: user?.companyName || "",
    email: user?.email || "",
    phone: "",
    street: "",
    city: "",
    state: "Gujarat",
    zip: "",
    country: "India",
    addressType: "Home" as "Home" | "Office" | "Work" | "Other",
    saveAddress: true,
    paymentMethod: initialPaymentMethod as "cod" | "prepaid",
    poNumber: "",
    cardNumber: "",
  });

  // Load Saved Addresses on Mount and when User is available
  useEffect(() => {
    setMounted(true);
    syncLivePrices();
    loadRazorpayCheckoutScript();

    const fetchAddresses = async () => {
      setLoadingAddresses(true);
      try {
        let combined: AddressItem[] = [];

        // 1. Fetch from database if user or email exists
        if (user?.id || user?.email) {
          const res = await getUserAddressesAction(user?.id, user?.email);
          if (res.success && res.addresses && res.addresses.length > 0) {
            combined = [...res.addresses];
          }
        }

        // 2. Fetch from localStorage for guests or local offline addresses
        try {
          const localStored = localStorage.getItem("om_saved_addresses");
          if (localStored) {
            const parsed = JSON.parse(localStored);
            if (Array.isArray(parsed)) {
              for (const loc of parsed) {
                if (!combined.some((c) => c.street?.trim() === loc.street?.trim() && c.zip?.trim() === loc.zip?.trim())) {
                  combined.push(loc);
                }
              }
            }
          }
        } catch (e) {
          console.error("Failed to read local addresses:", e);
        }

        setSavedAddresses(combined);

        // If saved addresses exist, select the default or first one and autofill!
        if (combined.length > 0) {
          const defaultAddr = combined.find((a) => a.isDefault) || combined[0];
          setSelectedAddressId(defaultAddr.id);
          setFormData((prev) => ({
            ...prev,
            fullName: defaultAddr.fullName || prev.fullName,
            companyName: defaultAddr.companyName || prev.companyName,
            email: defaultAddr.email || prev.email || user?.email || "",
            phone: defaultAddr.phone || prev.phone,
            street: defaultAddr.street,
            city: defaultAddr.city,
            state: defaultAddr.state || "Gujarat",
            zip: defaultAddr.zip,
            country: defaultAddr.country || "India",
            addressType: (defaultAddr.type as any) || "Home",
          }));
        } else {
          // Restore draft if any from localStorage
          try {
            const savedDraft = localStorage.getItem("om_checkout_shipping_draft");
            if (savedDraft) {
              const parsed = JSON.parse(savedDraft);
              setFormData((prev) => ({
                ...prev,
                fullName: parsed.fullName || prev.fullName,
                companyName: parsed.companyName || prev.companyName,
                email: parsed.email || prev.email,
                phone: parsed.phone || prev.phone,
                street: parsed.street || "",
                city: parsed.city || "",
                state: parsed.state || "Gujarat",
                zip: parsed.zip || "",
                country: parsed.country || "India",
                addressType: parsed.addressType || "Home",
              }));
            }
          } catch (e) {
            console.error("Failed to restore checkout draft:", e);
          }
        }
      } catch (e) {
        console.error("Failed to load saved addresses:", e);
      } finally {
        setLoadingAddresses(false);
      }
    };

    fetchAddresses();
  }, [user?.id, user?.email]);

  // Save address draft to localStorage whenever fields update
  useEffect(() => {
    try {
      const draft = {
        fullName: formData.fullName,
        companyName: formData.companyName,
        email: formData.email,
        phone: formData.phone,
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
        addressType: formData.addressType,
      };
      localStorage.setItem("om_checkout_shipping_draft", JSON.stringify(draft));
    } catch (e) {
      console.error("Failed to save checkout draft:", e);
    }
  }, [
    formData.fullName,
    formData.companyName,
    formData.email,
    formData.phone,
    formData.street,
    formData.city,
    formData.state,
    formData.zip,
    formData.country,
    formData.addressType,
  ]);

  // Update user name/email if user logs in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name || "",
        email: prev.email || user.email || "",
      }));
    }
  }, [user]);

  // Handle selecting a saved address card
  const handleSelectSavedAddress = (addr: AddressItem) => {
    setSelectedAddressId(addr.id);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName,
      companyName: addr.companyName || "",
      email: addr.email || prev.email || user?.email || "",
      phone: addr.phone,
      street: addr.street,
      city: addr.city,
      state: addr.state || "Gujarat",
      zip: addr.zip,
      country: addr.country || "India",
      addressType: (addr.type as any) || "Home",
    }));
  };

  // Handle choosing to enter a new address
  const handleSelectNewAddress = () => {
    setSelectedAddressId("new");
    setFormData((prev) => ({
      ...prev,
      fullName: user?.name || "",
      companyName: user?.companyName || "",
      email: user?.email || "",
      phone: "",
      street: "",
      city: "",
      state: "Gujarat",
      zip: "",
      country: "India",
      addressType: "Home",
      saveAddress: true,
    }));
  };

  // Real-Time Pincode Serviceability & Delivery Estimation Check (Only for India)
  useEffect(() => {
    const isIndia = !formData.country || formData.country.trim().toLowerCase() === "india";
    const pin = formData.zip.trim();

    if (isIndia && /^\d{6}$/.test(pin)) {
      let isCurrent = true;
      setPincodeStatus({ loading: true, checked: false });

      const timer = setTimeout(() => {
        checkPincodeServiceabilityAction(pin, 0.5, formData.paymentMethod === "cod").then((res) => {
          if (isCurrent) {
            setPincodeStatus({
              loading: false,
              checked: true,
              serviceable: res.serviceable,
              message: res.message,
              estimatedDays: res.estimatedDays,
              deliveryRange: res.deliveryRange,
              courierName: res.recommendedCourier,
            });
          }
        });
      }, 400);

      return () => {
        isCurrent = false;
        clearTimeout(timer);
      };
    } else {
      setPincodeStatus(null);
    }
  }, [formData.zip, formData.country, formData.paymentMethod]);

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

    const isIndia = !formData.country || formData.country.trim().toLowerCase() === "india";
    if (isIndia) {
      const phoneDigits = formData.phone.replace(/[^\d]/g, "");
      if (phoneDigits.length < 10) {
        addToast("warning", "Incomplete Phone Number", "Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      const pinVal = validatePincodeWithState(formData.zip, formData.state);
      if (!pinVal.isValid) {
        addToast("error", "PIN Code Mismatch", pinVal.message || "Please verify your PIN code and selected State.");
        return;
      }
    }

    const sanitizedItems = items.map((item) => {
      const varId = item.variant?.id;
      const cleanVarId = varId && varId !== "undefined" && varId !== "null" ? varId : undefined;
      const varName = item.variant?.name && item.variant.name !== "undefined" ? item.variant.name : "";
      const baseName = (item.product.name || "Industrial Hardware")
        .replace(/\s*-\s*undefined/gi, "")
        .replace(/\s*\(undefined\)/gi, "")
        .trim();
      const cleanName = varName ? `${baseName} (${varName})` : baseName;

      return {
        productId: item.product.id,
        name: cleanName,
        sku: item.variant?.sku || item.product.sku || `SKU-${item.product.id}`,
        price: item.variant?.price ?? item.product.basePrice ?? 0,
        quantity: item.quantity,
        variantId: cleanVarId,
      };
    });

    const handleOrderSuccess = (orderRes: any, methodLabel: string, reference: string) => {
      try {
        // Save placed address to local storage addresses array for quick repeat access
        const localAddrs: AddressItem[] = JSON.parse(localStorage.getItem("om_saved_addresses") || "[]");
        const newLocalAddr: AddressItem = {
          id: `local_addr_${Date.now()}`,
          userId: user?.id || `user_${formData.phone.replace(/\D/g, "")}`,
          fullName: formData.fullName,
          companyName: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zip,
          country: formData.country,
          type: formData.addressType,
          isDefault: true,
        };

        const filtered = localAddrs.filter((a) => !(a.street === newLocalAddr.street && a.zip === newLocalAddr.zip));
        filtered.unshift(newLocalAddr);
        localStorage.setItem("om_saved_addresses", JSON.stringify(filtered.slice(0, 10)));

        // Save placed order id to local placed orders
        const storedOrders = JSON.parse(localStorage.getItem("om-automation-placed-orders") || "[]");
        if (!storedOrders.includes(orderRes.orderId)) {
          storedOrders.push(orderRes.orderId);
          localStorage.setItem("om-automation-placed-orders", JSON.stringify(storedOrders));
        }
      } catch (e) {
        console.error(e);
      }

      setOrderDetails({
        orderId: orderRes.orderId,
        total: orderRes.total || total,
        paymentMethodLabel: orderRes.paymentMethodLabel || methodLabel,
        paymentReference: orderRes.paymentReference || reference || orderRes.orderId,
        carrier: orderRes.carrier || pincodeStatus?.courierName || "Express Regional Logistics",
        deliveryRange: orderRes.deliveryRange || pincodeStatus?.deliveryRange,
      });
      setOrderPlaced(true);
      clearCart();
      addToast("success", "Order Placed & Confirmed!", `Order ${orderRes.orderId} created successfully.`);
    };

    setIsSubmitting(true);

    // ==========================================
    // 1. PREPAID (Razorpay Online Checkout Modal)
    // ==========================================
    if (formData.paymentMethod === "prepaid") {
      try {
        const scriptLoaded = await loadRazorpayCheckoutScript();
        if (!scriptLoaded || !(window as any).Razorpay) {
          addToast(
            "error",
            "Payment Gateway Error",
            "Unable to load Razorpay checkout SDK. Please check your internet connection."
          );
          setIsSubmitting(false);
          return;
        }

        const rzpOrderRes = await createRazorpayOrderAction({
          amount: total,
          currency: "INR",
          notes: {
            customerName: formData.fullName,
            customerEmail: formData.email,
            customerPhone: formData.phone,
          },
        });

        if (!rzpOrderRes.success || !rzpOrderRes.orderId) {
          addToast("error", "Payment Order Error", rzpOrderRes.error || "Failed to initialize payment gateway order.");
          setIsSubmitting(false);
          return;
        }

        const options = {
          key: rzpOrderRes.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: rzpOrderRes.amount,
          currency: rzpOrderRes.currency || "INR",
          name: "Om Industrial Automation",
          description: `Payment for Hardware Order`,
          order_id: rzpOrderRes.orderId,
          prefill: {
            name: formData.fullName,
            email: formData.email,
            contact: formData.phone.replace(/[^\d]/g, "").slice(-10),
          },
          theme: {
            color: "#0284c7",
          },
          handler: async function (response: {
            razorpay_payment_id: string;
            razorpay_order_id: string;
            razorpay_signature: string;
          }) {
            setIsSubmitting(true);
            try {
              const verifyRes = await verifyAndCreatePrepaidOrderAction({
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
                addressType: formData.addressType,
                saveAddress: formData.saveAddress,
                items: sanitizedItems,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              if (verifyRes.success && verifyRes.orderId) {
                handleOrderSuccess(verifyRes, "Prepaid (Razorpay)", response.razorpay_payment_id);
              } else {
                addToast("error", "Payment Verification Failed", verifyRes.error || "Could not verify payment signature.");
              }
            } catch (err: any) {
              console.error("Payment verification error:", err);
              addToast("error", "Order Error", "Failed to finalize order after payment.");
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              addToast("info", "Payment Cancelled", "You closed the payment modal. Your cart items are preserved.");
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on("payment.failed", function (failResponse: any) {
          console.error("Razorpay payment failed:", failResponse?.error);
          addToast(
            "error",
            "Payment Failed",
            failResponse?.error?.description || "Payment was declined by bank or UPI provider."
          );
          setIsSubmitting(false);
        });

        rzp.open();
      } catch (err: any) {
        console.error("Razorpay initiation error:", err);
        addToast("error", "Payment Gateway Error", err?.message || "Failed to launch Razorpay payment modal.");
        setIsSubmitting(false);
      }
      return;
    }

    // ==========================================
    // 2. CASH ON DELIVERY (COD)
    // ==========================================
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
        addressType: formData.addressType,
        saveAddress: formData.saveAddress,
        paymentMethod: formData.paymentMethod,
        poNumber: formData.poNumber,
        cardNumber: formData.cardNumber,
        items: sanitizedItems,
      });

      if (res.success && res.orderId) {
        handleOrderSuccess(res, "Cash on Delivery", res.paymentReference || res.orderId);
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

  const isFieldMissing = (val: string) => showValidationErrors && !val?.trim();

  if (orderPlaced && orderDetails) {
    const courierPartner = orderDetails.carrier || pincodeStatus?.courierName || "Express Surface Logistics";
    const deliveryRangeStr = orderDetails.deliveryRange?.formattedDateRange || pincodeStatus?.deliveryRange?.formattedDateRange || "3 - 5 Business Days";
    const deliveryDaysStr = orderDetails.deliveryRange?.formattedDaysRange || pincodeStatus?.deliveryRange?.formattedDaysRange || "3 - 5 Business Days";

    return (
      <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-lg">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <span className="inline-flex items-center gap-2 type-label text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Real Database Order Created (New Order Status)
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
              <span className="text-slate-500">Logistics Carrier:</span>
              <span className="font-bold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-600" />
                {courierPartner}
              </span>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Estimated Delivery Window:</span>
              <div className="text-right">
                <span className="font-bold text-emerald-700 font-mono block">{deliveryRangeStr}</span>
                <span className="text-[10px] text-slate-400 font-mono">({deliveryDaysStr} • +2 Days Buffer Included)</span>
              </div>
            </div>
            <div className="flex justify-between type-technical border-b border-slate-100 pb-2">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-bold text-slate-900 font-mono">{formatCurrency(orderDetails.total)}</span>
            </div>
            <div className="flex justify-between type-technical">
              <span className="text-slate-500">Order Fulfillment Status:</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                New Order • Awaiting Dispatch
              </span>
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
                className={`py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  step === 1 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                1. Shipping Address
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  step === 2 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                2. Payment Options
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`py-2 rounded-xl font-bold transition-colors cursor-pointer ${
                  step === 3 ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                3. Final Review
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-6">
              {step === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-600" /> Corporate Shipping Address
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono font-medium">
                      <span className="text-rose-500 font-bold">*</span> Required Fields
                    </span>
                  </div>

                  {/* 1. Saved Addresses Carousel / Selector */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-3 p-4 rounded-2xl bg-slate-50/70 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span>Saved Delivery Addresses ({savedAddresses.length})</span>
                        </label>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Click to autofill
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {savedAddresses.map((addr) => {
                          const typeConfig = ADDRESS_TYPES.find((t) => t.id === addr.type) || ADDRESS_TYPES[0];
                          const Icon = typeConfig.icon;
                          const isSelected = selectedAddressId === addr.id;

                          return (
                            <div
                              key={addr.id}
                              onClick={() => handleSelectSavedAddress(addr)}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer relative text-xs flex flex-col justify-between ${
                                isSelected
                                  ? "bg-white border-amber-500 ring-2 ring-amber-500/20 shadow-sm"
                                  : "bg-white/60 border-slate-200 hover:border-slate-300 hover:bg-white"
                              }`}
                            >
                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 flex items-center gap-1 text-slate-700">
                                    <Icon className="w-3 h-3 text-amber-600" />
                                    {typeConfig.label}
                                  </span>
                                  {addr.isDefault && (
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                      <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h4 className="font-bold text-slate-900">
                                    {addr.fullName}
                                  </h4>
                                  {addr.companyName && (
                                    <p className="text-[11px] text-sky-600 font-mono font-medium">
                                      {addr.companyName}
                                    </p>
                                  )}
                                </div>

                                <p className="text-[11px] text-slate-600 line-clamp-2">
                                  {addr.street}, {addr.city}, {addr.state} - {addr.zip} ({addr.country || "India"})
                                </p>
                                <p className="text-[10px] font-mono text-slate-500">
                                  📱 +91 {addr.phone}
                                </p>
                              </div>

                              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                                <span className={`font-bold font-mono ${isSelected ? "text-amber-600 flex items-center gap-1" : "text-slate-400"}`}>
                                  {isSelected ? "✓ Selected" : "Use this address"}
                                </span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Option to enter a different address */}
                        <div
                          onClick={handleSelectNewAddress}
                          className={`p-3 rounded-2xl border-2 border-dashed transition-all cursor-pointer text-xs flex flex-col items-center justify-center text-center gap-1 min-h-[110px] ${
                            selectedAddressId === "new"
                              ? "border-sky-500 bg-sky-50/50 text-sky-700"
                              : "border-slate-300 hover:border-slate-400 text-slate-500 bg-white/40"
                          }`}
                        >
                          <Plus className="w-5 h-5" />
                          <span className="font-bold font-mono text-xs">
                            {selectedAddressId === "new" ? "Entering Custom Address" : "+ Enter Different Address"}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Fill address details below
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Contact Details */}
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

                  {/* 3. Street Address */}
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

                  {/* 4. Country, State, City, PIN Code Cascading Selector with India Validation */}
                  <AddressLocationSelector
                    country={formData.country}
                    state={formData.state}
                    city={formData.city}
                    zip={formData.zip}
                    onCountryChange={(country) => setFormData({ ...formData, country })}
                    onStateChange={(state) => setFormData({ ...formData, state })}
                    onCityChange={(city) => setFormData({ ...formData, city })}
                    onZipChange={(zip) => setFormData({ ...formData, zip })}
                    isFieldMissing={isFieldMissing}
                  />

                  {/* Pincode Live Courier Serviceability Notice (When India) */}
                  {(!formData.country || formData.country.toLowerCase() === "india") && (
                    <div>
                      {pincodeStatus?.loading && (
                        <span className="text-[10px] text-sky-600 font-mono flex items-center gap-1 font-semibold">
                          <Loader2 className="w-3 h-3 animate-spin" /> Checking live courier serviceability...
                        </span>
                      )}
                      {pincodeStatus?.checked && (
                        <div
                          className={`mt-1 p-3 rounded-2xl border text-[11px] font-mono flex items-center gap-2 ${
                            pincodeStatus.serviceable
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : "bg-amber-50 border-amber-200 text-amber-800"
                          }`}
                        >
                          {pincodeStatus.serviceable ? (
                            <Truck className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          <div>
                            <span className="font-bold">
                              {pincodeStatus.serviceable ? "Verified Delivery: " : "Notice: "}
                            </span>
                            <span>{pincodeStatus.message}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Address Type Label Picker & Save Address Checkbox */}
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                    <div>
                      <label className="block font-mono font-bold uppercase tracking-wider text-slate-700 mb-2">
                        Save Address As:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {ADDRESS_TYPES.map((type) => {
                          const Icon = type.icon;
                          const isSelected = formData.addressType === type.id;
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setFormData({ ...formData, addressType: type.id as any })}
                              className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{type.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <label className="flex items-center gap-2.5 pt-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={formData.saveAddress}
                        onChange={(e) => setFormData({ ...formData, saveAddress: e.target.checked })}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      />
                      <span className="font-semibold text-slate-700">
                        Save this address to my profile for 1-click checkout next time
                      </span>
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowValidationErrors(true);
                      if (!formData.fullName || !formData.email || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.zip) {
                        addToast("warning", "Required Fields Missing", "Please fill in all highlighted required shipping address fields.");
                        return;
                      }

                      const isIndia = !formData.country || formData.country.trim().toLowerCase() === "india";
                      if (isIndia) {
                        const phoneDigits = formData.phone.replace(/[^\d]/g, "");
                        if (phoneDigits.length < 10) {
                          addToast("warning", "Incomplete Phone Number", "Please enter a valid 10-digit Indian mobile number.");
                          return;
                        }
                        const pinVal = validatePincodeWithState(formData.zip, formData.state);
                        if (!pinVal.isValid) {
                          addToast("error", "PIN Code Mismatch", pinVal.message || "Please verify your PIN code and selected State.");
                          return;
                        }
                      }

                      setShowValidationErrors(false);
                      setStep(2);
                    }}
                    className="w-full py-3.5 rounded-full bg-slate-900 text-white type-button mt-4 hover:bg-slate-800 shadow-md transition-all active:scale-[0.99] cursor-pointer"
                  >
                    Continue to Payment Options →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-slate-900 font-mono flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-600" /> Payment Method Selection
                    </h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Choose COD or Pre-paid
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* 1. COD Option */}
                    <div
                      onClick={() => {
                        if (settings.cod_enabled) {
                          setFormData({ ...formData, paymentMethod: "cod" });
                        }
                      }}
                      className={`p-5 rounded-3xl border transition-all ${
                        !settings.cod_enabled
                          ? "opacity-45 bg-slate-100 border-slate-200 cursor-not-allowed"
                          : formData.paymentMethod === "cod"
                          ? "border-emerald-600 bg-emerald-50/60 font-bold ring-2 ring-emerald-500/20 shadow-md cursor-pointer"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm sm:text-base text-slate-900 flex items-center gap-2">
                          <DollarSign className="w-5 h-5 text-emerald-600 shrink-0" />
                          <span>Cash on Delivery (COD)</span>
                        </span>
                        {formData.paymentMethod === "cod" && settings.cod_enabled && (
                          <span className="w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-emerald-200" />
                        )}
                        {!settings.cod_enabled && (
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {settings.cod_enabled
                          ? "Pay cash or company cheque on freight delivery at dock / doorstep."
                          : "Cash on Delivery is currently disabled by store administrator."}
                      </p>
                    </div>

                    {/* 2. Pre-paid Option */}
                    <div
                      onClick={() => setFormData({ ...formData, paymentMethod: "prepaid" })}
                      className={`p-5 rounded-3xl border transition-all cursor-pointer ${
                        formData.paymentMethod === "prepaid"
                          ? "border-sky-600 bg-sky-50/60 font-bold ring-2 ring-sky-500/20 shadow-md"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-sm sm:text-base text-slate-900 flex items-center gap-2">
                          <Zap className="w-5 h-5 text-sky-600 fill-sky-500/20 shrink-0" />
                          <span>Pre-paid / Online Payment</span>
                        </span>
                        {formData.paymentMethod === "prepaid" && (
                          <span className="w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-200" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        Direct pre-paid procurement (Cards, NetBanking, UPI & Corporate transfer).
                      </p>
                    </div>
                  </div>

                  {/* Selected Payment Confirmation Notice */}
                  {formData.paymentMethod === "cod" && settings.cod_enabled && (
                    <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Cash on Delivery selected. Pay cash or company cheque when shipment arrives.</span>
                    </div>
                  )}

                  {formData.paymentMethod === "prepaid" && (
                    <div className="p-4 rounded-2xl bg-sky-50/80 border border-sky-200 text-sky-900 text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600" />
                      <span>Pre-paid payment selected. Order is processed as verified & paid for immediate fulfillment.</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-2/3 py-3 rounded-full bg-slate-900 text-white font-bold hover:bg-slate-800 cursor-pointer"
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
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{formData.companyName || formData.fullName}</span>
                      <span className="font-mono text-emerald-600 font-bold uppercase">
                        {formData.paymentMethod === "cod" ? "Cash on Delivery (COD)" : "Pre-paid (Online Payment)"}
                      </span>
                    </div>
                    <div className="text-slate-600">{formData.street}, {formData.city}, {formData.state} - {formData.zip} ({formData.country || "India"})</div>
                    <div className="text-slate-500 font-mono flex items-center gap-2">
                      <span>Contact: {formData.fullName} ({formData.email})</span>
                      <span className="text-sky-600 font-bold">• +91 {formData.phone}</span>
                    </div>
                    <div className="text-[11px] text-amber-700 font-mono font-semibold pt-1">
                      Label: {formData.addressType} Delivery
                    </div>
                  </div>

                  {/* Logistics & Delivery Window Summary */}
                  <div className="p-4 rounded-2xl bg-sky-50/60 border border-sky-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-slate-900 font-mono flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-sky-600" /> Logistics Partner & Delivery Window
                      </div>
                      <span className="text-[10px] font-mono bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-bold">
                        +2 Days Buffer Included
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Shipping Partner:</span>
                        <span className="font-bold text-slate-900">{pincodeStatus?.courierName || "Express Regional Logistics"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Estimated Delivery Window:</span>
                        <span className="font-bold text-emerald-700 font-mono">
                          {pincodeStatus?.deliveryRange?.formattedDateRange || "3 - 5 Business Days"}
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ({pincodeStatus?.deliveryRange?.formattedDaysRange || "3 - 5 Business Days"})
                        </span>
                      </div>
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
                      className="w-1/3 py-3.5 rounded-full bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 cursor-pointer"
                      disabled={isSubmitting}
                    >
                      ← Edit Payment
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isBelowMinOrder || settings.maintenance_mode}
                      className={`w-2/3 py-3.5 rounded-full font-bold shadow-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer ${
                        formData.paymentMethod === "prepaid"
                          ? "bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white"
                          : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>
                            {formData.paymentMethod === "prepaid"
                              ? "Opening Payment Gateway..."
                              : "Saving Order to Database..."}
                          </span>
                        </>
                      ) : formData.paymentMethod === "prepaid" ? (
                        <>
                          <Zap className="w-4 h-4 fill-white/20" />
                          <span>Pay with Razorpay →</span>
                        </>
                      ) : (
                        <span>Confirm & Place Order (COD)</span>
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
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-mono font-bold" suppressHydrationWarning>
                {mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0} items
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
                        <div className="font-bold text-slate-900 truncate">
                          {(item.product.name || "Product").replace(/\s*-\s*undefined/gi, "")}
                          {item.variant?.name && item.variant.name !== "undefined" && ` - ${item.variant.name}`}
                        </div>
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
