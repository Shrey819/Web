"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useQuickViewStore } from "@/store/useQuickViewStore";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useToastStore } from "@/store/useToastStore";
import { X, ShoppingBag, Heart, Star, ShieldCheck, ArrowRight, Plus, Minus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "@/lib/utils";

export function QuickViewModal() {
  const { product, isOpen, closeQuickView } = useQuickViewStore();
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { addToast } = useToastStore();

  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    addItem(product, quantity);
    addToast("success", "Added to Industrial Cart", `${quantity}x ${product.name} added.`);
    closeQuickView();
  };

  const handleToggleWishlist = () => {
    const added = toggleWishlist(product);
    if (added) {
      addToast("info", "Saved to Wishlist", `${product.name} saved for later.`);
    } else {
      addToast("info", "Removed from Wishlist", `${product.name} removed.`);
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
            onClick={closeQuickView}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6"
          >
            {/* Modal Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white text-slate-900 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 relative"
            >
              {/* Close button */}
              <button
                onClick={closeQuickView}
                className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
                {/* Left: Gallery */}
                <div className="flex flex-col gap-4">
                  <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 shadow-inner">
                    <Image
                      src={product.images[activeImageIndex]?.url || product.images[0]?.url || "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="bg-emerald-500/90 backdrop-blur-md text-slate-950 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider font-mono">
                        {product.stockStatus === 'in-stock' ? `In Stock` : "Backorder"}
                      </span>
                    </div>
                  </div>

                  {/* Thumbnail Row */}
                  {product.images.length > 1 && (
                    <div className="flex gap-2">
                      {product.images.map((img, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveImageIndex(idx)}
                          className={`w-16 h-14 relative rounded-xl overflow-hidden border-2 transition-all ${
                            activeImageIndex === idx
                              ? "border-sky-600 shadow-md scale-105"
                              : "border-slate-200 opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Image src={img.url} alt="" fill className="object-cover" unoptimized />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Info & Controls */}
                <div className="flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono type-label text-sky-600">
                        {product.brand}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono type-body-small text-slate-500">
                        SKU: {product.sku}
                      </span>
                    </div>

                    <h2 className="text-xl sm:type-section-title text-slate-900 mb-2 leading-tight">
                      {product.name}
                    </h2>

                    {/* Rating & Reviews */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center text-amber-400">
                        <Star className="w-4 h-4 fill-amber-400" />
                        <span className="text-xs font-bold text-slate-900 ml-1">
                          {product.rating}
                        </span>
                      </div>
                      <span className="type-body-small text-slate-400">
                        ({product.reviewCount} verified B2B reviews)
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-baseline gap-3 mb-4 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="type-section-title font-mono text-slate-900">
                        {formatCurrency(product.basePrice)}
                      </span>
                      {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
                        <span className="text-sm font-mono text-slate-400 line-through">
                          {formatCurrency(product.compareAtPrice)}
                        </span>
                      )}
                      <span className="text-xs font-semibold text-emerald-600 ml-auto">
                        {product.unitLabel}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed mb-4">
                      {product.shortDescription}
                    </p>

                    {/* Features checklist */}
                    <div className="space-y-1.5 mb-6">
                      {product.features.slice(0, 3).map((feat, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quantity & CTA Buttons */}
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center border border-slate-200 rounded-full bg-slate-50">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="p-2 hover:bg-slate-200 text-slate-700 rounded-l-full"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-3 font-mono font-bold text-sm text-slate-900">
                          {quantity}
                        </span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="p-2 hover:bg-slate-200 text-slate-700 rounded-r-full"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={handleToggleWishlist}
                        className={`p-3 rounded-full border transition-colors ${
                          isWishlisted
                            ? "bg-rose-50 border-rose-200 text-rose-600"
                            : "border-slate-200 hover:bg-slate-100 text-slate-600"
                        }`}
                        aria-label="Wishlist toggle"
                      >
                        <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500" : ""}`} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={handleAddToCart}
                        className="py-3 px-4 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 shadow-lg shadow-sky-600/20 transition-all"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>

                      <Link
                        href={`/product/${product.slug}`}
                        onClick={closeQuickView}
                        className="py-3 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs text-center flex items-center justify-center gap-2 transition-all"
                      >
                        <span>Full Specifications</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
