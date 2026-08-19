"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUserStore } from "@/store/useUserStore";
import { AnnouncementBar } from "./AnnouncementBar";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  ChevronDown,
  PhoneCall,
  User,
  Mic,
  PackageCheck,
  X,
} from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { formatCurrency } from "@/lib/utils";
function getSearchTokens(categories: any[], catalog: any[]) {
  const stopWords = new Set(["and", "the", "for", "with", "pack", "pcs", "of", "nos", "mm", "inch", "high", "low", "new", "old", "grade", "series"]);
  const tokens = new Set<string>();
  
  catalog.forEach((p) => {
    p.name
      .toLowerCase()
      .split(/[^a-zA-Z0-9]+/)
      .forEach((word: string) => {
        if (word.length > 2 && !stopWords.has(word)) {
          tokens.add(word);
        }
      });
  });

  categories.forEach((c) => {
    if (c && c.name) {
      c.name
        .toLowerCase()
        .split(/[^a-zA-Z0-9]+/)
        .forEach((word: string) => {
          if (word.length > 2 && !stopWords.has(word)) {
            tokens.add(word);
          }
        });
    }
  });

  return Array.from(tokens);
}

function highlightMatch(text: string, query: string) {
  if (!query) return <span>{text}</span>;
  const parts = text.split(new RegExp(`(${query})`, "gi"));
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <strong key={i} className="font-extrabold text-slate-900">{part}</strong>
        ) : (
          <span key={i} className="text-slate-500 font-normal">{part}</span>
        )
      )}
    </span>
  );
}

function getThumbnailUrl(url: string) {
  if (!url) return "https://images.unsplash.com/photo-1597423498219-04418210827d?w=50&auto=format&fit=crop&q=40";
  if (url.startsWith("data:")) return url; // Base64 data URIs are local and load instantly
  if (url.includes("unsplash.com")) {
    return url.replace(/w=\d+/, "w=50").replace(/q=\d+/, "q=40");
  }
  if (url.includes("cloudinary.com")) {
    return url.replace("/upload/", "/upload/w_50,c_fill,q_auto:low/");
  }
  return url;
}

export function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isBrandsMenuOpen, setIsBrandsMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [supportPhone, setSupportPhone] = useState("+91 90993 92066");
  const [showBottomNav, setShowBottomNav] = useState(true);
  const lastScrollY = useRef(0);
  const [searchActiveTab, setSearchActiveTab] = useState<"products" | "collections">("products");
  const [categories, setCategories] = useState<any[]>([]);
  const [searchCatalog, setSearchCatalog] = useState<any[]>(PRODUCTS);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileSearchFocused, setIsMobileSearchFocused] = useState(false);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.support_phone) {
          setSupportPhone(data.support_phone);
        }
      })
      .catch(() => {});

    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => {});

    // Fetch database products to sync with actual storefront products page
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setSearchCatalog(data);
        }
      })
      .catch(() => {});
  }, []);

  // Click outside to close search dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
      if (
        mobileSearchContainerRef.current &&
        !mobileSearchContainerRef.current.contains(event.target as Node)
      ) {
        setIsMobileSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock background page scroll while searching is active
  useEffect(() => {
    const isSearching = (isSearchFocused || isMobileSearchFocused) && searchQuery.trim().length > 0;
    if (isSearching) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isSearchFocused, isMobileSearchFocused, searchQuery]);

  const megaMenuTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleMegaMenuOpen = () => {
    if (megaMenuTimerRef.current) clearTimeout(megaMenuTimerRef.current);
    setIsMegaMenuOpen(true);
  };

  const handleMegaMenuClose = () => {
    megaMenuTimerRef.current = setTimeout(() => {
      setIsMegaMenuOpen(false);
    }, 250); // 250ms smooth hover transition grace delay
  };

  const { getItemCount, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, isLoggedIn } = useUserStore();

  const cartCount = getItemCount();
  const wishlistCount = wishlistItems.length;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }

      // Always show bottom nav when scroll is less than 50px
      if (currentScrollY < 50) {
        setShowBottomNav(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      const deltaY = currentScrollY - lastScrollY.current;
      // 15px tolerance threshold to ensure a solid 0/1 output and prevent flickering
      if (Math.abs(deltaY) > 15) {
        if (deltaY > 0) {
          setShowBottomNav(false); // Scrolling down -> hide (0)
        } else {
          setShowBottomNav(true); // Scrolling up -> show (1)
        }
        lastScrollY.current = currentScrollY;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const allSearchProducts = searchCatalog;

  const filteredProducts = searchQuery.trim()
    ? (() => {
        const keywords = searchQuery.toLowerCase().trim().split(/\s+/);
        return allSearchProducts.filter((p) => {
          const pName = p.name.toLowerCase();
          const pBrand = p.brand.toLowerCase();
          const pSku = p.sku ? p.sku.toLowerCase() : "";
          const pDesc = p.description ? p.description.toLowerCase() : "";
          return keywords.every(
            (kw) =>
              pName.includes(kw) ||
              pBrand.includes(kw) ||
              pSku.includes(kw) ||
              pDesc.includes(kw)
          );
        });
      })().slice(0, 5)
    : [];

  const filteredCollections = searchQuery.trim()
    ? categories.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.slug.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : categories.slice(0, 5);

  const filteredSuggestions = searchQuery.trim()
    ? getSearchTokens(categories, searchCatalog).filter((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10)
    : getSearchTokens(categories, searchCatalog).slice(0, 10);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  return (
    <>
      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/95 text-white shadow-2xl backdrop-blur-xl border-b border-slate-800"
            : "bg-slate-950 text-white border-b border-slate-900"
        }`}
      >
        {/* Top Infinite Announcement Bar */}
        <div className={`transition-all duration-300 overflow-hidden ${
          !showBottomNav && isScrolled
            ? "max-h-0 opacity-0"
            : "max-h-12 opacity-100"
        }`}>
          <AnnouncementBar />
        </div>
        {/* ROW 1: Logo, Search Bar, User & Cart Icons */}
        <div className="w-full max-w-none px-4 sm:px-8 lg:px-12 py-3.5 flex items-center justify-between gap-4 sm:gap-6">
          {/* Logo & Mobile Menu Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md group-hover:scale-105 transition-transform font-mono">
                OM
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight leading-none text-white font-mono">
                  OM <span className="text-amber-400">AUTOMATION</span>
                </span>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  Industrial Hardware
                </span>
              </div>
            </Link>
          </div>

          {/* Central Search Bar */}
          <div ref={searchContainerRef} className="flex-1 max-w-2xl relative hidden md:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search for Branded inserts, PLCs, VFDs, Sensors, SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-slate-900/90 border border-slate-700/80 hover:border-slate-600 focus:border-amber-400 text-white rounded-full pl-11 pr-24 py-2.5 text-xs sm:text-sm placeholder:text-slate-400 focus:outline-none transition-all shadow-inner font-mono"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                {searchQuery.trim().length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="hover:text-amber-400 p-1 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                    <span className="text-slate-700 font-light select-none">|</span>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    alert("Voice search activated. Speak product name or SKU...");
                  }}
                  className="hover:text-amber-400 transition-colors p-1"
                  title="Voice Search"
                  aria-label="Voice Search"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Live Autocomplete Suggestions Panel (Matches Screenshot design) */}
            {isSearchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 flex min-h-[300px] text-slate-800 font-sans">
                {/* Left Column: Products & Collections (60% width) */}
                <div className="w-3/5 p-4 flex flex-col justify-between">
                  <div>
                    {/* Tabs */}
                    <div className="flex items-center gap-6 border-b border-slate-100 pb-2 mb-4 text-sm font-semibold font-mono">
                      <button
                        type="button"
                        onClick={() => setSearchActiveTab("products")}
                        className={`pb-2 relative transition-all ${
                          searchActiveTab === "products"
                            ? "text-slate-900 border-b-2 border-slate-950 font-bold"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Products
                      </button>
                      <button
                        type="button"
                        onClick={() => setSearchActiveTab("collections")}
                        className={`pb-2 relative transition-all ${
                          searchActiveTab === "collections"
                            ? "text-slate-900 border-b-2 border-slate-950 font-bold"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Collections
                      </button>
                    </div>

                    {/* Products Content */}
                    {searchActiveTab === "products" && (
                      <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                        {filteredProducts.map((prod) => {
                          const imgUrl = getThumbnailUrl((prod.images && prod.images[0]?.url) || "");
                          return (
                            <Link
                              key={prod.id}
                              href={`/product/${prod.slug}`}
                              onClick={() => setIsSearchFocused(false)}
                              className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-50 transition-colors group"
                            >
                              <div className="w-12 h-12 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                                <img
                                  src={imgUrl}
                                  alt={prod.name}
                                  className="max-h-full max-w-full object-contain mix-blend-multiply"
                                />
                              </div>
                              <span className="font-bold text-xs leading-snug text-slate-800 group-hover:text-amber-500 transition-colors line-clamp-2">
                                {prod.name}
                              </span>
                            </Link>
                          );
                        })}
                        {filteredProducts.length === 0 && (
                          <div className="text-slate-400 text-xs py-6 font-mono text-center">
                            No matching products found
                          </div>
                        )}
                      </div>
                    )}

                    {/* Collections Content */}
                    {searchActiveTab === "collections" && (
                      <div className="space-y-2 max-h-[320px] overflow-y-auto">
                        {filteredCollections.map((cat) => (
                          <Link
                            key={cat.id}
                            href={`/category/${cat.slug}`}
                            onClick={() => setIsSearchFocused(false)}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                          >
                            <span className="font-bold text-xs text-slate-800">{cat.name}</span>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                              Collection
                            </span>
                          </Link>
                        ))}
                        {filteredCollections.length === 0 && (
                          <div className="text-slate-400 text-xs py-6 font-mono text-center">
                            No matching collections found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Suggestions (40% width) */}
                <div className="w-2/5 bg-slate-50 border-l border-slate-100 p-4">
                  <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider mb-3">
                    Suggestions
                  </div>
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    {filteredSuggestions.map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        onClick={() => {
                          setSearchQuery(phrase);
                          router.push(`/search?q=${encodeURIComponent(phrase)}`);
                          setIsSearchFocused(false);
                        }}
                        className="w-full text-left py-1 hover:bg-slate-100 hover:text-slate-950 px-2 rounded-md transition-colors block text-xs"
                      >
                        {highlightMatch(phrase, searchQuery)}
                      </button>
                    ))}
                    {filteredSuggestions.length === 0 && (
                      <div className="text-slate-400 text-xs py-4 font-mono text-center">
                        No suggestions found
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Action Icons: User Account & Shopping Cart */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Wishlist Icon */}
            <Link
              href="/wishlist"
              className="relative p-2.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors hidden sm:flex"
              aria-label="Wishlist saved items"
              title="Saved Wishlist"
            >
              <Heart className="w-5 h-5" />
              {mounted && wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white font-mono text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* User Account Icon */}
            {mounted && isLoggedIn && user ? (
              <Link
                href="/profile"
                className="p-2.5 text-slate-300 hover:text-amber-400 rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center"
                title="Account Profile"
              >
                <User className="w-6 h-6 text-amber-400" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-2.5 text-slate-300 hover:text-amber-400 rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center"
                title="Sign In / Register"
              >
                <User className="w-6 h-6 text-slate-200 hover:text-amber-400 transition-colors" />
              </Link>
            )}

            {/* Shopping Cart Icon */}
            <button
              onClick={openCart}
              className="relative p-2.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors flex items-center justify-center"
              aria-label="Shopping Cart"
              title="Open Cart"
            >
              <ShoppingBag className="w-6 h-6 text-white" />
              {mounted && getItemCount() > 0 && (
                <span className="absolute top-1 right-1 bg-amber-400 text-slate-950 font-mono text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center shadow">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Row */}
        <div ref={mobileSearchContainerRef} className="w-full max-w-none px-4 sm:px-8 lg:px-12 pb-3 md:hidden relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search components..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsMobileSearchFocused(true)}
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-full pl-10 pr-24 py-2 text-xs placeholder:text-slate-400 focus:outline-none font-mono"
            />
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
              {searchQuery.trim().length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="hover:text-amber-400 p-1 transition-colors"
                    title="Clear search"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <span className="text-slate-700 font-light select-none">|</span>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  alert("Voice search activated. Speak product name or SKU...");
                }}
                className="hover:text-amber-400 transition-colors p-1"
                title="Voice Search"
                aria-label="Voice Search"
              >
                <Mic className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Mobile Autocomplete Suggestions Dropdown (Vertical Staged Layout) */}
          {isMobileSearchFocused && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col text-slate-800 font-sans max-h-[380px] overflow-y-auto">
              {/* 1. Suggestions Section (Top Part) */}
              <div className="bg-slate-50 border-b border-slate-100 p-4">
                <div className="text-[10px] font-mono uppercase text-slate-400 font-semibold tracking-wider mb-2">
                  Suggestions
                </div>
                <div className="space-y-2">
                  {filteredSuggestions.map((phrase) => (
                    <button
                      key={phrase}
                      type="button"
                      onClick={() => {
                        setSearchQuery(phrase);
                        router.push(`/search?q=${encodeURIComponent(phrase)}`);
                        setIsMobileSearchFocused(false);
                      }}
                      className="w-full text-left py-1.5 hover:bg-slate-100 hover:text-slate-950 px-2 rounded-md transition-colors block text-xs"
                    >
                      {highlightMatch(phrase, searchQuery)}
                    </button>
                  ))}
                  {filteredSuggestions.length === 0 && (
                    <div className="text-slate-400 text-xs py-2 font-mono text-center">
                      No suggestions found
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Products & Collections Section (Downside Part) */}
              <div className="p-4 flex flex-col">
                {/* Tabs */}
                <div className="flex items-center gap-6 border-b border-slate-100 pb-2 mb-3 text-sm font-semibold font-mono">
                  <button
                    type="button"
                    onClick={() => setSearchActiveTab("products")}
                    className={`pb-2 relative transition-all ${
                      searchActiveTab === "products"
                        ? "text-slate-900 border-b-2 border-slate-950 font-bold"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Products
                  </button>
                  <button
                    type="button"
                    onClick={() => setSearchActiveTab("collections")}
                    className={`pb-2 relative transition-all ${
                      searchActiveTab === "collections"
                        ? "text-slate-900 border-b-2 border-slate-950 font-bold"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Collections
                  </button>
                </div>

                {/* Products Content */}
                {searchActiveTab === "products" && (
                  <div className="space-y-2.5">
                    {filteredProducts.map((prod) => {
                      const imgUrl = getThumbnailUrl((prod.images && prod.images[0]?.url) || "");
                      return (
                        <Link
                          key={prod.id}
                          href={`/product/${prod.slug}`}
                          onClick={() => setIsMobileSearchFocused(false)}
                          className="flex items-center gap-3 p-1 rounded-xl hover:bg-slate-50 transition-colors group"
                        >
                          <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 shrink-0">
                            <img
                              src={imgUrl}
                              alt={prod.name}
                              className="max-h-full max-w-full object-contain mix-blend-multiply"
                            />
                          </div>
                          <span className="font-bold text-xs leading-snug text-slate-800 group-hover:text-amber-500 transition-colors line-clamp-2">
                            {prod.name}
                          </span>
                        </Link>
                      );
                    })}
                    {filteredProducts.length === 0 && (
                      <div className="text-slate-400 text-xs py-4 font-mono text-center">
                        No matching products found
                      </div>
                    )}
                  </div>
                )}

                {/* Collections Content */}
                {searchActiveTab === "collections" && (
                  <div className="space-y-2">
                    {filteredCollections.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/category/${cat.slug}`}
                        onClick={() => setIsMobileSearchFocused(false)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-bold text-xs text-slate-800">{cat.name}</span>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full">
                          Collection
                        </span>
                      </Link>
                    ))}
                    {filteredCollections.length === 0 && (
                      <div className="text-slate-400 text-xs py-4 font-mono text-center">
                        No matching collections found
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ROW 2: Bottom Navigation Bar */}
        <div className={`border-t border-slate-900 bg-slate-950/80 backdrop-blur-md transition-all duration-300 overflow-hidden ${
          !showBottomNav && isScrolled
            ? "max-h-0 py-0 border-t-transparent opacity-0 pointer-events-none"
            : "max-h-16 py-2.5 opacity-100"
        }`}>
          <div className="w-full max-w-none px-4 sm:px-8 lg:px-12 flex items-center justify-between gap-4 text-xs font-semibold font-mono">
            {/* Left Nav Links */}
            <nav className="flex items-center gap-6 overflow-x-auto scrollbar-none whitespace-nowrap">
              <div
                className="relative py-1"
                onMouseEnter={handleMegaMenuOpen}
                onMouseLeave={handleMegaMenuClose}
              >
                <button
                  onClick={() => setIsMegaMenuOpen(!isMegaMenuOpen)}
                  className="flex items-center gap-1 text-white font-bold hover:text-amber-400 transition-colors py-1"
                >
                  <span>Shop</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              <Link
                href="/products?filter=deals"
                className="text-slate-300 hover:text-amber-400 transition-colors font-bold py-1"
              >
                Deals
              </Link>

              <Link
                href="/quote"
                className="text-slate-300 hover:text-amber-400 transition-colors font-bold py-1"
              >
                Wholesale
              </Link>

              <div
                className="relative hidden sm:block py-1"
                onMouseEnter={() => setIsBrandsMenuOpen(true)}
                onMouseLeave={() => setIsBrandsMenuOpen(false)}
              >
                <button className="flex items-center gap-1 text-slate-300 hover:text-amber-400 transition-colors py-1">
                  <span>Brands</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              <Link
                href="/products?sort=newest"
                className="text-slate-300 hover:text-amber-400 transition-colors font-bold py-1"
              >
                New Arrivals
              </Link>
            </nav>

            {/* Right Nav Links & "Call us" Pill CTA */}
            <div className="hidden lg:flex items-center gap-6 whitespace-nowrap text-slate-300 font-medium">
              <Link href="/delivery" className="hover:text-white transition-colors">
                Delivery
              </Link>

              <Link href="/orders" className="hover:text-white transition-colors flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Track your Order</span>
              </Link>

              <Link href="/about" className="hover:text-white transition-colors">
                About Us
              </Link>

              <Link href="/contact" className="hover:text-white transition-colors">
                Contact Us
              </Link>

              {/* Pill Call Us Button (Dynamic Support Phone from Admin Settings) */}
              <a
                href={`tel:${supportPhone.replace(/\s+/g, '')}`}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border-2 border-amber-400 hover:bg-amber-400 hover:text-slate-950 text-amber-400 font-bold transition-all shadow"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Mega Menu Overlay */}
        {isMegaMenuOpen && (
          <MegaMenu
            onClose={() => setIsMegaMenuOpen(false)}
            onMouseEnter={handleMegaMenuOpen}
            onMouseLeave={handleMegaMenuClose}
          />
        )}
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
        supportPhone={supportPhone}
      />
    </>
  );
}
