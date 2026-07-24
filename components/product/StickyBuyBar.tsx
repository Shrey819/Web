"use client";

import { useState, useEffect } from "react";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { ShoppingBag, ChevronUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export function StickyBuyBar({ product }: { product: Product }) {
  const [isVisible, setIsVisible] = useState(false);
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  useEffect(() => {
    const handleScroll = () => {
      // Show when scrolling past 500px down
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAddToCart = () => {
    addItem(product, 1);
    addToast("success", "Added to Cart", `1x ${product.name} added to cart.`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] p-4 sm:p-5 transition-transform duration-300 ease-in-out lg:hidden flex items-center justify-between gap-4 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-xs text-slate-900 truncate">
          {product.name}
        </h4>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sm text-sky-600">
            {formatCurrency(product.basePrice)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.basePrice && (
            <span className="font-mono text-[10px] text-slate-400 line-through">
              {formatCurrency(product.compareAtPrice)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={scrollToTop}
          className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>

        {product.hasVariants ? (
          <button
            onClick={scrollToTop}
            className="h-10 px-6 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center gap-2"
          >
            <span>Options</span>
          </button>
        ) : (
          <button
            onClick={handleAddToCart}
            className="h-10 px-6 rounded-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/20"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add</span>
          </button>
        )}
      </div>
    </div>
  );
}
