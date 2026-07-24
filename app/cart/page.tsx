"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag, ChevronRight, Truck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export default function FullCartPage() {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
  } = useCartStore();

  const { addToast } = useToastStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const total = getTotal();
  const freeShippingThreshold = 40000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      addToast("success", "Coupon Applied", res.message);
      setCouponInput("");
    }
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Industrial Cart</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 mb-8">
          Shopping Cart ({items.length} Items)
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="type-card-title text-slate-900">Your cart is currently empty</h3>
            <p className="type-body-small text-slate-500">
              Explore our sensors, PLCs, and drive components to build your industrial automation system.
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 rounded-full bg-sky-600 hover:bg-sky-500 text-white type-button shadow-md transition-all"
            >
              Browse Hardware Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Item Table */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Express Shipping Banner */}
              <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-4 rounded-2xl border border-sky-800/80 shadow-md">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-400" />
                    {remainingForFreeShipping > 0 ? (
                      <span>
                        Add <strong className="text-sky-300 font-bold">{formatCurrency(remainingForFreeShipping)}</strong> more to qualify for FREE Express Freight
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        Qualified for Free Freight Express Dispatch!
                      </span>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md divide-y divide-slate-100 overflow-hidden">
                {items.map((item) => {
                  const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                  const itemSku = item.variant ? item.variant.sku : item.product.sku;
                  const itemPrice = item.variant ? item.variant.price : item.product.basePrice;
                  
                  return (
                  <div key={itemId} className="p-5 flex flex-col sm:flex-row items-center gap-4">
                    <div className="w-20 h-20 relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-200 shrink-0">
                      <Image src={item.product.images[0]?.url || "/placeholder.png"} alt={item.product.name} fill className="object-cover" unoptimized />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-sky-600 uppercase">
                          {item.product.brand}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="font-mono text-[10px] text-slate-400">
                          SKU: {itemSku}
                        </span>
                      </div>

                      <Link href={`/product/${item.product.slug}`} className="font-bold text-sm text-slate-900 hover:text-sky-600 line-clamp-1">
                        {item.product.name} {item.variant && `- ${item.variant.name}`}
                      </Link>

                      <div className="text-xs text-emerald-600 font-medium">
                        {item.product.stockStatus === 'in-stock' ? 'In Stock' : 'Low Stock'}
                      </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 rounded-full bg-slate-50">
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity - 1)}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-l-full"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 font-mono type-button text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity + 1)}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-r-full"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="w-24 text-right">
                        <div className="font-mono font-bold text-sm text-slate-900">
                          {formatCurrency(itemPrice * item.quantity)}
                        </div>
                      </div>

                      <button
                        onClick={() => removeItem(itemId)}
                        className="p-2 text-slate-400 hover:text-rose-600"
                        title="Remove item"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )})}
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clearCart}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
                <Link href="/products" className="text-xs font-bold text-sky-600 hover:text-sky-700">
                  ← Continue Shopping Hardware
                </Link>
              </div>
            </div>

            {/* Right Summary Sidebar */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-6">
              <h3 className="font-bold text-base text-slate-900 font-mono pb-3 border-b border-slate-100">
                Order Summary & Pricing
              </h3>

              {/* Coupon Form */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" /> Code <strong>{appliedCoupon}</strong> Active
                  </span>
                  <button onClick={removeCoupon} className="text-rose-600 font-bold">Remove</button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Coupon (e.g. INDUSTRIAL10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 uppercase font-mono"
                  />
                  <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-xs text-rose-500">{couponError}</p>}

              <div className="space-y-2.5 text-xs text-slate-600 border-t border-slate-100 pt-4">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span className="font-mono">-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Freight Shipping</span>
                  <span className="font-mono font-semibold text-emerald-600">
                    {subtotal >= freeShippingThreshold ? "FREE" : formatCurrency(3800)}
                  </span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-slate-900 pt-3 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="font-mono text-sky-700">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-4 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button text-center flex items-center justify-center gap-2 shadow-xl transition-all"
              >
                <span>Proceed to B2B Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
