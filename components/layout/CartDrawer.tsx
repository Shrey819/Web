"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/useCartStore";
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, ShieldCheck, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
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

  // Lock body scroll on mobile when cart drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const subtotal = getSubtotal();
  const discount = getDiscountAmount();
  const total = getTotal();
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
  const freeShippingThreshold = 40000;
  const progressPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const res = applyCoupon(couponInput);
    if (!res.success) {
      setCouponError(res.message);
    } else {
      setCouponInput("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[9999]"
          />

          {/* Cart Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white text-slate-900 z-[10000] flex flex-col justify-between shadow-2xl overflow-hidden"
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/80">
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-5 h-5 text-sky-600" />
                  <h3 className="font-bold text-lg text-slate-900 tracking-tight">
                    Industrial Cart ({totalUnits} {totalUnits === 1 ? "Item" : "Items"})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    closeCart();
                  }}
                  className="p-2 rounded-full hover:bg-slate-200 active:bg-slate-300 text-slate-500 hover:text-slate-900 transition-colors touch-manipulation cursor-pointer"
                  aria-label="Close cart drawer"
                >
                  <X className="w-5 h-5 pointer-events-none" />
                </button>
              </div>

              {/* Free Express Shipping Progress Bar */}
              <div className="bg-sky-50/80 px-5 py-3 border-b border-sky-100">
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 mb-1.5">
                  {remainingForFreeShipping > 0 ? (
                    <span>
                      Add <strong className="text-sky-700 font-bold">{formatCurrency(remainingForFreeShipping)}</strong> more for FREE Express Freight
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      Free Express Freight Qualified!
                    </span>
                  )}
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-emerald-500 h-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-base mb-1">
                    Your cart is currently empty
                  </h4>
                  <p className="type-body-small text-slate-500 max-w-xs mb-6">
                    Browse our sensors, PLCs, and drive components to build your industrial automation system.
                  </p>
                  <Link
                    href="/products"
                    onClick={closeCart}
                    className="px-6 py-2.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md transition-all"
                  >
                    Browse Industrial Products
                  </Link>
                </div>
              ) : (
                items.map((item) => {
                  const itemId = item.variant ? `${item.product.id}-${item.variant.id}` : item.product.id;
                  const itemSku = item.variant ? item.variant.sku : item.product.sku;
                  const itemPrice = item.variant ? item.variant.price : item.product.basePrice;

                  return (
                    <div key={itemId} className="flex gap-4 group/item">
                      {/* Item Image */}
                      <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden relative shrink-0 border border-slate-200 group-hover/item:border-sky-300 transition-colors">
                        <Image
                          src={item.product.images[0]?.url || "/placeholder.png"}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex justify-between items-start gap-2">
                            <Link
                              href={`/product/${item.product.slug}`}
                              onClick={closeCart}
                              className="font-bold text-sm text-slate-900 group-hover/item:text-sky-600 line-clamp-1 leading-snug"
                            >
                              {(item.product.name || "Product").replace(/\s*-\s*undefined/gi, "")}
                              {item.variant?.name && item.variant.name !== "undefined" && ` - ${item.variant.name}`}
                            </Link>
                            <button
                              onClick={() => removeItem(itemId)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-mono text-[10px] text-sky-600 font-bold uppercase">
                              {item.product.brand}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[10px] text-slate-500">
                              SKU: {itemSku}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-slate-200 rounded-full bg-slate-50/50">
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity - 1)}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded-l-full"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-mono type-button text-slate-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(itemId, item.quantity + 1)}
                              className="p-1 hover:bg-slate-200 text-slate-600 rounded-r-full"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="font-mono font-bold text-sm text-slate-900">
                            {formatCurrency(itemPrice * item.quantity)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary & Actions */}
            {items.length > 0 && (
              <div className="p-5 border-t border-slate-200 bg-slate-50/90 flex flex-col gap-3">
                {/* Coupon Input */}
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded-xl">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Tag className="w-3.5 h-3.5 text-emerald-600" />
                      Code <strong>{appliedCoupon}</strong> Applied
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-slate-400 hover:text-rose-600 font-bold"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Promo code (e.g. INDUSTRIAL10)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 uppercase font-mono"
                    />
                    <button
                      type="submit"
                      className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                    >
                      Apply
                    </button>
                  </form>
                )}
                {couponError && <p className="text-[11px] text-rose-500">{couponError}</p>}

                {/* Subtotal Calculation */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-900">{formatCurrency(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Discount</span>
                      <span className="font-mono">-{formatCurrency(discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Estimated Total</span>
                    <span className="font-mono text-sky-700">{formatCurrency(total)}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col gap-2 pt-2">
                  <Link
                    href="/checkout"
                    onClick={closeCart}
                    className="w-full py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    <span>Proceed to B2B Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="w-full py-2.5 px-4 rounded-full border border-slate-300 hover:bg-slate-100 text-slate-800 font-medium text-xs text-center transition-colors"
                  >
                    View Full Cart & Shipping Calculator
                  </Link>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
