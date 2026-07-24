"use client";

import { FilterState } from "./FilterSidebar";
import { X } from "lucide-react";

interface ActiveFiltersProps {
  filters: FilterState;
  onRemoveCategory: () => void;
  onRemoveBrand: (brand: string) => void;
  onRemoveIp: () => void;
  onReset: () => void;
}

export function ActiveFilters({
  filters,
  onRemoveCategory,
  onRemoveBrand,
  onRemoveIp,
  onReset,
}: ActiveFiltersProps) {
  const hasActiveCategory = filters.category !== "all";
  const hasActiveBrands = filters.brand.length > 0;
  const hasActiveIp = filters.ipRating !== "all";
  const hasActiveStock = filters.inStockOnly;

  if (!hasActiveCategory && !hasActiveBrands && !hasActiveIp && !hasActiveStock) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-2xl bg-slate-100/80 border border-slate-200">
      <span className="type-technical font-bold uppercase text-slate-500 mr-1">
        Active Filters:
      </span>

      {hasActiveCategory && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-semibold border border-slate-200 shadow-sm">
          <span>Category: {filters.category}</span>
          <button onClick={onRemoveCategory} className="hover:text-rose-500">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      {filters.brand.map((b) => (
        <span
          key={b}
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-semibold border border-slate-200 shadow-sm"
        >
          <span>Brand: {b}</span>
          <button onClick={() => onRemoveBrand(b)} className="hover:text-rose-500">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {hasActiveIp && (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white text-slate-800 text-xs font-semibold border border-slate-200 shadow-sm">
          <span>Rating: {filters.ipRating}</span>
          <button onClick={onRemoveIp} className="hover:text-rose-500">
            <X className="w-3 h-3" />
          </button>
        </span>
      )}

      <button
        onClick={onReset}
        className="text-xs font-bold text-sky-600 hover:text-sky-700 underline ml-auto"
      >
        Clear All
      </button>
    </div>
  );
}
