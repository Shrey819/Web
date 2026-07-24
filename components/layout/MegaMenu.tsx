"use client";

import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { ArrowRight, Cpu, Zap, Layers, Sparkles } from "lucide-react";

interface MegaMenuProps {
  onClose: () => void;
}

export function MegaMenu({ onClose }: MegaMenuProps) {
  const featuredProduct = PRODUCTS.find((p) => p.featured) || PRODUCTS[0];

  return (
    <div
      className="absolute top-full left-0 right-0 bg-slate-900/95 text-white border-b border-slate-800 shadow-2xl backdrop-blur-xl transition-all duration-300 z-50 py-8 px-6 lg:px-12"
      onMouseLeave={onClose}
    >
      <div className="content-shell grid grid-cols-12 gap-8">
        {/* Category Columns */}
        <div className="col-span-8 grid grid-cols-3 gap-6">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex flex-col gap-3">
              <Link
                href={`/category/${cat.slug}`}
                onClick={onClose}
                className="group flex items-center justify-between font-semibold text-base text-white hover:text-sky-400 transition-colors pb-2 border-b border-slate-800"
              >
                <span>{cat.name}</span>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </Link>
              <p className="type-body-small text-slate-400 leading-relaxed mb-2">
                {cat.description}
              </p>
              <div className="flex flex-col gap-2">
                {cat.subcategories.map((sub) => (
                  <Link
                    key={sub}
                    href={`/products?category=${cat.slug}&sub=${encodeURIComponent(sub)}`}
                    onClick={onClose}
                    className="text-xs text-slate-300 hover:text-sky-400 transition-colors py-1 hover:translate-x-1 duration-200"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Featured Product Promo Card */}
        <div className="col-span-4 bg-slate-800/80 rounded-2xl p-5 border border-slate-700/60 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-sky-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Featured Automation Component</span>
            </div>
            <h4 className="font-semibold text-lg text-white mb-1">
              {featuredProduct.name}
            </h4>
            <p className="text-xs text-slate-300 line-clamp-2 mb-4">
              {featuredProduct.shortDescription}
            </p>
            <div className="type-card-title font-mono text-sky-400 mb-4">
              ${featuredProduct.basePrice.toFixed(2)}{" "}
              {featuredProduct.compareAtPrice && featuredProduct.compareAtPrice > featuredProduct.basePrice && (
                <span className="type-body-small text-slate-400 line-through font-normal">
                  ${featuredProduct.compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Link
              href={`/product/${featuredProduct.slug}`}
              onClick={onClose}
              className="w-full text-center py-2.5 px-4 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs transition-all"
            >
              View Component Specifications
            </Link>
            <Link
              href="/quote"
              onClick={onClose}
              className="w-full text-center py-2 px-4 rounded-full bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-xs transition-all"
            >
              Request Bulk RFQ Discount
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
