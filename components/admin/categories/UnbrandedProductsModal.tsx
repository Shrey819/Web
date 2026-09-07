"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  getUnbrandedProducts,
  assignProductToBrand,
  assignMultipleProductsToBrand,
  type BrandProductItem,
  type BrandItem,
} from "@/app/actions/productManagement";
import { formatCurrency } from "@/lib/utils";
import { useToastStore } from "@/store/useToastStore";
import {
  X,
  Search,
  ArrowUpDown,
  Tag,
  ExternalLink,
  Edit2,
  Loader2,
  Package,
  CheckSquare,
  Square,
  Building2,
  Check,
} from "lucide-react";

interface UnbrandedProductsModalProps {
  brands: BrandItem[];
  onClose: () => void;
  onBrandsUpdated: () => void;
}

export function UnbrandedProductsModal({
  brands,
  onClose,
  onBrandsUpdated,
}: UnbrandedProductsModalProps) {
  const { addToast } = useToastStore();
  const [products, setProducts] = useState<BrandProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name-asc" | "name-desc" | "newest" | "oldest" | "price-low" | "price-high"
  >("newest");

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTargetBrandId, setBulkTargetBrandId] = useState<string>(brands[0]?.id || "");
  const [isBulkAssigning, setIsBulkAssigning] = useState(false);

  // Individual row assigning state
  const [rowAssigningId, setRowAssigningId] = useState<string | null>(null);

  const loadProducts = async () => {
    setIsLoading(true);
    const res = await getUnbrandedProducts();
    if (res.success) {
      setProducts(res.products);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        return p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
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

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const toggleSelectProduct = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // Bulk Assign
  const handleBulkAssign = async () => {
    if (selectedIds.size === 0 || !bulkTargetBrandId) return;

    const targetBrand = brands.find((b) => b.id === bulkTargetBrandId);
    setIsBulkAssigning(true);
    try {
      const idsArray = Array.from(selectedIds);
      const res = await assignMultipleProductsToBrand(idsArray, bulkTargetBrandId);
      if (res.success) {
        addToast(
          "success",
          "Products Assigned",
          `Assigned ${idsArray.length} product(s) to brand "${targetBrand?.name || 'Selected Brand'}".`
        );
        // Remove assigned products from current view
        setProducts((prev) => prev.filter((p) => !selectedIds.has(p.id)));
        setSelectedIds(new Set());
        onBrandsUpdated();
      } else {
        addToast("error", "Assignment Failed", res.error || "Could not assign products.");
      }
    } finally {
      setIsBulkAssigning(false);
    }
  };

  // Single Row Assign
  const handleRowAssign = async (productId: string, brandId: string) => {
    if (!brandId) return;
    const targetBrand = brands.find((b) => b.id === brandId);
    setRowAssigningId(productId);
    try {
      const res = await assignProductToBrand(productId, brandId);
      if (res.success) {
        addToast(
          "success",
          "Product Assigned",
          `Product assigned to brand "${targetBrand?.name || 'Selected Brand'}".`
        );
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        const next = new Set(selectedIds);
        next.delete(productId);
        setSelectedIds(next);
        onBrandsUpdated();
      } else {
        addToast("error", "Assignment Failed", res.error || "Could not assign product.");
      }
    } finally {
      setRowAssigningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Non-Branded Products</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs font-semibold border border-amber-200 dark:border-amber-500/20">
                  {products.length} Products Available
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Assign these products to any brand individually or in bulk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter & Bulk Actions Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search product by name or SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#00a651]"
              />
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 flex items-center gap-1 font-medium shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
              >
                <option value="newest">Recently Added</option>
                <option value="oldest">Oldest First</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Bulk Assign Toolbar (visible when 1+ selected) */}
          {selectedIds.size > 0 && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300">
                <CheckSquare className="w-4 h-4 text-[#00a651]" />
                <span>{selectedIds.size} product(s) selected</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-600 dark:text-slate-400 shrink-0">Assign to:</span>
                <select
                  value={bulkTargetBrandId}
                  onChange={(e) => setBulkTargetBrandId(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-900 dark:text-white focus:outline-hidden cursor-pointer"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  disabled={isBulkAssigning || !bulkTargetBrandId}
                  onClick={handleBulkAssign}
                  className="px-3.5 py-1.5 bg-[#00a651] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isBulkAssigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Assign Selected
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Products Table Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00a651]" />
              <p className="text-xs font-medium">Fetching non-branded products...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-[#00a651] mb-3">
                <Check className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {searchQuery ? "No matching products found" : "No Non-Branded Products"}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                {searchQuery
                  ? `No unbranded products matching "${searchQuery}".`
                  : "All products in your catalog currently have an assigned brand. When you remove a brand from a product, it will appear here."}
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
              <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                <thead className="bg-slate-50/75 dark:bg-slate-950/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-3 py-3 w-10 text-center">
                      <button
                        type="button"
                        onClick={toggleSelectAll}
                        className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                        title={selectedIds.size === filteredProducts.length ? "Deselect All" : "Select All"}
                      >
                        {selectedIds.size > 0 && selectedIds.size === filteredProducts.length ? (
                          <CheckSquare className="w-4 h-4 text-[#00a651]" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">SKU</th>
                    <th className="px-4 py-3">Price</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Assign to Brand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.map((prod) => {
                    const isSelected = selectedIds.has(prod.id);
                    const isRowBusy = rowAssigningId === prod.id;

                    return (
                      <tr
                        key={prod.id}
                        className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                          isSelected ? "bg-emerald-50/30 dark:bg-emerald-500/5" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-3 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => toggleSelectProduct(prod.id)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-[#00a651]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Name & Thumbnail */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                              {prod.imageUrl ? (
                                <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                              ) : (
                                <Package className="w-5 h-5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <Link
                                href={`/admin/products/${prod.id}/edit`}
                                className="font-bold text-slate-900 dark:text-white hover:text-[#00a651] transition-colors"
                              >
                                {prod.name}
                              </Link>
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-1.5 py-0.2 rounded font-medium mt-0.5">
                                Non-Branded
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-400">
                          {prod.sku || "--"}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                          {formatCurrency(prod.basePrice)}
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              prod.visible
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {prod.visible ? "Active" : "Draft"}
                          </span>
                        </td>

                        {/* Assign to Brand Action */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isRowBusy ? (
                              <Loader2 className="w-4 h-4 animate-spin text-[#00a651]" />
                            ) : (
                              <select
                                defaultValue=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleRowAssign(prod.id, e.target.value);
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
                              >
                                <option value="" disabled>
                                  Assign to brand...
                                </option>
                                {brands.map((b) => (
                                  <option key={b.id} value={b.id}>
                                    {b.name}
                                  </option>
                                ))}
                              </select>
                            )}

                            <Link
                              href={`/admin/products/${prod.id}/edit`}
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </Link>

                            <Link
                              href={`/product/${prod.slug}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="View on Storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60 text-xs">
          <span className="text-slate-500">
            Showing {filteredProducts.length} of {products.length} total non-branded products
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-semibold hover:bg-slate-800 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
