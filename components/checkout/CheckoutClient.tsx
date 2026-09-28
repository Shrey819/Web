"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { useUserStore } from "@/store/useUserStore";
import { 
  ChevronRight, 
  ChevronDown,
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
  Star,
  Trash2,
  ShoppingBag
} from "lucide-react";
import { formatCurrency, formatDisplayPhone, validatePersonName, validateEmailAddress } from "@/lib/utils";
import { createOrderAction } from "@/app/actions/order";
import { createRazorpayOrderAction, verifyAndCreatePrepaidOrderAction } from "@/app/actions/razorpay";
import { checkPincodeServiceabilityAction } from "@/app/actions/shiprocket";
import { getUserAddressesAction, deleteAddressAction } from "@/app/actions/address";
import type { AddressItem } from "@/types";
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

export interface PublicCheckoutSettings {
  cod_enabled: boolean;
  min_order_value: number;
  maintenance_mode: boolean;
}

interface CheckoutClientProps {
  settings: PublicCheckoutSettings;
}

const ADDRESS_TYPES = [
  { id: "Home", label: "Home", icon: Home },
  { id: "Office", label: "Office", icon: Building2 },
  { id: "Work", label: "Work / Factory", icon: Briefcase },
  { id: "Other", label: "Other", icon: MapPin },
] as const;

export function CheckoutClient({ settings }: CheckoutClientProps) {
  const { items, getSubtotal, getDiscountAmount, getTotal, clearCart, syncLivePrices, appliedCoupon } = useCartStore();
  const { addToast } = useToastStore();
  const { user } = useUserStore();

  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [isMobileSummaryOpen, setIsMobileSummaryOpen] = useState(false);

  // Saved Addresses State
  const [savedAddresses, setSavedAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new">("new");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isAddressDropdownOpen, setIsAddressDropdownOpen] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState<string | null>(null);
  const addressDropdownRef = useRef<HTMLDivElement>(null);

  // Close address dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (addressDropdownRef.current && !addressDropdownRef.current.contains(event.target as Node)) {
        setIsAddressDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
          const res = await getUserAddressesAction();
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

        // Limit to maximum 4 saved addresses
        combined = combined.slice(0, 4);

        setSavedAddresses(combined);
        if (combined.length >= 4) {
          setFormData((prev) => ({ ...prev, saveAddress: false }));
        }

        // If saved addresses exist, select the default or first one and autofill!
        const lastSavedPhone = localStorage.getItem("om_last_used_phone") || "";

        if (combined.length > 0) {
          const defaultAddr = combined.find((a) => a.isDefault) || combined[0];
          setSelectedAddressId(defaultAddr.id);
          setFormData((prev) => ({
            ...prev,
            fullName: defaultAddr.fullName || prev.fullName,
            companyName: defaultAddr.companyName || prev.companyName,
            email: defaultAddr.email || prev.email || user?.email || "",
            phone: defaultAddr.phone || lastSavedPhone || prev.phone,
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
                phone: parsed.phone || lastSavedPhone || prev.phone,
                street: parsed.street || "",
                city: parsed.city || "",
                state: parsed.state || "Gujarat",
                zip: parsed.zip || "",
                country: parsed.country || "India",
                addressType: parsed.addressType || "Home",
              }));
            } else if (lastSavedPhone) {
              setFormData((prev) => ({ ...prev, phone: prev.phone || lastSavedPhone }));
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

  // Track and remember last used valid phone number in localStorage
  useEffect(() => {
    if (formData.phone && formData.phone.replace(/\D/g, "").length >= 10) {
      try {
        localStorage.setItem("om_last_used_phone", formData.phone);
      } catch (e) {}
    }
  }, [formData.phone]);

  // Handle selecting a saved address
  const handleSelectSavedAddress = (addr: AddressItem) => {
    setSelectedAddressId(addr.id);
    setIsAddressDropdownOpen(false);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName,
      companyName: addr.companyName || "",
      email: addr.email || prev.email || user?.email || "",
      phone: addr.phone || prev.phone || (typeof window !== "undefined" ? localStorage.getItem("om_last_used_phone") || "" : ""),
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
    setIsAddressDropdownOpen(false);
    setFormData((prev) => ({
      ...prev,
      fullName: user?.name || "",
      companyName: user?.companyName || "",
      email: user?.email || "",
      phone: prev.phone || (typeof window !== "undefined" ? localStorage.getItem("om_last_used_phone") || "" : ""),
      street: "",
      city: "",
      state: "Gujarat",
      zip: "",
      country: "India",
      addressType: "Home",
      saveAddress: savedAddresses.length < 4,
    }));
  };

  // Handle deleting a saved address
  const handleDeleteAddress = async (e: React.MouseEvent, addrId: string) => {
    e.stopPropagation();
    if (isDeletingAddress) return;
    if (!confirm("Are you sure you want to delete this saved address?")) return;

    setIsDeletingAddress(addrId);
    try {
      // 1. Delete from database
      await deleteAddressAction(addrId);

      // 2. Delete from localStorage
      try {
        const localStored = localStorage.getItem("om_saved_addresses");
        if (localStored) {
          const parsed = JSON.parse(localStored);
          if (Array.isArray(parsed)) {
            const updated = parsed.filter((a: any) => a.id !== addrId);
            localStorage.setItem("om_saved_addresses", JSON.stringify(updated));
          }
        }
      } catch (err) {
        console.error("Failed to update localStorage after address deletion:", err);
      }

      const updatedAddresses = savedAddresses.filter((a) => a.id !== addrId);
      setSavedAddresses(updatedAddresses);
      addToast("success", "Address Deleted", "Address removed from your saved list.");

      // If active address was deleted, switch to next available or 'new'
      if (selectedAddressId === addrId) {
        if (updatedAddresses.length > 0) {
          handleSelectSavedAddress(updatedAddresses[0]);
        } else {
          handleSelectNewAddress();
        }
      }
    } catch (err) {
      console.error("Failed to delete address:", err);
      addToast("error", "Deletion Failed", "Could not delete address. Please try again.");
    } finally {
      setIsDeletingAddress(null);
    }
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

    const nameCheck = validatePersonName(formData.fullName);
    if (!nameCheck.isValid) {
      addToast("error", "Invalid Full Name", nameCheck.error || "Please enter a valid full name without special characters or numbers.");
      return;
    }

    const emailCheck = validateEmailAddress(formData.email);
    if (!emailCheck.isValid) {
      addToast("error", "Invalid Corporate Email", emailCheck.error || "Please enter a valid corporate email address.");
      return;
    }

    const isIndia = !formData.country || formData.country.trim().toLowerCase() === "india";
    if (isIndia) {
      const phoneDigits = formData.phone.replace(/[^\d]/g, "");
      if (phoneDigits.length < 10) {
        addToast("warning", "Incomplete Phone Number", "Please enter a valid 10-digit Indian mobile number.");
        return;
      }
      if (formData.zip.replace(/\D/g, "").length !== 6) {
        addToast("error", "Incomplete PIN Code", "Indian PIN code must be exactly 6 digits.");
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
      const parts = [baseName];
      if (varName) parts.push(`(${varName})`);
      if (item.buyerNote) parts.push(`[Model/Note: ${item.buyerNote}]`);
      const cleanName = parts.join(" ");

      return {
        productId: item.product.id,
        name: cleanName,
        sku: item.variant?.sku || item.product.sku || `SKU-${item.product.id}`,
        price: item.variant?.price ?? item.product.basePrice ?? 0,
        quantity: item.quantity,
        variantId: cleanVarId,
        buyerNote: item.buyerNote?.trim() || undefined,
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
          items: sanitizedItems,
          couponCode: appliedCoupon || undefined,
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
                couponCode: appliedCoupon || undefined,
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
        couponCode: appliedCoupon || undefined,
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
      <div className="bg-[#faf9f5] min-h-screen py-8 sm:py-16 border-b border-slate-200">
        <div className="max-w-xl mx-auto px-4 text-center space-y-5 sm:space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Order Placed Successfully
          </span>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Thank You for Your Order!
          </h1>

          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-3 text-left text-xs sm:text-sm">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">Order Reference:</span>
              <span className="font-bold text-slate-900 font-mono text-xs sm:text-sm">{orderDetails.orderId}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">Customer:</span>
              <span className="font-semibold text-slate-900">{formData.companyName || formData.fullName}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">Payment Terms:</span>
              <span className="font-semibold text-sky-700">{orderDetails.paymentMethodLabel}</span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">Logistics Carrier:</span>
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-sky-600" />
                {courierPartner}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">Estimated Delivery:</span>
              <div className="text-right">
                <span className="font-bold text-emerald-700 block">{deliveryRangeStr}</span>
                <span className="text-[11px] text-slate-400">({deliveryDaysStr})</span>
              </div>
            </div>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-500">Total Amount:</span>
              <span className="font-bold text-slate-900 font-mono text-sm sm:text-base">{formatCurrency(orderDetails.total)}</span>
            </div>
            <div className="flex justify-between items-center pt-0.5">
              <span className="text-slate-500">Status:</span>
              <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-xs">
                New Order • Awaiting Dispatch
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-2.5 sm:gap-3 pt-2">
            <Link
              href={`/orders`}
              className="px-6 py-3 rounded-xl bg-slate-900 text-white font-semibold text-sm shadow-sm hover:bg-slate-800 transition-all text-center"
            >
              Track Order Status
            </Link>
            <Link
              href="/products"
              className="px-6 py-3 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm hover:bg-slate-200 transition-all text-center"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#faf9f5] min-h-screen py-5 sm:py-10 border-b border-slate-200">
      <div className="max-w-6xl mx-auto px-3.5 sm:px-6 space-y-4 sm:space-y-6">
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
        <nav className="flex items-center gap-1.5 text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-900 transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/cart" className="hover:text-slate-900 transition-colors">
            Cart
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold">Checkout</span>
        </nav>

        {/* Title & Trust Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Checkout
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-fit font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>256-Bit SSL Encrypted & Guaranteed</span>
          </div>
        </div>

        {/* Mobile Collapsible Order Summary Banner (Top of page on mobile) */}
        <div className="lg:hidden bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => setIsMobileSummaryOpen((prev) => !prev)}
            className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer active:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
              <ShoppingBag className="w-4 h-4 text-emerald-600" />
              <span>{isMobileSummaryOpen ? "Hide order summary" : "Show order summary"}</span>
              <span className="text-xs text-slate-500 font-normal">
                ({mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0} items)
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isMobileSummaryOpen ? "rotate-180" : ""}`} />
            </div>
            <div className="text-right">
              <span className="text-sm sm:text-base font-bold text-slate-900 font-mono" suppressHydrationWarning>
                {mounted ? formatCurrency(total) : formatCurrency(0)}
              </span>
            </div>
          </button>

          {isMobileSummaryOpen && (
            <div className="px-4 pb-4 pt-1 border-t border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150 text-xs">
              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 divide-y divide-slate-50">
                {mounted && items.length > 0 ? (
                  items.map((item) => {
                    const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                    const itemPrice = item.variant ? item.variant.price : item.product.basePrice;
                    return (
                      <div key={itemId} className="flex items-center justify-between gap-3 pt-2 first:pt-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 truncate">
                            {(item.product.name || "Product").replace(/\s*-\s*undefined/gi, "")}
                            {item.variant?.name && item.variant.name !== "undefined" && ` - ${item.variant.name}`}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span>Qty: {item.quantity}</span>
                            {item.buyerNote && (
                              <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 truncate max-w-[140px]">
                                Note: {item.buyerNote}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="font-semibold text-slate-900 font-mono shrink-0" suppressHydrationWarning>
                          {formatCurrency(itemPrice * item.quantity)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-slate-400 text-center py-2">Cart is empty</p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900" suppressHydrationWarning>
                    {mounted ? formatCurrency(subtotal) : formatCurrency(0)}
                  </span>
                </div>
                {mounted && discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount</span>
                    <span className="font-mono" suppressHydrationWarning>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total</span>
                  <span className="font-mono text-sky-700 font-bold" suppressHydrationWarning>
                    {mounted ? formatCurrency(total) : formatCurrency(0)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* Left Checkout Form */}
          <div className="lg:col-span-8 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-slate-200 shadow-sm sm:shadow-lg space-y-5 sm:space-y-6">
            {/* Step Indicators (Clean, responsive sans-serif) */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 pb-4 sm:pb-5 border-b border-slate-100 text-xs text-center font-medium">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  step === 1 ? "bg-slate-900 text-white font-bold shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${step === 1 ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>1</span>
                <span className="hidden sm:inline">Shipping Address</span>
                <span className="sm:hidden">Address</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(2)}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  step === 2 ? "bg-slate-900 text-white font-bold shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${step === 2 ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>2</span>
                <span className="hidden sm:inline">Payment Method</span>
                <span className="sm:hidden">Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  step === 3 ? "bg-slate-900 text-white font-bold shadow-xs" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${step === 3 ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>3</span>
                <span className="hidden sm:inline">Review Order</span>
                <span className="sm:hidden">Review</span>
              </button>
            </div>

            <form onSubmit={handleSubmitOrder} className="space-y-5 sm:space-y-6">
              {step === 1 && (
                <div className="space-y-4 sm:space-y-5">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-600" /> Shipping & Delivery Address
                    </h2>
                    <span className="text-[11px] text-slate-400 font-medium">
                      <span className="text-rose-500 font-bold">*</span> Required Fields
                    </span>
                  </div>

                  {/* 1. Saved Addresses Dropdown Selector (Unified for Mobile & Desktop) */}
                  {savedAddresses.length > 0 && (
                    <div className="space-y-2 relative" ref={addressDropdownRef}>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-amber-500" />
                          <span>Delivery Address</span>
                          <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-amber-100/80 text-amber-800 border border-amber-200">
                            {savedAddresses.length}/4 saved
                          </span>
                        </label>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          Select from saved or enter new
                        </span>
                      </div>

                      {/* Dropdown Toggle Trigger Button */}
                      <div
                        onClick={() => setIsAddressDropdownOpen((prev) => !prev)}
                        className={`p-3 sm:p-4 rounded-xl border transition-all cursor-pointer select-none bg-white relative flex items-center justify-between gap-3 shadow-2xs hover:border-slate-300 ${
                          isAddressDropdownOpen
                            ? "border-amber-500 ring-2 ring-amber-500/20"
                            : selectedAddressId === "new"
                            ? "border-sky-300 bg-sky-50/20"
                            : "border-slate-200"
                        }`}
                      >
                        {selectedAddressId === "new" ? (
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0 mt-0.5">
                              <Plus className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs sm:text-sm text-slate-900">
                                  + Enter Different Address
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 font-semibold">
                                  Custom
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                Filling custom shipping address in form fields below
                              </p>
                            </div>
                          </div>
                        ) : (
                          (() => {
                            const activeAddr = savedAddresses.find((a) => a.id === selectedAddressId) || savedAddresses[0];
                            const typeConfig = ADDRESS_TYPES.find((t) => t.id === activeAddr.type) || ADDRESS_TYPES[0];
                            const Icon = typeConfig.icon;

                            return (
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                      {activeAddr.fullName}
                                    </span>
                                    {activeAddr.companyName && (
                                      <span className="text-[11px] text-sky-600 font-medium truncate max-w-[150px]">
                                        ({activeAddr.companyName})
                                      </span>
                                    )}
                                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center gap-0.5">
                                      {typeConfig.label}
                                    </span>
                                    {activeAddr.isDefault && (
                                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-0.5">
                                        <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-slate-600 truncate mt-0.5">
                                    {activeAddr.street}, {activeAddr.city}, {activeAddr.state} - {activeAddr.zip}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    📱 {formatDisplayPhone(activeAddr.phone)}
                                  </p>
                                </div>
                              </div>
                            );
                          })()
                        )}

                        {/* Dropdown Arrow & Label */}
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                            Change
                          </span>
                          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 transition-transform">
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isAddressDropdownOpen ? "rotate-180 text-amber-600" : ""}`} />
                          </div>
                        </div>
                      </div>

                      {/* Dropdown Floating Menu */}
                      {isAddressDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full mt-2 z-30 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-150">
                          <div className="p-3 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-600">
                              Select Delivery Address ({savedAddresses.length}/4)
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Max 4 allowed
                            </span>
                          </div>

                          {/* List of Saved Addresses */}
                          <div className="max-h-72 overflow-y-auto p-2 space-y-1.5">
                            {savedAddresses.map((addr) => {
                              const typeConfig = ADDRESS_TYPES.find((t) => t.id === addr.type) || ADDRESS_TYPES[0];
                              const Icon = typeConfig.icon;
                              const isSelected = selectedAddressId === addr.id;

                              return (
                                <div
                                  key={addr.id}
                                  onClick={() => handleSelectSavedAddress(addr)}
                                  className={`group flex items-start justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                    isSelected
                                      ? "bg-amber-50/70 border-amber-400 ring-1 ring-amber-400/30"
                                      : "bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200"
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5 min-w-0 pr-2">
                                    <div className="mt-1 shrink-0">
                                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                        isSelected
                                          ? "border-amber-600 bg-amber-600"
                                          : "border-slate-300 group-hover:border-slate-400"
                                      }`}>
                                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                      </div>
                                    </div>
                                    <div className="space-y-0.5 min-w-0">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="text-xs font-bold text-slate-900">
                                          {addr.fullName}
                                        </span>
                                        {addr.companyName && (
                                          <span className="text-[11px] text-sky-600 font-medium">
                                            ({addr.companyName})
                                          </span>
                                        )}
                                        <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600 flex items-center gap-0.5">
                                          <Icon className="w-2.5 h-2.5" />
                                          {typeConfig.label}
                                        </span>
                                        {addr.isDefault && (
                                          <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 flex items-center gap-0.5">
                                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Default
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-[11px] text-slate-600 line-clamp-1">
                                        {addr.street}, {addr.city}, {addr.state} - {addr.zip}
                                      </p>
                                      <p className="text-[11px] text-slate-400">
                                        📱 {formatDisplayPhone(addr.phone)}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Delete button */}
                                  <button
                                    type="button"
                                    title="Delete address"
                                    disabled={isDeletingAddress === addr.id}
                                    onClick={(e) => handleDeleteAddress(e, addr.id)}
                                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer disabled:opacity-50"
                                  >
                                    {isDeletingAddress === addr.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* Bottom option inside Dropdown: Enter Different Address */}
                          <div className="p-2 bg-slate-50/50">
                            <button
                              type="button"
                              onClick={handleSelectNewAddress}
                              className={`w-full p-2.5 rounded-xl border-2 border-dashed flex items-center justify-between text-left transition-all cursor-pointer ${
                                selectedAddressId === "new"
                                  ? "border-sky-500 bg-sky-50/60 text-sky-800"
                                  : "border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
                                  <Plus className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="font-bold text-xs block">
                                    + Enter Different Address
                                  </span>
                                  <span className="text-[10px] text-slate-400 block">
                                    {savedAddresses.length >= 4
                                      ? "Max 4 saved reached (One-time delivery without saving)"
                                      : "Fill custom address below and optionally save it"}
                                  </span>
                                </div>
                              </div>
                              {selectedAddressId === "new" && (
                                <span className="text-[10px] font-bold text-sky-600 bg-sky-100 px-2 py-0.5 rounded-full">
                                  Active
                                </span>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Contact Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700 flex items-center gap-1">
                          Full Name <span className="text-rose-500 font-bold">*</span>
                        </label>
                        <span className="text-[11px] text-slate-400">Letters only</span>
                      </div>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Rahul Sharma"
                        className={`w-full p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-all ${
                          isFieldMissing(formData.fullName) || (formData.fullName.trim().length > 0 && !validatePersonName(formData.fullName).isValid)
                            ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                            : "border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                        }`}
                        required
                      />
                      {isFieldMissing(formData.fullName) && (
                        <span className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Full Name is required
                        </span>
                      )}
                      {formData.fullName.trim().length > 0 && !validatePersonName(formData.fullName).isValid && (
                        <span className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {validatePersonName(formData.fullName).error}
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-semibold text-slate-700">Company / Organization</label>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md font-medium">Optional</span>
                      </div>
                      <input
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g. Om Automation Pvt Ltd"
                        className="w-full p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        Email Address <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="e.g. rahul@company.com"
                        className={`w-full p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-all ${
                          isFieldMissing(formData.email) ||
                          (formData.email.trim().length > 0 && !validateEmailAddress(formData.email).isValid)
                            ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                            : "border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                        }`}
                        required
                      />
                      {isFieldMissing(formData.email) && (
                        <span className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Email Address is required
                        </span>
                      )}
                      {formData.email.trim().length > 0 && !validateEmailAddress(formData.email).isValid && (
                        <span className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 shrink-0" /> {validateEmailAddress(formData.email).error}
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 mb-1 flex items-center gap-1">
                        Mobile Phone Number <span className="text-rose-500 font-bold">*</span>
                      </label>
                      <PhoneInput
                        value={formData.phone}
                        onChange={(phone) => setFormData({ ...formData, phone })}
                      />
                      {isFieldMissing(formData.phone) && (
                        <span className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Phone Number is required
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 3. Street Address */}
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                      Street Address / Building / Area <span className="text-rose-500 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      placeholder="e.g. Plot 42, GIDC Electronics Estate, Sector 26"
                      className={`w-full p-2.5 sm:p-3 text-xs sm:text-sm rounded-xl border focus:outline-none transition-all ${
                        isFieldMissing(formData.street)
                          ? "border-rose-500 bg-rose-50/20 ring-2 ring-rose-500/20"
                          : "border-slate-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/10"
                      }`}
                      required
                    />
                    {isFieldMissing(formData.street) && (
                      <span className="text-[11px] text-rose-500 font-medium mt-1 flex items-center gap-1">
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
                        <span className="text-xs text-sky-600 flex items-center gap-1.5 font-medium">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking live courier serviceability...
                        </span>
                      )}
                      {pincodeStatus?.checked && (
                        <div
                          className={`mt-1 p-3 rounded-xl border text-xs flex items-center gap-2 ${
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
                            <span className="font-semibold">
                              {pincodeStatus.serviceable ? "Verified Delivery: " : "Notice: "}
                            </span>
                            <span>{pincodeStatus.message}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. Address Saving Slider Switch & Type Picker */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs transition-all">
                    {/* Slider Button Row */}
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className="cursor-pointer select-none flex-1"
                        onClick={() => setFormData((prev) => ({ ...prev, saveAddress: !prev.saveAddress }))}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800 text-xs">
                            Save address for future orders
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              formData.saveAddress
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-600"
                            }`}
                          >
                            {formData.saveAddress ? "ON" : "OFF"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {formData.saveAddress
                            ? "Address will be saved for fast 1-click checkout next time"
                            : "One-time delivery (address will not be saved)"}
                        </p>
                      </div>

                      {/* Slider / Switch Toggle Button */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={formData.saveAddress}
                        onClick={() => setFormData((prev) => ({ ...prev, saveAddress: !prev.saveAddress }))}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 ${
                          formData.saveAddress ? "bg-slate-900" : "bg-slate-300"
                        }`}
                      >
                        <span className="sr-only">Toggle save address</span>
                        <span
                          aria-hidden="true"
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            formData.saveAddress ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {/* Shown ONLY when Slider is ON */}
                    {formData.saveAddress && (
                      <div className="pt-3 border-t border-slate-200/80 space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1.5">
                            Save address as:
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
                                  className={`p-2 sm:p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                                    isSelected
                                      ? "bg-slate-900 text-white border-slate-900 shadow-2xs"
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

                        {savedAddresses.length >= 4 ? (
                          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">Maximum 4 saved addresses reached.</span>
                              <p className="text-[11px] text-amber-800 mt-0.5">
                                To save this new address permanently, please delete an existing address from the dropdown selector above.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-500">
                            Address will be stored ({savedAddresses.length}/4 used)
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowValidationErrors(true);
                      if (!formData.fullName || !formData.email || !formData.phone || !formData.street || !formData.city || !formData.state || !formData.zip) {
                        addToast("warning", "Required Fields Missing", "Please fill in all highlighted required shipping address fields.");
                        return;
                      }

                      const nameCheck = validatePersonName(formData.fullName);
                      if (!nameCheck.isValid) {
                        addToast("error", "Invalid Full Name", nameCheck.error || "Please enter a valid full name without special characters or numbers.");
                        return;
                      }

                      const emailCheck = validateEmailAddress(formData.email);
                      if (!emailCheck.isValid) {
                        addToast("error", "Invalid Corporate Email", emailCheck.error || "Please enter a valid corporate email address.");
                        return;
                      }

                      const isIndia = !formData.country || formData.country.trim().toLowerCase() === "india";
                      if (isIndia) {
                        const phoneDigits = formData.phone.replace(/[^\d]/g, "");
                        if (phoneDigits.length < 10) {
                          addToast("warning", "Incomplete Phone Number", "Please enter a valid 10-digit Indian mobile number.");
                          return;
                        }
                        if (formData.zip.replace(/\D/g, "").length !== 6) {
                          addToast("error", "Incomplete PIN Code", "Indian PIN code must be exactly 6 digits.");
                          return;
                        }
                        const pinVal = validatePincodeWithState(formData.zip, formData.state);
                        if (!pinVal.isValid) {
                          addToast("error", "PIN Code Mismatch", pinVal.message || "Please verify your PIN code and selected State.");
                          return;
                        }
                      }

                      setShowValidationErrors(false);

                      // Persist phone and address immediately so mobile number is never lost
                      try {
                        localStorage.setItem("om_last_used_phone", formData.phone);

                        if (formData.saveAddress) {
                          const localAddrs: AddressItem[] = JSON.parse(localStorage.getItem("om_saved_addresses") || "[]");
                          const existingIndex = localAddrs.findIndex(
                            (a) => a.street?.trim().toLowerCase() === formData.street?.trim().toLowerCase() && a.zip?.trim() === formData.zip?.trim()
                          );

                          const currentAddrItem: AddressItem = {
                            id: selectedAddressId !== "new" ? selectedAddressId : `local_addr_${Date.now()}`,
                            userId: user?.id || `user_${formData.phone.replace(/\D/g, "").slice(-10)}`,
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
                            isDefault: localAddrs.length === 0,
                          };

                          if (existingIndex >= 0) {
                            localAddrs[existingIndex] = { ...localAddrs[existingIndex], ...currentAddrItem };
                          } else if (localAddrs.length < 4) {
                            localAddrs.unshift(currentAddrItem);
                          }
                          localStorage.setItem("om_saved_addresses", JSON.stringify(localAddrs.slice(0, 4)));

                          setSavedAddresses((prev) => {
                            const pIndex = prev.findIndex(
                              (a) => a.street?.trim().toLowerCase() === formData.street?.trim().toLowerCase() && a.zip?.trim() === formData.zip?.trim()
                            );
                            if (pIndex >= 0) {
                              const updated = [...prev];
                              updated[pIndex] = { ...updated[pIndex], ...currentAddrItem };
                              return updated;
                            } else if (prev.length < 4) {
                              return [currentAddrItem, ...prev];
                            }
                            return prev;
                          });
                        }
                      } catch (err) {
                        console.error("Failed to auto-save address locally:", err);
                      }

                      setStep(2);
                    }}
                    className="w-full py-3.5 rounded-xl bg-slate-900 text-white font-semibold text-sm sm:text-base mt-4 hover:bg-slate-800 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                  >
                    Continue to Payment Method →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-sky-600" /> Select Payment Method
                    </h2>
                    <span className="text-[11px] text-slate-400">
                      Choose COD or Online Payment
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* 1. COD Option */}
                    <div
                      onClick={() => {
                        if (settings.cod_enabled) {
                          setFormData({ ...formData, paymentMethod: "cod" });
                        }
                      }}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                        !settings.cod_enabled
                          ? "opacity-45 bg-slate-100 border-slate-200 cursor-not-allowed"
                          : formData.paymentMethod === "cod"
                          ? "border-emerald-600 bg-emerald-50/60 font-bold ring-2 ring-emerald-500/20 shadow-xs cursor-pointer"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm sm:text-base text-slate-900 font-bold flex items-center gap-2">
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
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        {settings.cod_enabled
                          ? "Pay cash or cheque upon delivery at your doorstep."
                          : "Cash on Delivery is currently disabled by store administrator."}
                      </p>
                    </div>

                    {/* 2. Pre-paid Option */}
                    <div
                      onClick={() => setFormData({ ...formData, paymentMethod: "prepaid" })}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                        formData.paymentMethod === "prepaid"
                          ? "border-sky-600 bg-sky-50/60 font-bold ring-2 ring-sky-500/20 shadow-xs"
                          : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm sm:text-base text-slate-900 font-bold flex items-center gap-2">
                          <Zap className="w-5 h-5 text-sky-600 fill-sky-500/20 shrink-0" />
                          <span>Online Payment (Prepaid)</span>
                        </span>
                        {formData.paymentMethod === "prepaid" && (
                          <span className="w-3 h-3 rounded-full bg-sky-500 ring-4 ring-sky-200" />
                        )}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">
                        Direct online payment via Cards, UPI, NetBanking & Corporate transfer.
                      </p>
                    </div>
                  </div>

                  {/* Selected Payment Confirmation Notice */}
                  {formData.paymentMethod === "cod" && settings.cod_enabled && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>Cash on Delivery selected. Pay cash or cheque when shipment arrives.</span>
                    </div>
                  )}

                  {formData.paymentMethod === "prepaid" && (
                    <div className="p-3.5 sm:p-4 rounded-xl bg-sky-50/80 border border-sky-200 text-sky-900 text-xs flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-sky-600" />
                      <span>Online payment selected. Instant order confirmation for priority dispatch.</span>
                    </div>
                  )}

                  <div className="flex gap-2.5 sm:gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-2/3 py-3 rounded-xl bg-slate-900 text-white font-semibold text-xs sm:text-sm hover:bg-slate-800 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                    >
                      Review Order →
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 text-xs">
                  <h2 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Review & Place Order
                  </h2>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-slate-900 text-xs sm:text-sm">{formData.companyName || formData.fullName}</span>
                      <span className="text-emerald-700 font-semibold text-xs">
                        {formData.paymentMethod === "cod" ? "Cash on Delivery" : "Online Payment (Prepaid)"}
                      </span>
                    </div>
                    <div className="text-slate-600 leading-relaxed">{formData.street}, {formData.city}, {formData.state} - {formData.zip} ({formData.country || "India"})</div>
                    <div className="text-slate-500 flex items-center gap-2 flex-wrap">
                      <span>Contact: {formData.fullName} ({formData.email})</span>
                      <span className="text-sky-700 font-medium">• {formatDisplayPhone(formData.phone)}</span>
                    </div>
                    <div className="text-[11px] text-amber-800 font-medium pt-0.5">
                      Delivery Type: {formData.addressType} Delivery
                    </div>
                  </div>

                  {/* Logistics & Delivery Window Summary */}
                  <div className="p-3.5 sm:p-4 rounded-xl bg-sky-50/60 border border-sky-200/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-slate-900 flex items-center gap-1.5 text-xs sm:text-sm">
                        <Truck className="w-4 h-4 text-sky-600" /> Logistics Partner & Delivery Window
                      </div>
                      <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-semibold">
                        Buffer Included
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Shipping Partner:</span>
                        <span className="font-semibold text-slate-900">{pincodeStatus?.courierName || "Express Regional Logistics"}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[11px]">Estimated Delivery:</span>
                        <span className="font-bold text-emerald-700 block">
                          {pincodeStatus?.deliveryRange?.formattedDateRange || "3 - 5 Business Days"}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ({pincodeStatus?.deliveryRange?.formattedDaysRange || "3 - 5 Business Days"})
                        </span>
                      </div>
                    </div>
                  </div>

                  {isBelowMinOrder && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>Minimum order value is {formatCurrency(settings.min_order_value)}. Please add more items to place order.</span>
                    </div>
                  )}

                  <div className="flex gap-2.5 sm:gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold text-xs sm:text-sm hover:bg-slate-200 transition-colors cursor-pointer"
                      disabled={isSubmitting}
                    >
                      ← Edit Payment
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || isBelowMinOrder || settings.maintenance_mode}
                      className={`w-2/3 py-3 rounded-xl font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-[0.99] ${
                        formData.paymentMethod === "prepaid"
                          ? "bg-sky-600 hover:bg-sky-700 text-white"
                          : "bg-[#00a651] hover:bg-[#008f45] text-white"
                      }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>
                            {formData.paymentMethod === "prepaid"
                              ? "Opening Gateway..."
                              : "Placing Order..."}
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

          {/* Right Summary (Desktop Sidebar) */}
          <div className="hidden lg:block lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm sm:shadow-lg space-y-4 sticky top-24">
            <h2 className="font-bold text-sm sm:text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full font-semibold" suppressHydrationWarning>
                {mounted ? items.reduce((s, i) => s + i.quantity, 0) : 0} items
              </span>
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1 divide-y divide-slate-50">
              {mounted && items.length > 0 ? (
                items.map((item) => {
                  const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                  const itemPrice = item.variant ? item.variant.price : item.product.basePrice;
                  return (
                    <div key={itemId} className="flex items-center justify-between text-xs pt-2.5 first:pt-0">
                      <div className="min-w-0 pr-2">
                        <div className="font-semibold text-slate-900 truncate">
                          {(item.product.name || "Product").replace(/\s*-\s*undefined/gi, "")}
                          {item.variant?.name && item.variant.name !== "undefined" && ` - ${item.variant.name}`}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span>Qty: {item.quantity}</span>
                          {item.buyerNote && (
                            <span className="text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 truncate max-w-[140px]">
                              Note: {item.buyerNote}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="font-mono font-semibold text-slate-900 shrink-0" suppressHydrationWarning>
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
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-mono text-slate-900" suppressHydrationWarning>
                  {mounted ? formatCurrency(subtotal) : formatCurrency(0)}
                </span>
              </div>
              {mounted && discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount</span>
                  <span className="font-mono" suppressHydrationWarning>-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-slate-900 text-base pt-2.5 border-t border-slate-200">
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
