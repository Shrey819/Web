"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/useCartStore";
import { useWishlistStore } from "@/store/useWishlistStore";
import { useUserStore } from "@/store/useUserStore";
import { AnnouncementBar } from "./AnnouncementBar";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";
import { Search, ShoppingBag, Heart, Menu, ChevronDown, PhoneCall, Sparkles, X, User } from "lucide-react";
import { PRODUCTS } from "@/data/products";
import { formatCurrency } from "@/lib/utils";

export function Header() {
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { getItemCount, openCart } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const { user, isLoggedIn } = useUserStore();

  const cartCount = getItemCount();
  const wishlistCount = wishlistItems.length;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const searchResults = searchQuery.trim()
    ? PRODUCTS.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchOpen(false);
    }
  };

  return (
    <>
      {/* Top Announcement Strip */}
      <AnnouncementBar />

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-slate-950/90 text-white shadow-xl backdrop-blur-xl border-b border-slate-800/80 py-3"
            : "bg-slate-950 text-white border-b border-slate-900 py-4"
        }`}
      >
        <div className="content-shell flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileNavOpen(true)}
              className="lg:hidden p-2 text-slate-300 hover:text-white rounded-full hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>

            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center font-black text-slate-950 text-base shadow-md group-hover:scale-105 transition-transform font-mono">
                OM
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg tracking-tight leading-none text-white font-mono">
                  OM <span className="text-amber-400">AUTOMATION</span>
                </span>
                <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
                  Industrial Automation
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 type-nav">
            <div
              className="relative"
              onMouseEnter={() => setIsMegaMenuOpen(true)}
            >
              <button className="flex items-center gap-1.5 py-2 text-slate-200 hover:text-sky-400 transition-colors">
                <span>Products & Categories</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <Link
              href="/products"
              className="text-slate-200 hover:text-sky-400 transition-colors"
            >
              All Hardware Catalog
            </Link>

            <Link
              href="/about"
              className="text-slate-200 hover:text-sky-400 transition-colors"
            >
              About
            </Link>

            <Link
              href="/resources"
              className="text-slate-200 hover:text-sky-400 transition-colors"
            >
              Resources & Specs
            </Link>

            <Link
              href="/contact"
              className="text-slate-200 hover:text-sky-400 transition-colors"
            >
              Contact Us
            </Link>
          </nav>

          {/* Right Action Icons & Quote CTA */}
          <div className="flex items-center gap-3">
            {/* Search Trigger */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              aria-label="Search industrial components"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist Link */}
            <Link
              href="/wishlist"
              className="relative p-2.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              aria-label="Wishlist saved items"
            >
              <Heart className="w-5 h-5" />
              {mounted && wishlistItems.length > 0 && (
                <span className="absolute top-1 right-1 bg-rose-500 text-white type-label w-4 h-4 rounded-full flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart Trigger */}
            <button
              onClick={openCart}
              className="relative p-2.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
              aria-label="Open industrial shopping cart"
            >
              <ShoppingBag className="w-5 h-5 text-sky-400" />
              {mounted && getItemCount() > 0 && (
                <span className="absolute top-1 right-1 bg-sky-500 text-slate-950 type-label w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md">
                  {getItemCount()}
                </span>
              )}
            </button>

            {/* User Account / Profile Badge */}
            {mounted && isLoggedIn && user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 p-1.5 pr-3 text-slate-300 hover:text-white rounded-full hover:bg-slate-800/80 transition-colors border border-slate-800"
                title="User Workspace"
              >
                <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 font-mono font-extrabold text-xs flex items-center justify-center shadow-sm">
                  {user.name ? user.name[0].toUpperCase() : "U"}
                </div>
                <span className="text-xs font-mono font-bold max-w-24 truncate hidden xl:inline text-slate-200">
                  {user.name.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="p-2.5 text-slate-300 hover:text-white rounded-full hover:bg-slate-800 transition-colors"
                title="Sign In to Account"
              >
                <User className="w-5 h-5 text-amber-400" />
              </Link>
            )}

            {/* Request a Quote CTA */}
            <Link
              href="/quote"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 type-button shadow-md shadow-sky-500/10 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Request a Quote</span>
            </Link>
          </div>
        </div>

        {/* Mega Menu Overlay */}
        {isMegaMenuOpen && <MegaMenu onClose={() => setIsMegaMenuOpen(false)} />}
      </header>

      {/* Mobile Drawer Navigation */}
      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        cartCount={cartCount}
        wishlistCount={wishlistCount}
      />

      {/* Search Modal */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-20 px-4"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-200">
                Search Industrial Parts & Models
              </h3>
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
              <input
                type="text"
                autoFocus
                placeholder="Search by part number, brand (Siemens, Omron, ABB), or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500"
              />
            </form>

            {searchResults.length > 0 ? (
              <div className="space-y-2">
                <div className="text-[11px] font-mono uppercase text-slate-500 font-semibold mb-2">
                  Matching Hardware Items ({searchResults.length})
                </div>
                {searchResults.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.slug}`}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-700"
                  >
                    <div>
                      <div className="font-semibold text-sm text-white">{item.name}</div>
                      <div className="type-body-small text-slate-400 font-mono">
                        {item.brand} • SKU: {item.sku}
                      </div>
                    </div>
                    <div className="font-mono text-sm font-bold text-sky-400">
                      {formatCurrency(item.basePrice)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                No components found matching &quot;{searchQuery}&quot;. Try searching for &quot;Siemens&quot;, &quot;VFD&quot;, or &quot;Sensor&quot;.
              </div>
            ) : (
              <div className="type-body-small text-slate-400 py-2">
                <strong>Popular searches:</strong> Siemens S7-1200, OMRON E2B, ABB VFD 7.5kW, Laser Proximity Sensor.
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
