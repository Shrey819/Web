"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Product, ProductVariant } from "@/types";
import { ProductGallery } from "@/components/product/ProductGallery";
import { SpecsTable } from "@/components/product/SpecsTable";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCompareStore } from "@/store/useCompareStore";
import { useToastStore } from "@/store/useToastStore";
import {
  ChevronRight,
  Star,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  ShoppingBag,
  Heart,
  ArrowUpDown,
  FileText,
  Download,
  PhoneCall,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { formatCurrency, calculateDiscount } from "@/lib/utils";

interface ProductDetailClientProps {
  product: Product;
  relatedProducts?: Product[];
}

export function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailClientProps) {
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "features" | "applications" | "downloads">("specs");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (product && product.hasVariants && product.variants.length > 0 && !selectedVariant) {
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  if (!product) {
    return notFound();
  }

  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  const activePrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const activeComparePrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice;
  const activeSku = selectedVariant ? selectedVariant.sku : product.sku;
  const activeStockStatus = selectedVariant ? (selectedVariant.stockQuantity > 0 ? "in-stock" : "out-of-stock") : product.stockStatus;
  
  const discountPercent = activeComparePrice ? calculateDiscount(activePrice, activeComparePrice) : 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    addToast("success", "Added to Cart", `${quantity}x ${selectedVariant ? selectedVariant.name : product.name} added to cart.`);
  };

  const handleToggleWishlist = () => {
    const added = toggleWishlist(product);
    addToast("info", added ? "Saved to Wishlist" : "Removed from Wishlist", product.name);
  };

  const handleToggleCompare = () => {
    const res = toggleCompare(product);
    if (res.limitReached) {
      addToast("warning", "Limit Reached", "Max 4 items in comparison matrix.");
    } else {
      addToast("info", res.added ? "Added to Compare" : "Removed from Compare", product.name);
    }
  };

  const imageUrls = product.images.map(img => img.url);

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200 pb-24 lg:pb-16">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6 overflow-x-auto">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/products" className="hover:text-slate-900">
            Catalog
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href={`/products?category=${product.categoryId}`} className="hover:text-slate-900 capitalize">
            {product.categoryId.replace("-", " ")}
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold truncate max-w-[200px]">
            {product.name}
          </span>
        </nav>

        {/* Product PDP Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mb-16">
          {/* Left: Gallery */}
          <div className="lg:col-span-6">
            <ProductGallery images={imageUrls} productName={product.name} />
          </div>

          {/* Right: Info, Price & Actions */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono type-label text-sky-600 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
                  {product.brand}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono type-body-small text-slate-500">
                  SKU: {activeSku}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug font-mono">
                {product.name}
              </h1>

              {/* Rating & Stock */}
              <div className="flex items-center gap-4 mt-3 text-xs">
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold text-slate-900 ml-1">{product.rating}</span>
                  <span className="text-slate-400 ml-1">({product.reviewCount} Reviews)</span>
                </div>
                <span className="text-slate-300">|</span>
                <span className={`font-semibold flex items-center gap-1 ${activeStockStatus === 'in-stock' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {activeStockStatus === 'in-stock' ? "In Stock - Ready to Ship" : "Low Stock / Backorder"}
                </span>
              </div>
            </div>

            {/* Price Box */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
              <div className="flex items-baseline gap-4">
                <span className="text-3xl font-bold font-mono text-slate-900">
                  {formatCurrency(activePrice)}
                </span>
                <span className="type-technical text-slate-400">
                  {product.unitLabel}
                </span>
                {activeComparePrice && activeComparePrice > activePrice && (
                  <span className="text-base font-mono text-slate-400 line-through">
                    {formatCurrency(activeComparePrice)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="bg-rose-500 text-white font-mono type-button px-2.5 py-0.5 rounded-full uppercase ml-auto">
                    Save {discountPercent}%
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {product.description}
              </p>

              {/* Quantity Selector & Action Buttons */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-300 rounded-full bg-slate-50">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-slate-200 text-slate-700 rounded-l-full"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 font-mono font-bold text-base text-slate-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="p-3 hover:bg-slate-200 text-slate-700 rounded-r-full"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleToggleWishlist}
                    className={`p-3.5 rounded-full border transition-colors ${
                      isWishlisted
                        ? "bg-rose-50 border-rose-200 text-rose-600"
                        : "border-slate-300 hover:bg-slate-100 text-slate-700"
                    }`}
                    title="Wishlist"
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? "fill-rose-500" : ""}`} />
                  </button>

                  <button
                    onClick={handleToggleCompare}
                    className={`p-3.5 rounded-full border transition-colors ${
                      isCompared
                        ? "bg-sky-50 border-sky-200 text-sky-600"
                        : "border-slate-300 hover:bg-slate-100 text-slate-700"
                    }`}
                    title="Compare"
                    aria-label="Compare"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={handleAddToCart}
                    className="py-4 px-6 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-xl shadow-sky-600/20 transition-all hover:scale-105"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart</span>
                  </button>

                  <Link
                    href="/checkout"
                    className="py-4 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button text-center flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Buy Now</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Support Callout Box */}
            <div className="bg-slate-900 text-slate-300 rounded-3xl p-5 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-white font-bold">
                <Truck className="w-4 h-4 text-sky-400" />
                <span>Next-day dispatch for in-stock configurations</span>
              </div>
              <div className="flex items-center gap-2 text-white font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>100% Genuine Industrial Hardware from Authorized Distributor</span>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <h3 className="type-card-title font-mono text-slate-900">
              Cross-Compatible & Related Hardware
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      <StickyBuyBar product={product} />
    </div>
  );
}
