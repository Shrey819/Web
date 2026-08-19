"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, Eye, Heart } from "lucide-react";
import { Product } from "@/types";
import { formatCurrency, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useQuickViewStore } from "@/store/useQuickViewStore";
import { useToastStore } from "@/store/useToastStore";

interface CategoryProductCarouselProps {
  products: Product[];
}

export function CategoryProductCarousel({ products }: CategoryProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const { addItem } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { openQuickView } = useQuickViewStore();
  const { addToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const checkScrollState = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  };

  useEffect(() => {
    checkScrollState();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScrollState, { passive: true });
      window.addEventListener("resize", checkScrollState);
    }
    return () => {
      if (el) {
        el.removeEventListener("scroll", checkScrollState);
      }
      window.removeEventListener("resize", checkScrollState);
    };
  }, [products]);

  const handleScroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  if (!products || products.length === 0) {
    return (
      <div className="py-12 text-center text-slate-400 bg-white/50 rounded-2xl border border-slate-200/60">
        <p className="text-sm font-medium">No products currently available in this category.</p>
      </div>
    );
  }

  return (
    <div className="relative group/carousel">
      {/* Navigation Arrows */}
      <button
        onClick={() => handleScroll("left")}
        disabled={!canScrollLeft}
        aria-label="Previous products"
        className={`absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900 text-white shadow-xl border border-slate-700 flex items-center justify-center transition-all duration-200 ${
          canScrollLeft
            ? "opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={() => handleScroll("right")}
        disabled={!canScrollRight}
        aria-label="Next products"
        className={`absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-slate-900 text-white shadow-xl border border-slate-700 flex items-center justify-center transition-all duration-200 ${
          canScrollRight
            ? "opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer"
            : "opacity-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Horizontal Scroll Track */}
      <div
        ref={scrollContainerRef}
        className="flex items-stretch gap-3 sm:gap-4 overflow-x-auto scrollbar-none scroll-smooth pb-4 pt-1 px-1 -mx-1"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => {
          const primaryImage =
            product.images?.find((img) => img.isPrimary)?.url ||
            product.images?.[0]?.url ||
            "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80";

          const discountPercent = product.compareAtPrice
            ? calculateDiscount(product.basePrice, product.compareAtPrice)
            : 0;

          const isWishlisted = mounted ? isInWishlist(product.id) : false;

          return (
            <div
              key={product.id}
              className="shrink-0 w-[68vw] min-w-[210px] max-w-[240px] sm:w-[220px] md:w-[210px] lg:w-[220px] xl:w-[230px] group/card bg-white rounded-2xl border border-slate-200/80 hover:border-sky-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div>
                {/* Product Image Box */}
                <div className="relative aspect-square w-full bg-slate-950 overflow-hidden border-b border-slate-100">
                  <Image
                    src={primaryImage}
                    alt={product.name}
                    fill
                    sizes="(max-width: 640px) 70vw, 240px"
                    className="object-cover group-hover/card:scale-108 transition-transform duration-500"
                    unoptimized
                  />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
                    {discountPercent > 0 ? (
                      <span className="bg-rose-600 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
                        -{discountPercent}%
                      </span>
                    ) : product.stockStatus === "in-stock" ? (
                      <span className="bg-slate-900/80 text-emerald-400 backdrop-blur-sm font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                        LIMITED STOCK
                      </span>
                    ) : null}
                  </div>

                  {/* Actions overlay */}
                  <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-100 sm:opacity-0 sm:group-hover/card:opacity-100 transition-all duration-200 z-10">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const added = toggleWishlist(product);
                        addToast(
                          "info",
                          added ? "Wishlist Saved" : "Wishlist Removed",
                          product.name
                        );
                      }}
                      className={`w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md transition-colors ${
                        isWishlisted
                          ? "bg-rose-500 text-white"
                          : "bg-slate-900/80 hover:bg-slate-900 text-white"
                      }`}
                      aria-label="Wishlist"
                    >
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isWishlisted ? "fill-white" : ""
                        }`}
                      />
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openQuickView(product);
                      }}
                      className="w-7 h-7 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white flex items-center justify-center backdrop-blur-md transition-colors"
                      aria-label="Quick View"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="p-3 space-y-1">
                  <div className="text-[10px] font-mono font-bold text-sky-600 uppercase tracking-wider line-clamp-1">
                    {product.brand}
                  </div>

                  <Link href={`/product/${product.slug}`}>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover/card:text-sky-600 transition-colors line-clamp-2 leading-snug min-h-[2.4rem]">
                      {product.name}
                    </h4>
                  </Link>
                </div>
              </div>

              {/* Footer / Price & Add */}
              <div className="p-3 pt-0 flex items-center justify-between gap-2 border-t border-slate-100/60 mt-2">
                <div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                    {formatCurrency(product.basePrice)}
                  </div>
                  {product.compareAtPrice &&
                    product.compareAtPrice > product.basePrice && (
                      <div className="font-mono text-[10px] text-slate-400 line-through">
                        {formatCurrency(product.compareAtPrice)}
                      </div>
                    )}
                </div>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem(product, 1);
                    addToast("success", "Added to Cart", product.name);
                  }}
                  className="p-2 rounded-full bg-slate-900 hover:bg-sky-600 text-white transition-colors flex items-center justify-center shadow"
                  aria-label="Add to cart"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
