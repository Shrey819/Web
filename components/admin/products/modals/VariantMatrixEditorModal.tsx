"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Search,
  Check,
  Package,
  Layers,
  Plus,
  Trash2,
  SlidersHorizontal,
  Info,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import { useToastStore } from "@/store/useToastStore";
import { GeneratedVariant, OptionInput } from "@/lib/variantGenerator";

interface VariantMatrixEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  basePrice: number;
  options: OptionInput[];
  initialVariants: GeneratedVariant[];
  onApplyVariants: (variants: GeneratedVariant[]) => void;
}

export function VariantMatrixEditorModal({
  isOpen,
  onClose,
  productName,
  basePrice,
  options,
  initialVariants,
  onApplyVariants,
}: VariantMatrixEditorModalProps) {
  const { addToast } = useToastStore();

  const [overrides, setOverrides] = useState<GeneratedVariant[]>(initialVariants || []);
  const [search, setSearch] = useState("");

  // New Override Draft Builder state
  const [draftAttributes, setDraftAttributes] = useState<Record<string, string>>({});
  const [draftPrice, setDraftPrice] = useState<string>("");
  const [draftStrikethrough, setDraftStrikethrough] = useState<string>("");
  const [draftSku, setDraftSku] = useState<string>("");
  const [draftStock, setDraftStock] = useState<string>("100");
  const [draftInventoryStatus, setDraftInventoryStatus] = useState<"IN_STOCK" | "OUT_OF_STOCK">("IN_STOCK");

  const activeOptions = useMemo(
    () => options.filter((o) => o.choices && o.choices.length > 0),
    [options]
  );

  // Initialize draft attributes with first choice of each option
  useEffect(() => {
    if (isOpen) {
      setOverrides(initialVariants || []);
      const initialAttrs: Record<string, string> = {};
      activeOptions.forEach((opt) => {
        if (opt.choices && opt.choices.length > 0) {
          initialAttrs[opt.name] = opt.choices[0].name;
        }
      });
      setDraftAttributes(initialAttrs);
      setDraftPrice(String(basePrice || 0));
      setDraftStrikethrough("");
      setDraftSku("");
      setDraftStock("100");
      setDraftInventoryStatus("IN_STOCK");
    }
  }, [isOpen, initialVariants, activeOptions, basePrice]);

  if (!isOpen) return null;

  const totalPossible = activeOptions.reduce(
    (acc, o) => acc * Math.max(1, o.choices.length),
    activeOptions.length > 0 ? 1 : 0
  );

  const filteredOverrides = overrides.filter((v) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    const name = v.displayName || Object.values(v.attributes || {}).join(" | ");
    return name.toLowerCase().includes(q) || (v.sku && v.sku.toLowerCase().includes(q));
  });

  const handleAddOrUpdateOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (Object.keys(draftAttributes).length === 0) {
      addToast("warning", "Select Options", "Please select option choices for this override.");
      return;
    }

    const displayName = Object.values(draftAttributes).join(" | ");
    const key = Object.entries(draftAttributes)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, val]) => `${k}:${val}`)
      .join("|");

    const priceNum = draftPrice !== "" ? parseFloat(draftPrice) : basePrice;
    const strikethroughNum = draftStrikethrough !== "" ? parseFloat(draftStrikethrough) : null;
    const stockNum = draftStock !== "" ? parseInt(draftStock) : 100;

    const newOverride: GeneratedVariant = {
      id: "var_" + Date.now(),
      sku: draftSku.trim() || `VAR-${Date.now().toString().slice(-4)}`,
      barcode: "",
      price: isNaN(priceNum) ? basePrice : priceNum,
      strikethroughPrice: strikethroughNum,
      cost: null,
      trackQuantity: false,
      stockQuantity: isNaN(stockNum) ? 100 : stockNum,
      inventoryStatus: draftInventoryStatus,
      preOrderEnabled: false,
      preOrderLimit: null,
      totalUnits: null,
      totalUnitsMeasurement: "g",
      packageLength: null,
      packageWidth: null,
      packageHeight: null,
      packageUnit: "cm",
      mediaUrl: "",
      attributes: { ...draftAttributes },
      displayName,
    };

    setOverrides((prev) => {
      // Replace existing if attributes match
      const existsIndex = prev.findIndex((v) => {
        const vKey = Object.entries(v.attributes || {})
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([k, val]) => `${k}:${val}`)
          .join("|");
        return vKey === key;
      });

      if (existsIndex >= 0) {
        return prev.map((v, i) => (i === existsIndex ? { ...v, ...newOverride } : v));
      }
      return [...prev, newOverride];
    });

    addToast("success", "Override Added", `Set custom pricing/stock for "${displayName}".`);
  };

  const handleRemoveOverride = (index: number) => {
    setOverrides((prev) => prev.filter((_, i) => i !== index));
    addToast("info", "Override Removed", "Variant will use standard base pricing.");
  };

  const handleUpdateOverrideRow = (idOrIdx: string | number, field: keyof GeneratedVariant, value: any) => {
    setOverrides((prev) =>
      prev.map((v, i) => {
        const matches = v.id ? v.id === idOrIdx : i === idOrIdx;
        if (!matches) return v;
        return { ...v, [field]: value };
      })
    );
  };

  const handleEditRowInDraft = (v: GeneratedVariant) => {
    setDraftAttributes(v.attributes || {});
    setDraftPrice(String(v.price ?? basePrice));
    setDraftStrikethrough(v.strikethroughPrice != null ? String(v.strikethroughPrice) : "");
    setDraftSku(v.sku || "");
    setDraftStock(String(v.stockQuantity ?? 100));
    setDraftInventoryStatus(v.inventoryStatus || "IN_STOCK");
    addToast("info", "Loaded into Editor", `Loaded "${v.displayName}" to edit above.`);
  };

  const handleApply = () => {
    onApplyVariants(overrides);
    addToast(
      "success",
      "Overrides Saved",
      overrides.length > 0
        ? `Applied ${overrides.length} custom variant override(s).`
        : "All variants will dynamically use base product pricing."
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-slate-800 dark:text-slate-200">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Custom Variant Pricing & Overrides
              </h2>
              <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 rounded-full text-xs font-bold">
                {overrides.length} Custom Overrides
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Only create records for variants that have different prices, SKUs, or stock from the base product (₹{basePrice.toFixed(2)}).
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. Add / Configure Variant Override Card */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                Add / Edit Custom Variant Override
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total possible combinations: <strong>{totalPossible.toLocaleString()}</strong>
              </span>
            </div>

            <form onSubmit={handleAddOrUpdateOverride} className="space-y-4">
              {/* Option Choice Selectors */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
                {activeOptions.map((opt) => (
                  <div key={opt.name} className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate" title={opt.name}>
                      {opt.name}
                    </label>
                    <select
                      value={draftAttributes[opt.name] || opt.choices[0]?.name || ""}
                      onChange={(e) =>
                        setDraftAttributes((prev) => ({ ...prev, [opt.name]: e.target.value }))
                      }
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {opt.choices.map((c, i) => (
                        <option key={i} value={c.name}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Pricing & Stock Overrides Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-200/60 dark:border-slate-800">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Custom Price (₹) *</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={String(basePrice)}
                      value={draftPrice}
                      onChange={(e) => setDraftPrice(e.target.value)}
                      className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Strikethrough (₹)</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Optional"
                      value={draftStrikethrough}
                      onChange={(e) => setDraftStrikethrough(e.target.value)}
                      className="w-full pl-6 pr-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Custom SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. PROD-XL-RED"
                    value={draftSku}
                    onChange={(e) => setDraftSku(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono font-medium text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Inventory Status</label>
                  <select
                    value={draftInventoryStatus}
                    onChange={(e) => setDraftInventoryStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="IN_STOCK">In stock</option>
                    <option value="OUT_OF_STOCK">Out of stock</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save / Update Override
                </button>
              </div>
            </form>
          </div>

          {/* 2. Active Custom Overrides Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Configured Custom Overrides ({overrides.length})
              </h3>
              {overrides.length > 0 && (
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search overrides..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-500 font-medium text-slate-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {overrides.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
                <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto">
                  <Layers className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">No Custom Overrides Needed</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  All {totalPossible.toLocaleString()} option combinations currently use the standard base price of{" "}
                  <strong>₹{basePrice.toFixed(2)}</strong> and default in-stock inventory. Add an override above only if specific combinations have different prices or SKUs.
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                <table className="w-full text-left text-xs divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-2.5">Variant Override</th>
                      <th className="px-4 py-2.5">Custom Price (₹)</th>
                      <th className="px-4 py-2.5">SKU</th>
                      <th className="px-4 py-2.5">Status</th>
                      <th className="px-4 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                    {filteredOverrides.map((v, idx) => (
                      <tr key={v.id || idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Variant Name */}
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-slate-900 dark:text-white block text-xs">
                            {v.displayName || Object.values(v.attributes || {}).join(" | ")}
                          </span>
                        </td>

                        {/* Direct Editable Custom Price & Strikethrough */}
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="relative w-28">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                value={v.price}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
                                  handleUpdateOverrideRow(v.id || idx, "price", val);
                                }}
                                className="w-full pl-6 pr-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 rounded-lg text-xs font-bold text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div className="relative w-24">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 text-[10px]">
                                ~₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Strike"
                                value={v.strikethroughPrice ?? ""}
                                onChange={(e) => {
                                  const val = e.target.value === "" ? null : parseFloat(e.target.value);
                                  handleUpdateOverrideRow(v.id || idx, "strikethroughPrice", val);
                                }}
                                className="w-full pl-5 pr-1.5 py-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 rounded-lg text-xs text-slate-600 dark:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 placeholder:text-slate-300"
                                title="Strikethrough Price"
                              />
                            </div>
                          </div>
                        </td>

                        {/* Direct Editable SKU */}
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={v.sku || ""}
                            onChange={(e) =>
                              handleUpdateOverrideRow(v.id || idx, "sku", e.target.value)
                            }
                            placeholder="SKU"
                            className="w-28 px-2 py-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 focus:border-blue-500 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                          />
                        </td>

                        {/* Direct Editable Inventory Status */}
                        <td className="px-4 py-2">
                          <select
                            value={v.inventoryStatus || "IN_STOCK"}
                            onChange={(e) =>
                              handleUpdateOverrideRow(v.id || idx, "inventoryStatus", e.target.value)
                            }
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold border focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer ${
                              v.inventoryStatus === "OUT_OF_STOCK"
                                ? "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
                                : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                            }`}
                          >
                            <option value="IN_STOCK">In stock</option>
                            <option value="OUT_OF_STOCK">Out of stock</option>
                          </select>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleRemoveOverride(idx)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                              title="Remove override"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Unconfigured combinations automatically use base price ₹{basePrice.toFixed(2)}.
          </span>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-6 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Apply Overrides
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
