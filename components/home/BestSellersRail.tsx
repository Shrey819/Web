"use client";

import { useRef } from "react";
import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronLeft, ChevronRight, Flame, ArrowRight } from "lucide-react";
import { BestSellersConfig, DEFAULT_BEST_SELLERS } from "@/lib/homepage";

export function BestSellersRail({ config }: { config?: BestSellersConfig }) {
  const currentConfig = config || DEFAULT_BEST_SELLERS;
  const scrollRef = useRef<HTMLDivElement>(null);
  const bestSellers = PRODUCTS.filter((p) => p.bestSeller || p.rating >= 4.9);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = direction === "left" ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  return (
    <section className="py-20 bg-[#faf9f5] border-b border-slate-200 overflow-hidden">
      <div className="content-shell">
        {/* Header with Rail Controls */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 type-label text-rose-600 mb-2">
              <Flame className="w-4 h-4 fill-rose-500" />
              <span>{currentConfig.eyebrow || "Highest B2B Demand"}</span>
            </div>
            <h2 className="type-display-section text-slate-900">
              {currentConfig.title || "Top Best Sellers & Fast Movers"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="w-11 h-11 rounded-full bg-white border border-slate-200 hover:bg-slate-900 hover:text-white flex items-center justify-center shadow-md transition-colors"
              aria-label="Previous best sellers"
              suppressHydrationWarning
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="w-11 h-11 rounded-full bg-white border border-slate-200 hover:bg-slate-900 hover:text-white flex items-center justify-center shadow-md transition-colors"
              aria-label="Next best sellers"
              suppressHydrationWarning
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Horizontal Draggable Rail */}
        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto pb-6 scrollbar-none snap-x snap-mandatory"
        >
          {bestSellers.map((product) => (
            <div
              key={product.id}
              className="w-[280px] sm:w-[320px] shrink-0 snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
