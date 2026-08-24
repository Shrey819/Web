"use client";

import { useState, useEffect, useRef } from "react";
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
  Info,
  Building2,
  Bookmark,
  Tag,
  FileText,
  Sliders,
  FolderTree,
  Upload,
  Download,
  Filter,
  X,
} from "lucide-react";
import { toggleProductVisibility, duplicateProduct, deleteProduct } from "@/app/actions/product";
import { useToastStore } from "@/store/useToastStore";
import { CustomizeColumnsDrawer, ColumnConfig } from "./modals/CustomizeColumnsDrawer";
import { ManageBrandsModal } from "./modals/ManageBrandsModal";
import { ManageRibbonsModal } from "./modals/ManageRibbonsModal";
import { ManageTagsModal } from "./modals/ManageTagsModal";
import { SelectInfoSectionsModal } from "./modals/SelectInfoSectionsModal";
import { EditInfoSectionModal } from "./modals/EditInfoSectionModal";
import { ManageGlobalOptionsModal } from "./modals/ManageGlobalOptionsModal";
import { ApplyOptionPresetModal } from "./modals/ApplyOptionPresetModal";
import { ExportProductsModal } from "./modals/ExportProductsModal";
import {
  FilterProductsDrawer,
  ProductFilters,
  DEFAULT_PRODUCT_FILTERS,
} from "./modals/FilterProductsDrawer";

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
  categories?: string[];
  categoryIds?: string[];
  visible: boolean;
}

interface AdminProductsClientProps {
  products: ProductRow[];
}

const DEFAULT_PRODUCT_COLUMNS: ColumnConfig[] = [
  { id: "name", label: "Name", visible: true, required: true },
  { id: "type", label: "Type", visible: true },
  { id: "sku", label: "SKU", visible: true },
  { id: "price", label: "Price", visible: true },
  { id: "inventory", label: "Inventory", visible: true },
  { id: "ribbon", label: "Ribbon", visible: true },
  { id: "brand", label: "Brand", visible: true },
  { id: "tags", label: "Tags", visible: false },
];

export function AdminProductsClient({ products: initialProducts }: AdminProductsClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [products, setProducts] = useState<ProductRow[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [isCustomizeColumnsOpen, setIsCustomizeColumnsOpen] = useState(false);

  // Global Management Modals State
  const [isMoreActionsOpen, setIsMoreActionsOpen] = useState(false);
  const [isManageBrandsOpen, setIsManageBrandsOpen] = useState(false);
  const [isManageRibbonsOpen, setIsManageRibbonsOpen] = useState(false);
  const [isManageTagsOpen, setIsManageTagsOpen] = useState(false);
  const [isManageSectionsOpen, setIsManageSectionsOpen] = useState(false);
  const [isEditSectionOpen, setIsEditSectionOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<any>(null);
  const [infoSectionsList, setInfoSectionsList] = useState<any[]>([]);
  const [isManageOptionsOpen, setIsManageOptionsOpen] = useState(false);
  const [isApplyPresetOpen, setIsApplyPresetOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(DEFAULT_PRODUCT_FILTERS);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const moreActionsRef = useRef<HTMLDivElement>(null);

  // Active filters count
  let activeFilterCount = 0;
  if (filters.categories.length > 0) activeFilterCount += filters.categories.length;
  if (filters.productType !== "all") activeFilterCount += 1;
  if (filters.inventory !== "all") activeFilterCount += 1;
  if (filters.visibility !== "all") activeFilterCount += 1;
  if (filters.preOrderEnabled) activeFilterCount += 1;
  if (filters.tags.length > 0) activeFilterCount += filters.tags.length;

  // Column visibility configuration matching Wix with localStorage persistence
  const [columns, setColumns] = useState<ColumnConfig[]>(DEFAULT_PRODUCT_COLUMNS);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreActionsRef.current && !moreActionsRef.current.contains(e.target as Node)) {
        setIsMoreActionsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("admin_products_columns_config");
        if (saved) {
          const parsed: ColumnConfig[] = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = parsed.map((c) => {
              const def = DEFAULT_PRODUCT_COLUMNS.find((d) => d.id === c.id);
              return def ? { ...def, ...c } : c;
            });
            DEFAULT_PRODUCT_COLUMNS.forEach((def) => {
              if (!merged.some((m) => m.id === def.id)) {
                merged.push(def);
              }
            });
            setColumns(merged);
          }
        }
      } catch (e) {
        console.error("Error reading saved product columns:", e);
      }
    }
  }, []);

  const handleUpdateColumns = (updated: ColumnConfig[]) => {
    setColumns(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("admin_products_columns_config", JSON.stringify(updated));
      } catch (e) {
        console.error("Error saving product columns:", e);
      }
    }
  };

  const filtered = products.filter((p) => {
    // 1. Search Query
    const query = search.toLowerCase().trim();
    if (query) {
      const matchesSearch =
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query)) ||
        (p.categories && p.categories.some((c) => c.toLowerCase().includes(query)));
      if (!matchesSearch) return false;
    }

    // 2. Categories Filter
    if (filters.categories.length > 0) {
      const prodCats = p.categories || [];
      const hasMatchingCat = filters.categories.some((fc) =>
        prodCats.some((pc) => pc.toLowerCase() === fc.toLowerCase())
      );
      if (!hasMatchingCat) return false;
    }

    // 3. Visibility Filter
    if (filters.visibility === "shown" && !p.visible) return false;
    if (filters.visibility === "hidden" && p.visible) return false;

    // 4. Product Type Filter
    if (filters.productType === "physical" && p.type.toLowerCase() !== "physical") return false;
    if (filters.productType === "digital" && p.type.toLowerCase() !== "digital") return false;

    // 5. Inventory Filter
    if (filters.inventory === "in_stock" && p.inventoryStatus !== "In stock") return false;
    if (filters.inventory === "out_of_stock" && p.inventoryStatus !== "Out of stock") return false;
    if (filters.inventory === "partial" && p.inventoryStatus !== "Partially out of stock") return false;

    // 6. Tags Filter
    if (filters.tags.length > 0) {
      const prodTags = p.tags || [];
      const hasMatchingTag = filters.tags.some((ft) =>
        prodTags.some((pt) => pt.toLowerCase() === ft.toLowerCase())
      );
      if (!hasMatchingTag) return false;
    }

    return true;
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
            Products <span className="text-slate-400 font-normal text-lg">{filtered.length}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            To see how your products perform, go to Store Analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Global Tables More Actions Dropdown */}
          <div ref={moreActionsRef} className="relative">
            <button
              type="button"
              onClick={() => setIsMoreActionsOpen(!isMoreActionsOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>More Actions</span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-150 ${
                  isMoreActionsOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown Menu */}
            {isMoreActionsOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
                {/* 1. Export and Import on Top */}
                <div className="py-1 space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreActionsOpen(false);
                      setIsExportModalOpen(true);
                    }}
                    className="w-full flex items-start gap-2.5 px-2.5 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <Upload className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Export</div>
                      <div className="text-[11px] text-slate-400 font-normal leading-tight">
                        Export your physical products to a CSV file.
                      </div>
                    </div>
                  </button>

                  <Link
                    href="/admin/products/import"
                    onClick={() => setIsMoreActionsOpen(false)}
                    className="w-full flex items-start gap-2.5 px-2.5 py-2 text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg transition-colors cursor-pointer text-left"
                  >
                    <Download className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">Import</div>
                      <div className="text-[11px] text-slate-400 font-normal leading-tight">
                        Import multiple products to your store.
                      </div>
                    </div>
                  </Link>
                </div>

                {/* 2. Global Catalog Tables */}
                <div>
                  <div className="px-2.5 pt-2 pb-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Global Catalog Tables
                  </div>

                  <div className="py-1 space-y-0.5">
                    <Link
                      href="/admin/categories"
                      onClick={() => setIsMoreActionsOpen(false)}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg font-medium transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderTree className="w-4 h-4 text-slate-400" />
                        <span>Manage Categories</span>
                      </div>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreActionsOpen(false);
                        setIsManageBrandsOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg font-medium transition-colors cursor-pointer text-left"
                    >
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>Manage Brands</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreActionsOpen(false);
                        setIsManageRibbonsOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg font-medium transition-colors cursor-pointer text-left"
                    >
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      <span>Manage Ribbons</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreActionsOpen(false);
                        setIsManageTagsOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg font-medium transition-colors cursor-pointer text-left"
                    >
                      <Tag className="w-4 h-4 text-slate-400" />
                      <span>Manage Tags</span>
                    </button>

                    <button
                      type="button"
                      onClick={async () => {
                        setIsMoreActionsOpen(false);
                        const res = await (await import("@/app/actions/productManagement")).getGlobalInfoSections();
                        if (res.success) {
                          setInfoSectionsList(res.sections || []);
                        }
                        setIsManageSectionsOpen(true);
                      }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg font-medium transition-colors cursor-pointer text-left"
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>Manage Info Sections</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreActionsOpen(false);
                        setIsApplyPresetOpen(true);
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-2 text-xs text-slate-700 hover:text-blue-600 hover:bg-blue-50/70 rounded-lg font-medium transition-colors cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5">
                        <Sliders className="w-4 h-4 text-slate-400" />
                        <span>Apply Option Setting</span>
                      </div>
                      <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                        Presets
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Link
            href="/admin/products/new"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Product
          </Link>
        </div>
      </div>

      {/* Toolbar & Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-2xs">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              <span>All products</span>
              <span className="text-slate-400 font-normal">({filtered.length})</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </div>

            <button
              type="button"
              onClick={() => setIsCustomizeColumnsOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 border border-slate-200 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span>Manage View</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Button with active count badge */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsFilterDrawerOpen(true)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer shadow-2xs ${
                  activeFilterCount > 0
                    ? "bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-100"
                    : "bg-white text-blue-600 border-blue-200 hover:bg-blue-50/60"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Filter</span>
              </button>
              {activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shadow-xs pointer-events-none">
                  {activeFilterCount}
                </span>
              )}
            </div>

            {/* Quick Export Button */}
            <button
              type="button"
              onClick={() => setIsExportModalOpen(true)}
              className="p-1.5 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              title="Export products"
            >
              <Upload className="w-4 h-4" />
            </button>

            {/* Customize Columns Button */}
            <button
              type="button"
              onClick={() => setIsCustomizeColumnsOpen(true)}
              className="p-1.5 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
              title="Customize columns"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-44 sm:w-56 pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-full focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-800 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center gap-2 flex-wrap text-xs animate-in fade-in duration-150">
            {filters.categories.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 border border-blue-200 text-blue-900 rounded-full text-xs font-medium">
                <span>
                  Categories: <strong>{filters.categories.join(", ")}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, categories: [] })}
                  className="text-blue-500 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Remove category filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.visibility !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 border border-blue-200 text-blue-900 rounded-full text-xs font-medium">
                <span>
                  Visibility:{" "}
                  <strong>
                    {filters.visibility === "shown"
                      ? "Shown in online store"
                      : "Hidden from online store"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, visibility: "all" })}
                  className="text-blue-500 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Remove visibility filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.productType !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 border border-blue-200 text-blue-900 rounded-full text-xs font-medium">
                <span>
                  Product type:{" "}
                  <strong>
                    {filters.productType === "physical" ? "Physical" : "Digital"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, productType: "all" })}
                  className="text-blue-500 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Remove product type filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.inventory !== "all" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 border border-blue-200 text-blue-900 rounded-full text-xs font-medium">
                <span>
                  Inventory:{" "}
                  <strong>
                    {filters.inventory === "in_stock"
                      ? "In stock"
                      : filters.inventory === "out_of_stock"
                      ? "Out of stock"
                      : "Partially out of stock"}
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, inventory: "all" })}
                  className="text-blue-500 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Remove inventory filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.preOrderEnabled && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 border border-blue-200 text-blue-900 rounded-full text-xs font-medium">
                <span>
                  Pre-order: <strong>Enabled</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, preOrderEnabled: false })}
                  className="text-blue-500 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Remove pre-order filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            {filters.tags.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/70 border border-blue-200 text-blue-900 rounded-full text-xs font-medium">
                <span>
                  Tags: <strong>{filters.tags.join(", ")}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setFilters({ ...filters, tags: [] })}
                  className="text-blue-500 hover:text-blue-800 p-0.5 rounded-full hover:bg-blue-200 transition-colors cursor-pointer"
                  title="Remove tag filter"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={() => setFilters(DEFAULT_PRODUCT_FILTERS)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline cursor-pointer ml-1"
            >
              Clear all
            </button>
          </div>
        )}

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
        onChange={handleUpdateColumns}
      />

      {/* Global Modals for More Actions */}
      <ManageBrandsModal
        isOpen={isManageBrandsOpen}
        onClose={() => setIsManageBrandsOpen(false)}
        onBrandsUpdated={() => router.refresh()}
      />

      <ManageRibbonsModal
        isOpen={isManageRibbonsOpen}
        onClose={() => setIsManageRibbonsOpen(false)}
        onRibbonsUpdated={() => router.refresh()}
      />

      <ManageTagsModal
        isOpen={isManageTagsOpen}
        onClose={() => setIsManageTagsOpen(false)}
        onTagsUpdated={() => router.refresh()}
      />

      <SelectInfoSectionsModal
        isOpen={isManageSectionsOpen}
        onClose={() => setIsManageSectionsOpen(false)}
        selectedIds={[]}
        initialSections={infoSectionsList}
        onApply={(_, updatedList) => {
          setInfoSectionsList(updatedList);
        }}
        onOpenCreateSection={() => {
          setEditingSection(null);
          setIsEditSectionOpen(true);
        }}
        onOpenEditSection={(sec) => {
          setEditingSection(sec);
          setIsEditSectionOpen(true);
        }}
      />

      <EditInfoSectionModal
        isOpen={isEditSectionOpen}
        onClose={() => {
          setIsEditSectionOpen(false);
          setEditingSection(null);
        }}
        section={editingSection}
        onSaved={(saved) => {
          setInfoSectionsList((prev) => {
            const exists = prev.some((s) => s.id === saved.id);
            return exists
              ? prev.map((s) => (s.id === saved.id ? { ...s, ...saved } : s))
              : [...prev, saved];
          });
        }}
      />

      <ApplyOptionPresetModal
        isOpen={isApplyPresetOpen}
        onClose={() => setIsApplyPresetOpen(false)}
        onApplyPreset={() => {
          setIsApplyPresetOpen(false);
          addToast(
            "info",
            "Option Presets",
            "To apply this preset to a product, open the product editor and click 'Option Presets'."
          );
        }}
      />

      <ExportProductsModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        totalProductsCount={products.length}
        filteredCount={filtered.length}
        selectedIds={selectedIds}
        filteredIds={filtered.map((p) => p.id)}
        currentSearch={search}
      />

      <FilterProductsDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />
    </div>
  );
}
