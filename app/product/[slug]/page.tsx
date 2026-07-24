"use client";

import { useState, use, useEffect } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { SpecsTable } from "@/components/product/SpecsTable";
import { StickyBuyBar } from "@/components/product/StickyBuyBar";
import { ProductCard } from "@/components/product/ProductCard";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useCompareStore } from "@/store/useCompareStore";
import { useToastStore } from "@/store/useToastStore";
import { ProductVariant } from "@/types";
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

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = use(params);
  const product = PRODUCTS.find((p) => p.slug === slug);

  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"specs" | "features" | "applications" | "downloads">("specs");
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    if (product && product.hasVariants && product.variants.length > 0 && !selectedVariant) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedVariant(product.variants[0]);
    }
  }, [product, selectedVariant]);

  if (!product) {
    return notFound();
  }

  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  // Price calculations based on selected variant or base product
  const activePrice = selectedVariant ? selectedVariant.price : product.basePrice;
  const activeComparePrice = selectedVariant ? selectedVariant.compareAtPrice : product.compareAtPrice;
  const activeSku = selectedVariant ? selectedVariant.sku : product.sku;
  const activeStockStatus = selectedVariant ? (selectedVariant.stockQuantity > 0 ? "in-stock" : "out-of-stock") : product.stockStatus;
  
  const discountPercent = activeComparePrice ? calculateDiscount(activePrice, activeComparePrice) : 0;

  const relatedProducts = PRODUCTS.filter(
    (p) => p.categoryId === product.categoryId && p.id !== product.id
  ).slice(0, 3);

  const handleAddToCart = () => {
    // In a real app we'd pass the variant to the cart item too
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

  // Convert ProductImage[] to string[] for Gallery
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
          <Link href={`/category/${product.categoryId}`} className="hover:text-slate-900 capitalize">
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

              {/* Variant Selection */}
              {product.hasVariants && product.variants.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <h3 className="font-bold text-sm text-slate-900 mb-3">Select Configuration:</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariant(v)}
                        className={`px-4 py-2 rounded-xl font-mono text-xs font-bold transition-colors border ${
                          selectedVariant?.id === v.id
                            ? "bg-sky-50 border-sky-500 text-sky-700"
                            : "bg-white border-slate-200 text-slate-600 hover:border-sky-300"
                        }`}
                      >
                        {v.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
                    href="/quote"
                    className="py-4 px-6 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button text-center flex items-center justify-center gap-2 transition-all hover:scale-105"
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Request Volume RFQ</span>
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
              <div className="flex items-center gap-2 text-slate-400 pt-1 border-t border-slate-800">
                <PhoneCall className="w-4 h-4 text-amber-400" />
                <span>Need technical validation? Call 1-800-555-AUTO</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabbed Detail Section */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-lg mb-16">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-8 overflow-x-auto">
            <button
              onClick={() => setActiveTab("specs")}
              className={`font-mono text-xs sm:text-sm font-bold pb-2 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "specs"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Technical Specifications
            </button>
            <button
              onClick={() => setActiveTab("features")}
              className={`font-mono text-xs sm:text-sm font-bold pb-2 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "features"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Hardware Features
            </button>
            <button
              onClick={() => setActiveTab("applications")}
              className={`font-mono text-xs sm:text-sm font-bold pb-2 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "applications"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Target Applications
            </button>
            <button
              onClick={() => setActiveTab("downloads")}
              className={`font-mono text-xs sm:text-sm font-bold pb-2 transition-colors border-b-2 whitespace-nowrap ${
                activeTab === "downloads"
                  ? "border-sky-600 text-sky-600"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              CAD & Datasheet Downloads
            </button>
          </div>

          {activeTab === "specs" && (
            <SpecsTable specifications={product.specifications} />
          )}

          {activeTab === "features" && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              {product.features.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "applications" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {product.applications.map((app, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 font-medium text-xs text-slate-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-sky-500/10 text-sky-600 flex items-center justify-center font-mono type-button">
                    0{idx + 1}
                  </div>
                  <span>{app}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === "downloads" && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                <div>
                  <FileText className="w-8 h-8 text-rose-500 mb-2" />
                  <h4 className="font-bold text-sm text-slate-900">PDF Datasheet</h4>
                  <p className="text-[11px] text-slate-500">Official technical specifications & wiring pinouts.</p>
                </div>
                <button
                  onClick={() => addToast("info", "Downloading Datasheet", "PDF file transfer initiated.")}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white type-button flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF (2.4 MB)
                </button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4">
                <div>
                  <FileText className="w-8 h-8 text-sky-500 mb-2" />
                  <h4 className="font-bold text-sm text-slate-900">3D CAD STEP File</h4>
                  <p className="text-[11px] text-slate-500">SolidWorks & AutoCAD 3D model for mechanical design.</p>
                </div>
                <button
                  onClick={() => addToast("info", "Downloading CAD File", "3D STEP file download initiated.")}
                  className="w-full py-2 rounded-xl bg-slate-900 text-white type-button flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download STEP (5.1 MB)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Related Products Rail */}
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

      {/* Sticky Mobile Buy Bar */}
      <StickyBuyBar product={product} />
    </div>
  );
}
