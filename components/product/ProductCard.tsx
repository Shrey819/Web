"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCompareStore } from "@/store/useCompareStore";
import { useQuickViewStore } from "@/store/useQuickViewStore";
import { useToastStore } from "@/store/useToastStore";
import { Eye, Heart, ArrowUpDown, ShoppingBag, Star, Check, ListTree } from "lucide-react";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface ProductCardProps {
  product: Product;
  layout?: "grid" | "list";
}

export function ProductCard({ product, layout = "grid" }: ProductCardProps) {
  const [mounted, setMounted] = useState(false);
  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  const { openQuickView } = useQuickViewStore();
  const { addToast } = useToastStore();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isWishlisted = mounted ? isInWishlist(product.id) : false;
  const isCompared = mounted ? isInCompare(product.id) : false;
  
  const discountPercent = product.compareAtPrice 
    ? calculateDiscount(product.basePrice, product.compareAtPrice) 
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.hasVariants) {
      router.push(`/product/${product.slug}`);
      return;
    }

    addItem(product, 1);
    addToast("success", "Added to Cart", `${product.name} added to cart.`);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = toggleWishlist(product);
    addToast("info", added ? "Saved to Wishlist" : "Removed from Wishlist", product.name);
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const res = toggleCompare(product);
    if (res.limitReached) {
      addToast("warning", "Compare Limit Reached", "You can compare up to 4 components simultaneously.");
    } else {
      addToast("info", res.added ? "Added to Compare Matrix" : "Removed from Compare", product.name);
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openQuickView(product);
  };

  const primaryImage = product.images.find(img => img.isPrimary)?.url || product.images[0]?.url || "/placeholder.png";

  if (layout === "list") {
    return (
      <div className="group bg-white rounded-3xl p-5 border border-slate-200/80 hover:border-sky-500/40 hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row gap-6 items-center">
        {/* Product Image */}
        <div className="relative w-full md:w-56 h-48 rounded-2xl overflow-hidden bg-slate-950 shrink-0 border border-slate-200">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />
          {discountPercent > 0 && (
            <span className="absolute top-3 left-3 bg-rose-500 text-white font-bold font-mono text-[10px] px-2.5 py-1 rounded-full uppercase">
              -{discountPercent}%
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="type-label text-sky-600 uppercase">
              {product.brand}
            </span>
            <span className="text-slate-300">•</span>
            <span className="font-mono type-body-small text-slate-500">
              SKU: {product.sku}
            </span>
          </div>

          <Link href={`/product/${product.slug}`}>
            <h3 className="font-bold text-lg text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="type-body-small text-slate-600 line-clamp-2 leading-relaxed">
            {product.shortDescription}
          </p>

          <div className="flex flex-wrap gap-x-4 gap-y-1 type-body-small text-slate-500 pt-1">
            <span className={`flex items-center gap-1 font-medium ${product.stockStatus === 'in-stock' ? 'text-emerald-600' : 'text-amber-600'}`}>
              <Check className="w-3.5 h-3.5" /> 
              {product.stockStatus === 'in-stock' ? 'In Stock' : 'Low Stock'}
            </span>
            {product.hasVariants && (
               <span className="flex items-center gap-1">
                 <ListTree className="w-3.5 h-3.5" /> Multiple Variants Available
               </span>
            )}
          </div>
        </div>

        {/* Actions & Price */}
        <div className="w-full md:w-48 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 gap-4 shrink-0">
          <div className="text-right">
            <div className="type-section-title font-mono text-slate-900">
              {product.hasVariants ? "From " : ""}{formatCurrency(product.basePrice)}
            </div>
            <div className="type-technical text-slate-400">
              {product.unitLabel}
            </div>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
              <div className="type-technical text-slate-400 line-through mt-1">
                {formatCurrency(product.compareAtPrice)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={handleQuickView}
              className="p-2.5 rounded-full border border-slate-200 hover:bg-slate-100 text-slate-600"
              title="Quick View"
              aria-label="Quick View"
              suppressHydrationWarning
            >
              <Eye className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`p-2.5 rounded-full border transition-colors ${
                isWishlisted
                  ? "bg-rose-50 border-rose-200 text-rose-600"
                  : "border-slate-200 hover:bg-slate-100 text-slate-600"
              }`}
              title="Wishlist"
              aria-label="Wishlist"
              suppressHydrationWarning
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-rose-500" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleAddToCart}
              className="flex-1 py-2.5 px-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-md"
              suppressHydrationWarning
            >
              {product.hasVariants ? (
                <>
                  <ListTree className="w-4 h-4 text-sky-400" />
                  <span>Options</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  <span>Add</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-sky-500/40 hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden">
      {/* Top Badges & Actions Overlay */}
      <div>
        <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-950 mb-4 border border-slate-200/80">
          <Image
            src={primaryImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-108 transition-transform duration-500"
            unoptimized
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {discountPercent > 0 && (
              <span className="bg-rose-500 text-white font-bold font-mono text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                -{discountPercent}%
              </span>
            )}
          </div>

          {/* Action Buttons Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 translate-x-0 sm:translate-x-2 sm:group-hover:translate-x-0 z-10">
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-colors ${
                isWishlisted
                  ? "bg-rose-500 text-white"
                  : "bg-slate-900/80 hover:bg-slate-900 text-slate-200"
              }`}
              title="Save to wishlist"
              aria-label="Save to wishlist"
              suppressHydrationWarning
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? "fill-white" : ""}`} />
            </button>

            <button
              type="button"
              onClick={handleToggleCompare}
              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md backdrop-blur-md transition-colors ${
                isCompared
                  ? "bg-sky-500 text-slate-950"
                  : "bg-slate-900/80 hover:bg-slate-900 text-slate-200"
              }`}
              title="Add to compare matrix"
              aria-label="Add to compare matrix"
              suppressHydrationWarning
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleQuickView}
              className="w-8 h-8 rounded-full bg-slate-900/80 hover:bg-slate-900 text-slate-200 flex items-center justify-center shadow-md backdrop-blur-md transition-colors"
              title="Quick View"
              aria-label="Quick View"
              suppressHydrationWarning
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Brand & Part Number */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="type-label font-bold text-sky-600 uppercase tracking-wider">
            {product.brand}
          </span>
          <span className="type-technical text-[10px] text-slate-400">
            SKU: {product.sku}
          </span>
        </div>

        {/* Title */}
        <Link href={`/product/${product.slug}`}>
          <h3 className="type-product-title text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug mb-2">
            {product.name}
          </h3>
        </Link>
      </div>

      {/* Footer: Rating, Stock, Price & Cart CTA */}
      <div className="pt-3 border-t border-slate-100 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-bold text-slate-800">{product.rating}</span>
            <span className="text-slate-400">({product.reviewCount})</span>
          </div>

          <span className={`text-[11px] font-semibold ${product.stockStatus === 'in-stock' ? 'text-emerald-600' : 'text-amber-600'}`}>
            {product.stockStatus === 'in-stock' ? 'In Stock' : 'Low Stock'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="type-product-title font-mono text-slate-900 leading-tight">
              {product.hasVariants ? "From " : ""}{formatCurrency(product.basePrice)}
            </div>
            {product.compareAtPrice && product.compareAtPrice > product.basePrice ? (
              <div className="type-technical text-[11px] font-mono text-slate-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </div>
            ) : (
              <div className="type-technical text-[11px] font-mono text-slate-400">
                {product.unitLabel}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="py-2 px-3.5 rounded-full bg-slate-900 hover:bg-sky-600 text-white font-medium text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
            aria-label="Add product to cart"
            suppressHydrationWarning
          >
            {product.hasVariants ? (
              <>
                <ListTree className="w-3.5 h-3.5" />
                <span>Options</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
