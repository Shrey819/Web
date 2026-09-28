"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PRODUCTS as MOCK_PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRight, Sparkles } from "lucide-react";
import { FeaturedCatalogConfig, DEFAULT_FEATURED_CATALOG } from "@/lib/homepage";

interface FeaturedProductsProps {
  initialProducts?: Product[];
  config?: FeaturedCatalogConfig;
}

export function FeaturedProducts({ initialProducts, config }: FeaturedProductsProps) {
  const currentConfig = config || DEFAULT_FEATURED_CATALOG;
  const [activeTab, setActiveTab] = useState<string>("all");
  const [products, setProducts] = useState<Product[]>(initialProducts || MOCK_PRODUCTS);

  useEffect(() => {
    if (initialProducts && initialProducts.length > 0) {
      setProducts(initialProducts);
    }
  }, [initialProducts]);

  const filteredProducts =
    activeTab === "all"
      ? products.slice(0, 10)
      : products
          .filter((p) => {
            const cat = (p.categoryId || "").toLowerCase();
            const cats = (p.categoryIds || []).map((c) => (c || "").toLowerCase());
            const target = activeTab.toLowerCase();
            return (
              cat === target ||
              cat.includes(target) ||
              cats.some((c) => c === target || c.includes(target))
            );
          })
          .slice(0, 10);

  return (
    <section className="py-8 sm:py-16 bg-white border-b border-slate-200">
      <div className="content-shell">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-10 gap-3 sm:gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 mb-1 sm:mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentConfig.eyebrow || "Hardware Catalog"}</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900">
              {currentConfig.title || "Featured Components"}
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl sm:rounded-full bg-slate-100 border border-slate-200 overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              suppressHydrationWarning
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {currentConfig.allTabLabel || "All Top Components"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ballscrew")}
              suppressHydrationWarning
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "ballscrew" || activeTab === "sensors"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {currentConfig.sensorsTabLabel || "Ballscrews"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("linear-guideway")}
              suppressHydrationWarning
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "linear-guideway" || activeTab === "plcs"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {currentConfig.plcsTabLabel || "Linear Guideways"}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("actuators")}
              suppressHydrationWarning
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === "actuators" || activeTab === "motors"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {currentConfig.motorsTabLabel || "Actuators"}
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-8 sm:mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-2.5 sm:px-8 sm:py-3.5 rounded-xl sm:rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs sm:text-sm shadow-md transition-all active:scale-95"
          >
            <span>Explore Entire Hardware Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
