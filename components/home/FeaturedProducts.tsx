"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { PRODUCTS as MOCK_PRODUCTS } from "@/data/products";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRight, Sparkles } from "lucide-react";

interface FeaturedProductsProps {
  initialProducts?: Product[];
}

export function FeaturedProducts({ initialProducts }: FeaturedProductsProps) {
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
      : products.filter((p) => p.categoryId === activeTab || p.categoryId.includes(activeTab)).slice(0, 10);

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="content-shell">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 type-label text-sky-600 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Live Database Catalog</span>
            </div>
            <h2 className="type-section-title text-slate-900">
              Featured Industrial Components
            </h2>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-full bg-slate-100 border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-full type-button transition-all whitespace-nowrap ${
                activeTab === "all"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Top Components
            </button>
            <button
              onClick={() => setActiveTab("sensors")}
              className={`px-4 py-2 rounded-full type-button transition-all whitespace-nowrap ${
                activeTab === "sensors" || activeTab === "cat_sensors"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sensors
            </button>
            <button
              onClick={() => setActiveTab("plcs")}
              className={`px-4 py-2 rounded-full type-button transition-all whitespace-nowrap ${
                activeTab === "plcs" || activeTab === "cat_plcs"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              PLCs
            </button>
            <button
              onClick={() => setActiveTab("motors")}
              className={`px-4 py-2 rounded-full type-button transition-all whitespace-nowrap ${
                activeTab === "motors" || activeTab === "cat_motors"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Motors & Drives
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button shadow-lg shadow-slate-900/10 transition-all hover:scale-105"
          >
            <span>Explore Entire Hardware Inventory</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
