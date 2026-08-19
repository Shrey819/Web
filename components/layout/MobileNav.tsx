"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  ShoppingBag,
  User,
  PhoneCall,
  Mic,
  PackageCheck
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
  wishlistCount: number;
  supportPhone?: string;
}

export function MobileNav({
  isOpen,
  onClose,
  cartCount,
  wishlistCount,
  supportPhone = "+91 90993 92066",
}: MobileNavProps) {
  const router = useRouter();
  const [currentMenu, setCurrentMenu] = useState<"main" | "shop" | "brands">("main");
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [categoryProducts, setCategoryProducts] = useState<Record<string, any[]>>({});
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>({
    support_phone: supportPhone,
    announcement: "Get Rs.100 Flat Discount on your First order.",
    store_name: "OM Automation",
  });

  // Fetch categories and settings
  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCategories(data);
        }
      })
      .catch(() => {});

    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          setSettings(data);
        }
      })
      .catch(() => {});
  }, []);

  // Prevent background scrolling when mobile menu is open (Fixed viewport lock for iOS/Android support)
  useEffect(() => {
    if (isOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    };
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const handleCategoryClick = (cat: any) => {
    if (expandedCategory === cat.id) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(cat.id);
      if (!categoryProducts[cat.id]) {
        setLoadingCategory(cat.id);
        fetch(`/api/products?category=${cat.slug}`)
          .then((res) => res.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setCategoryProducts((prev) => ({ ...prev, [cat.id]: data }));
            }
            setLoadingCategory(null);
          })
          .catch(() => setLoadingCategory(null));
      }
    }
  };

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "sensors":
        return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=60";
      case "plcs":
        return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=100&auto=format&fit=crop&q=60";
      case "drives":
        return "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=100&auto=format&fit=crop&q=60";
      default:
        return "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=100&auto=format&fit=crop&q=60";
    }
  };

  const popularBrands = [
    "Delta",
    "Mitsubishi",
    "Omron",
    "Siemens",
    "Panasonic",
    "Schneider Electric"
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 lg:hidden"
          />

          {/* Drawer Panel (Takes Full Width of browser matching request) */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed top-0 left-0 right-0 bottom-0 w-full h-full bg-white text-slate-800 z-50 lg:hidden flex flex-col overflow-y-auto"
          >
            <div>
              {/* Promotion Bar */}
              <div className="bg-[#fbbf24] text-slate-950 text-[10px] sm:text-xs font-bold text-center py-2 px-4 select-none font-mono">
                {settings.announcement}
              </div>

              {/* Header Row */}
              <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-700 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Logo text matching Desktop */}
                <Link href="/" onClick={onClose} className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-xl bg-slate-950 flex items-center justify-center font-bold text-amber-400 text-xs font-mono">
                    OM
                  </div>
                  <span className="font-extrabold text-sm tracking-tight text-slate-950 font-mono">
                    OM <span className="text-amber-500">AUTOMATION</span>
                  </span>
                </Link>

                <div className="flex items-center gap-3 text-slate-700">
                  <Link href="/profile" onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full">
                    <User className="w-5 h-5" />
                  </Link>

                  <Link href="/cart" onClick={onClose} className="p-1 hover:bg-slate-100 rounded-full relative">
                    <ShoppingBag className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-amber-500 text-slate-950 font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>

              {/* Search Bar Row */}
              <div className="px-4 py-3 bg-white border-b border-slate-100">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search components..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg pl-9 pr-9 py-2 text-xs placeholder:text-slate-400 focus:outline-none focus:border-amber-400 transition-colors"
                  />
                  <Mic className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                </form>
              </div>

              {/* Navigation Body */}
              <div className="bg-white">
                {/* 1. MAIN MENU */}
                {currentMenu === "main" && (
                  <div className="bg-white font-mono text-sm font-bold">
                    {/* Top Group with Dividers (Each item followed by a centered black divider 50px from ends) */}
                    <div>
                      <button
                        onClick={() => setCurrentMenu("shop")}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 text-slate-900"
                      >
                        <span>Shop</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                      <div className="mx-5 border-b border-black/80"></div>

                      <Link
                        href="/products?filter=deals"
                        onClick={onClose}
                        className="block px-5 py-4 hover:bg-slate-50 text-slate-900"
                      >
                        Deals
                      </Link>
                      <div className="mx-5 border-b border-black/80"></div>

                      <Link
                        href="/quote"
                        onClick={onClose}
                        className="block px-5 py-4 hover:bg-slate-50 text-slate-900"
                      >
                        Wholesale
                      </Link>
                      <div className="mx-5 border-b border-black/80"></div>

                      <button
                        onClick={() => setCurrentMenu("brands")}
                        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 text-slate-900"
                      >
                        <span>Brands</span>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </button>
                      <div className="mx-5 border-b border-black/80"></div>

                      <Link
                        href="/products?sort=newest"
                        onClick={onClose}
                        className="block px-5 py-4 hover:bg-slate-50 text-slate-900"
                      >
                        New Arrivals
                      </Link>
                      <div className="mx-5 border-b border-black/80"></div>
                    </div>

                    {/* Bottom Group (Separate, no lines, padded gap matching request) */}
                    <div className="px-5 py-6 flex flex-col gap-4 border-t border-slate-100/50 mt-2">
                      <Link
                        href="/delivery"
                        onClick={onClose}
                        className="hover:text-amber-500 text-slate-900 transition-colors"
                      >
                        Delivery
                      </Link>

                      <Link
                        href="/orders"
                        onClick={onClose}
                        className="hover:text-amber-500 text-slate-900 transition-colors"
                      >
                        Track your Order
                      </Link>

                      <Link
                        href="/about"
                        onClick={onClose}
                        className="hover:text-amber-500 text-slate-900 transition-colors"
                      >
                        About Us
                      </Link>

                      <Link
                        href="/contact"
                        onClick={onClose}
                        className="hover:text-amber-500 text-slate-900 transition-colors"
                      >
                        Contact Us
                      </Link>
                    </div>

                    {/* Call Us Button */}
                    <div className="px-5 pb-8 pt-2">
                      <a
                        href={`tel:${settings.support_phone.replace(/\s+/g, "")}`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-amber-400 text-slate-950 hover:bg-amber-400 hover:text-white font-bold transition-all text-xs"
                      >
                        <PhoneCall className="w-4 h-4" />
                        <span>Call us</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 2. SHOP MENU */}
                {currentMenu === "shop" && (
                  <div className="bg-white">
                    {/* Back Button Header */}
                    <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <button
                        onClick={() => {
                          setCurrentMenu("main");
                          setExpandedCategory(null);
                        }}
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-bold font-mono"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    </div>

                    <div className="px-4 py-4 border-b border-slate-100">
                      <h2 className="text-xl font-extrabold text-slate-900 font-heading">Shop</h2>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {(categories.length > 0 ? categories : [
                        { id: "sensors", name: "Sensors & Perception", slug: "sensors" },
                        { id: "plcs", name: "PLCs & Controllers", slug: "plcs" },
                        { id: "drives", name: "Drives & Servo Motors", slug: "drives" }
                      ]).map((cat) => (
                        <div key={cat.id} className="bg-white">
                          <button
                            onClick={() => handleCategoryClick(cat)}
                            className="w-full flex items-center justify-between p-4 hover:bg-slate-50 text-left font-bold text-slate-900 text-sm"
                          >
                            <div className="flex items-center gap-3">
                              {/* Thumbnail Image */}
                              <img
                                src={getCategoryIcon(cat.slug)}
                                alt={cat.name}
                                className="w-10 h-10 object-cover rounded-lg bg-slate-100 border border-slate-200"
                              />
                              <span className="font-mono">{cat.name}</span>
                            </div>
                            {expandedCategory === cat.id ? (
                              <ChevronUp className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {/* Accordion content: Product Cards Grid (Limit to max top 20 products) */}
                          {expandedCategory === cat.id && (
                            <div className="p-4 bg-slate-50 border-t border-b border-slate-100">
                              {loadingCategory === cat.id ? (
                                <div className="flex items-center justify-center py-6">
                                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500"></div>
                                </div>
                              ) : (
                                <>
                                  <div className="grid grid-cols-2 gap-4">
                                    {((categoryProducts[cat.id] || []).slice(0, 20)).map((prod) => {
                                      const imgUrl = (prod.images && prod.images[0]?.url) || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=300&auto=format&fit=crop&q=80";
                                      return (
                                        <Link
                                          key={prod.id}
                                          href={`/product/${prod.slug}`}
                                          onClick={onClose}
                                          className="bg-white p-3 rounded-2xl border border-slate-200 hover:border-amber-400 transition-colors flex flex-col items-center justify-between min-h-[140px] shadow-sm group"
                                        >
                                          {/* Product Image */}
                                          <div className="w-full h-24 bg-slate-50 rounded-xl overflow-hidden flex items-center justify-center p-1 border border-slate-100">
                                            <img
                                              src={imgUrl}
                                              alt={prod.name}
                                              className="max-h-full max-w-full object-contain mix-blend-multiply transition-transform group-hover:scale-105"
                                            />
                                          </div>
                                          <span className="text-[11px] font-bold font-mono text-slate-800 leading-snug mt-2 text-center line-clamp-2">
                                            {prod.name}
                                          </span>
                                        </Link>
                                      );
                                    })}
                                  </div>

                                  {/* Link to Category Page with Chevron-in-Circle Arrow Icon */}
                                  <Link
                                    href={`/category/${cat.slug}`}
                                    onClick={onClose}
                                    className="flex items-center gap-2 text-slate-800 hover:text-amber-500 font-mono font-bold text-sm pt-4 mt-4 border-t border-slate-200/80 group"
                                  >
                                    <span>Go to {cat.name}</span>
                                    <ChevronRight className="w-5 h-5 bg-slate-200 text-slate-700 rounded-full p-1 group-hover:bg-amber-400 group-hover:text-slate-950 transition-all" />
                                  </Link>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. BRANDS MENU */}
                {currentMenu === "brands" && (
                  <div className="bg-white">
                    {/* Back Button Header */}
                    <div className="flex items-center px-4 py-3 bg-slate-50 border-b border-slate-200">
                      <button
                        onClick={() => setCurrentMenu("main")}
                        className="flex items-center gap-1 text-slate-600 hover:text-slate-900 text-xs font-bold font-mono"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Back</span>
                      </button>
                    </div>

                    <div className="px-4 py-4 border-b border-slate-100">
                      <h2 className="text-xl font-extrabold text-slate-900 font-heading">Brands</h2>
                    </div>

                    <div className="divide-y divide-slate-100 text-sm font-bold font-mono">
                      {popularBrands.map((brand) => (
                        <Link
                          key={brand}
                          href={`/products?brand=${brand}`}
                          onClick={onClose}
                          className="block px-5 py-4 hover:bg-slate-50 text-slate-900"
                        >
                          {brand}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
