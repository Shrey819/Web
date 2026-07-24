"use client";

import Link from "next/link";
import { useWishlistStore } from "@/store/useWishlistStore";
import { ProductCard } from "@/components/product/ProductCard";
import { Heart, ChevronRight, Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { items, clearWishlist } = useWishlistStore();

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Saved Wishlist</span>
        </nav>

        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-200">
          <div>
            <h1 className="text-3xl font-mono font-extrabold text-slate-900">
              Saved Hardware Items ({items.length})
            </h1>
            <p className="type-body-small text-slate-500 mt-1">
              Keep track of components specified for future project bills of materials.
            </p>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearWishlist}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> Clear All Saved
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-400">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="type-card-title text-slate-900">No saved items in wishlist</h3>
            <p className="type-body-small text-slate-500">
              Click the heart icon on any sensor, PLC, or VFD card to save items for future reference.
            </p>
            <Link
              href="/products"
              className="inline-block px-8 py-3 rounded-full bg-slate-900 text-white type-button shadow-md"
            >
              Browse Products Catalog
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
