"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  MoreHorizontal,
  ChevronDown,
  ExternalLink,
  Edit2,
  Copy,
  Trash2,
  Eye,
  EyeOff,
  Package,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { toggleProductVisibility, duplicateProduct, deleteProduct } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { CustomizeColumnsDrawer, ColumnConfig } from "./modals/CustomizeColumnsDrawer";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  type: string;
  imageUrl: string;
  variantCount: number;
  displayPrice: string;
  priceNumber: number;
  inventoryStatus: string;
  ribbon: string;
  brand: string;
  tags: string[];
  visible: boolean;
}

interface AdminProductsClientProps {
  products: ProductRow[];
}

export function AdminProductsClient({ products: initialProducts }: AdminProductsClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCustomizeColumnsOpen, setIsCustomizeColumnsOpen] = useState(false);

  // Column visibility configuration matching Wix
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "name", label: "Name", visible: true, required: true },
    { id: "type", label: "Type", visible: true },
    { id: "sku", label: "SKU", visible: true },
    { id: "price", label: "Price", visible: true },
    { id: "inventory", label: "Inventory", visible: true },
    { id: "ribbon", label: "Ribbon", visible: true },
    { id: "brand", label: "Brand", visible: false },
    { id: "tags", label: "Tags", visible: false },
  ]);

  const filtered = products.filter((p) => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      p.name.toLowerCase().includes(query) ||
      p.sku.toLowerCase().includes(query) ||
      p.brand.toLowerCase().includes(query) ||
      p.tags.some((t) => t.toLowerCase().includes(query))
    );
  });

  const isAllSelected = filtered.length > 0 && selectedIds.length === filtered.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((p) => p.id));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleVisibility = async (id: string, currentVisible: boolean) => {
    const res = await toggleProductVisibility(id, currentVisible);
    if (res.success) {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, visible: res.visible ?? !currentVisible } : p))
      );
      addToast("success", "Visibility Updated", res.visible ? "Product is now visible." : "Product is now hidden.");
    }
  };

  const handleDuplicate = async (id: string) => {
    const res = await duplicateProduct(id);
    if (res.success) {
      addToast("success", "Product Duplicated", "Copy created in draft mode.");
      router.refresh();
    } else {
      addToast("error", "Failed", res.error || "Could not duplicate product.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    const res = await deleteProduct(id);
    if (res.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
      addToast("info", "Product Deleted", "Removed from store.");
    } else {
      addToast("error", "Failed", res.error || "Could not delete product.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Products <span className="text-slate-400 font-normal text-lg">{products.length}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            To see how your products perform, go to Store Analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" /> New Product
          </Link>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
              <span>All products ({products.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => setIsCustomizeColumnsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span>Manage View</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-800 transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCustomizeColumnsOpen(true)}
              className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600"
              title="Customize columns"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs divide-y divide-slate-100">
            <thead className="bg-slate-50/70 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleToggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                </th>

                {columns.find((c) => c.id === "name")?.visible && (
                  <th className="px-4 py-3">Name</th>
                )}
                {columns.find((c) => c.id === "type")?.visible && (
                  <th className="px-4 py-3">Type</th>
                )}
                {columns.find((c) => c.id === "sku")?.visible && (
                  <th className="px-4 py-3">SKU</th>
                )}
                {columns.find((c) => c.id === "price")?.visible && (
                  <th className="px-4 py-3">Price</th>
                )}
                {columns.find((c) => c.id === "inventory")?.visible && (
                  <th className="px-4 py-3">Inventory</th>
                )}
                {columns.find((c) => c.id === "ribbon")?.visible && (
                  <th className="px-4 py-3">Ribbon</th>
                )}
                {columns.find((c) => c.id === "brand")?.visible && (
                  <th className="px-4 py-3">Brand</th>
                )}
                {columns.find((c) => c.id === "tags")?.visible && (
                  <th className="px-4 py-3">Tags</th>
                )}

                <th className="w-12 px-4 py-3 text-right"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.map((prod) => {
                const isSelected = selectedIds.includes(prod.id);
                return (
                  <tr
                    key={prod.id}
                    className={`hover:bg-slate-50/60 transition-colors ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(prod.id)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* Name + Thumbnail + Variant Count */}
                    {columns.find((c) => c.id === "name")?.visible && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            {prod.imageUrl ? (
                              <img src={prod.imageUrl} alt={prod.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <Link
                              href={`/admin/products/${prod.id}/edit`}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                            >
                              {prod.name}
                            </Link>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {prod.variantCount > 0
                                ? `${prod.variantCount} variants`
                                : "No variants"}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}

                    {/* Type */}
                    {columns.find((c) => c.id === "type")?.visible && (
                      <td className="px-4 py-3.5 font-medium text-slate-600">
                        {prod.type}
                      </td>
                    )}

                    {/* SKU */}
                    {columns.find((c) => c.id === "sku")?.visible && (
                      <td className="px-4 py-3.5 font-mono text-slate-500">
                        {prod.sku || "--"}
                      </td>
                    )}

                    {/* Price */}
                    {columns.find((c) => c.id === "price")?.visible && (
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        {prod.displayPrice}
                      </td>
                    )}

                    {/* Inventory */}
                    {columns.find((c) => c.id === "inventory")?.visible && (
                      <td className="px-4 py-3.5">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold text-emerald-700 bg-emerald-50">
                          {prod.inventoryStatus}
                        </span>
                      </td>
                    )}

                    {/* Ribbon */}
                    {columns.find((c) => c.id === "ribbon")?.visible && (
                      <td className="px-4 py-3.5">
                        {prod.ribbon ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold text-blue-700 bg-blue-50 border border-blue-200/60">
                            {prod.ribbon}
                          </span>
                        ) : (
                          <span className="text-slate-300">--</span>
                        )}
                      </td>
                    )}

                    {/* Brand */}
                    {columns.find((c) => c.id === "brand")?.visible && (
                      <td className="px-4 py-3.5 text-slate-600 font-medium">
                        {prod.brand || "--"}
                      </td>
                    )}

                    {/* Tags */}
                    {columns.find((c) => c.id === "tags")?.visible && (
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1">
                          {prod.tags && prod.tags.length > 0 ? (
                            prod.tags.map((t, i) => (
                              <span key={i} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-medium">
                                {t}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-300">--</span>
                          )}
                        </div>
                      </td>
                    )}

                    {/* 3 Dots Actions Menu */}
                    <td className="px-4 py-3.5 text-right relative">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/products/${prod.id}/edit`}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setActiveMenuId(activeMenuId === prod.id ? null : prod.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-900 rounded-md hover:bg-slate-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Dropdown Menu */}
                      {activeMenuId === prod.id && (
                        <div className="absolute right-4 top-10 z-20 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1 text-left animate-in fade-in-50 zoom-in-95">
                          <Link
                            href={`/product/${prod.slug}`}
                            target="_blank"
                            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View on Storefront
                          </Link>
                          {prod.variantCount > 0 && (
                            <Link
                              href={`/admin/products/${prod.id}/variants`}
                              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                            >
                              <Layers className="w-3.5 h-3.5" /> Edit {prod.variantCount} Variants
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleToggleVisibility(prod.id, prod.visible);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            {prod.visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {prod.visible ? "Hide from Store" : "Show in Store"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              handleDuplicate(prod.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <Copy className="w-3.5 h-3.5" /> Duplicate
                          </button>
                          <div className="my-1 border-t border-slate-100" />
                          <button
                            type="button"
                            onClick={() => {
                              handleDelete(prod.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-sm text-slate-400">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customize Columns Drawer */}
      <CustomizeColumnsDrawer
        isOpen={isCustomizeColumnsOpen}
        onClose={() => setIsCustomizeColumnsOpen(false)}
        columns={columns}
        onChange={setColumns}
      />
    </div>
  );
}
