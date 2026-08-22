"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Save,
  Check,
  Package,
  Layers,
  Loader2,
  X,
  Plus,
  Edit2
} from "lucide-react";
import { saveProductVariants } from "@/app/actions/productManagement";
import { useToastStore } from "@/store/useToastStore";
import { CustomizeColumnsDrawer, ColumnConfig } from "./modals/CustomizeColumnsDrawer";

interface VariantRecord {
  id?: string;
  productId?: string;
  sku: string;
  barcode?: string;
  price: number;
  strikethroughPrice?: number | null;
  cost?: number | null;
  trackQuantity: boolean;
  stockQuantity: number;
  inventoryStatus: string;
  preOrderEnabled: boolean;
  preOrderLimit?: number | null;
  totalUnits?: number | null;
  totalUnitsMeasurement?: string;
  packageLength?: number | null;
  packageWidth?: number | null;
  packageHeight?: number | null;
  packageUnit?: string;
  mediaUrl?: string;
  attributes: Record<string, string>;
  displayName?: string;
}

interface AdminVariantsClientProps {
  productId: string;
  productName: string;
  basePrice: number;
  initialVariants: VariantRecord[];
}

export function AdminVariantsClient({
  productId,
  productName,
  basePrice,
  initialVariants,
}: AdminVariantsClientProps) {
  const router = useRouter();
  const { addToast } = useToastStore();

  const [variants, setVariants] = useState<VariantRecord[]>(initialVariants);
  const [search, setSearch] = useState("");
  const [filterChoice, setFilterChoice] = useState("");
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isCustomizeColumnsOpen, setIsCustomizeColumnsOpen] = useState(false);

  // Bulk Edit inputs
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStrikethrough, setBulkStrikethrough] = useState("");
  const [bulkInventoryStatus, setBulkInventoryStatus] = useState("IN_STOCK");

  // Variant table columns configuration
  const [columns, setColumns] = useState<ColumnConfig[]>([
    { id: "variant", label: "Variant", visible: true, required: true },
    { id: "price", label: "Price", visible: true, hasInfo: true },
    { id: "strikethroughPrice", label: "Strikethrough price", visible: true, hasInfo: true },
    { id: "inventory", label: "Inventory", visible: true, hasInfo: true },
    { id: "quantity", label: "Quantity", visible: true, hasInfo: true },
    { id: "preOrder", label: "Pre-order", visible: true, hasInfo: true },
    { id: "preOrderLimit", label: "Pre-order limit", visible: true, hasInfo: true },
    { id: "cost", label: "Cost of goods", visible: true, hasInfo: true },
    { id: "profit", label: "Profit", visible: false, hasInfo: true },
    { id: "margin", label: "Margin", visible: false, hasInfo: true },
    { id: "totalUnits", label: "Total units in variant", visible: true, hasInfo: true },
    { id: "pricePerUnit", label: "Price per unit", visible: true, hasInfo: true },
    { id: "addDimensions", label: "Add package dimensions", visible: true, hasInfo: true },
    { id: "dimensions", label: "Dimensions", visible: true },
    { id: "sku", label: "SKU", visible: true },
  ]);

  // Extract unique choices for filter dropdown
  const allChoices = useMemo(() => {
    const set = new Set<string>();
    variants.forEach((v) => {
      Object.entries(v.attributes || {}).forEach(([k, val]) => {
        set.add(`${k}: ${val}`);
      });
    });
    return Array.from(set);
  }, [variants]);

  // Filtered variants
  const filteredIndices = useMemo(() => {
    return variants
      .map((v, idx) => ({ v, idx }))
      .filter(({ v }) => {
        const query = search.toLowerCase().trim();
        const display = v.displayName || Object.values(v.attributes || {}).join(" | ");
        const matchSearch =
          !query ||
          display.toLowerCase().includes(query) ||
          v.sku.toLowerCase().includes(query);

        if (!matchSearch) return false;

        if (filterChoice) {
          const [optKey, optVal] = filterChoice.split(": ");
          if (v.attributes?.[optKey] !== optVal) return false;
        }

        return true;
      })
      .map(({ idx }) => idx);
  }, [variants, search, filterChoice]);

  const isAllSelected =
    filteredIndices.length > 0 &&
    filteredIndices.every((idx) => selectedIndices.includes(idx));

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(filteredIndices);
    }
  };

  const handleToggleRow = (idx: number) => {
    setSelectedIndices((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleUpdateVariantField = (index: number, field: keyof VariantRecord, value: any) => {
    setVariants((prev) =>
      prev.map((v, i) => (i === index ? { ...v, [field]: value } : v))
    );
  };

  // Bulk Apply
  const handleApplyBulk = () => {
    if (selectedIndices.length === 0) return;
    setVariants((prev) =>
      prev.map((v, i) => {
        if (!selectedIndices.includes(i)) return v;
        const updated = { ...v };
        if (bulkPrice) updated.price = Number(bulkPrice);
        if (bulkStrikethrough) updated.strikethroughPrice = Number(bulkStrikethrough);
        if (bulkInventoryStatus) updated.inventoryStatus = bulkInventoryStatus;
        return updated;
      })
    );
    addToast("success", "Bulk Applied", `Updated ${selectedIndices.length} variants.`);
    setSelectedIndices([]);
    setBulkPrice("");
    setBulkStrikethrough("");
  };

  // Save all variants
  const handleSaveAndContinue = async () => {
    setIsSaving(true);
    try {
      const res = await saveProductVariants(productId, variants);
      if (res.success) {
        addToast("success", "Variants Saved", "All variant prices and stock updated successfully!");
        router.push(`/admin/products/${productId}/edit`);
        router.refresh();
      } else {
        addToast("error", "Save Failed", res.error || "Could not save variants.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#f7f9fa] min-h-screen pb-24 text-slate-800">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products/${productId}/edit`}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Link href="/admin/products" className="hover:text-slate-800">
              Products
            </Link>
            <span>›</span>
            <Link href={`/admin/products/${productId}/edit`} className="hover:text-slate-800">
              {productName}
            </Link>
            <span>›</span>
            <span className="text-slate-900 font-bold">Variants</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/admin/products/${productId}/edit`}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAndContinue}
            className="px-6 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Apply & Continue
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Variants <span className="text-slate-400 font-normal text-lg">{variants.length}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            These variants are the combination of your product options.
          </p>
        </div>

        {/* Toolbar & Filters */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                <span>All variants ({variants.length})</span>
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

              {/* Filter by Choice */}
              <select
                value={filterChoice}
                onChange={(e) => setFilterChoice(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden text-slate-700 font-medium"
              >
                <option value="">Filter by choice</option>
                {allChoices.map((c, i) => (
                  <option key={i} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search variants..."
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

          {/* Bulk Edit Bar (Shown when 1+ rows selected) */}
          {selectedIndices.length > 0 && (
            <div className="p-3.5 bg-blue-50/80 border-b border-blue-200 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in duration-100">
              <div className="flex items-center gap-3">
                <span className="font-bold text-blue-900">
                  {selectedIndices.length} variants selected
                </span>
                <div className="h-4 w-px bg-blue-200" />
                <div className="flex items-center gap-2">
                  <span className="text-blue-800 font-medium">Set Price:</span>
                  <input
                    type="number"
                    placeholder="₹"
                    value={bulkPrice}
                    onChange={(e) => setBulkPrice(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-blue-200 rounded text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-800 font-medium">Strikethrough:</span>
                  <input
                    type="number"
                    placeholder="₹"
                    value={bulkStrikethrough}
                    onChange={(e) => setBulkStrikethrough(e.target.value)}
                    className="w-20 px-2 py-1 bg-white border border-blue-200 rounded text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-800 font-medium">Status:</span>
                  <select
                    value={bulkInventoryStatus}
                    onChange={(e) => setBulkInventoryStatus(e.target.value)}
                    className="px-2 py-1 bg-white border border-blue-200 rounded text-xs"
                  >
                    <option value="IN_STOCK">In stock</option>
                    <option value="OUT_OF_STOCK">Out of stock</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyBulk}
                  className="px-4 py-1 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 shadow-2xs"
                >
                  Apply to Selected
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIndices([])}
                  className="text-slate-500 hover:text-slate-800 font-medium"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          )}

          {/* Matrix Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs divide-y divide-slate-100 min-w-[1200px]">
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

                  {columns.find((c) => c.id === "variant")?.visible && (
                    <th className="px-4 py-3 min-w-[180px]">Variant</th>
                  )}
                  {columns.find((c) => c.id === "price")?.visible && (
                    <th className="px-4 py-3 min-w-[120px]">
                      <span className="flex items-center gap-1">
                        Price <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "strikethroughPrice")?.visible && (
                    <th className="px-4 py-3 min-w-[120px]">
                      <span className="flex items-center gap-1">
                        Strikethrough ... <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "inventory")?.visible && (
                    <th className="px-4 py-3 min-w-[130px]">
                      <span className="flex items-center gap-1">
                        Inventory <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "quantity")?.visible && (
                    <th className="px-4 py-3 min-w-[120px]">
                      <span className="flex items-center gap-1">
                        Quantity <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "preOrder")?.visible && (
                    <th className="px-4 py-3 min-w-[120px]">
                      <span className="flex items-center gap-1">
                        Pre-order <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "preOrderLimit")?.visible && (
                    <th className="px-4 py-3 min-w-[100px]">
                      <span className="flex items-center gap-1">
                        Pre-order limit <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "cost")?.visible && (
                    <th className="px-4 py-3 min-w-[110px]">
                      <span className="flex items-center gap-1">
                        Cost of goods <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "profit")?.visible && (
                    <th className="px-4 py-3 min-w-[90px]">Profit</th>
                  )}
                  {columns.find((c) => c.id === "margin")?.visible && (
                    <th className="px-4 py-3 min-w-[90px]">Margin</th>
                  )}
                  {columns.find((c) => c.id === "totalUnits")?.visible && (
                    <th className="px-4 py-3 min-w-[130px]">
                      <span className="flex items-center gap-1">
                        Total units in va... <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "pricePerUnit")?.visible && (
                    <th className="px-4 py-3 min-w-[140px]">
                      <span className="flex items-center gap-1">
                        Price per unit <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "addDimensions")?.visible && (
                    <th className="px-4 py-3 min-w-[160px]">
                      <span className="flex items-center gap-1">
                        Add package dimensions <Info className="w-3 h-3 text-slate-400" />
                      </span>
                    </th>
                  )}
                  {columns.find((c) => c.id === "dimensions")?.visible && (
                    <th className="px-4 py-3 min-w-[130px]">Dimensions</th>
                  )}
                  {columns.find((c) => c.id === "sku")?.visible && (
                    <th className="px-4 py-3 min-w-[130px]">SKU</th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredIndices.map((idx) => {
                  const v = variants[idx];
                  const isSelected = selectedIndices.includes(idx);
                  const vPrice = Number(v.price || 0);
                  const vCost = Number(v.cost || 0);
                  const profit = vCost > 0 ? vPrice - vCost : null;
                  const margin = vPrice > 0 && profit !== null ? (profit / vPrice) * 100 : null;

                  // Price per unit calculation: (vPrice / totalUnits) * 100
                  const totalUnits = Number(v.totalUnits || 25);
                  const unitMeasure = v.totalUnitsMeasurement || "g";
                  const pricePerUnit = totalUnits > 0 ? (vPrice / totalUnits) * 100 : null;

                  return (
                    <tr
                      key={v.id || idx}
                      className={`hover:bg-slate-50/60 transition-colors ${
                        isSelected ? "bg-blue-50/40" : ""
                      }`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRow(idx)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>

                      {/* Variant Name */}
                      {columns.find((c) => c.id === "variant")?.visible && (
                        <td className="px-4 py-3 font-semibold text-slate-900">
                          {v.displayName || Object.values(v.attributes || {}).join(" | ")}
                        </td>
                      )}

                      {/* Price */}
                      {columns.find((c) => c.id === "price")?.visible && (
                        <td className="px-4 py-3">
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-xs text-slate-400">₹</span>
                            <input
                              type="number"
                              value={v.price}
                              onChange={(e) =>
                                handleUpdateVariantField(idx, "price", Number(e.target.value))
                              }
                              className="w-24 pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-semibold"
                            />
                          </div>
                        </td>
                      )}

                      {/* Strikethrough Price */}
                      {columns.find((c) => c.id === "strikethroughPrice")?.visible && (
                        <td className="px-4 py-3">
                          <div className="relative flex items-center">
                            <span className="absolute left-2.5 text-xs text-slate-400">₹</span>
                            <input
                              type="number"
                              value={v.strikethroughPrice || ""}
                              onChange={(e) =>
                                handleUpdateVariantField(
                                  idx,
                                  "strikethroughPrice",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="w-24 pl-6 pr-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 text-slate-500"
                            />
                          </div>
                        </td>
                      )}

                      {/* Inventory: Track Quantity toggle */}
                      {columns.find((c) => c.id === "inventory")?.visible && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateVariantField(idx, "trackQuantity", !v.trackQuantity)
                              }
                              className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                                v.trackQuantity ? "bg-blue-600" : "bg-slate-300"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                                  v.trackQuantity ? "translate-x-4" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                            <span className="text-[11px] text-slate-600 font-medium">
                              Track quantity
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Quantity */}
                      {columns.find((c) => c.id === "quantity")?.visible && (
                        <td className="px-4 py-3">
                          {v.trackQuantity ? (
                            <input
                              type="number"
                              value={v.stockQuantity}
                              onChange={(e) =>
                                handleUpdateVariantField(idx, "stockQuantity", Number(e.target.value))
                              }
                              className="w-20 px-2 py-1 text-xs border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                            />
                          ) : (
                            <select
                              value={v.inventoryStatus}
                              onChange={(e) =>
                                handleUpdateVariantField(idx, "inventoryStatus", e.target.value)
                              }
                              className="px-2.5 py-1 text-xs border border-slate-200 rounded-lg bg-white font-medium"
                            >
                              <option value="IN_STOCK">In stock</option>
                              <option value="OUT_OF_STOCK">Out of stock</option>
                            </select>
                          )}
                        </td>
                      )}

                      {/* Pre-order */}
                      {columns.find((c) => c.id === "preOrder")?.visible && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateVariantField(idx, "preOrderEnabled", !v.preOrderEnabled)
                              }
                              className={`w-8 h-4.5 rounded-full transition-colors relative cursor-pointer ${
                                v.preOrderEnabled ? "bg-blue-600" : "bg-slate-300"
                              }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 transition-transform ${
                                  v.preOrderEnabled ? "translate-x-4" : "translate-x-0.5"
                                }`}
                              />
                            </button>
                            <span className="text-[11px] text-slate-600">
                              Allow pre-order
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Pre-order limit */}
                      {columns.find((c) => c.id === "preOrderLimit")?.visible && (
                        <td className="px-4 py-3 text-slate-400">
                          {v.preOrderEnabled ? (
                            <input
                              type="number"
                              value={v.preOrderLimit || ""}
                              placeholder="No limit"
                              onChange={(e) =>
                                handleUpdateVariantField(
                                  idx,
                                  "preOrderLimit",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="w-20 px-2 py-1 text-xs border border-slate-200 rounded"
                            />
                          ) : (
                            "--"
                          )}
                        </td>
                      )}

                      {/* Cost of goods */}
                      {columns.find((c) => c.id === "cost")?.visible && (
                        <td className="px-4 py-3">
                          <div className="relative flex items-center">
                            <span className="absolute left-2 text-xs text-slate-400">₹</span>
                            <input
                              type="number"
                              value={v.cost || ""}
                              onChange={(e) =>
                                handleUpdateVariantField(
                                  idx,
                                  "cost",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="w-20 pl-5 pr-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-700"
                            />
                          </div>
                        </td>
                      )}

                      {/* Profit */}
                      {columns.find((c) => c.id === "profit")?.visible && (
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {profit !== null ? `₹${profit.toFixed(2)}` : "--"}
                        </td>
                      )}

                      {/* Margin */}
                      {columns.find((c) => c.id === "margin")?.visible && (
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {margin !== null ? `${margin.toFixed(1)}%` : "--"}
                        </td>
                      )}

                      {/* Total units in variant */}
                      {columns.find((c) => c.id === "totalUnits")?.visible && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={v.totalUnits ?? 25}
                              onChange={(e) =>
                                handleUpdateVariantField(idx, "totalUnits", Number(e.target.value))
                              }
                              className="w-16 px-2 py-1 text-xs border border-slate-200 rounded-lg text-slate-800"
                            />
                            <span className="text-xs text-slate-500 font-medium">{unitMeasure}</span>
                          </div>
                        </td>
                      )}

                      {/* Price per unit */}
                      {columns.find((c) => c.id === "pricePerUnit")?.visible && (
                        <td className="px-4 py-3 text-xs font-semibold text-slate-700">
                          {pricePerUnit !== null ? `₹${pricePerUnit.toLocaleString("en-IN", { minimumFractionDigits: 2 })} / 100 ${unitMeasure}` : "--"}
                        </td>
                      )}

                      {/* Add package dimensions toggle */}
                      {columns.find((c) => c.id === "addDimensions")?.visible && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="w-8 h-4.5 rounded-full bg-blue-600 relative cursor-pointer"
                            >
                              <div className="w-3.5 h-3.5 bg-white rounded-full absolute top-0.5 translate-x-4" />
                            </button>
                            <span className="text-[11px] text-slate-600">Add dimensions</span>
                          </div>
                        </td>
                      )}

                      {/* Dimensions */}
                      {columns.find((c) => c.id === "dimensions")?.visible && (
                        <td className="px-4 py-3 text-xs text-slate-700 font-mono">
                          {v.packageLength || 25} x {v.packageWidth || 25} x {v.packageHeight || 20} {v.packageUnit || "cm"}
                        </td>
                      )}

                      {/* SKU */}
                      {columns.find((c) => c.id === "sku")?.visible && (
                        <td className="px-4 py-3">
                          <input
                            type="text"
                            value={v.sku}
                            onChange={(e) => handleUpdateVariantField(idx, "sku", e.target.value)}
                            className="w-28 px-2 py-1 text-xs font-mono border border-slate-200 rounded-lg"
                          />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
