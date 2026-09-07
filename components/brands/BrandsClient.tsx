"use client";

import React, { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Award,
  Globe,
  Cog,
  Handshake,
  Mail,
  Grid,
  ChevronUp,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { BrandCard } from "./BrandCard";
import { getBrandMetadata } from "@/data/brandsData";
import type { BrandItem } from "@/app/actions/productManagement";

interface BrandsClientProps {
  brands: BrandItem[];
}

const CATEGORY_TABS = [
  "All Brands",
  "Linear Motion",
  "Gearboxes & Reducers",
  "Mechanical Transmission",
  "Drives & Controls",
];

export function BrandsClient({ brands }: BrandsClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Brands");
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Monitor scroll for floating scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter brands by search query and category
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const meta = getBrandMetadata(b.slug || b.name);
      const nameMatch = b.name.toLowerCase().includes(searchQuery.toLowerCase().trim());
      const countryMatch = (b.country || meta.country || "").toLowerCase().includes(searchQuery.toLowerCase().trim());
      const taglineMatch = (b.tagline || meta.tagline || "").toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchesSearch = !searchQuery.trim() || nameMatch || countryMatch || taglineMatch;
      if (!matchesSearch) return false;

      if (selectedCategory === "All Brands") return true;
      if (selectedCategory === "Linear Motion") {
        return meta.category === "Linear Motion";
      }
      if (selectedCategory === "Gearboxes & Reducers") {
        return meta.category === "Gearboxes & Reducers";
      }
      if (selectedCategory === "Mechanical Transmission") {
        return meta.category === "Mechanical Transmission";
      }
      if (selectedCategory === "Drives & Controls") {
        return meta.category === "Drives & Motors" || meta.category === "Sensors & Controls";
      }
      return true;
    });
  }, [brands, searchQuery, selectedCategory]);

  return (
    <div className="bg-[#faf9f5] min-h-screen text-slate-800">
      {/* 1. HERO BANNER (Our Site's Signature Tech Slate Theme: slate-950 with emerald/amber ambient glow) */}
      <section className="bg-slate-950 text-white py-16 sm:py-24 relative overflow-hidden border-b border-slate-900">
        {/* Ambient Top Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-[#00a651]/10 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-36 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-amber-400 font-mono text-xs font-bold mb-5 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#00a651] animate-pulse" />
            <span>Authorized OEM Brand Partners</span>
          </div>

          {/* Breadcrumb Navigation */}
          <nav className="flex items-center justify-center gap-2 text-xs sm:text-sm font-mono text-slate-400 mb-4">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              Home
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-white font-bold">Brands</span>
          </nav>

          {/* Main Title & Subtitle */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4 font-heading">
            Our Brands
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            World-class industrial automation manufacturers we partner with for factory-grade motion, control, and transmission systems.
          </p>
        </div>
      </section>

      {/* 2. MAIN SECTION: "Trusted Global Brands" */}
      <section className="py-14 sm:py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-[#00a651] font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Factory-Certified Equipment</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2 font-heading">
            Trusted Global Brands
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-lg mx-auto">
            Explore verified components with CAD downloads, technical manuals, and regional dispatch.
          </p>
        </div>

        {/* Filter Toolbar: Search Bar & Category Tabs */}
        <div className="mb-10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brand by name, country..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#00a651] focus:ring-2 focus:ring-[#00a651]/20 shadow-2xs transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full scrollbar-none">
              {CATEGORY_TABS.map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSelectedCategory(tab)}
                  className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === tab
                      ? "bg-[#00a651] text-white shadow-xs"
                      : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:text-slate-950"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4-Column Brand Grid */}
        {filteredBrands.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch">
            {filteredBrands.map((brand) => (
              <BrandCard key={brand.id || brand.slug || brand.name} brand={brand} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
            <h3 className="text-base font-bold text-slate-800 mb-1">No brands matching your filter</h3>
            <p className="text-xs text-slate-400 mb-4">
              Try searching with another keyword or resetting the category filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory("All Brands");
              }}
              className="px-4 py-2 bg-[#00a651] hover:bg-[#008a41] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </section>

      {/* 3. "Why These Brands?" SECTION */}
      <section className="py-16 sm:py-20 bg-white border-t border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2 font-heading">
              Why These Brands?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Engineered excellence in industrial automation and precision manufacturing
            </p>
          </div>

          {/* 4 Feature Columns in Our Theme Colors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Feature 1: Premium Quality (Emerald Green) */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00a651] mb-4 shadow-2xs">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Premium Quality
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                International ISO and DIN engineering standards
              </p>
            </div>

            {/* Feature 2: Global Recognition (Sky Blue) */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center text-[#0284c7] mb-4 shadow-2xs">
                <Globe className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Global Recognition
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Trusted in high-precision factory floors worldwide
              </p>
            </div>

            {/* Feature 3: Innovation (Amber / Gold) */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
                <Cog className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Innovation
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Cutting-edge multi-axis motion and IoT control
              </p>
            </div>

            {/* Feature 4: Reliability (Emerald / Handshake) */}
            <div className="flex flex-col items-center text-center p-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#00a651] mb-4 shadow-2xs">
                <Handshake className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Reliability
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Proven uptime in continuous 24/7 manufacturing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION (CTA) BANNER (Our Site's Tech Slate 950 Theme with Emerald & Amber Accents) */}
      <section className="bg-slate-950 text-white py-16 sm:py-20 relative overflow-hidden border-t border-slate-900">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-36 bg-amber-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-amber-400 font-mono text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00a651]" />
            <span>Direct OEM Sourcing & B2B Distribution</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-heading">
            Looking for a Specific Brand?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl mx-auto font-normal leading-relaxed">
            Contact our application engineering team for custom model sizing, lead time verification, or bulk RFQ quotes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-[#00a651] hover:bg-[#008a41] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-[#00a651]/20 cursor-pointer active:scale-95"
            >
              <Mail className="w-4 h-4 text-white" />
              <span>Contact Sales</span>
            </Link>

            <Link
              href="/products"
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 hover:border-slate-600 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Grid className="w-4 h-4 text-amber-400" />
              <span>Browse All Categories</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FLOATING SCROLL-TO-TOP BUTTON (Emerald Green matching our site) */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[#00a651] hover:bg-[#008a41] text-white flex items-center justify-center shadow-lg shadow-[#00a651]/30 active:scale-90 transition-all z-40 cursor-pointer"
          title="Scroll to top"
          aria-label="Scroll to top"
        >
          <ChevronUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
