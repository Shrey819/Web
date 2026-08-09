"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Product } from "@/types";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSidebar, FilterState, CategoryFilterItem } from "@/components/catalog/FilterSidebar";
import { MobileFilterDrawer } from "@/components/catalog/MobileFilterDrawer";
import { ActiveFilters } from "@/components/catalog/ActiveFilters";
import { LayoutGrid, List, SlidersHorizontal, ChevronRight, Search } from "lucide-react";

interface StorefrontCatalogProps {
  initialProducts: Product[];
  categories?: CategoryFilterItem[];
}

export function StorefrontCatalog({ initialProducts, categories = [] }: StorefrontCatalogProps) {
  const [layout, setLayout] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating">("featured");
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    brand: [],
    minPrice: 0,
    maxPrice: 250000,
    inStockOnly: false,
    ipRating: "all",
    searchQuery: "",
  });

  const resetFilters = () => {
    setFilters({
      category: "all",
      brand: [],
      minPrice: 0,
      maxPrice: 250000,
      inStockOnly: false,
      ipRating: "all",
      searchQuery: "",
    });
  };

  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      if (filters.category !== "all") {
        const catObj = categories.find(c => c.id === filters.category || c.slug === filters.category);
        const pCategoryIds: string[] = Array.isArray((p as any).categoryIds) ? (p as any).categoryIds : [];
        const matchesCategory = p.categoryId === filters.category || 
                                (catObj && (p.categoryId === catObj.id || p.categoryId === catObj.slug)) ||
                                pCategoryIds.some((cid: string) => cid === filters.category || (catObj && (cid === catObj.id || cid === catObj.slug)));
        if (!matchesCategory) return false;
      }
      if (filters.brand.length > 0 && !filters.brand.includes(p.brand)) return false;
      if (p.basePrice > filters.maxPrice * 100) return false;
      if (filters.inStockOnly && p.stockStatus === 'out-of-stock') return false;
      if (
        filters.searchQuery &&
        !p.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) &&
        !p.sku.toLowerCase().includes(filters.searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortBy === "price-low") return a.basePrice - b.basePrice;
      if (sortBy === "price-high") return b.basePrice - a.basePrice;
      return 0;
    });
  }, [initialProducts, filters, sortBy, categories]);

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Industrial Hardware Catalog</span>
        </nav>

        {/* Page Title & Stats */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4 pb-6 border-b border-slate-200">
          <div>
            <span className="type-label text-sky-600">
              Live Factory Database Inventory
            </span>
            <h1 className="text-3xl sm:text-4xl font-mono font-extrabold text-slate-900 tracking-tight mt-1">
              Industrial Automation Parts & Systems
            </h1>
          </div>
          <div className="type-technical text-slate-500">
            Showing <strong className="text-slate-900 font-bold">{filteredProducts.length}</strong> published SKU items
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-3 sticky top-28">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              onReset={resetFilters}
              totalResults={filteredProducts.length}
              categories={categories}
            />
          </div>

          {/* Main Catalog View */}
          <div className="lg:col-span-9 space-y-6">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              {/* Mobile Filter Button */}
              <button
                onClick={() => setIsMobileDrawerOpen(true)}
                className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white type-button"
              >
                <SlidersHorizontal className="w-4 h-4 text-sky-400" />
                <span>Filters ({filteredProducts.length})</span>
              </button>

              {/* Search Bar Input */}
              <div className="relative flex-1 max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search parts, model #..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-4 ml-auto">
                {/* Sort Dropdown */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500 font-mono hidden sm:inline">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as "featured" | "price-low" | "price-high" | "rating")}
                    className="p-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-xs font-semibold focus:outline-none focus:border-sky-500"
                  >
                    <option value="featured">Featured Relevance</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                {/* Grid vs List View */}
                <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1 bg-slate-50">
                  <button
                    onClick={() => setLayout("grid")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      layout === "grid" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setLayout("list")}
                    className={`p-1.5 rounded-lg transition-colors ${
                      layout === "list" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900"
                    }`}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Bar */}
            <ActiveFilters
              filters={filters}
              onRemoveCategory={() => setFilters({ ...filters, category: "all" })}
              onRemoveBrand={(b) =>
                setFilters({ ...filters, brand: filters.brand.filter((item) => item !== b) })
              }
              onRemoveIp={() => setFilters({ ...filters, ipRating: "all" })}
              onReset={resetFilters}
            />

            {/* Product List/Grid */}
            {filteredProducts.length > 0 ? (
              <div
                className={
                  layout === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6"
                    : "space-y-4"
                }
              >
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} layout={layout} />
                ))}
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-8 h-8" />
                </div>
                <h3 className="type-card-title text-slate-900">
                  No published industrial components found
                </h3>
                <p className="type-body-small text-slate-500 max-w-sm mx-auto">
                  Make sure products have the <span className="font-bold text-emerald-600">Eye icon (Visible)</span> toggled in the Admin dashboard!
                </p>
                <button
                  onClick={resetFilters}
                  className="px-6 py-2.5 rounded-full bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 shadow-md"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        onReset={resetFilters}
        totalResults={filteredProducts.length}
        categories={categories}
      />
    </div>
  );
}
