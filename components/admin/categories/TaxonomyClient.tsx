"use client";

import { useState } from "react";
import { FolderTree, Building2 } from "lucide-react";
import { CategoryManager } from "./CategoryManager";
import { BrandManager } from "./BrandManager";
import type { BrandItem } from "@/app/actions/productManagement";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status?: string;
  product_count: number;
}

interface TaxonomyClientProps {
  categories: CategoryItem[];
  brands: BrandItem[];
  unbrandedCount?: number;
  initialTab?: "categories" | "brands";
}

export function TaxonomyClient({
  categories,
  brands,
  unbrandedCount = 0,
  initialTab = "categories",
}: TaxonomyClientProps) {
  const [activeTab, setActiveTab] = useState<"categories" | "brands">(initialTab);

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("categories")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "categories"
              ? "bg-[#00a651] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <FolderTree className="w-4 h-4" />
          <span>Categories</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "categories"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("brands")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "brands"
              ? "bg-[#00a651] text-white shadow-xs"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Brands &amp; Linked Products</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "brands"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            {brands.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "categories" ? (
        <CategoryManager categories={categories} />
      ) : (
        <BrandManager brands={brands} unbrandedCount={unbrandedCount} />
      )}
    </div>
  );
}
