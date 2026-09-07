"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  getBrandProducts,
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
  Building2,
  ExternalLink,
  Edit2,
  Loader2,
  Package,
  Plus,
  Unlink,
  Check,
  CheckSquare,
  Square,
  ArrowRightLeft,
} from "lucide-react";

interface BrandProductsModalProps {
  brand: {
    id: string;
    name: string;
    slug?: string;
    productCount?: number;
  };
  brands?: BrandItem[];
  onClose: () => void;
  onBrandsUpdated?: () => void;
}

export function BrandProductsModal({
  brand,
  brands = [],
  onClose,
  onBrandsUpdated,
}: BrandProductsModalProps) {
  const { addToast } = useToastStore();
  const [products, setProducts] = useState<BrandProductItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<
    "name-asc" | "name-desc" | "newest" | "oldest" | "price-low" | "price-high"
  >("newest");

  // Busy states for actions
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  // Add Products Drawer/View State
  const [showAddProducts, setShowAddProducts] = useState(false);
  const [unbrandedProducts, setUnbrandedProducts] = useState<BrandProductItem[]>([]);
  const [isLoadingUnbranded, setIsLoadingUnbranded] = useState(false);
  const [selectedUnbrandedIds, setSelectedUnbrandedIds] = useState<Set<string>>(new Set());
  const [isAddingSelected, setIsAddingSelected] = useState(false);

  const otherBrands = brands.filter((b) => b.id !== brand.id && b.name !== brand.name);

  const loadBrandProducts = async () => {
    setIsLoading(true);
    const res = await getBrandProducts(brand.id || brand.name);
    if (res.success) {
      setProducts(res.products);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadBrandProducts();
  }, [brand]);

  // Load unbranded products when opening "+ Add Products" drawer
  const handleOpenAddProducts = async () => {
    setShowAddProducts(true);
    setIsLoadingUnbranded(true);
    const res = await getUnbrandedProducts();
    if (res.success) {
      setUnbrandedProducts(res.products);
    }
    setIsLoadingUnbranded(false);
  };

  // Filter & Sort for current brand products
  const filteredAndSortedProducts = useMemo(() => {
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

  // Remove product from brand (make unbranded)
  const handleRemoveFromBrand = async (product: BrandProductItem) => {
    if (
      !confirm(
        `Remove "${product.name}" from brand "${brand.name}"? It will become a Non-Branded product.`
      )
    )
      return;

    setActionBusyId(product.id);
    try {
      const res = await assignProductToBrand(product.id, null);
      if (res.success) {
        addToast(
          "info",
          "Removed from Brand",
          `"${product.name}" is now Non-Branded.`
        );
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        if (onBrandsUpdated) onBrandsUpdated();
      } else {
        addToast("error", "Remove Failed", res.error || "Could not remove product from brand.");
      }
    } finally {
      setActionBusyId(null);
    }
  };

  // Reassign product to another brand
  const handleMoveToBrand = async (productId: string, targetBrandId: string) => {
    if (!targetBrandId) return;
    const targetBrand = brands.find((b) => b.id === targetBrandId);
    setActionBusyId(productId);
    try {
      const res = await assignProductToBrand(productId, targetBrandId);
      if (res.success) {
        addToast(
          "success",
          "Product Moved",
          `Moved product to brand "${targetBrand?.name || 'Selected Brand'}".`
        );
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        if (onBrandsUpdated) onBrandsUpdated();
      } else {
        addToast("error", "Move Failed", res.error || "Could not move product.");
      }
    } finally {
      setActionBusyId(null);
    }
  };

  // Add selected unbranded products to this brand
  const handleAddSelectedToThisBrand = async () => {
    if (selectedUnbrandedIds.size === 0) return;

    setIsAddingSelected(true);
    try {
      const idsArray = Array.from(selectedUnbrandedIds);
      const res = await assignMultipleProductsToBrand(idsArray, brand.id);
      if (res.success) {
        addToast(
          "success",
          "Products Added to Brand",
          `Added ${idsArray.length} product(s) to brand "${brand.name}".`
        );
        setSelectedUnbrandedIds(new Set());
        setShowAddProducts(false);
        loadBrandProducts();
        if (onBrandsUpdated) onBrandsUpdated();
      } else {
        addToast("error", "Add Failed", res.error || "Could not add products to brand.");
      }
    } finally {
      setIsAddingSelected(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-[#00a651] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{brand.name}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-500/20">
                  {products.length} Products Linked
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Brand Identifier: {brand.slug || brand.name.toLowerCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={showAddProducts ? () => setShowAddProducts(false) : handleOpenAddProducts}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAddProducts
                  ? "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  : "bg-[#00a651] hover:bg-emerald-600 text-white shadow-xs"
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddProducts ? "Back to Brand Products" : "Add Products to Brand"}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View 1: Add Products Drawer */}
        {showAddProducts ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 dark:bg-slate-950/30">
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Select Non-Branded Products to Add to &ldquo;{brand.name}&rdquo;</span>
                </h3>
                <p className="text-[11px] text-slate-400">Check products and click Add to assign them to {brand.name}</p>
              </div>

              {selectedUnbrandedIds.size > 0 && (
                <button
                  type="button"
                  disabled={isAddingSelected}
                  onClick={handleAddSelectedToThisBrand}
                  className="px-3.5 py-1.5 bg-[#00a651] hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAddingSelected ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Add {selectedUnbrandedIds.size} to {brand.name}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isLoadingUnbranded ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00a651]" />
                  <p className="text-xs font-medium">Fetching available non-branded products...</p>
                </div>
              ) : unbrandedProducts.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No non-branded products available</h4>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    All products are currently assigned to brands. You can remove products from other brands to add them here.
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
                            onClick={() => {
                              if (selectedUnbrandedIds.size === unbrandedProducts.length) {
                                setSelectedUnbrandedIds(new Set());
                              } else {
                                setSelectedUnbrandedIds(new Set(unbrandedProducts.map((p) => p.id)));
                              }
                            }}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                          >
                            {selectedUnbrandedIds.size > 0 && selectedUnbrandedIds.size === unbrandedProducts.length ? (
                              <CheckSquare className="w-4 h-4 text-[#00a651]" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {unbrandedProducts.map((p) => {
                        const isSelected = selectedUnbrandedIds.has(p.id);
                        return (
                          <tr
                            key={p.id}
                            className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors ${
                              isSelected ? "bg-emerald-50/30 dark:bg-emerald-500/5" : ""
                            }`}
                          >
                            <td className="px-3 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => {
                                  const next = new Set(selectedUnbrandedIds);
                                  if (next.has(p.id)) next.delete(p.id);
                                  else next.add(p.id);
                                  setSelectedUnbrandedIds(next);
                                }}
                                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-4 h-4 text-[#00a651]" />
                                ) : (
                                  <Square className="w-4 h-4" />
                                )}
                              </button>
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                              {p.name}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-500">{p.sku || "--"}</td>
                            <td className="px-4 py-3 font-bold">{formatCurrency(p.basePrice)}</td>
                            <td className="px-4 py-3 text-right">
                              <button
                                type="button"
                                onClick={async () => {
                                  const res = await assignProductToBrand(p.id, brand.id);
                                  if (res.success) {
                                    addToast("success", "Added to Brand", `"${p.name}" added to ${brand.name}.`);
                                    setUnbrandedProducts((prev) => prev.filter((item) => item.id !== p.id));
                                    loadBrandProducts();
                                    if (onBrandsUpdated) onBrandsUpdated();
                                  }
                                }}
                                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-[#00a651] hover:bg-[#00a651] hover:text-white border border-emerald-200 dark:border-emerald-500/20 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                              >
                                + Add
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* View 2: Main Brand Products List */
          <>
            {/* Filter & Search Toolbar */}
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
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

            {/* Products Table Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {isLoading ? (
                <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00a651]" />
                  <p className="text-xs font-medium">Fetching linked products for {brand.name}...</p>
                </div>
              ) : filteredAndSortedProducts.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                    <Package className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    No products linked to {brand.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm">
                    {searchQuery
                      ? `No products matching "${searchQuery}".`
                      : `Click "+ Add Products to Brand" above to link products to "${brand.name}".`}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenAddProducts}
                    className="mt-4 px-4 py-2 bg-[#00a651] hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Products Now</span>
                  </button>
                </div>
              ) : (
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                  <table className="w-full text-left text-xs divide-y divide-slate-100 dark:divide-slate-800">
                    <thead className="bg-slate-50/75 dark:bg-slate-950/70 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Price</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Brand Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredAndSortedProducts.map((prod) => {
                        const isBusy = actionBusyId === prod.id;

                        return (
                          <tr key={prod.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
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
                                  <p className="text-[11px] text-slate-400 mt-0.5">Brand: {prod.brand}</p>
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

                            {/* Brand Actions */}
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isBusy ? (
                                  <Loader2 className="w-4 h-4 animate-spin text-[#00a651]" />
                                ) : (
                                  <>
                                    {/* Move to another Brand */}
                                    {otherBrands.length > 0 && (
                                      <select
                                        defaultValue=""
                                        onChange={(e) => {
                                          if (e.target.value) {
                                            handleMoveToBrand(prod.id, e.target.value);
                                          }
                                        }}
                                        className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-medium text-slate-600 dark:text-slate-300 focus:outline-hidden cursor-pointer"
                                        title="Move to another brand"
                                      >
                                        <option value="" disabled>
                                          Move brand...
                                        </option>
                                        {otherBrands.map((b) => (
                                          <option key={b.id} value={b.id}>
                                            Move to {b.name}
                                          </option>
                                        ))}
                                      </select>
                                    )}

                                    {/* Remove from brand (Make Non-Branded) */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveFromBrand(prod)}
                                      className="p-1.5 text-amber-600 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                                      title="Remove from this brand (Make Non-Branded)"
                                    >
                                      <Unlink className="w-3.5 h-3.5" />
                                    </button>

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
                                  </>
                                )}
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
          </>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/60 text-xs">
          <span className="text-slate-500">
            Showing {filteredAndSortedProducts.length} of {products.length} total products linked to <strong>{brand.name}</strong>
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
