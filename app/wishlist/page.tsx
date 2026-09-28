"use client";

import Link from "next/link";
import { useWishlistStore } from "@/store/useWishlistStore";
import { ProductCard } from "@/components/product/ProductCard";
import { Heart, ChevronRight, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="bg-[#faf9f5] min-h-screen py-4 sm:py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 mb-3 sm:mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-semibold">Saved Wishlist</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-8 pb-3 sm:pb-4 border-b border-slate-200 gap-2">
          <div>
            <h1 className="text-xl sm:text-3xl font-bold text-slate-900">
              Saved Wishlist ({items.length})
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Keep track of components specified for future project bills of materials.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Clear All Saved
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-400">
              <Heart className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <h3 className="font-bold text-base sm:text-lg text-slate-900">No saved items in wishlist</h3>
            <p className="text-xs sm:text-sm text-slate-500">
              Click the heart icon on any component card to save items for future reference.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl sm:rounded-full bg-slate-900 text-white font-semibold text-xs sm:text-sm shadow-md"
            >
              Browse Products Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
