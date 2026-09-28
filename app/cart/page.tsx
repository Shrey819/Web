"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore, getCartItemId } from "@/store/useCartStore";
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
    syncLivePrices,
  } = useCartStore();

  useEffect(() => {
    syncLivePrices();
  }, []);

  const { addToast } = useToastStore();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const total = getTotal();
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
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
    <div className="bg-[#faf9f5] min-h-screen py-4 sm:py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-3 sm:mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold">Shopping Cart</span>
        </nav>

        <h1 className="text-xl sm:text-3xl font-bold text-slate-900 mb-4 sm:mb-8">
          Shopping Cart ({totalUnits} {totalUnits === 1 ? "Item" : "Items"})
        </h1>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <ShoppingBag className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Your cart is currently empty</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Explore our sensors, PLCs, and drive components to build your industrial automation system.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl sm:rounded-full bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs sm:text-sm shadow-md transition-all"
            >
              Browse Hardware Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-8 items-start">
            {/* Left Item Table */}
            <div className="lg:col-span-8 space-y-3 sm:space-y-4">
              {/* Free Express Shipping Banner */}
              <div className="bg-gradient-to-r from-sky-900 to-slate-900 text-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-sky-800/80 shadow-md">
                <div className="flex items-center justify-between text-xs font-semibold mb-2">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <Truck className="w-4 h-4 text-sky-400 shrink-0" />
                    {remainingForFreeShipping > 0 ? (
                      <span className="text-[11px] sm:text-xs">
                        Add <strong className="text-sky-300 font-bold">{formatCurrency(remainingForFreeShipping)}</strong> more for FREE Express Freight
                      </span>
                    ) : (
                      <span className="text-emerald-400 font-bold flex items-center gap-1 text-[11px] sm:text-xs">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        Qualified for Free Freight Express Dispatch!
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] sm:text-xs text-slate-400">{Math.round(progressPercent)}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-400 to-emerald-400 h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Items List */}
              <div className="border border-slate-200 rounded-2xl sm:rounded-3xl overflow-hidden bg-white shadow-sm divide-y divide-slate-100">
                {items.map((item) => {
                  const itemId = getCartItemId(item.product.id, item.variant?.id, item.buyerNote);
                  const itemSku = item.variant ? item.variant.sku : item.product.sku;
                  const itemPrice = item.variant ? item.variant.price : item.product.basePrice;
                  
                  return (
                  <div key={itemId} className="p-3 sm:p-5 flex items-start sm:items-center gap-3 sm:gap-5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative rounded-xl overflow-hidden bg-slate-950 border border-slate-200 shrink-0">
                      <Image src={item.product.images[0]?.url || "/placeholder.png"} alt={item.product.name} fill className="object-cover" unoptimized />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] sm:text-xs font-bold text-sky-600 uppercase">
                          {item.product.brand}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] sm:text-xs text-slate-400">
                          SKU: {itemSku}
                        </span>
                      </div>

                      <Link href={`/product/${item.product.slug}`} className="font-semibold text-xs sm:text-sm text-slate-900 hover:text-sky-600 line-clamp-1">
                        {(item.product.name || "Product").replace(/\s*-\s*undefined/gi, "")}
                        {item.variant?.name && item.variant.name !== "undefined" && ` - ${item.variant.name}`}
                      </Link>

                      {item.buyerNote && (
                        <div className="mt-1 px-2 py-0.5 rounded bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 inline-block">
                          <span className="font-semibold text-amber-950">Note: </span>
                          <span className="italic">{item.buyerNote}</span>
                        </div>
                      )}

                      {/* Mobile Row: Stepper + Price + Remove */}
                      <div className="flex sm:hidden items-center justify-between pt-1 gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 h-7">
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity - 1)}
                            className="w-7 h-full flex items-center justify-center hover:bg-slate-200 text-slate-700 rounded-l-lg"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-slate-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(itemId, item.quantity + 1)}
                            className="w-7 h-full flex items-center justify-center hover:bg-slate-200 text-slate-700 rounded-r-lg"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="font-bold text-xs text-slate-900">
                            {formatCurrency(itemPrice * item.quantity)}
                          </div>
                          <button
                            onClick={() => removeItem(itemId)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remove item"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Desktop Quantity Selector & Price */}
                    <div className="hidden sm:flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 rounded-full bg-slate-50">
                        <button
                          onClick={() => updateQuantity(itemId, item.quantity - 1)}
                          className="p-1.5 hover:bg-slate-200 text-slate-700 rounded-l-full"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-slate-900">
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
                        <div className="font-bold text-sm text-slate-900">
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
                  ← Continue Shopping
                </Link>
              </div>
            </div>

            {/* Right Summary Sidebar */}
            <div className="lg:col-span-4 bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-lg space-y-4 sm:space-y-6">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 pb-2.5 border-b border-slate-100">
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
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 uppercase"
                  />
                  <button type="submit" className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-xs text-rose-500">{couponError}</p>}

              <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatCurrency(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Freight Shipping</span>
                  <span className="font-semibold text-emerald-600">
                    {subtotal >= freeShippingThreshold ? "FREE" : formatCurrency(3800)}
                  </span>
                </div>
                <div className="flex justify-between text-sm sm:text-base font-extrabold text-slate-900 pt-2.5 border-t border-slate-200">
                  <span>Total Due</span>
                  <span className="text-sky-700">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="w-full py-3 sm:py-3.5 px-4 rounded-xl sm:rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm text-center flex items-center justify-center gap-2 shadow-lg transition-all"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
