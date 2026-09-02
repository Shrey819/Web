"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { 
  Package, 
  Heart, 
  ShoppingBag, 
  MapPin, 
  User, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Truck, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  Home,
  Briefcase,
  Star,
  Check,
  X,
  Loader2,
  ArrowRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { 
  getUserAddressesAction, 
  createAddressAction, 
  updateAddressAction, 
  deleteAddressAction, 
  setDefaultAddressAction, 
  AddressItem 
} from "@/app/actions/address";
import { AddressLocationSelector } from "@/components/ui/AddressLocationSelector";
import { validatePincodeWithState } from "@/lib/indiaLocations";

const ADDRESS_TYPES = [
  { id: "Home", label: "Home", icon: Home, color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  { id: "Office", label: "Office", icon: Building2, color: "text-sky-600 bg-sky-50 border-sky-200" },
  { id: "Work", label: "Work / Factory", icon: Briefcase, color: "text-indigo-600 bg-indigo-50 border-indigo-200" },
  { id: "Other", label: "Other", icon: MapPin, color: "text-slate-600 bg-slate-50 border-slate-200" },
] as const;

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useUserStore();
  const { items: wishlistItems, toggleWishlist, clearWishlist } = useWishlistStore();
  const { items: cartItems, updateQuantity, removeItem, addItem, getTotal, clearCart } = useCartStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "wishlist" | "cart">("orders");
  
  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Addresses State
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    companyName: "",
    phone: "",
    email: "",
    street: "",
    city: "",
    state: "Gujarat",
    zip: "",
    country: "India",
    type: "Home",
    isDefault: false,
  });

  // Load Orders
  useEffect(() => {
    let placedOrderIds: string[] = [];
    try {
      placedOrderIds = JSON.parse(localStorage.getItem("om-automation-placed-orders") || "[]");
    } catch (e) {}

    const fetchOrders = async () => {
      setIsLoadingOrders(true);
      try {
        const queryParams = new URLSearchParams();
        if (user?.id) queryParams.set("userId", user.id);
        if (user?.email) queryParams.set("email", user.email);
        if (placedOrderIds.length > 0) queryParams.set("ids", placedOrderIds.join(","));

        const res = await fetch(`/api/tracker/live?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch (err) {
        console.error("Failed to load user orders:", err);
      } finally {
        setIsLoadingOrders(false);
      }
    };

    fetchOrders();
  }, [user?.id, user?.email]);

  // Load User Addresses
  const loadAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      let combined: AddressItem[] = [];

      // 1. Load from Database
      if (user?.id || user?.email) {
        const res = await getUserAddressesAction(user?.id, user?.email);
        if (res.success && res.addresses) {
          combined = [...res.addresses];
        }
      }

      // 2. Load from localStorage (for offline/guest addresses)
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
      } catch (e) {}

      setAddresses(combined);
    } catch (e) {
      console.error("Failed to load addresses:", e);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, [user?.id, user?.email]);

  const handleSignOut = async () => {
    await logout();
    addToast("info", "Signed Out", "You have been successfully signed out.");
    router.push("/");
  };

  // Open modal for new address
  const handleAddNewAddress = () => {
    setEditingAddressId(null);
    setAddressForm({
      fullName: user?.name || "",
      companyName: user?.companyName || "",
      phone: "",
      email: user?.email || "",
      street: "",
      city: "",
      state: "Gujarat",
      zip: "",
      country: "India",
      type: "Home",
      isDefault: addresses.length === 0,
    });
    setShowAddressModal(true);
  };

  // Open modal for editing address
  const handleEditAddress = (addr: AddressItem) => {
    setEditingAddressId(addr.id);
    setAddressForm({
      fullName: addr.fullName,
      companyName: addr.companyName || "",
      phone: addr.phone,
      email: addr.email || user?.email || "",
      street: addr.street,
      city: addr.city,
      state: addr.state || "Gujarat",
      zip: addr.zip,
      country: addr.country || "India",
      type: addr.type || "Home",
      isDefault: addr.isDefault,
    });
    setShowAddressModal(true);
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.street || !addressForm.city || !addressForm.state || !addressForm.zip) {
      addToast("warning", "Missing Information", "Please fill in all mandatory address fields.");
      return;
    }

    const isIndia = !addressForm.country || addressForm.country.trim().toLowerCase() === "india";
    if (isIndia) {
      const pinVal = validatePincodeWithState(addressForm.zip, addressForm.state);
      if (!pinVal.isValid) {
        addToast("error", "PIN Code Mismatch", pinVal.message || "Please verify your PIN code and selected State.");
        return;
      }
    }

    setIsSavingAddress(true);
    try {
      if (editingAddressId) {
        const res = await updateAddressAction(editingAddressId, {
          userId: user?.id,
          fullName: addressForm.fullName,
          companyName: addressForm.companyName,
          phone: addressForm.phone,
          email: addressForm.email,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          zip: addressForm.zip,
          country: addressForm.country,
          type: addressForm.type,
          isDefault: addressForm.isDefault,
        });

        if (res.success) {
          addToast("success", "Address Updated", "Delivery address updated successfully.");
          setShowAddressModal(false);
          await loadAddresses();
        } else {
          addToast("error", "Update Failed", res.error || "Could not update address.");
        }
      } else {
        const res = await createAddressAction({
          userId: user?.id,
          fullName: addressForm.fullName,
          companyName: addressForm.companyName,
          phone: addressForm.phone,
          email: addressForm.email,
          street: addressForm.street,
          city: addressForm.city,
          state: addressForm.state,
          zip: addressForm.zip,
          country: addressForm.country,
          type: addressForm.type,
          isDefault: addressForm.isDefault,
        });

        if (res.success) {
          addToast("success", "Address Saved", "New delivery address added successfully.");
          setShowAddressModal(false);
          await loadAddresses();
        } else {
          addToast("error", "Save Failed", res.error || "Could not save address.");
        }
      }
    } catch (err: any) {
      console.error(err);
      addToast("error", "Error", "An unexpected error occurred while saving address.");
    } finally {
      setIsSavingAddress(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this delivery address?")) return;
    try {
      const res = await deleteAddressAction(id);
      if (res.success) {
        addToast("success", "Address Deleted", "Delivery address removed.");
        setAddresses((prev) => prev.filter((a) => a.id !== id));
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete address.");
      }
    } catch (e) {
      console.error(e);
      addToast("error", "Error", "Failed to delete address.");
    }
  };

  // Set Default Address
  const handleSetDefaultAddress = async (id: string) => {
    if (!user?.id) return;
    try {
      const res = await setDefaultAddressAction(id, user.id);
      if (res.success) {
        addToast("success", "Default Updated", "Primary delivery address updated.");
        setAddresses((prev) =>
          prev.map((a) => ({
            ...a,
            isDefault: a.id === id,
          }))
        );
      } else {
        addToast("error", "Update Failed", res.error || "Could not set default address.");
      }
    } catch (e) {
      console.error(e);
      addToast("error", "Error", "Failed to update default address.");
    }
  };

  if (!isLoggedIn || !user) {
    return (
      <div className="bg-[#faf9f5] min-h-screen py-16 border-b border-slate-200 flex items-center justify-center">
        <div className="max-w-md w-full px-4 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center mx-auto">
            <User className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-mono font-extrabold text-slate-900">
            Please Sign In to Access Workspace
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to your customer account to view your orders, saved delivery addresses, liked products, and shopping cart.
          </p>
          <div className="flex gap-3 justify-center pt-2">
            <Link href="/login" className="px-6 py-3 rounded-full bg-slate-900 text-white type-button">
              Sign In
            </Link>
            <Link href="/register" className="px-6 py-3 rounded-full bg-slate-100 text-slate-800 type-button hover:bg-slate-200">
              Register Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const userInitials = user.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "US";
  const userAvatarUrl = user.image || user.avatar;

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">User Workspace & Profile</span>
        </nav>

        {/* User Hero Banner */}
        <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold font-mono shadow-inner overflow-hidden border-2 border-white/20">
              {userAvatarUrl ? (
                <img src={userAvatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-mono font-bold">{user.name || "Enterprise Customer"}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
                  Verified B2B Account
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 font-mono mt-0.5">{user.email}</p>
              {user.companyName && (
                <p className="text-xs text-sky-400 font-mono mt-1 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" /> {user.companyName}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/orders"
              className="px-5 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white type-button shadow-md flex items-center gap-2"
            >
              <Package className="w-4 h-4" />
              <span>My Orders</span>
            </Link>
            <button
              onClick={handleSignOut}
              className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 type-button border border-slate-700 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Workspace Selector Cards (4 Tabs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* 1. My Orders */}
          <button
            onClick={() => setActiveTab("orders")}
            className={`p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer ${
              activeTab === "orders"
                ? "bg-white border-sky-500 shadow-xl ring-2 ring-sky-500/20"
                : "bg-white/80 border-slate-200 hover:border-sky-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Package className="w-5 h-5" />
              </div>
              <span className="bg-sky-100 text-sky-700 text-xs font-mono font-bold px-3 py-1 rounded-full">
                {orders.length} Orders
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">My Orders</h3>
            <p className="text-xs text-slate-500 mt-1">
              View purchase history, COD status, and freight tracking.
            </p>
          </button>

          {/* 2. Saved Addresses */}
          <button
            onClick={() => setActiveTab("addresses")}
            className={`p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer ${
              activeTab === "addresses"
                ? "bg-white border-amber-500 shadow-xl ring-2 ring-amber-500/20"
                : "bg-white/80 border-slate-200 hover:border-amber-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <MapPin className="w-5 h-5" />
              </div>
              <span className="bg-amber-100 text-amber-700 text-xs font-mono font-bold px-3 py-1 rounded-full">
                {addresses.length} Addresses
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">Delivery Addresses</h3>
            <p className="text-xs text-slate-500 mt-1">
              Maintain Home, Office & Factory delivery details for 1-click checkout.
            </p>
          </button>

          {/* 3. Liked Products */}
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer ${
              activeTab === "wishlist"
                ? "bg-white border-rose-500 shadow-xl ring-2 ring-rose-500/20"
                : "bg-white/80 border-slate-200 hover:border-rose-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <Heart className="w-5 h-5 fill-rose-500" />
              </div>
              <span className="bg-rose-500 text-white text-xs font-mono font-bold px-3 py-1 rounded-full">
                {wishlistItems.length} Liked
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">Liked Products</h3>
            <p className="text-xs text-slate-500 mt-1">
              Saved hardware components in your wishlist collection.
            </p>
          </button>

          {/* 4. Cart Products */}
          <button
            onClick={() => setActiveTab("cart")}
            className={`p-5 rounded-3xl border text-left transition-all duration-300 cursor-pointer ${
              activeTab === "cart"
                ? "bg-white border-emerald-500 shadow-xl ring-2 ring-emerald-500/20"
                : "bg-white/80 border-slate-200 hover:border-emerald-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="bg-emerald-100 text-emerald-700 text-xs font-mono font-bold px-3 py-1 rounded-full">
                {cartItems.reduce((s, i) => s + i.quantity, 0)} Items
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">Procurement Cart</h3>
            <p className="text-xs text-slate-500 mt-1">
              Active bill of materials ready for quotation or purchase order.
            </p>
          </button>
        </div>

        {/* Tab Content Display Area */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl">
          {/* TAB 1: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-mono font-bold text-slate-900">Procurement & Order History</h2>
                  <p className="text-xs text-slate-500">Live order database records placed via your account.</p>
                </div>
                <Link
                  href="/orders"
                  className="text-xs font-mono font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1"
                >
                  <span>Detailed Tracking Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>

              {isLoadingOrders ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-sky-600" />
                  <span className="text-xs font-mono">Fetching your order history...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Package className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700">No Orders Found Yet</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    When you place an order in our store, it will automatically appear here with live tracking.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold font-mono hover:bg-slate-800"
                  >
                    Browse Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="p-5 rounded-2xl border border-slate-200 hover:border-sky-300 transition-all space-y-3 bg-slate-50/50"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900 text-sm">
                            {order.id}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-sky-100 text-sky-800 border border-sky-200">
                            {order.status || "CONFIRMED"}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-500">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" }) : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px] font-mono uppercase">Delivery Pincode</span>
                          <span className="font-bold text-slate-800 font-mono">
                            {order.shippingZip || "360004"} ({order.shippingCity || "Rajkot"})
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] font-mono uppercase">Payment Terms</span>
                          <span className="font-bold text-slate-800">
                            {order.paymentMethod === "cod" ? "Cash on Delivery" : "Purchase Order"}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] font-mono uppercase">Order Total</span>
                          <span className="font-bold text-emerald-700 font-mono">
                            {formatCurrency(order.total || 0)}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-mono">
                          {order.items?.length || 1} hardware line item(s)
                        </span>
                        <Link
                          href={`/orders?id=${order.id}`}
                          className="font-bold font-mono text-sky-600 hover:text-sky-700 flex items-center gap-1"
                        >
                          <span>Track Freight</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SAVED DELIVERY ADDRESSES */}
          {activeTab === "addresses" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-mono font-bold text-slate-900">Delivery Address Book</h2>
                  <p className="text-xs text-slate-500">
                    Save multiple delivery addresses (Home, Office, Work/Factory, Other) for 1-click checkout.
                  </p>
                </div>

                <button
                  onClick={handleAddNewAddress}
                  className="px-5 py-2.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button shadow-md flex items-center justify-center gap-2 cursor-pointer transition-colors shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Address</span>
                </button>
              </div>

              {isLoadingAddresses ? (
                <div className="py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                  <span className="text-xs font-mono">Loading your saved addresses...</span>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-700 text-base">No Delivery Addresses Saved Yet</h4>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Add your corporate warehouse, home, or factory address so you never have to re-enter delivery details during checkout.
                  </p>
                  <button
                    onClick={handleAddNewAddress}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold font-mono shadow-md cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add First Delivery Address</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {addresses.map((addr) => {
                    const typeConfig = ADDRESS_TYPES.find((t) => t.id === addr.type) || ADDRESS_TYPES[0];
                    const Icon = typeConfig.icon;

                    return (
                      <div
                        key={addr.id}
                        className={`p-5 rounded-3xl border transition-all relative flex flex-col justify-between ${
                          addr.isDefault
                            ? "bg-amber-50/40 border-amber-300 shadow-md ring-2 ring-amber-400/20"
                            : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Header tag & default pill */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[11px] font-mono font-bold px-3 py-1 rounded-full border flex items-center gap-1.5 ${typeConfig.color}`}>
                              <Icon className="w-3.5 h-3.5" />
                              <span>{typeConfig.label}</span>
                            </span>

                            {addr.isDefault ? (
                              <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white flex items-center gap-1 shadow-xs">
                                <Star className="w-3 h-3 fill-white" /> Primary Address
                              </span>
                            ) : (
                              <button
                                onClick={() => handleSetDefaultAddress(addr.id)}
                                className="text-[10px] font-mono text-slate-400 hover:text-amber-600 cursor-pointer"
                              >
                                Set as Default
                              </button>
                            )}
                          </div>

                          {/* Contact Info */}
                          <div>
                            <h3 className="font-bold text-slate-900 text-base">
                              {addr.fullName}
                            </h3>
                            {addr.companyName && (
                              <p className="text-xs text-sky-600 font-mono font-semibold flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3.5 h-3.5" />
                                {addr.companyName}
                              </p>
                            )}
                          </div>

                          {/* Location */}
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {addr.street}
                            <br />
                            <strong className="text-slate-800">{addr.city}, {addr.state} - {addr.zip}</strong>
                            <br />
                            <span className="text-slate-400">{addr.country || "India"}</span>
                          </p>

                          {/* Phone & Email */}
                          <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-500 space-y-1">
                            <p className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <span>+91 {addr.phone}</span>
                            </p>
                            {addr.email && (
                              <p className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-slate-400" />
                                <span>{addr.email}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-4 mt-3 border-t border-slate-100">
                          <button
                            onClick={() => handleEditAddress(addr)}
                            className="p-2 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
                            title="Edit Address"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => handleDeleteAddress(addr.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1 text-xs font-mono font-bold"
                            title="Delete Address"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WISHLIST */}
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-mono font-bold text-slate-900">Saved Wishlist Items</h2>
                  <p className="text-xs text-slate-500">Hardware components saved for future procurement.</p>
                </div>
                {wishlistItems.length > 0 && (
                  <button
                    onClick={clearWishlist}
                    className="text-xs font-mono text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {wishlistItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <Heart className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700">Wishlist is Empty</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Click the heart icon on any industrial product to save it to your procurement wishlist.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold font-mono hover:bg-slate-800"
                  >
                    Explore Components
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {wishlistItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl border border-slate-200 hover:border-rose-300 transition-all space-y-3 relative group"
                    >
                      <div className="aspect-square bg-slate-100 rounded-xl overflow-hidden relative">
                        {item.images?.[0] ? (
                          <img
                            src={typeof item.images[0] === "string" ? item.images[0] : (item.images[0] as any)?.url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-300">
                            <Package className="w-10 h-10" />
                          </div>
                        )}
                        <button
                          onClick={() => toggleWishlist(item)}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-rose-500 shadow-md hover:scale-110 transition-transform cursor-pointer"
                        >
                          <Heart className="w-4 h-4 fill-rose-500" />
                        </button>
                      </div>

                      <div>
                        <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{item.name}</h4>
                        <p className="text-xs font-mono text-slate-400">{item.sku || `SKU-${item.id}`}</p>
                        <div className="text-sm font-mono font-bold text-sky-700 mt-1">
                          {formatCurrency(item.basePrice || 0)}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <Link
                          href={`/product/${item.slug || item.id}`}
                          className="flex-1 py-2 text-center text-xs font-mono font-bold bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-800"
                        >
                          View Specs
                        </Link>
                        <button
                          onClick={() => {
                            addItem(item);
                            addToast("success", "Added to Cart", `${item.name} added to cart.`);
                          }}
                          className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-mono font-bold cursor-pointer"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: CART */}
          {activeTab === "cart" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-xl font-mono font-bold text-slate-900">Procurement Shopping Cart</h2>
                  <p className="text-xs text-slate-500">Bill of materials ready for procurement checkout.</p>
                </div>
                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-mono text-rose-600 hover:text-rose-700 cursor-pointer"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                  <h4 className="font-bold text-slate-700">Your Cart is Currently Empty</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Add industrial automation components, PLCs, HMIs or sensors to build your order.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-5 py-2.5 rounded-full bg-slate-900 text-white text-xs font-bold font-mono hover:bg-slate-800"
                  >
                    Shop Hardware
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="divide-y divide-slate-100">
                    {cartItems.map((item) => {
                      const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                      const itemPrice = item.variant ? item.variant.price : item.product.basePrice;
                      const cleanName = (item.product.name || "Product").replace(/\s*-\s*undefined/gi, "");

                      return (
                        <div key={itemId} className="py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                              {item.product.images?.[0] ? (
                                <img
                                  src={typeof item.product.images[0] === "string" ? item.product.images[0] : (item.product.images[0] as any)?.url}
                                  alt={cleanName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <Package className="w-6 h-6" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-900 truncate">{cleanName}</h4>
                              {item.variant?.name && item.variant.name !== "undefined" && (
                                <span className="text-xs font-mono text-sky-600 block">{item.variant.name}</span>
                              )}
                              <span className="text-xs font-mono text-slate-400">
                                {formatCurrency(itemPrice)} / unit
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0">
                            {/* Quantity Controls */}
                            <div className="flex items-center border border-slate-200 rounded-full bg-slate-50">
                              <button
                                onClick={() => updateQuantity(itemId, Math.max(1, item.quantity - 1))}
                                className="p-1 hover:bg-slate-200 rounded-l-full text-slate-700 cursor-pointer"
                              >
                                -
                              </button>
                              <span className="px-3 text-xs font-mono font-bold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(itemId, item.quantity + 1)}
                                className="p-1 hover:bg-slate-200 rounded-r-full text-slate-700 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="font-mono font-bold text-sm text-slate-900 w-24 text-right">
                              {formatCurrency(itemPrice * item.quantity)}
                            </div>

                            <button
                              onClick={() => removeItem(itemId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100">
                    <div className="text-sm font-mono text-slate-700">
                      Subtotal: <strong className="text-slate-900 text-lg font-bold">{formatCurrency(getTotal())}</strong>
                    </div>

                    <Link
                      href="/checkout"
                      className="w-full sm:w-auto px-8 py-3 rounded-full bg-gradient-to-r from-sky-600 to-emerald-600 hover:from-sky-500 hover:to-emerald-500 text-white font-bold type-button shadow-xl flex items-center justify-center gap-2"
                    >
                      <span>Proceed to B2B Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ADD / EDIT ADDRESS MODAL */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-mono font-bold text-slate-900 dark:text-white">
                    {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Maintain addresses for quick checkout autofill
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAddressModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveAddress} className="space-y-4">
              {/* Address Type Tag Selector */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
                  Address Type / Label <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {ADDRESS_TYPES.map((type) => {
                    const Icon = type.icon;
                    const isSelected = addressForm.type === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setAddressForm({ ...addressForm, type: type.id })}
                        className={`p-2.5 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                            : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Full Name & Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    placeholder="e.g. Shrey Sojitra"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Company / Organisation <span className="text-[10px] text-slate-400 font-mono">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addressForm.companyName}
                    onChange={(e) => setAddressForm({ ...addressForm, companyName: e.target.value })}
                    placeholder="e.g. Om Automation"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mobile Phone (+91) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
                    <span className="px-2.5 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-mono font-bold shrink-0">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value.replace(/[^\d]/g, "").slice(0, 10) })}
                      placeholder="98765 43210"
                      className="w-full p-2.5 bg-transparent text-xs text-slate-900 dark:text-white focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={addressForm.email}
                    onChange={(e) => setAddressForm({ ...addressForm, email: e.target.value })}
                    placeholder="name@company.com"
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Street Address / Building / Area / GIDC <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={addressForm.street}
                  onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                  placeholder="e.g. Plot 42, GIDC Electronics Estate, Sector 26"
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Country, State, City, PIN Code with Cascading Dropdowns & Validation */}
              <AddressLocationSelector
                country={addressForm.country}
                state={addressForm.state}
                city={addressForm.city}
                zip={addressForm.zip}
                onCountryChange={(country) => setAddressForm({ ...addressForm, country })}
                onStateChange={(state) => setAddressForm({ ...addressForm, state })}
                onCityChange={(city) => setAddressForm({ ...addressForm, city })}
                onZipChange={(zip) => setAddressForm({ ...addressForm, zip })}
              />

              {/* Set as Default Checkbox */}
              <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Set as default delivery address for future orders
                </span>
              </label>

              {/* Buttons */}
              <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-mono font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingAddress}
                  className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-mono font-bold cursor-pointer shadow-md transition-colors flex items-center justify-center gap-2"
                >
                  {isSavingAddress ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>{editingAddressId ? "Update Address" : "Save Address"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
