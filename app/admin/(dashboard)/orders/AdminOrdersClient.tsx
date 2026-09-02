"use client";

import { useState, useMemo, useEffect } from "react";
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
  Phone,
  Zap,
  Printer,
  FileCheck,
  Navigation,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ShieldCheck,
  Star,
  Check
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { updateOrderStatusAction, updateOrderPaymentMethodAction } from "@/app/actions/order";
import { 
  adminGetShiprocketRatesForOrderAction,
  adminGetShiprocketPickupLocationsAction,
  adminCreateShiprocketShipmentAction,
  adminAssignAWBAction,
  adminRequestPickupAction,
  adminGenerateLabelAction,
  adminGenerateInvoiceAction,
  adminGenerateManifestAction,
  getLiveOrderTrackingAction,
} from "@/app/actions/shiprocket";
import { CourierServiceabilityResponse, TrackingResult, ShiprocketPickupLocation } from "@/lib/shiprocket";
import Link from "next/link";

interface OrderItem {
  id: string;
  productId?: string;
  variantId?: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  attributes?: { name: string; value: string }[];
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
  originalPaymentMethod?: string;
  paymentReference: string;
  paymentStatus?: string;
  carrier: string;
  trackingNumber: string;
  shiprocketOrderId?: string;
  shiprocketShipmentId?: string;
  awbCode?: string;
  courierName?: string;
  labelUrl?: string;
  invoiceUrl?: string;
  manifestUrl?: string;
  pickupTokenNumber?: string;
  pickupScheduledDate?: string | null;
  etd?: string;
  shipmentCurrentStatus?: string;
  trackingData?: any;
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

  // Shiprocket Dispatch Modal State
  const [shippingOrder, setShippingOrder] = useState<OrderRow | null>(null);
  const [loadingRates, setLoadingRates] = useState(false);
  const [courierRates, setCourierRates] = useState<CourierServiceabilityResponse[]>([]);
  const [selectedCourierId, setSelectedCourierId] = useState<number | undefined>(undefined);
  const [courierTab, setCourierTab] = useState<"Recommended" | "Surface" | "Air" | "All">("All");
  const [customDeliveryPin, setCustomDeliveryPin] = useState("");
  const [resolvedCityState, setResolvedCityState] = useState<string | null>(null);
  const [shiprocketError, setShiprocketError] = useState<string | null>(null);
  const [parcelWeight, setParcelWeight] = useState(0.5);
  const [parcelLength, setParcelLength] = useState(10);
  const [parcelBreadth, setParcelBreadth] = useState(10);
  const [parcelHeight, setParcelHeight] = useState(10);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchingCourierId, setDispatchingCourierId] = useState<number | null>(null);
  const [isPushingToShiprocket, setIsPushingToShiprocket] = useState(false);

  // Registered Shiprocket Pickup Locations State
  const [pickupLocations, setPickupLocations] = useState<ShiprocketPickupLocation[]>([]);
  const [selectedPickupLocation, setSelectedPickupLocation] = useState<string>("warehouse");
  const [selectedPickupPincode, setSelectedPickupPincode] = useState<string>("360003");

  // Load registered Shiprocket pickup locations on mount
  useEffect(() => {
    const loadPickups = async () => {
      try {
        const res = await adminGetShiprocketPickupLocationsAction();
        if (res.success && res.pickupLocations && res.pickupLocations.length > 0) {
          setPickupLocations(res.pickupLocations);
          const primary = res.pickupLocations.find((l) => l.is_primary_location) || res.pickupLocations[0];
          setSelectedPickupLocation(primary.pickup_location);
          setSelectedPickupPincode(primary.pin_code);
        }
      } catch (err) {
        console.error("Failed to load Shiprocket pickup locations:", err);
      }
    };
    loadPickups();
  }, []);

  // Live Tracking Modal State
  const [trackingModalOrder, setTrackingModalOrder] = useState<OrderRow | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<TrackingResult | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  // Document action loading
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
      const matchAwb = ord.awbCode?.toLowerCase().includes(q);
      if (!matchId && !matchName && !matchCompany && !matchTrk && !matchAwb) return false;
    }
    return true;
  });

  const handleOpenEdit = (ord: OrderRow) => {
    setEditingOrder(ord);
    setNewStatus(ord.status);
    setNewCarrier(ord.carrier || "Shiprocket Freight");
    setNewTrackingNumber(ord.awbCode || ord.trackingNumber || `TRK-${ord.id}`);
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

  // Switch Order Payment Mode (COD <-> Prepaid) directly from Admin
  const [updatingPaymentOrderId, setUpdatingPaymentOrderId] = useState<string | null>(null);

  const handleTogglePaymentMethod = async (orderId: string, newMethod: "cod" | "prepaid") => {
    setUpdatingPaymentOrderId(orderId);
    try {
      const res = await updateOrderPaymentMethodAction(orderId, newMethod);
      if (res.success && res.paymentMethod) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  paymentMethod: res.paymentMethod,
                  paymentStatus: res.paymentStatus || (newMethod === "cod" ? "pending_cod" : "paid"),
                }
              : o
          )
        );
        if (inspectingOrder?.id === orderId) {
          setInspectingOrder((prev) =>
            prev
              ? {
                  ...prev,
                  paymentMethod: res.paymentMethod,
                  paymentStatus: res.paymentStatus || (newMethod === "cod" ? "pending_cod" : "paid"),
                }
              : null
          );
        }
      } else {
        alert(res.error || "Failed to update payment method.");
      }
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Failed to update payment method.");
    } finally {
      setUpdatingPaymentOrderId(null);
    }
  };

  // Open Shiprocket Dispatch Modal & fetch live courier quotes directly from Shiprocket API
  const handleOpenShiprocketModal = async (
    ord: OrderRow,
    overridePin?: string,
    overridePickupPin?: string,
    overridePickupLoc?: string
  ) => {
    setShippingOrder(ord);
    const pinToUse = overridePin ?? (ord.shippingZip?.trim() || "360003");
    const pickupPinToUse = overridePickupPin ?? selectedPickupPincode ?? "360003";
    const pickupLocToUse = overridePickupLoc ?? selectedPickupLocation ?? "warehouse";

    setCustomDeliveryPin(pinToUse);
    setResolvedCityState(`${ord.shippingCity || "Destination"}, ${ord.shippingState || "India"}`);
    setLoadingRates(true);
    setCourierRates([]);
    setSelectedCourierId(undefined);
    setShiprocketError(null);

    try {
      const res = await adminGetShiprocketRatesForOrderAction(ord.id, {
        weight: parcelWeight,
        length: parcelLength,
        breadth: parcelBreadth,
        height: parcelHeight,
        deliveryPincode: pinToUse,
        pickupPincode: pickupPinToUse,
        pickupLocation: pickupLocToUse,
      });

      if (res.success && res.couriers && res.couriers.length > 0) {
        setCourierRates(res.couriers);
        if (res.deliveryCity && res.deliveryState) {
          setResolvedCityState(`${res.deliveryCity}, ${res.deliveryState}`);
        }
        if (res.recommendedId) {
          setSelectedCourierId(res.recommendedId);
          setCourierTab("Recommended");
        } else {
          setSelectedCourierId(res.couriers[0].courier_company_id);
          setCourierTab("All");
        }
        if (res.shiprocketError) {
          setShiprocketError(res.shiprocketError);
        }
      } else {
        if (res.deliveryCity && res.deliveryState) {
          setResolvedCityState(`${res.deliveryCity}, ${res.deliveryState}`);
        }
        setCourierRates([]);
        setSelectedCourierId(undefined);
        setCourierTab("All");
        setShiprocketError(
          res.shiprocketError ||
          res.error ||
          `Shiprocket API: Pincode "${pinToUse}" is not serviceable or invalid for domestic shipping.`
        );
      }
    } catch (e: any) {
      console.error("Failed to load Shiprocket rates:", e);
      setCourierRates([]);
      setShiprocketError(e.message || "Failed to contact Shiprocket API.");
    } finally {
      setLoadingRates(false);
    }
  };

  // Direct 1-Click Dispatch with Chosen Courier Partner from Shiprocket
  const handleDirectShipWithCourier = async (courierId: number, courierName: string) => {
    if (!shippingOrder) return;
    setDispatchingCourierId(courierId);
    setShiprocketError(null);
    try {
      const res = await adminCreateShiprocketShipmentAction(shippingOrder.id, {
        courierId,
        weight: parcelWeight,
        length: parcelLength,
        breadth: parcelBreadth,
        height: parcelHeight,
        deliveryPincode: customDeliveryPin || shippingOrder.shippingZip,
        pickupLocation: selectedPickupLocation,
        pickupPincode: selectedPickupPincode,
        autoAssignAwb: true,
      });

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === shippingOrder.id
              ? {
                  ...o,
                  status: "SHIPPED",
                  carrier: res.courierName || courierName || o.carrier,
                  trackingNumber: res.awbCode || o.trackingNumber,
                  awbCode: res.awbCode,
                  courierName: res.courierName || courierName,
                  shiprocketOrderId: res.shiprocketOrderId,
                  shiprocketShipmentId: res.shiprocketShipmentId,
                }
              : o
          )
        );

        if (inspectingOrder?.id === shippingOrder.id) {
          setInspectingOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "SHIPPED",
                  carrier: res.courierName || courierName || prev.carrier,
                  trackingNumber: res.awbCode || prev.trackingNumber,
                  awbCode: res.awbCode,
                  courierName: res.courierName || courierName,
                  shiprocketOrderId: res.shiprocketOrderId,
                  shiprocketShipmentId: res.shiprocketShipmentId,
                }
              : null
          );
        }

        alert(`✅ Shipment created successfully with ${res.courierName || courierName}!\nAWB Code: ${res.awbCode || 'Assigned'}`);
        setShippingOrder(null);
      } else {
        setShiprocketError(res.error || "Shiprocket dispatch failed.");
      }
    } catch (e: any) {
      console.error(e);
      setShiprocketError(e.message || "Failed to create shipment with Shiprocket");
    } finally {
      setDispatchingCourierId(null);
    }
  };

  // Push order directly to Shiprocket without assigning courier (so admin can assign courier inside Shiprocket dashboard)
  const handlePushToShiprocketOnly = async () => {
    if (!shippingOrder) return;
    setIsPushingToShiprocket(true);
    setShiprocketError(null);
    try {
      const res = await adminCreateShiprocketShipmentAction(shippingOrder.id, {
        autoAssignAwb: false,
        weight: parcelWeight,
        length: parcelLength,
        breadth: parcelBreadth,
        height: parcelHeight,
        deliveryPincode: customDeliveryPin || shippingOrder.shippingZip,
        pickupLocation: selectedPickupLocation,
        pickupPincode: selectedPickupPincode,
      });

      if (res.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === shippingOrder.id
              ? {
                  ...o,
                  shiprocketOrderId: res.shiprocketOrderId,
                  shiprocketShipmentId: res.shiprocketShipmentId,
                }
              : o
          )
        );
        alert(`✅ Order #${shippingOrder.id} successfully created in Shiprocket (Shiprocket Order ID: ${res.shiprocketOrderId})!\n\nYou can now assign courier, generate labels, and track it directly in your Shiprocket Web Dashboard.`);
        setShippingOrder(null);
      } else {
        setShiprocketError(res.error || "Failed to create order in Shiprocket.");
      }
    } catch (e: any) {
      console.error(e);
      setShiprocketError(e.message || "Failed to create order in Shiprocket.");
    } finally {
      setIsPushingToShiprocket(false);
    }
  };

  // Filter couriers strictly based on Shiprocket API response
  const filteredCouriers = useMemo(() => {
    if (courierTab === "Recommended") {
      const recs = courierRates.filter((c) => c.is_recommended);
      return recs;
    }
    if (courierTab === "Air") {
      return courierRates.filter((c) => c.mode === "Air" || c.courier_name.toLowerCase().includes("air"));
    }
    if (courierTab === "Surface") {
      return courierRates.filter((c) => c.mode === "Surface" || c.courier_name.toLowerCase().includes("surface"));
    }
    return courierRates;
  }, [courierRates, courierTab]);

  // Execute Shiprocket Dispatch (Create Order & Assign AWB)
  const handleExecuteShiprocket = async () => {
    if (!shippingOrder) return;

    setIsDispatching(true);
    try {
      const res = await adminCreateShiprocketShipmentAction(shippingOrder.id, {
        courierId: selectedCourierId,
        weight: parcelWeight,
        length: parcelLength,
        breadth: parcelBreadth,
        height: parcelHeight,
        autoAssignAwb: true,
      });

      if (res.success) {
        // Update local state
        setOrders((prev) =>
          prev.map((o) =>
            o.id === shippingOrder.id
              ? {
                  ...o,
                  status: "SHIPPED",
                  carrier: res.courierName || o.carrier,
                  trackingNumber: res.awbCode || o.trackingNumber,
                  awbCode: res.awbCode,
                  courierName: res.courierName,
                  shiprocketOrderId: res.shiprocketOrderId,
                  shiprocketShipmentId: res.shiprocketShipmentId,
                }
              : o
          )
        );

        if (inspectingOrder?.id === shippingOrder.id) {
          setInspectingOrder((prev) =>
            prev
              ? {
                  ...prev,
                  status: "SHIPPED",
                  carrier: res.courierName || prev.carrier,
                  trackingNumber: res.awbCode || prev.trackingNumber,
                  awbCode: res.awbCode,
                  courierName: res.courierName,
                  shiprocketOrderId: res.shiprocketOrderId,
                  shiprocketShipmentId: res.shiprocketShipmentId,
                }
              : null
          );
        }

        alert(`Shipment created with Shiprocket!\nAWB: ${res.awbCode || "Assigned"}\nCourier: ${res.courierName || "Carrier Assigned"}`);
        setShippingOrder(null);
      } else {
        alert(res.error || "Failed to create Shiprocket shipment.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to dispatch order with Shiprocket.");
    } finally {
      setIsDispatching(false);
    }
  };

  // Open Live Tracking Dialog
  const handleOpenTracking = async (ord: OrderRow) => {
    setTrackingModalOrder(ord);
    setLoadingTracking(true);
    setTrackingInfo(null);
    setTrackingError(null);

    try {
      const res = await getLiveOrderTrackingAction(ord.id);
      if (res.success && res.tracking) {
        setTrackingInfo(res.tracking);
      } else {
        setTrackingError(res.error || "Live tracking not yet initialized by courier.");
      }
    } catch (e: any) {
      setTrackingError(e.message || "Could not fetch tracking data.");
    } finally {
      setLoadingTracking(false);
    }
  };

  // Download / Generate Shipping Label
  const handleGenerateLabel = async (orderId: string) => {
    setActionLoading(`label_${orderId}`);
    try {
      const res = await adminGenerateLabelAction(orderId);
      if (res.success && res.labelUrl) {
        window.open(res.labelUrl, "_blank");
      } else {
        alert(res.error || "Failed to generate label.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to generate label.");
    } finally {
      setActionLoading(null);
    }
  };

  // Download / Generate Tax Invoice
  const handleGenerateInvoice = async (orderId: string) => {
    setActionLoading(`invoice_${orderId}`);
    try {
      const res = await adminGenerateInvoiceAction(orderId);
      if (res.success && res.invoiceUrl) {
        window.open(res.invoiceUrl, "_blank");
      } else {
        alert(res.error || "Failed to generate invoice.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to generate invoice.");
    } finally {
      setActionLoading(null);
    }
  };

  // Download / Generate Manifest
  const handleGenerateManifest = async (orderId: string) => {
    setActionLoading(`manifest_${orderId}`);
    try {
      const res = await adminGenerateManifestAction(orderId);
      if (res.success && res.manifestUrl) {
        window.open(res.manifestUrl, "_blank");
      } else {
        alert(res.error || "Failed to generate manifest.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to generate manifest.");
    } finally {
      setActionLoading(null);
    }
  };

  // Schedule Carrier Pickup
  const handleRequestPickup = async (orderId: string) => {
    setActionLoading(`pickup_${orderId}`);
    try {
      const res = await adminRequestPickupAction(orderId);
      if (res.success) {
        alert(`Pickup scheduled successfully!\nPickup Token: ${res.pickupToken || "Generated"}`);
      } else {
        alert(res.error || "Failed to request pickup.");
      }
    } catch (e: any) {
      alert(e.message || "Failed to schedule pickup.");
    } finally {
      setActionLoading(null);
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
            <span className="text-[11px] font-mono font-bold uppercase text-slate-500 dark:text-slate-400">Active Shipments</span>
            <div className="text-2xl font-mono font-extrabold text-indigo-600 dark:text-indigo-400">{inTransitCount}</div>
            <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-mono">Shiprocket AWB Tracked</div>
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
            placeholder="Search order ID, AWB, customer..."
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
                <th className="py-3 px-4">Customer & Dock</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Total Amount</th>
                <th className="py-3 px-4">Logistics & AWB</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-800 dark:text-slate-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400 font-mono">
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
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">{ord.shippingCity}, {ord.shippingZip}</div>
                      <div className="text-[11px] font-mono text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{ord.shippingPhone || "+91 9876543210"}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {(() => {
                        const isCurrentCod = ord.paymentMethod.toLowerCase().includes("cod");
                        const origMethodStr = (ord.originalPaymentMethod || ord.paymentMethod || "").toLowerCase();
                        const isOrigCod = origMethodStr.includes("cod") || ord.paymentReference?.startsWith("COD-");
                        const isModified = isCurrentCod !== isOrigCod;

                        return (
                          <div className="flex flex-col gap-1">
                            <div className="relative inline-flex items-center">
                              <select
                                value={isCurrentCod ? "cod" : "prepaid"}
                                disabled={updatingPaymentOrderId === ord.id}
                                onChange={(e) => handleTogglePaymentMethod(ord.id, e.target.value as "cod" | "prepaid")}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-mono text-[11px] font-bold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${
                                  isCurrentCod
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 focus:ring-emerald-500 hover:bg-emerald-100/60"
                                    : "bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-400 focus:ring-blue-500 hover:bg-blue-100/60"
                                } ${updatingPaymentOrderId === ord.id ? "opacity-50 cursor-wait" : ""}`}
                                title={`Original Customer Placement: ${isOrigCod ? "Cash on Delivery (COD)" : "Pre-paid (Online Payment)"}`}
                              >
                                <option value="cod" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono">
                                  💵 Cash on Delivery (COD) {isOrigCod ? "★ Original" : ""}
                                </option>
                                <option value="prepaid" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono">
                                  ⚡ Pre-paid (Online) {!isOrigCod ? "★ Original" : ""}
                                </option>
                              </select>
                              {updatingPaymentOrderId === ord.id && (
                                <div className="absolute right-2 pointer-events-none">
                                  <Loader2 className="w-3 h-3 animate-spin text-slate-500" />
                                </div>
                              )}
                            </div>

                            {/* Origin Indicator */}
                            <div className="text-[10px] font-mono pl-0.5">
                              {!isModified ? (
                                <span className="text-slate-400 dark:text-slate-500">
                                  Customer: {isOrigCod ? "COD" : "Pre-paid"}
                                </span>
                              ) : (
                                <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/80 inline-block">
                                  Modified (Orig: {isOrigCod ? "COD" : "Pre-paid"})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(ord.total)}
                    </td>

                    <td className="py-3 px-4">
                      {ord.awbCode ? (
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1 font-mono">
                            <Truck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                            <span>{ord.courierName || ord.carrier}</span>
                          </div>
                          <button
                            onClick={() => handleOpenTracking(ord)}
                            className="text-[10px] font-mono text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <span>AWB: {ord.awbCode}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleOpenShiprocketModal(ord)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-[10px] font-mono font-bold transition-colors cursor-pointer"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>Ship with Shiprocket</span>
                        </button>
                      )}
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
                          title="Inspect Order Details & Documents"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(ord)}
                          className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center gap-1 text-xs cursor-pointer font-medium"
                          title="Update Status / Freight"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
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

      {/* INSPECT ORDER MODAL (Full Line Items & Shiprocket Logistics Controls) */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden space-y-6 p-6 sm:p-8 relative text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
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

            {/* SHIPROCKET LOGISTICS HUB ACTION BAR */}
            <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="font-bold text-xs font-mono uppercase text-blue-900 dark:text-blue-200">
                    Shiprocket Automated Logistics
                  </span>
                </div>
                {inspectingOrder.awbCode && (
                  <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                    AWB: {inspectingOrder.awbCode}
                  </span>
                )}
              </div>

              {/* Action buttons depending on state */}
              <div className="flex flex-wrap gap-2">
                {!inspectingOrder.awbCode ? (
                  <button
                    onClick={() => {
                      const ord = inspectingOrder;
                      setInspectingOrder(null);
                      handleOpenShiprocketModal(ord);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer font-mono"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300" />
                    <span>Dispatch via Shiprocket (Auto AWB)</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleOpenTracking(inspectingOrder)}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      <span>Live Tracking</span>
                    </button>

                    <button
                      onClick={() => handleGenerateLabel(inspectingOrder.id)}
                      disabled={actionLoading === `label_${inspectingOrder.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `label_${inspectingOrder.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Printer className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>Print Label (PDF)</span>
                    </button>

                    <button
                      onClick={() => handleGenerateInvoice(inspectingOrder.id)}
                      disabled={actionLoading === `invoice_${inspectingOrder.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `invoice_${inspectingOrder.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      )}
                      <span>Tax Invoice (PDF)</span>
                    </button>

                    <button
                      onClick={() => handleGenerateManifest(inspectingOrder.id)}
                      disabled={actionLoading === `manifest_${inspectingOrder.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `manifest_${inspectingOrder.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                      )}
                      <span>Manifest (PDF)</span>
                    </button>

                    <button
                      onClick={() => handleRequestPickup(inspectingOrder.id)}
                      disabled={actionLoading === `pickup_${inspectingOrder.id}`}
                      className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:text-blue-600 text-xs font-mono font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {actionLoading === `pickup_${inspectingOrder.id}` ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Package className="w-3.5 h-3.5 text-sky-600" />
                      )}
                      <span>Schedule Pickup</span>
                    </button>
                  </>
                )}
              </div>
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
                <div className="text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200 dark:border-slate-800">
                  <span>Payment Mode:</span>
                  <select
                    value={inspectingOrder.paymentMethod.toLowerCase().includes("cod") ? "cod" : "prepaid"}
                    disabled={updatingPaymentOrderId === inspectingOrder.id}
                    onChange={(e) => handleTogglePaymentMethod(inspectingOrder.id, e.target.value as "cod" | "prepaid")}
                    className={`px-2 py-0.5 rounded border text-[11px] font-bold font-mono cursor-pointer focus:outline-none ${
                      inspectingOrder.paymentMethod.toLowerCase().includes("cod")
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800"
                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-800"
                    }`}
                  >
                    <option value="cod">💵 COD (Cash on Delivery)</option>
                    <option value="prepaid">⚡ Pre-paid (Online)</option>
                  </select>
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

            {/* Purchased Items Breakdown Table with Chosen Variants */}
            <div className="space-y-3">
              <h3 className="font-mono font-bold text-sm text-slate-900 dark:text-white">Purchased Line Items ({inspectingOrder.items?.length || inspectingOrder.itemCount})</h3>
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {inspectingOrder.items && inspectingOrder.items.length > 0 ? (
                  inspectingOrder.items.map((item: any) => {
                    // Extract options from attributes or from parentheses in item name
                    const rawName = item.name || "Industrial Component";
                    const match = rawName.match(/^(.*?)\s*\((.*?)\)$/);
                    const baseName = match ? match[1].trim() : rawName;
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
                      <div key={item.id} className="p-3.5 flex items-start justify-between gap-4 text-xs hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {baseName}
                          </div>

                          {/* Chosen Variants Badges */}
                          {combinedAttrs.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                              {combinedAttrs.map((attr: any, i: number) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold border border-blue-200 dark:border-blue-800/80 shadow-2xs"
                                >
                                  <span className="text-slate-500 dark:text-slate-400 font-normal">{attr.name}:</span>
                                  <span className="font-bold">{attr.value}</span>
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-block text-[10px] font-mono text-slate-400 italic">
                              Standard Base Configuration
                            </span>
                          )}

                          <div className="font-mono text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-2 pt-0.5">
                            <span>SKU: <strong className="text-slate-600 dark:text-slate-300">{item.sku}</strong></span>
                            <span>•</span>
                            <span>Qty: <strong className="text-slate-600 dark:text-slate-300">{item.quantity}</strong></span>
                            <span>•</span>
                            <span>Unit Price: {formatCurrency(item.price)}</span>
                          </div>
                        </div>

                        <div className="font-mono font-bold text-slate-900 dark:text-white text-sm text-right shrink-0 pt-0.5">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    );
                  })
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
                  <span>GST Tax (18% Included):</span>
                  <span>{formatCurrency(inspectingOrder.tax)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping Freight:</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    {inspectingOrder.shippingCost === 0 ? "FREE" : formatCurrency(inspectingOrder.shippingCost)}
                  </span>
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
                className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs shadow-xs transition-colors cursor-pointer"
              >
                Edit Status Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHIPROCKET SELECT COURIER PARTNER MODAL (Matching Official Shiprocket Logistics Hub) */}
      {shippingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row text-slate-900 dark:text-white max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* LEFT SIDEBAR: Order Details */}
            <div className="w-full md:w-80 bg-slate-50 dark:bg-slate-950 p-6 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6 shrink-0 overflow-y-auto">
              <div className="space-y-5">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-bold block mb-1">
                    Shipment Overview
                  </span>
                  <h2 className="text-xl font-mono font-extrabold text-slate-900 dark:text-white">
                    Order Details
                  </h2>
                </div>

                {/* Pickup From (Shiprocket Registered Locations) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-400 block font-mono">Pickup Location</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-bold">
                      Shiprocket
                    </span>
                  </div>

                  {pickupLocations.length > 0 ? (
                    <div className="space-y-1">
                      <select
                        value={selectedPickupLocation}
                        onChange={(e) => {
                          const locName = e.target.value;
                          setSelectedPickupLocation(locName);
                          const locObj = pickupLocations.find((l) => l.pickup_location === locName);
                          const newPin = locObj?.pin_code || "360003";
                          setSelectedPickupPincode(newPin);
                          if (shippingOrder) {
                            handleOpenShiprocketModal(shippingOrder, customDeliveryPin, newPin, locName);
                          }
                        }}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer shadow-xs"
                      >
                        {pickupLocations.map((loc) => (
                          <option key={loc.id} value={loc.pickup_location}>
                            {loc.pickup_location} ({loc.pin_code} - {loc.city}){loc.is_primary_location ? " ★ Primary" : ""}
                          </option>
                        ))}
                      </select>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 pl-0.5">
                        <MapPin className="w-3 h-3 text-blue-500 shrink-0" />
                        <span className="truncate">
                          PIN {selectedPickupPincode} • {pickupLocations.find((l) => l.pickup_location === selectedPickupLocation)?.city || "Rajkot"}, Gujarat
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>360003, Gujarat</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 font-normal">Primary Warehouse</span>
                    </div>
                  )}
                </div>

                {/* Deliver To */}
                <div className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-400 block font-mono">Deliver To</span>
                  <div className="text-xs font-bold text-slate-900 dark:text-white font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="truncate">
                      {resolvedCityState || `${shippingOrder.shippingCity || "Destination"}, ${shippingOrder.shippingState || "India"}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={customDeliveryPin}
                      onChange={(e) => setCustomDeliveryPin(e.target.value.replace(/[^\d]/g, "").slice(0, 6))}
                      placeholder="6-Digit PIN"
                      className="w-28 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleOpenShiprocketModal(shippingOrder, customDeliveryPin, selectedPickupPincode, selectedPickupLocation)}
                      disabled={loadingRates || customDeliveryPin.length !== 6}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-mono text-[11px] font-bold cursor-pointer transition-colors"
                    >
                      Check
                    </button>
                  </div>
                </div>

                {/* Order Value */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block font-mono">Order Value</span>
                  <div className="text-base font-extrabold text-slate-900 dark:text-white font-mono">
                    {formatCurrency(shippingOrder.total)}
                  </div>
                </div>

                {/* Payment Mode */}
                <div className="space-y-1">
                  <span className="text-[11px] font-medium text-slate-400 block font-mono">Payment Mode</span>
                  <div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase ${
                      shippingOrder.paymentMethod.toLowerCase().includes("cod")
                        ? "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50"
                        : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50"
                    }`}>
                      {shippingOrder.paymentMethod.toLowerCase().includes("cod") ? "COD" : "Prepaid"}
                    </span>
                  </div>
                </div>

                {/* Applicable Weight & Dimensions */}
                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-[11px] font-medium text-slate-400 block font-mono">Applicable Weight (in Kg)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={parcelWeight}
                      onChange={(e) => setParcelWeight(Number(e.target.value))}
                      className="w-20 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-1.5 text-xs font-mono font-bold"
                    />
                    <span className="text-xs font-mono text-slate-500">Kg</span>
                  </div>

                  <span className="text-[10px] text-slate-400 block font-mono pt-1">Dimensions (L × W × H cm)</span>
                  <div className="grid grid-cols-3 gap-1.5 text-xs font-mono">
                    <input
                      type="number"
                      value={parcelLength}
                      onChange={(e) => setParcelLength(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold"
                      placeholder="L"
                    />
                    <input
                      type="number"
                      value={parcelBreadth}
                      onChange={(e) => setParcelBreadth(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold"
                      placeholder="W"
                    />
                    <input
                      type="number"
                      value={parcelHeight}
                      onChange={(e) => setParcelHeight(Number(e.target.value))}
                      className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded p-1 text-center font-bold"
                      placeholder="H"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShippingOrder(null)}
                className="w-full py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-mono font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>

            {/* RIGHT MAIN: Select Courier Partner */}
            <div className="flex-1 p-6 space-y-5 bg-white dark:bg-slate-900 flex flex-col justify-between overflow-y-auto">
              <div className="space-y-4">
                {/* Header & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-sans font-bold text-slate-900 dark:text-white">
                      Select Courier Partner
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Choose 1-click dispatch below, or push order to Shiprocket dashboard.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePushToShiprocketOnly}
                      disabled={isPushingToShiprocket || isDispatching}
                      className="px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      title="Create order in Shiprocket without auto-assigning courier, so you can choose courier manually in Shiprocket Dashboard"
                    >
                      {isPushingToShiprocket ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Pushing to Shiprocket...</span>
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Push to Shiprocket</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShippingOrder(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Navigation Tabs (Recommended / Surface / Air / All) */}
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
                  <div className="flex gap-6 text-sm font-medium">
                    {(["Recommended", "Surface", "Air", "All"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setCourierTab(tab)}
                        className={`pb-3 relative transition-colors cursor-pointer font-sans ${
                          courierTab === tab
                            ? "text-indigo-600 dark:text-indigo-400 font-bold"
                            : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                        }`}
                      >
                        {tab}
                        {courierTab === tab && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                  <span className="text-xs font-mono text-slate-400 pb-3">
                    {filteredCouriers.length} Couriers Found
                  </span>
                </div>

                {/* Shiprocket Error / Notice Banner */}
                {shiprocketError && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 space-y-1.5 text-xs animate-in fade-in">
                    <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 font-mono">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Shiprocket API Response</span>
                    </div>
                    <p className="text-amber-900 dark:text-amber-200 font-mono text-[11px] leading-relaxed">
                      {shiprocketError}
                    </p>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono pt-0.5">
                      Tip: Enter a valid 6-digit Indian PIN code (e.g. <code>360003</code>, <code>700144</code>) in the left panel and click <strong>Check</strong>.
                    </div>
                  </div>
                )}

                {/* Best Performing Couriers Recommendation Notice */}
                {courierRates.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/50 flex items-start gap-2.5 text-xs text-emerald-900 dark:text-emerald-300">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-bold">Best Performing couriers: </strong>
                      <span>Real-time courier rates & serviceability returned directly by Shiprocket for PIN {customDeliveryPin}.</span>
                    </div>
                  </div>
                )}

                {/* Courier Partners List / Table */}
                {loadingRates ? (
                  <div className="py-16 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
                    <p className="text-xs text-slate-500 font-mono">Querying live Shiprocket courier serviceability & freight rates...</p>
                  </div>
                ) : courierRates.length === 0 ? (
                  <div className="py-12 px-4 text-center border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl space-y-3 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                      <Truck className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">No Couriers Available for PIN {customDeliveryPin}</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-mono max-w-md mx-auto">
                        Shiprocket returned 0 available carriers. Verify that the destination PIN is a valid 6-digit Indian PIN code or update the PIN on the left and click <strong>Check</strong>.
                      </p>
                    </div>
                  </div>
                ) : filteredCouriers.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                    <p className="text-xs text-slate-500 font-mono">No couriers match the "{courierTab}" category from Shiprocket.</p>
                    <button
                      type="button"
                      onClick={() => setCourierTab("All")}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold hover:underline cursor-pointer"
                    >
                      View All {courierRates.length} Available Couriers
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto max-h-[380px] pr-1">
                    {filteredCouriers.map((c) => {
                      const isRec = c.is_recommended;
                      const isShippingThis = dispatchingCourierId === c.courier_company_id;

                      return (
                        <div
                          key={c.courier_company_id}
                          className={`p-4 rounded-2xl border transition-all relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            isRec
                              ? "border-indigo-400 dark:border-indigo-600/80 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-xs"
                              : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                          }`}
                        >
                          {/* Recommended Ribbon */}
                          {isRec && (
                            <div className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-mono font-bold uppercase tracking-wider shadow-xs flex items-center gap-1">
                              <span>★</span> Recommended
                            </div>
                          )}

                          {/* Left: Courier Logo & Name */}
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <div className="w-10 h-10 rounded-full bg-slate-950 text-white flex items-center justify-center font-mono font-black text-xs shrink-0 shadow-inner">
                              {c.courier_name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {c.courier_name}
                              </h4>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-2">
                                <span>{c.mode || "Standard"}</span>
                                <span>•</span>
                                <span>Min-wt: {c.min_weight || 0.5} Kg</span>
                                <span>•</span>
                                <span>RTO: ₹{c.rto_charges || 76}</span>
                              </div>
                            </div>
                          </div>

                          {/* Middle: Rating, Pickup & Delivery */}
                          <div className="flex items-center gap-6 text-xs shrink-0">
                            {/* Rating Badge */}
                            <div className="text-center">
                              <div className="w-9 h-9 rounded-full border-2 border-emerald-500 text-emerald-700 dark:text-emerald-400 font-mono font-bold text-xs flex items-center justify-center mx-auto">
                                {c.rating ? c.rating.toFixed(1) : "4.8"}
                              </div>
                              <span className="text-[9px] text-slate-400 font-mono block mt-0.5">Radar</span>
                            </div>

                            {/* Expected Pickup */}
                            <div>
                              <span className="text-[10px] text-slate-400 font-mono block">Pickup</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">{c.pickup_date || "Today"}</span>
                            </div>

                            {/* Estimated Delivery */}
                            <div>
                              <span className="text-[10px] text-slate-400 font-mono block">Delivery</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-xs font-mono">{c.etd}</span>
                            </div>

                            {/* Charges */}
                            <div className="text-right min-w-[70px]">
                              <span className="text-[10px] text-slate-400 font-mono block">Charges</span>
                              <span className="font-mono font-extrabold text-sm text-indigo-600 dark:text-indigo-400">
                                ₹{c.rate.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Right: Direct Ship Now Action Button */}
                          <button
                            type="button"
                            onClick={() => handleDirectShipWithCourier(c.courier_company_id, c.courier_name)}
                            disabled={isShippingThis || isDispatching}
                            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-98 disabled:opacity-50 text-white font-sans font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                          >
                            {isShippingThis ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Shipping...</span>
                              </>
                            ) : (
                              <span>Ship Now</span>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LIVE TRACKING TIMELINE MODAL */}
      {trackingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-900 dark:text-white animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase text-blue-600 dark:text-blue-400 font-bold">Shiprocket Live Telemetry</span>
                <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  Tracking Order #{trackingModalOrder.id}
                </h3>
              </div>
              <button onClick={() => setTrackingModalOrder(null)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AWB Banner */}
            <div className="p-3.5 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800 text-xs flex items-center justify-between">
              <div>
                <div className="font-bold text-blue-900 dark:text-blue-200 font-mono">
                  AWB: {trackingModalOrder.awbCode || trackingModalOrder.trackingNumber}
                </div>
                <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Carrier: {trackingModalOrder.courierName || trackingModalOrder.carrier}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-blue-600 text-white">
                {trackingInfo?.shipment_track?.[0]?.current_status || trackingModalOrder.status}
              </span>
            </div>

            {/* Timeline Activities */}
            {loadingTracking ? (
              <div className="py-12 text-center space-y-2">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-600" />
                <p className="text-xs text-slate-500 font-mono">Contacting carrier API for real-time waybill checkpoints...</p>
              </div>
            ) : trackingInfo?.shipment_track_activities && trackingInfo.shipment_track_activities.length > 0 ? (
              <div className="space-y-4">
                <h4 className="font-mono font-bold text-xs uppercase text-slate-500">Scan Checkpoints History</h4>
                <div className="space-y-3 border-l-2 border-blue-500 ml-2 pl-4">
                  {trackingInfo.shipment_track_activities.map((act, i) => (
                    <div key={i} className="relative text-xs space-y-0.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-600" />
                      <div className="font-bold text-slate-900 dark:text-white">{act.activity}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        {act.location ? `${act.location} • ` : ""}{act.date}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center border border-slate-200 dark:border-slate-800 rounded-xl space-y-2 bg-slate-50 dark:bg-slate-950">
                <Package className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {trackingError || "Tracking number generated. Waybill will show real-time checkpoints once carrier scans package at first hub."}
                </p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setTrackingModalOrder(null)}
                className="px-5 py-2 rounded-lg bg-slate-900 text-white font-bold text-xs cursor-pointer font-mono"
              >
                Close Tracking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGISTICS & MANUAL STATUS UPDATER MODAL */}
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
                  placeholder="e.g. Delhivery Surface / Blue Dart"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Waybill / Tracking #</label>
                <input
                  type="text"
                  value={newTrackingNumber}
                  onChange={(e) => setNewTrackingNumber(e.target.value)}
                  placeholder="e.g. 1423859201"
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
