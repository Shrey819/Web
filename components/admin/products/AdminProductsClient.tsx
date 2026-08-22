"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Plus, Search, Edit2, Trash2, Eye, Package, Filter, 
  Download, MoreHorizontal, ArrowUpDown, CheckCircle2, 
  ExternalLink, Layers, Sparkles, AlertCircle, ShoppingBag,
  SlidersHorizontal, ChevronRight, Check
} from "lucide-react";
import { ProductVisibilityToggle } from "./ProductVisibilityToggle";
import { BulkUploadButton } from "./BulkUploadButton";
import { deleteProduct } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";

export interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productCode?: string;
  basePrice: number;
  compareAtPrice?: number | null;
  salePrice?: number | null;
  status: string;
  stockQuantity?: number;
  category?: { name?: string };
  images?: { url: string }[];
  [key: string]: unknown;
}

interface AdminProductsClientProps {
  products: AdminProductRow[];
  total: number;
  currentPage: number;
  take: number;
  currentSearch: string;
  currentStatus: string;
}

export function AdminProductsClient({
  products,
  total,
  currentPage,
  take,
  currentSearch,
  currentStatus,
}: AdminProductsClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const { theme } = useAdminThemeStore();
  const isLight = theme === "light";

  const [search, setSearch] = useState(currentSearch);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>(currentStatus || "ALL");
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const totalPages = Math.ceil(total / take) || 1;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (activeTab && activeTab !== "ALL") params.set("status", activeTab);
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleTabChange = (status: string) => {
    setActiveTab(status);
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (status !== "ALL") params.set("status", status);
    router.push(`/admin/products?${params.toString()}`);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      const res = await deleteProduct(id);
      if (res.success) {
        addToast("success", "Product Deleted", `"${name}" was removed.`);
        router.refresh();
      } else {
        addToast("error", "Delete Failed", res.error || "Could not delete product.");
      }
    } catch {
      addToast("error", "Error", "An unexpected error occurred.");
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar matching Wix Style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${isLight ? "text-slate-900" : "text-white"}`}>
              Products
            </h1>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono ${
              isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-slate-300"
            }`}>
              {total}
            </span>
          </div>
          <p className={`text-xs mt-1 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
            To see how your products perform, go to{" "}
            <Link href="/admin" className="text-blue-600 hover:underline font-medium">
              Store Analytics
            </Link>
            .
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bulk Upload Excel */}
          <BulkUploadButton />

          {/* New Product CTA (Primary Blue) */}
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      {/* 2. Business Setup Recommendation Cards (Wix 2-card layout) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recommendation Card 1 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight 
            ? "bg-white border-slate-200 shadow-sm hover:shadow-md" 
            : "bg-slate-900 border-slate-800"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase ${
                isLight ? "bg-slate-900 text-white" : "bg-slate-800 text-slate-200"
              }`}>
                REQUIRED
              </span>
              <h3 className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                Catalog Health & Live Inventory
              </h3>
              <p className={`text-xs leading-relaxed ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Your active store catalog is live and accepting customer orders and inquiries.
              </p>
            </div>
            <Link
              href="/admin/live-tracker"
              className={`px-4 py-2 rounded-xl text-xs font-semibold border shrink-0 transition-colors ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              View Analytics
            </Link>
          </div>
        </div>

        {/* Recommendation Card 2 */}
        <div className={`p-5 rounded-2xl border transition-all ${
          isLight 
            ? "bg-white border-slate-200 shadow-sm hover:shadow-md" 
            : "bg-slate-900 border-slate-800"
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider uppercase ${
                isLight ? "bg-slate-900 text-white" : "bg-slate-800 text-slate-200"
              }`}>
                FAST ACTION
              </span>
              <h3 className={`text-sm font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                Multi-Category Organization
              </h3>
              <p className={`text-xs leading-relaxed ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                Assign multiple industrial categories to ensure buyers find products instantly.
              </p>
            </div>
            <Link
              href="/admin/categories"
              className={`px-4 py-2 rounded-xl text-xs font-semibold border shrink-0 transition-colors ${
                isLight
                  ? "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"
                  : "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700"
              }`}
            >
              Manage Categories
            </Link>
          </div>
        </div>
      </div>

      {/* 3. Main Products Table Container (Wix Light Card) */}
      <div className={`rounded-2xl border overflow-hidden transition-all shadow-sm ${
        isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"
      }`}>
        {/* Table Filter Tabs */}
        <div className={`px-6 pt-4 pb-0 border-b flex items-center justify-between flex-wrap gap-4 ${
          isLight ? "border-slate-100" : "border-slate-800"
        }`}>
          {/* Tabs */}
          <div className="flex items-center gap-6 overflow-x-auto text-xs font-semibold">
            <button
              onClick={() => handleTabChange("ALL")}
              className={`pb-3.5 relative transition-colors cursor-pointer ${
                activeTab === "ALL" || !activeTab
                  ? isLight ? "text-blue-600 font-bold" : "text-blue-400 font-bold"
                  : isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>All products</span>
              <span className="ml-1 text-[11px] opacity-75">({total})</span>
              {(activeTab === "ALL" || !activeTab) && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleTabChange("ACTIVE")}
              className={`pb-3.5 relative transition-colors cursor-pointer ${
                activeTab === "ACTIVE"
                  ? isLight ? "text-blue-600 font-bold" : "text-blue-400 font-bold"
                  : isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Active</span>
              {activeTab === "ACTIVE" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>

            <button
              onClick={() => handleTabChange("DRAFT")}
              className={`pb-3.5 relative transition-colors cursor-pointer ${
                activeTab === "DRAFT"
                  ? isLight ? "text-blue-600 font-bold" : "text-blue-400 font-bold"
                  : isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <span>Draft</span>
              {activeTab === "DRAFT" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full" />
              )}
            </button>
          </div>

          {/* Action Tools (Filter, Search) */}
          <div className="flex items-center gap-2.5 pb-3">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
                isLight ? "text-slate-400" : "text-slate-500"
              }`} />
              <input
                type="text"
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`pl-9 pr-4 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors w-44 sm:w-56 ${
                  isLight
                    ? "bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400"
                    : "bg-slate-950 border-slate-800 text-white placeholder-slate-500"
                }`}
              />
            </form>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className={`border-b text-[11px] font-bold uppercase tracking-wider font-mono ${
                isLight ? "bg-slate-50/70 border-slate-100 text-slate-500" : "bg-slate-950/60 border-slate-800 text-slate-400"
              }`}>
                <th className="p-4 pl-6 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length > 0 && selectedIds.length === products.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Name</th>
                <th className="p-4">Type</th>
                <th className="p-4">SKU</th>
                <th className="p-4">Price</th>
                <th className="p-4">Inventory</th>
                <th className="p-4">Visibility</th>
                <th className="p-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className={`divide-y text-xs ${
              isLight ? "divide-slate-100 text-slate-700" : "divide-slate-800/80 text-slate-300"
            }`}>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-16 text-center">
                    <div className="max-w-sm mx-auto space-y-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto ${
                        isLight ? "bg-slate-100 text-slate-400" : "bg-slate-800 text-slate-500"
                      }`}>
                        <Package className="w-6 h-6" />
                      </div>
                      <p className={`font-bold text-sm ${isLight ? "text-slate-800" : "text-white"}`}>
                        No products found
                      </p>
                      <p className={`text-xs ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Try modifying your search filter or click &quot;New Product&quot; to upload your first item.
                      </p>
                      <Link
                        href="/admin/products/new"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-sm"
                      >
                        <Plus className="w-4 h-4" /> Add Product
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const isSelected = selectedIds.includes(product.id);
                  const primaryImage = product.images?.[0]?.url || "";
                  const formattedPrice = (product.basePrice / 100).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  });

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${
                        isSelected 
                          ? isLight ? "bg-blue-50/50" : "bg-blue-950/20"
                          : isLight ? "hover:bg-slate-50/80" : "hover:bg-slate-800/40"
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 pl-6">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(product.id)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Name & Thumbnail */}
                      <td className="p-4">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-xl overflow-hidden shrink-0 border flex items-center justify-center ${
                            isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950 border-slate-800"
                          }`}>
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.name}
                                className="w-full h-full object-contain p-1"
                              />
                            ) : (
                              <Package className={`w-5 h-5 ${isLight ? "text-slate-400" : "text-slate-600"}`} />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${product.id}/edit`}
                              className={`font-bold transition-colors line-clamp-1 ${
                                isLight ? "text-slate-900 hover:text-blue-600" : "text-white hover:text-blue-400"
                              }`}
                            >
                              {product.name}
                            </Link>
                            <span className={`text-[11px] block mt-0.5 ${
                              isLight ? "text-slate-500" : "text-slate-400"
                            }`}>
                              {product.category?.name || "Uncategorized"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className={`p-4 font-mono text-[11px] ${isLight ? "text-slate-600" : "text-slate-400"}`}>
                        Physical
                      </td>

                      {/* SKU */}
                      <td className="p-4 font-mono text-[11px] text-slate-500">
                        {product.sku || product.productCode || "—"}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-mono font-bold">
                        <span className={isLight ? "text-slate-900" : "text-emerald-400"}>
                          ₹{formattedPrice}
                        </span>
                      </td>

                      {/* Inventory Status */}
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>In stock</span>
                        </span>
                      </td>

                      {/* Visibility Toggle */}
                      <td className="p-4">
                        <ProductVisibilityToggle
                          productId={product.id}
                          initialStatus={product.status}
                          productName={product.name}
                        />
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/products/${product.id}/edit`}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isLight
                                ? "border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-100"
                                : "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                            title="Edit product"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>

                          <Link
                            href={`/product/${product.slug || product.id}`}
                            target="_blank"
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isLight
                                ? "border-slate-200 text-slate-600 hover:text-emerald-600 hover:bg-slate-100"
                                : "border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
                            }`}
                            title="View live on website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              isLight
                                ? "border-slate-200 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                : "border-slate-800 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                            }`}
                            title="Delete product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className={`p-4 border-t flex items-center justify-between text-xs ${
            isLight ? "border-slate-100 text-slate-500 bg-slate-50/50" : "border-slate-800 text-slate-400 bg-slate-950/40"
          }`}>
            <span>
              Showing {products.length} of {total} products
            </span>

            <div className="flex items-center gap-2">
              <button
                disabled={currentPage <= 1}
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("page", String(currentPage - 1));
                  if (search) params.set("search", search);
                  if (activeTab !== "ALL") params.set("status", activeTab);
                  router.push(`/admin/products?${params.toString()}`);
                }}
                className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 transition-colors ${
                  isLight
                    ? "border-slate-200 hover:bg-white text-slate-700"
                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                }`}
              >
                Previous
              </button>

              <span className="font-mono font-bold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => {
                  const params = new URLSearchParams();
                  params.set("page", String(currentPage + 1));
                  if (search) params.set("search", search);
                  if (activeTab !== "ALL") params.set("status", activeTab);
                  router.push(`/admin/products?${params.toString()}`);
                }}
                className={`px-3 py-1.5 rounded-lg border disabled:opacity-40 transition-colors ${
                  isLight
                    ? "border-slate-200 hover:bg-white text-slate-700"
                    : "border-slate-700 hover:bg-slate-800 text-slate-300"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
