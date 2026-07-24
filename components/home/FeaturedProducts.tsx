"use client";

import { useState } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState<"all" | "sensors" | "plcs" | "drives">("all");

  const filteredProducts =
    activeTab === "all"
      ? PRODUCTS.slice(0, 10)
      : PRODUCTS.filter((p) => p.categoryId === activeTab).slice(0, 10);

  return (
    <section className="py-20 bg-white border-b border-slate-200">
      <div className="content-shell">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div>
            <div className="inline-flex items-center gap-2 type-label text-sky-600 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Certified Stock</span>
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
                activeTab === "sensors"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Sensors
            </button>
            <button
              onClick={() => setActiveTab("plcs")}
              className={`px-4 py-2 rounded-full type-button transition-all whitespace-nowrap ${
                activeTab === "plcs"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              PLCs & Control
            </button>
            <button
              onClick={() => setActiveTab("drives")}
              className={`px-4 py-2 rounded-full type-button transition-all whitespace-nowrap ${
                activeTab === "drives"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Drives & Motors
            </button>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-6 mb-12">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Catalog CTA */}
        <div className="text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-slate-900 hover:bg-slate-800 text-white type-button shadow-xl transition-all hover:scale-105"
          >
            <span>Explore Complete 1,500+ Hardware Inventory</span>
            <ArrowRight className="w-4 h-4 text-sky-400" />
          </Link>
        </div>
      </div>
    </section>
  );
}
