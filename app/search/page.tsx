"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { PRODUCTS } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";
import { ChevronRight, Search } from "lucide-react";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [catalog, setCatalog] = useState<any[]>(PRODUCTS);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch the actual database products shown on the storefront
  useEffect(() => {
    setIsLoading(true);
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setCatalog(data);
        }
        setIsLoading(false);
      })
      .catch(() => {
        setIsLoading(false);
      });
  }, []);

  // Multi-word partial-match query filter (Matches Header Autocomplete)
  const results = query.trim()
    ? (() => {
        const keywords = query.toLowerCase().trim().split(/\s+/);
        return catalog.filter((p) => {
          const pName = p.name.toLowerCase();
          const pBrand = p.brand ? p.brand.toLowerCase() : "";
          const pSku = p.sku ? p.sku.toLowerCase() : "";
          const pDesc = p.description ? p.description.toLowerCase() : "";
          const pShortDesc = p.shortDescription ? p.shortDescription.toLowerCase() : "";
          
          return keywords.every(
            (kw) =>
              pName.includes(kw) ||
              pBrand.includes(kw) ||
              pSku.includes(kw) ||
              pDesc.includes(kw) ||
              pShortDesc.includes(kw)
          );
        });
      })()
    : [];

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      <div className="content-shell">
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">Search Results</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold font-mono text-slate-900">
            Search Results for &quot;{query}&quot;
          </h1>
          <p className="type-body-small text-slate-500 mt-1 font-mono">
            {isLoading 
              ? "Searching active catalog..." 
              : `Found ${results.length} matching industrial automation components`}
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mb-4"></div>
            <span className="text-sm font-mono text-slate-400">Searching active catalog...</span>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="type-card-title text-slate-900">
              No components found for &quot;{query}&quot;
            </h3>
            <p className="type-body-small text-slate-500 max-w-sm mx-auto">
              Please double check your part number or try searching for major manufacturers like Siemens, Omron, ABB, Schneider, or Allen-Bradley.
            </p>
            <Link
              href="/products"
              className="inline-block px-6 py-2.5 rounded-full bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 shadow-md"
            >
              Browse Complete Hardware Catalog
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm font-mono">Loading Search...</div>}>
      <SearchContent />
    </Suspense>
  );
}
