"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { getUserOrdersAction } from "@/app/actions/order";
import { 
  User, 
  Package, 
  Heart, 
  ShoppingBag, 
  LogOut, 
  ChevronRight, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight,
  Truck,
  CheckCircle2,
  Sparkles,
  ExternalLink
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isLoggedIn, logout } = useUserStore();
  const { items: wishlistItems, toggleWishlist, clearWishlist } = useWishlistStore();
  const { items: cartItems, updateQuantity, removeItem, addItem, getTotal, clearCart } = useCartStore();
  const { addToast } = useToastStore();

  const [activeTab, setActiveTab] = useState<"wishlist" | "cart" | "orders">("wishlist");
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    let placedOrderIds: string[] = [];
    try {
      placedOrderIds = JSON.parse(localStorage.getItem("om-automation-placed-orders") || "[]");
    } catch (e) {
      console.error(e);
    }

    setIsLoadingOrders(true);
    getUserOrdersAction(user?.id, user?.email, placedOrderIds).then((res) => {
      if (res.success && res.orders) {
        setOrders(res.orders);
      } else {
        setOrders([]);
      }
      setIsLoadingOrders(false);
    });
  }, [user?.id, user?.email]);

  const handleSignOut = () => {
    logout();
    addToast("info", "Signed Out", "You have signed out of your account.");
    router.push("/");
  };

  const handleAddToCartFromWishlist = (product: any) => {
    addItem(product, 1);
    addToast("success", "Added to Cart", `${product.name} added to cart.`);
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
            Sign in to your customer account to view your orders, liked products, and shopping cart.
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

        {/* Hero Card */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-sky-500 to-emerald-400 text-slate-950 font-black text-2xl flex items-center justify-center font-mono shrink-0 shadow-lg">
              {userInitials}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="type-section-title font-mono text-white">{user.name}</h1>
                <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/20 uppercase">
                  {user.role}
                </span>
              </div>
              <p className="type-body-small text-slate-400 font-mono">{user.email}</p>
              {user.companyName && (
                <p className="text-xs text-sky-400 font-mono">{user.companyName}</p>
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
              className="px-5 py-2.5 rounded-full bg-slate-800 hover:bg-rose-600/20 text-slate-300 hover:text-rose-400 type-button border border-slate-700 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Workspace Selector Cards (Tabs) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* My Orders Selector */}
          <button
            onClick={() => setActiveTab("orders")}
            className={`p-6 rounded-3xl border text-left transition-all duration-300 ${
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
              View real database purchase history, Cash on Delivery status, and freight tracking.
            </p>
          </button>

          {/* Liked Products Selector */}
          <button
            onClick={() => setActiveTab("wishlist")}
            className={`p-6 rounded-3xl border text-left transition-all duration-300 ${
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
              Saved hardware components in your personal wishlist collection.
            </p>
          </button>

          {/* Cart Products Selector */}
          <button
            onClick={() => setActiveTab("cart")}
            className={`p-6 rounded-3xl border text-left transition-all duration-300 ${
              activeTab === "cart"
                ? "bg-white border-emerald-500 shadow-xl ring-2 ring-emerald-500/20"
                : "bg-white/80 border-slate-200 hover:border-emerald-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="bg-emerald-500 text-slate-950 text-xs font-mono font-bold px-3 py-1 rounded-full">
                {cartItems.length} Items
              </span>
            </div>
            <h3 className="font-bold text-base text-slate-900 font-mono">Cart Products</h3>
            <p className="text-xs text-slate-500 mt-1">
              Subtotal: <strong className="font-mono text-slate-900">{formatCurrency(getTotal())}</strong>. Ready for checkout.
            </p>
          </button>
        </div>

        {/* ACTIVE TAB CONTENT VIEW */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
          {/* TAB 1: LIKED PRODUCTS */}
          {activeTab === "wishlist" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-mono font-extrabold text-slate-900 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                    My Liked Products ({wishlistItems.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Hardware components saved for future BOM specifications.
                  </p>
                </div>

                {wishlistItems.length > 0 && (
                  <button
                    onClick={clearWishlist}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear All Liked
                  </button>
                )}
              </div>

              {wishlistItems.length === 0 ? (
                <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-400 flex items-center justify-center mx-auto">
                    <Heart className="w-8 h-8" />
                  </div>
                  <h3 className="font-mono font-bold text-base text-slate-900">No Liked Products Yet</h3>
                  <p className="text-xs text-slate-500">
                    Click the Heart icon on any product card across the catalog to save it to your Liked Products list.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-6 py-2.5 rounded-full bg-slate-900 text-white type-button shadow-md"
                  >
                    Explore Hardware Catalog
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wishlistItems.map((product) => {
                    const primaryImage = product.images?.[0]?.url || "/placeholder.png";
                    return (
                      <div
                        key={product.id}
                        className="group bg-slate-50/50 rounded-2xl p-4 border border-slate-200 hover:border-rose-300 hover:bg-white transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border border-slate-200">
                            <Image
                              src={primaryImage}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              unoptimized
                            />
                            <button
                              onClick={() => toggleWishlist(product)}
                              className="absolute top-2 right-2 p-2 rounded-full bg-rose-500 text-white shadow-md hover:bg-rose-600 transition-colors"
                              title="Remove from liked"
                            >
                              <Heart className="w-4 h-4 fill-white" />
                            </button>
                          </div>

                          <div>
                            <div className="text-[10px] font-mono font-bold text-sky-600 uppercase">
                              {product.brand} • SKU: {product.sku}
                            </div>
                            <Link href={`/product/${product.slug}`} className="font-bold text-sm text-slate-900 hover:text-sky-600 line-clamp-1 block mt-0.5">
                              {product.name}
                            </Link>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between mt-4">
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {formatCurrency(product.basePrice)}
                          </div>
                          <button
                            onClick={() => handleAddToCartFromWishlist(product)}
                            className="px-3 py-1.5 rounded-full bg-slate-900 hover:bg-sky-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-sky-400" /> Add to Cart
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CART PRODUCTS */}
          {activeTab === "cart" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-mono font-extrabold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-emerald-600" />
                    My Cart Products ({cartItems.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Active items queued for Cash on Delivery or Net-30 purchase order checkout.
                  </p>
                </div>

                {cartItems.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-mono font-bold text-base text-slate-900">Your Cart is Currently Empty</h3>
                  <p className="text-xs text-slate-500">
                    Browse our sensors, PLCs, and drive components to add products to your active cart.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-6 py-2.5 rounded-full bg-slate-900 text-white type-button shadow-md"
                  >
                    Browse Hardware Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
                    {cartItems.map((item) => {
                      const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                      const itemSku = item.variant ? item.variant.sku : item.product.sku;
                      const itemPrice = item.variant ? item.variant.price : item.product.basePrice;

                      return (
                        <div key={itemId} className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4 hover:bg-slate-50/50">
                          <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="w-14 h-14 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shrink-0">
                              <Image
                                src={item.product.images[0]?.url || "/placeholder.png"}
                                alt={item.product.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            <div>
                              <div className="text-[10px] font-mono font-bold text-sky-600 uppercase">
                                {item.product.brand} • SKU: {itemSku}
                              </div>
                              <Link href={`/product/${item.product.slug}`} className="font-bold text-sm text-slate-900 hover:text-sky-600 line-clamp-1">
                                {item.product.name} {item.variant && `- ${item.variant.name}`}
                              </Link>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            <div className="flex items-center border border-slate-200 rounded-full bg-slate-100">
                              <button
                                onClick={() => updateQuantity(itemId, item.quantity - 1)}
                                className="p-1 hover:bg-slate-200 rounded-l-full text-slate-700"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 font-mono text-xs font-bold text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(itemId, item.quantity + 1)}
                                className="p-1 hover:bg-slate-200 rounded-r-full text-slate-700"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="font-mono font-bold text-sm text-slate-900 w-24 text-right">
                              {formatCurrency(itemPrice * item.quantity)}
                            </div>

                            <button
                              onClick={() => removeItem(itemId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600"
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

          {/* TAB 3: MY ORDERS */}
          {activeTab === "orders" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-mono font-extrabold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-sky-600" />
                    My Database Orders ({orders.length})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time PostgreSQL purchase history and freight tracking details.
                  </p>
                </div>
              </div>

              {isLoadingOrders ? (
                <div className="py-12 text-center font-mono text-xs text-slate-500">
                  Loading order history from database...
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center space-y-4 max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                    <Package className="w-8 h-8" />
                  </div>
                  <h3 className="font-mono font-bold text-base text-slate-900">No Orders Placed Yet</h3>
                  <p className="text-xs text-slate-500">
                    Place an order using Cash on Delivery or Net-30 PO to see real database records here.
                  </p>
                  <Link
                    href="/products"
                    className="inline-block px-6 py-2.5 rounded-full bg-slate-900 text-white type-button shadow-md"
                  >
                    Browse Hardware Catalog
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-5 rounded-2xl bg-slate-50/50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-sm text-slate-900">{ord.id}</span>
                          <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                            ord.status === "DELIVERED" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                            ord.status === "SHIPPED" ? "bg-sky-50 text-sky-700 border-sky-200" :
                            "bg-amber-50 text-amber-700 border-amber-200"
                          }`}>
                            {ord.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">
                          Placed on {ord.date} • {ord.itemCount} Line Items
                        </div>
                        <div className="text-xs text-slate-600 flex items-center gap-2 pt-0.5">
                          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {ord.paymentMethod}
                          </span>
                          <span>• Carrier: {ord.carrier} ({ord.trackingNumber})</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        <div className="text-right font-mono">
                          <div className="text-[10px] text-slate-400">Total</div>
                          <div className="font-bold text-slate-900 text-sm">{formatCurrency(ord.total)}</div>
                        </div>

                        <Link
                          href={`/orders/${ord.id}`}
                          className="px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
                        >
                          <span>Details</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
