"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, FolderTree } from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import { PRODUCTS } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
import { Product } from "@/types";

interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  itemCount?: number;
}

interface MegaMenuProps {
  onClose: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function MegaMenu({ onClose, onMouseEnter, onMouseLeave }: MegaMenuProps) {
  const [categoriesList, setCategoriesList] = useState<DbCategory[]>([]);
  const [activeCategorySlug, setActiveCategorySlug] = useState<string>("");
  const [activeProducts, setActiveProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [isFading, setIsFading] = useState<boolean>(false);

  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Prevent background main page scrolling while MegaMenu popup is active
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Fetch active categories from database on mount
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategoriesList(data);
          setActiveCategorySlug(data[0].slug);
        } else {
          // Fallback to static CATEGORIES if DB is empty
          const fallback = CATEGORIES.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            itemCount: c.itemCount,
          }));
          setCategoriesList(fallback);
          setActiveCategorySlug(fallback[0].slug);
        }
      })
      .catch(() => {
        const fallback = CATEGORIES.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          itemCount: c.itemCount,
        }));
        setCategoriesList(fallback);
        setActiveCategorySlug(fallback[0].slug);
      });
  }, []);

  // Fetch products whenever active category changes
  useEffect(() => {
    if (!activeCategorySlug) return;
    setLoadingProducts(true);
    setIsFading(true);

    fetch(`/api/products?category=${encodeURIComponent(activeCategorySlug)}`)
      .then((res) => res.json())
      .then((prods) => {
        if (Array.isArray(prods) && prods.length > 0) {
          setActiveProducts(prods);
        } else {
          const matched = PRODUCTS.filter(
            (p) =>
              p.categoryId?.toLowerCase() === activeCategorySlug.toLowerCase() ||
              p.subcategoryId?.toLowerCase() === activeCategorySlug.toLowerCase()
          );
          setActiveProducts(matched.length > 0 ? matched : PRODUCTS.slice(0, 8));
        }
      })
      .catch(() => {
        setActiveProducts(PRODUCTS.slice(0, 8));
      })
      .finally(() => {
        setLoadingProducts(false);
        // Smooth opacity fade-in transition (0.2s)
        setTimeout(() => setIsFading(false), 50);
      });
  }, [activeCategorySlug]);

  // Hover Intent Handler: 150ms delay before triggering category switch
  const handleCategoryHover = (slug: string) => {
    if (slug === activeCategorySlug) return;
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);

    hoverTimerRef.current = setTimeout(() => {
      setIsFading(true);
      setTimeout(() => {
        setActiveCategorySlug(slug);
      }, 100);
    }, 150);
  };

  const activeCategory =
    categoriesList.find((c) => c.slug === activeCategorySlug) ||
    categoriesList[0];

  const displayProducts = activeProducts.slice(0, 8);

  return (
    <div
      className="absolute top-full left-0 right-0 bg-slate-950 text-white border-b border-slate-800 shadow-2xl backdrop-blur-2xl transition-all duration-300 z-50 py-6 px-4 sm:px-8 before:content-[''] before:absolute before:-top-6 before:left-0 before:right-0 before:h-6"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave || onClose}
    >
      <div className="w-full max-w-none px-4 sm:px-8 lg:px-12 flex flex-col md:flex-row gap-6 max-h-[75vh]">
        {/* LEFT COLUMN: All Active Database Categories */}
        <div className="w-full md:w-80 shrink-0 bg-slate-900/90 rounded-2xl border border-slate-800 p-2 overflow-y-auto overscroll-contain max-h-[60vh] scrollbar-thin space-y-1">
          <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase text-amber-400 tracking-wider flex items-center justify-between border-b border-slate-800/80 mb-1">
            <span>Admin Categories ({categoriesList.length})</span>
            <FolderTree className="w-3.5 h-3.5" />
          </div>

          {categoriesList.map((cat) => {
            const isActive = cat.slug === activeCategorySlug;

            return (
              <div
                key={cat.id || cat.slug}
                onMouseEnter={() => handleCategoryHover(cat.slug)}
                className={`group flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "bg-amber-400 text-slate-950 font-bold shadow-md"
                    : "hover:bg-slate-800 text-slate-200 hover:text-white"
                }`}
              >
                <Link
                  href={`/category/${cat.slug}`}
                  onClick={onClose}
                  className="flex items-center gap-3 flex-1 min-w-0"
                >
                  <div
                    className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center font-mono text-xs font-bold border ${
                      isActive
                        ? "border-slate-950/20 bg-slate-950/10 text-slate-950"
                        : "border-slate-700 bg-slate-950 text-amber-400"
                    }`}
                  >
                    {cat.name[0].toUpperCase()}
                  </div>
                  <span className="text-xs sm:text-sm font-heading tracking-tight truncate leading-snug">
                    {cat.name}
                  </span>
                </Link>

                <ChevronRight
                  className={`w-4 h-4 shrink-0 transition-transform ${
                    isActive
                      ? "text-slate-950 translate-x-0.5"
                      : "text-slate-500 group-hover:text-white"
                  }`}
                />
              </div>
            );
          })}
        </div>

        {/* RIGHT PANEL: Live Category Products Grid with Smooth 0.2s Transparency Fade */}
        <div className="flex-1 bg-slate-900/50 rounded-2xl border border-slate-800 p-6 overflow-y-auto overscroll-contain max-h-[60vh] flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-5">
              <div>
                <span className="text-[10px] font-mono uppercase text-amber-400 font-bold tracking-widest">
                  Live Products from Admin Catalog
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight font-heading">
                  {activeCategory?.name || "Category Products"}
                </h3>
              </div>

              {activeCategory?.slug && (
                <Link
                  href={`/category/${activeCategory.slug}`}
                  onClick={onClose}
                  className="text-xs font-mono font-bold text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1"
                >
                  <span>Go to {activeCategory.name} Category Page →</span>
                </Link>
              )}
            </div>

            {/* Product Grid Container */}
            <div
              className={`transition-opacity duration-300 ease-in-out ${
                isFading || loadingProducts ? "opacity-30" : "opacity-100"
              }`}
            >
              {loadingProducts ? (
                /* Organized Skeleton Product Cards Grid */
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="bg-white/90 rounded-2xl p-3 border border-slate-200 animate-pulse space-y-3"
                    >
                      <div className="aspect-square w-full rounded-xl bg-slate-200" />
                      <div className="h-3 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ) : displayProducts.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-sm">
                  No active products currently in this category.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {displayProducts.map((prod) => {
                    const imgUrl =
                      prod.images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80";

                    return (
                      <Link
                        key={prod.id}
                        href={`/product/${prod.slug}`}
                        onClick={onClose}
                        className="group/prod bg-white rounded-2xl p-3 border border-slate-200/80 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden"
                      >
                        <div>
                          {/* Product Thumbnail Box */}
                          <div className="relative aspect-square w-full rounded-xl bg-slate-950 overflow-hidden mb-2.5 border border-slate-100">
                            <img
                              src={imgUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover group-hover/prod:scale-108 transition-transform duration-500"
                            />
                          </div>

                          {/* Product Title */}
                          <h4 className="text-xs font-bold text-slate-900 group-hover/prod:text-sky-600 transition-colors line-clamp-2 leading-snug">
                            {prod.name}
                          </h4>
                        </div>

                        <div className="mt-2 text-[11px] font-mono font-bold text-slate-900">
                          {formatCurrency(prod.basePrice)}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
