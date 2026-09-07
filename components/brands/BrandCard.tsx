"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Globe, Package } from "lucide-react";
import { BrandLogo } from "./BrandLogos";
import { getBrandMetadata } from "@/data/brandsData";
import type { BrandItem } from "@/app/actions/productManagement";

interface BrandCardProps {
  brand: BrandItem;
}

export function BrandCard({ brand }: BrandCardProps) {
  const meta = getBrandMetadata(brand.slug || brand.name);
  const country = brand.country || meta.country;
  const productCount = brand.productCount || 0;
  const targetUrl = `/products?brand=${encodeURIComponent(brand.name)}`;

  return (
    <div className="group relative bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-xs hover:shadow-xl hover:border-[#00a651]/50 transition-all duration-300 flex flex-col justify-between h-full">
      {/* Top Tag Bar: Country & In-Stock Badges */}
      <div className="px-3.5 pt-3 pb-1 flex items-center justify-between gap-2 z-10">
        {country ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
            <Globe className="w-3 h-3 text-slate-400" />
            <span>{country}</span>
          </span>
        ) : (
          <span />
        )}

        {productCount > 0 && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-[#00a651] text-[10px] font-bold border border-emerald-200/80 shadow-2xs">
            <Package className="w-3 h-3" />
            <span>{productCount} in Catalog</span>
          </span>
        )}
      </div>

      {/* Main Brand Logo Box: Big, full size with minimal clean padding */}
      <Link
        href={targetUrl}
        className="flex-1 flex items-center justify-center p-2 sm:p-3 min-h-[180px] sm:min-h-[200px] h-48 sm:h-56 bg-white cursor-pointer overflow-hidden"
      >
        <BrandLogo
          name={brand.name}
          slug={brand.slug || brand.name}
          logoUrl={brand.logo}
          size="lg"
          className="w-full h-full max-h-[165px] sm:max-h-[195px] max-w-[95%] object-contain"
        />
      </Link>

      {/* Card Bottom Area: Default Brand Name / Hover "View Products" Bar */}
      <div className="relative border-t border-slate-100 overflow-hidden bg-slate-50/60">
        {/* Default View (Visible when not hovered) */}
        <div className="py-3 px-4 text-center transition-all duration-300 group-hover:opacity-0 group-hover:-translate-y-2">
          <span className="text-sm font-bold text-slate-800 tracking-tight block truncate">
            {brand.name}
          </span>
        </div>

        {/* Hover / Active Action Bar (Sliding in smoothly from bottom in our brand green) */}
        <Link
          href={targetUrl}
          className="absolute inset-0 bg-[#00a651] hover:bg-[#008a41] text-white font-bold text-xs flex items-center justify-center gap-1.5 opacity-0 translate-y-full group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md cursor-pointer tracking-wide"
        >
          <ArrowRight className="w-3.5 h-3.5" />
          <span>View Products</span>
        </Link>
      </div>
    </div>
  );
}
