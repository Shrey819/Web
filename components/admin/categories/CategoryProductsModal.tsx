"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCategoryProducts, CategoryProduct } from "@/app/actions/category";
import { formatCurrency } from "@/lib/utils";
import { X, Search, ArrowUpDown, Package, ExternalLink, Edit, Loader2, Image as ImageIcon } from "lucide-react";

interface CategoryProductsModalProps {
  category: {
    id: string;
    name: string;
    slug: string;
    product_count: number;
  };
  onClose: () => void;
}

export function CategoryProductsModal({ category, onClose }: CategoryProductsModalProps) {
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest" | "oldest" | "price-low" | "price-high">("newest");

  useEffect(() => {
    let isMounted = true;
    async function loadProducts() {
      setIsLoading(true);
      const res = await getCategoryProducts(category.id || category.slug);
      if (isMounted) {
        if (res.success) {
          setProducts(res.products);
        }
        setIsLoading(false);
      }
    }
    loadProducts();
    return () => {
      isMounted = false;
    };
  }, [category]);

  // Filter & Sort logic
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        if (sortBy === "name-asc") return a.name.localeCompare(b.name);
        if (sortBy === "name-desc") return b.name.localeCompare(a.name);
        if (sortBy === "newest") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === "price-low") return a.basePrice - b.basePrice;
        if (sortBy === "price-high") return b.basePrice - a.basePrice;
        return 0;
      });
  }, [products, searchQuery, sortBy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{category.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-sky-400 text-xs font-mono font-bold border border-slate-700">
                  {filteredAndSortedProducts.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">Category Slug: /{category.slug}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search by Name / SKU */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search product by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <label className="text-xs text-slate-400 font-mono flex items-center gap-1.5 shrink-0">
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-400" />
              <span>Sort By:</span>
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
            >
              <option value="newest">Latest Added (Newest First)</option>
              <option value="oldest">Latest Added (Oldest First)</option>
              <option value="name-asc">Product Name (A → Z)</option>
              <option value="name-desc">Product Name (Z → A)</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-sky-400" />
              <p className="text-xs font-mono">Loading category products...</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-3 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Package className="w-10 h-10 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-300">
                {searchQuery ? "No products matching your search query." : "No products currently associated with this category."}
              </p>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-sky-400 text-xs font-semibold hover:bg-slate-700"
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAndSortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-900 rounded-2xl border border-slate-800 p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all group shadow-md"
                >
                  {/* Primary Image & Badges */}
                  <div className="relative w-full h-40 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center">
                    {product.primaryImage ? (
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="text-slate-600 flex flex-col items-center gap-1">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-[10px]">No Primary Image</span>
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider font-mono border shadow-sm ${
                          product.stockStatus === "IN_STOCK"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        }`}
                      >
                        {product.stockStatus === "IN_STOCK" ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    {/* Brand Badge */}
                    <div className="absolute bottom-2 right-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 font-mono backdrop-blur-sm border border-slate-700">
                        {product.brand}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                      <span>SKU: {product.sku}</span>
                      <span>Added: {new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-sky-400 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Base Price</span>
                      <span className="text-base font-extrabold text-white font-mono">
                        {formatCurrency(product.basePrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        className="p-2 rounded-lg bg-slate-800 hover:bg-sky-600/20 text-slate-300 hover:text-sky-400 transition-colors"
                        title="View on Storefront"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-amber-600/20 text-slate-300 hover:text-amber-400 transition-colors"
                        title="Edit Product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400 font-mono">
          <span>Showing {filteredAndSortedProducts.length} items</span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
