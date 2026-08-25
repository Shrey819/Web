"use client";

import { useState, useEffect, useRef } from "react";
import { X, ChevronDown, ChevronUp, Search, Check } from "lucide-react";
import { getGlobalCategories, getGlobalTags } from "@/app/actions/productManagement";

export interface ProductFilters {
  categories: string[];
  productType: "all" | "physical" | "digital";
  inventory: "all" | "in_stock" | "out_of_stock" | "partial";
  visibility: "all" | "shown" | "hidden";
  preOrderEnabled: boolean;
  tags: string[];
}

export const DEFAULT_PRODUCT_FILTERS: ProductFilters = {
  categories: [],
  productType: "all",
  inventory: "all",
  visibility: "all",
  preOrderEnabled: false,
  tags: [],
};

interface FilterProductsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
}

export function FilterProductsDrawer({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
}: FilterProductsDrawerProps) {
  // Global Lookup Data
  const [categoriesList, setCategoriesList] = useState<Array<{ id: string; name: string }>>([]);
  const [tagsList, setTagsList] = useState<string[]>([]);

  // Accordion Expand / Collapse States
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    categories: true,
    productType: true,
    inventory: true,
    visibility: true,
    preOrder: true,
    tags: true,
  });

  // Category Search Popover
  const [categorySearch, setCategorySearch] = useState("");
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);

  // Tag Search Popover
  const [tagSearch, setTagSearch] = useState("");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      getGlobalCategories().then((res) => {
        if (res.success) setCategoriesList(res.categories || []);
      });
      getGlobalTags().then((res) => {
        if (res.success) setTagsList((res.tags || []).map((t) => t.name));
      });
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target as Node)
      ) {
        setIsCategoryDropdownOpen(false);
      }
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Calculate total active filters count
  let activeCount = 0;
  if (filters.categories.length > 0) activeCount += filters.categories.length;
  if (filters.productType !== "all") activeCount += 1;
  if (filters.inventory !== "all") activeCount += 1;
  if (filters.visibility !== "all") activeCount += 1;
  if (filters.preOrderEnabled) activeCount += 1;
  if (filters.tags.length > 0) activeCount += filters.tags.length;

  const handleClearAll = () => {
    onFiltersChange(DEFAULT_PRODUCT_FILTERS);
  };

  const handleToggleCategory = (catName: string) => {
    const exists = filters.categories.includes(catName);
    const updated = exists
      ? filters.categories.filter((c) => c !== catName)
      : [...filters.categories, catName];
    onFiltersChange({ ...filters, categories: updated });
  };

  const handleToggleTag = (tagName: string) => {
    const exists = filters.tags.includes(tagName);
    const updated = exists
      ? filters.tags.filter((t) => t !== tagName)
      : [...filters.tags, tagName];
    onFiltersChange({ ...filters, tags: updated });
  };

  const filteredCategories = categoriesList.filter((c) =>
    c.name.toLowerCase().includes(categorySearch.toLowerCase())
  );

  const filteredTags = tagsList.filter((t) =>
    t.toLowerCase().includes(tagSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-sm bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col animate-in slide-in-from-right duration-200 text-slate-900 dark:text-white">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Filter your products</h2>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {/* 1. Categories Accordion */}
            <div className="p-4 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleSection("categories")}
                className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <span>Categories</span>
                {openSections.categories ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {openSections.categories && (
                <div ref={categoryDropdownRef} className="relative pt-1">
                  <div
                    onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-500/40 rounded-full flex items-center justify-between text-slate-400 text-xs font-medium cursor-pointer shadow-xs"
                  >
                    <span className="text-slate-600 dark:text-slate-300 truncate">
                      {filters.categories.length === 0
                        ? "Search by category name"
                        : `${filters.categories.length} selected`}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                  </div>

                  {isCategoryDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search categories..."
                          value={categorySearch}
                          onChange={(e) => setCategorySearch(e.target.value)}
                          autoFocus
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-xs">
                            No categories found
                          </div>
                        ) : (
                          filteredCategories.map((cat) => {
                            const isChecked = filters.categories.includes(cat.name);
                            return (
                              <label
                                key={cat.id}
                                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleCategory(cat.name)}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {cat.name}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected Category Badges */}
                  {filters.categories.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      {filters.categories.map((c) => (
                        <span
                          key={c}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-md text-[11px] font-semibold"
                        >
                          {c}
                          <button
                            type="button"
                            onClick={() => handleToggleCategory(c)}
                            className="text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 2. Product type Accordion */}
            <div className="p-4 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleSection("productType")}
                className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <span>Product type</span>
                {openSections.productType ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {openSections.productType && (
                <div className="space-y-2 pt-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "physical", label: "Physical" },
                    { id: "digital", label: "Digital" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <input
                        type="radio"
                        name="productType"
                        value={item.id}
                        checked={filters.productType === item.id}
                        onChange={() =>
                          onFiltersChange({ ...filters, productType: item.id as any })
                        }
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Inventory Accordion */}
            <div className="p-4 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleSection("inventory")}
                className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <span>Inventory</span>
                {openSections.inventory ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {openSections.inventory && (
                <div className="space-y-2 pt-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "in_stock", label: "In stock" },
                    { id: "out_of_stock", label: "Out of stock" },
                    { id: "partial", label: "Partially out of stock" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <input
                        type="radio"
                        name="inventory"
                        value={item.id}
                        checked={filters.inventory === item.id}
                        onChange={() =>
                          onFiltersChange({ ...filters, inventory: item.id as any })
                        }
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Visibility Accordion */}
            <div className="p-4 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleSection("visibility")}
                className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <span>Visibility</span>
                {openSections.visibility ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {openSections.visibility && (
                <div className="space-y-2 pt-1">
                  {[
                    { id: "all", label: "All" },
                    { id: "shown", label: "Shown in online store" },
                    { id: "hidden", label: "Hidden from online store" },
                  ].map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 cursor-pointer select-none group"
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={item.id}
                        checked={filters.visibility === item.id}
                        onChange={() =>
                          onFiltersChange({ ...filters, visibility: item.id as any })
                        }
                        className="w-4 h-4 text-blue-600 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Pre-order Accordion */}
            <div className="p-4 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleSection("preOrder")}
                className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <span>Pre-order</span>
                {openSections.preOrder ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {openSections.preOrder && (
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={filters.preOrderEnabled}
                      onChange={(e) =>
                        onFiltersChange({ ...filters, preOrderEnabled: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Pre-order enabled
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* 6. Tags Accordion */}
            <div className="p-4 space-y-2.5">
              <button
                type="button"
                onClick={() => toggleSection("tags")}
                className="w-full flex items-center justify-between text-left font-bold text-slate-900 dark:text-white cursor-pointer"
              >
                <span>Tags</span>
                {openSections.tags ? (
                  <ChevronUp className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                )}
              </button>

              {openSections.tags && (
                <div ref={tagDropdownRef} className="relative pt-1">
                  <div
                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-950 border border-blue-400 dark:border-blue-500/40 rounded-full flex items-center justify-between text-slate-400 text-xs font-medium cursor-pointer shadow-xs"
                  >
                    <span className="text-slate-600 dark:text-slate-300 truncate">
                      {filters.tags.length === 0
                        ? "Select tags..."
                        : `${filters.tags.length} selected`}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400 shrink-0" />
                  </div>

                  {isTagDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 space-y-2 animate-in fade-in zoom-in-95 duration-100">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search tags..."
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          autoFocus
                          className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 pt-1">
                        {filteredTags.length === 0 ? (
                          <div className="p-3 text-center text-slate-400 dark:text-slate-500 text-xs">
                            No tags found
                          </div>
                        ) : (
                          filteredTags.map((tagName) => {
                            const isChecked = filters.tags.includes(tagName);
                            return (
                              <label
                                key={tagName}
                                className="flex items-center gap-2.5 px-2.5 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleTag(tagName)}
                                  className="w-4 h-4 text-blue-600 rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-blue-500 cursor-pointer"
                                />
                                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                  {tagName}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Selected Tag Badges */}
                  {filters.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-2">
                      {filters.tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 rounded-md text-[11px] font-semibold"
                        >
                          {t}
                          <button
                            type="button"
                            onClick={() => handleToggleTag(t)}
                            className="text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Bar */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {activeCount === 0
                ? "No filters applied"
                : `${activeCount} ${activeCount === 1 ? "filter" : "filters"} applied`}
            </span>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={activeCount === 0}
              className={`text-xs font-semibold transition-colors cursor-pointer ${
                activeCount === 0
                  ? "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                  : "text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
              }`}
            >
              Clear all
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
