"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  getCategoryProducts,
  removeProductFromCategory,
  addProductToCategory,
  getAvailableProductsForCategory,
  CategoryProduct,
  AvailableProductItem,
} from "@/app/actions/category";
import { formatCurrency } from "@/lib/utils";
import { useToastStore } from "@/store/useToastStore";
import {
  X,
  Search,
  ArrowUpDown,
  Package,
  ExternalLink,
  Edit,
  Loader2,
  Image as ImageIcon,
  Trash2,
  Plus,
  ChevronDown,
  Check,
} from "lucide-react";

interface CategoryProductsModalProps {
  category: {
    id: string;
    name: string;
    slug: string;
    product_count: number;
  };
  onClose: () => void;
  onUpdate?: () => void;
}

export function CategoryProductsModal({ category, onClose, onUpdate }: CategoryProductsModalProps) {
  const { addToast } = useToastStore();
  const [products, setProducts] = useState<CategoryProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "newest" | "oldest" | "price-low" | "price-high">("newest");

  // Remove State
  const [removingId, setRemovingId] = useState<string | null>(null);

  // Add Product Dropdown State
  const [isAddDropdownOpen, setIsAddDropdownOpen] = useState(false);
  const [availableProducts, setAvailableProducts] = useState<AvailableProductItem[]>([]);
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false);
  const [availableSearchQuery, setAvailableSearchQuery] = useState("");
  const [addingId, setAddingId] = useState<string | null>(null);

  const addDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (addDropdownRef.current && !addDropdownRef.current.contains(event.target as Node)) {
        setIsAddDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Load products in this category
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

  // Load unassigned products when Add dropdown opens or search changes
  useEffect(() => {
    if (!isAddDropdownOpen) return;
    let isMounted = true;
    const timer = setTimeout(async () => {
      setIsLoadingAvailable(true);
      const res = await getAvailableProductsForCategory(category.id || category.slug, availableSearchQuery);
      if (isMounted) {
        if (res.success) {
          setAvailableProducts(res.products);
        }
        setIsLoadingAvailable(false);
      }
    }, 200);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [isAddDropdownOpen, availableSearchQuery, category]);

  // Handle Remove Product from Category
  const handleRemoveProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to remove "${productName}" from this category?`)) {
      return;
    }
    setRemovingId(productId);
    try {
      const res = await removeProductFromCategory(category.id || category.slug, productId);
      if (res.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        addToast("success", "Product Removed", `"${productName}" was removed from ${category.name}.`);
        if (onUpdate) onUpdate();
      } else {
        addToast("error", "Remove Failed", res.error || "Could not remove product from category.");
      }
    } catch {
      addToast("error", "Error", "An unexpected error occurred while removing product.");
    } finally {
      setRemovingId(null);
    }
  };

  // Handle Add Product to Category
  const handleAddProduct = async (product: AvailableProductItem) => {
    setAddingId(product.id);
    try {
      const res = await addProductToCategory(category.id || category.slug, product.id);
      if (res.success) {
        const newProd: CategoryProduct = {
          id: product.id,
          name: product.name,
          slug: product.slug,
          sku: product.sku,
          basePrice: product.basePrice,
          status: "ACTIVE",
          stockStatus: "IN_STOCK",
          createdAt: new Date().toISOString(),
          brand: product.brand,
          primaryImage: product.primaryImage,
        };
        setProducts((prev) => [newProd, ...prev]);
        setAvailableProducts((prev) => prev.filter((p) => p.id !== product.id));
        addToast("success", "Product Added", `"${product.name}" was added to ${category.name}.`);
        if (onUpdate) onUpdate();
      } else {
        addToast("error", "Add Failed", res.error || "Could not add product to category.");
      }
    } catch {
      addToast("error", "Error", "An unexpected error occurred while adding product.");
    } finally {
      setAddingId(null);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{category.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-500/20">
                  {products.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Category Slug: /{category.slug}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter, Search & Add Products Toolbar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search by Name / SKU */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search product by name or SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          {/* Right: Add Product Dropdown + Sort By */}
          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Common Add Product Option (Dropdown / Combobox) */}
            <div className="relative" ref={addDropdownRef}>
              <button
                type="button"
                onClick={() => setIsAddDropdownOpen(!isAddDropdownOpen)}
                className="px-3 py-2 rounded-lg bg-[#00a651] hover:bg-[#009247] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Products</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAddDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown Menu */}
              {isAddDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 max-w-[90vw] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95 duration-150">
                  <div className="p-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[#00a651]" />
                        <span>Add to {category.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddDropdownOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Search inside unassigned products */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={availableSearchQuery}
                        onChange={(e) => setAvailableSearchQuery(e.target.value)}
                        placeholder="Search unassigned products..."
                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00a651]"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Product List */}
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
                    {isLoadingAvailable ? (
                      <div className="py-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#00a651]" />
                        <span>Searching products...</span>
                      </div>
                    ) : availableProducts.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs px-4">
                        {availableSearchQuery
                          ? "No unassigned products match your search."
                          : "All available products are already in this category!"}
                      </div>
                    ) : (
                      availableProducts.map((p) => (
                        <div
                          key={p.id}
                          className="p-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Product Image */}
                            <div className="w-10 h-10 rounded-md border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-50 dark:bg-slate-950 shrink-0 flex items-center justify-center">
                              {p.primaryImage ? (
                                <img
                                  src={p.primaryImage}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src =
                                      "https://res.cloudinary.com/hecyltpu/image/upload/v1788819936/products/v86fzl3rk6h4o0psjucv.jpg";
                                  }}
                                />
                              ) : (
                                <ImageIcon className="w-4 h-4 text-slate-400" />
                              )}
                            </div>

                            {/* Name, SKU & Price */}
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {p.name}
                              </h4>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                                <span className="font-mono">{p.sku}</span>
                                <span>•</span>
                                <span className="font-extrabold text-[#00a651] dark:text-emerald-400 font-mono">
                                  {formatCurrency(p.basePrice)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Add button */}
                          <button
                            type="button"
                            onClick={() => handleAddProduct(p)}
                            disabled={addingId === p.id}
                            className="px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#00a651] dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/60 transition-colors shrink-0 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          >
                            {addingId === p.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            <span>Add</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sort By Dropdown */}
            <div className="flex items-center gap-1.5 shrink-0">
              <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <span className="hidden sm:inline">Sort:</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="newest">Latest Added</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name (A → Z)</option>
                <option value="name-desc">Name (Z → A)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 dark:bg-slate-950/40 custom-scrollbar">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 dark:text-blue-400" />
              <p className="text-xs">Loading category products...</p>
            </div>
          ) : filteredAndSortedProducts.length === 0 ? (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400 space-y-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <Package className="w-10 h-10 mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {searchQuery ? "No products matching your search query." : "No products currently associated with this category."}
              </p>
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery("")}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Clear Search Filter
                </button>
              ) : (
                <button
                  onClick={() => setIsAddDropdownOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#00a651] text-white text-xs font-bold hover:bg-[#009247] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Product to this Category</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredAndSortedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all group shadow-2xs"
                >
                  {/* Primary Image & Badges */}
                  <div className="relative w-full h-40 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center">
                    {product.primaryImage ? (
                      <img
                        src={product.primaryImage}
                        alt={product.name}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://res.cloudinary.com/hecyltpu/image/upload/v1788819936/products/v86fzl3rk6h4o0psjucv.jpg";
                        }}
                      />
                    ) : (
                      <div className="text-slate-400 flex flex-col items-center gap-1">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[10px]">No Primary Image</span>
                      </div>
                    )}

                    {/* Stock Status Badge */}
                    <div className="absolute top-2 left-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border shadow-xs ${
                          product.stockStatus === "IN_STOCK"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                        }`}
                      >
                        {product.stockStatus === "IN_STOCK" ? "In Stock" : "Out of Stock"}
                      </span>
                    </div>

                    {/* Brand Badge */}
                    <div className="absolute bottom-2 right-2">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 backdrop-blur-xs border border-slate-200 dark:border-slate-800 shadow-xs">
                        {product.brand}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      <span>SKU: {product.sku}</span>
                      <span>{new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  {/* Price & Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block uppercase">Base Price</span>
                      <span className="text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                        {formatCurrency(product.basePrice)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="View on Storefront"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </Link>
                      {/* Direct Remove from this Category */}
                      <button
                        type="button"
                        onClick={() => handleRemoveProduct(product.id, product.name)}
                        disabled={removingId === product.id}
                        className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 border border-rose-200 dark:border-rose-800/60 transition-colors cursor-pointer disabled:opacity-50"
                        title={`Remove from ${category.name}`}
                      >
                        {removingId === product.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Showing {filteredAndSortedProducts.length} of {products.length} items</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
