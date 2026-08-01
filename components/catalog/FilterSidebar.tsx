"use client";

import { BRANDS } from "@/data/brands";
import { CATEGORIES } from "@/data/categories";
import { SlidersHorizontal, Check, RefreshCw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

export interface FilterState {
  category: string;
  brand: string[];
  minPrice: number;
  maxPrice: number;
  inStockOnly: boolean;
  ipRating: string;
  searchQuery: string;
}

export interface CategoryFilterItem {
  id: string;
  name: string;
  slug: string;
  itemCount?: number;
}

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
  categories?: CategoryFilterItem[];
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
  totalResults,
  categories = [],
}: FilterSidebarProps) {
  const categoryList = categories.length > 0 ? categories : CATEGORIES;

  const handleBrandToggle = (brandName: string) => {
    const isSelected = filters.brand.includes(brandName);
    const updated = isSelected
      ? filters.brand.filter((b) => b !== brandName)
      : [...filters.brand, brandName];
    onFilterChange({ ...filters, brand: updated });
  };

  return (
    <aside className="w-full bg-white rounded-3xl p-6 border border-slate-200/90 shadow-lg space-y-6">
      {/* Title Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2 font-bold text-slate-900 text-sm font-mono">
          <SlidersHorizontal className="w-4 h-4 text-sky-600" />
          <span>Faceted Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> Reset
        </button>
      </div>

      {/* Category Filter */}
      <div className="space-y-2.5">
        <h4 className="type-label text-slate-500">
          Domain Category
        </h4>
        <div className="space-y-1">
          <button
            onClick={() => onFilterChange({ ...filters, category: "all" })}
            className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
              filters.category === "all"
                ? "bg-slate-900 text-white font-bold"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <span>All Categories</span>
          </button>
          {categoryList.map((cat) => {
            const isSelected = filters.category === cat.id || filters.category === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => onFilterChange({ ...filters, category: isSelected ? "all" : cat.id })}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-between ${
                  isSelected
                    ? "bg-sky-600 text-white font-bold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{cat.name}</span>
                {cat.itemCount !== undefined && (
                  <span className="text-[10px] opacity-70">({cat.itemCount})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand Checkboxes */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <h4 className="type-label text-slate-500">
          Manufacturer Brand
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {BRANDS.map((b) => {
            const isChecked = filters.brand.includes(b.name);
            return (
              <label
                key={b.id}
                className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleBrandToggle(b.name)}
                  className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className={isChecked ? "font-bold text-slate-900" : ""}>
                  {b.name}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price Range Slider */}
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex items-center justify-between type-technical">
          <span className="font-bold uppercase tracking-wider text-slate-500">
            Max Price
          </span>
          <span className="font-bold text-sky-600">{formatCurrency(filters.maxPrice)}</span>
        </div>
        <input
          type="range"
          min={2500}
          max={250000}
          step={5000}
          value={filters.maxPrice}
          onChange={(e) =>
            onFilterChange({ ...filters, maxPrice: Number(e.target.value) })
          }
          className="w-full accent-sky-600 cursor-pointer"
        />
        <div className="flex justify-between type-technical text-slate-400">
          <span>{formatCurrency(2500)}</span>
          <span>{formatCurrency(125000)}</span>
          <span>{formatCurrency(250000)}</span>
        </div>
      </div>

      {/* Stock Toggle */}
      <div className="pt-4 border-t border-slate-100">
        <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
          <span className="font-semibold">In-Stock Only (Same Day)</span>
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) =>
              onFilterChange({ ...filters, inStockOnly: e.target.checked })
            }
            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
          />
        </label>
      </div>

      {/* Ingress Protection Filter */}
      <div className="space-y-2.5 pt-4 border-t border-slate-100">
        <h4 className="type-label text-slate-500">
          Ingress Protection (IP)
        </h4>
        <select
          value={filters.ipRating}
          onChange={(e) =>
            onFilterChange({ ...filters, ipRating: e.target.value })
          }
          className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-sky-500"
        >
          <option value="all">All Ingress Ratings</option>
          <option value="IP67">IP67 Waterproof & Dust-tight</option>
          <option value="IP69K">IP69K Washdown & Steam</option>
          <option value="IP20">IP20 Cabinet Control</option>
        </select>
      </div>
    </aside>
  );
}
