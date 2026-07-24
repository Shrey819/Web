"use client";

import { useState } from "react";
import Link from "next/link";
import { CATEGORIES } from "@/data/categories";
import { X, ChevronDown, Search, ShoppingBag, Heart, FileText, Phone, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  cartCount: number;
  wishlistCount: number;
}

export function MobileNav({ isOpen, onClose, cartCount, wishlistCount }: MobileNavProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  const toggleCategory = (id: string) => {
    setExpandedCategory(expandedCategory === id ? null : id);
  };

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

          {/* Drawer Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="fixed top-0 left-0 bottom-0 w-full max-w-xs bg-slate-900 text-white z-50 lg:hidden flex flex-col justify-between overflow-y-auto"
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between p-5 border-b border-slate-800">
                <Link href="/" onClick={onClose} className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-emerald-400 flex items-center justify-center font-bold text-slate-950 text-sm">
                    P
                  </div>
                  <span className="font-bold text-lg text-white tracking-tight">
                    PROPEL<span className="text-sky-400">AUTO</span>
                  </span>
                </Link>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Quick Links */}
              <div className="grid grid-cols-3 gap-2 p-4 border-b border-slate-800 bg-slate-950/50">
                <Link
                  href="/cart"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200"
                >
                  <div className="relative">
                    <ShoppingBag className="w-5 h-5 text-sky-400" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-sky-500 text-slate-950 font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium mt-1">Cart</span>
                </Link>

                <Link
                  href="/wishlist"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200"
                >
                  <div className="relative">
                    <Heart className="w-5 h-5 text-rose-400" />
                    {wishlistCount > 0 && (
                      <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {wishlistCount}
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-medium mt-1">Saved</span>
                </Link>

                <Link
                  href="/login"
                  onClick={onClose}
                  className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-200"
                >
                  <User className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-medium mt-1">Account</span>
                </Link>
              </div>

              {/* Main Navigation Links */}
              <div className="p-4 flex flex-col gap-1">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 py-2">
                  Product Categories
                </div>

                {CATEGORIES.map((cat) => (
                  <div key={cat.id} className="flex flex-col">
                    <button
                      onClick={() => toggleCategory(cat.id)}
                      className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-800 text-left font-medium text-slate-200"
                    >
                      <span className="text-sm">{cat.name}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          expandedCategory === cat.id ? "rotate-180 text-sky-400" : ""
                        }`}
                      />
                    </button>

                    {expandedCategory === cat.id && (
                      <div className="pl-4 pr-2 py-2 flex flex-col gap-1 bg-slate-950/60 rounded-xl my-1 border border-slate-800">
                        <Link
                          href={`/category/${cat.slug}`}
                          onClick={onClose}
                          className="p-2 text-xs font-semibold text-sky-400 hover:text-sky-300"
                        >
                          View All {cat.name} →
                        </Link>
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub}
                            href={`/products?category=${cat.slug}&sub=${encodeURIComponent(sub)}`}
                            onClick={onClose}
                            className="p-2 text-xs text-slate-300 hover:text-white"
                          >
                            {sub}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 px-3 pt-4 pb-2">
                  Company & Support
                </div>
                <Link
                  href="/products"
                  onClick={onClose}
                  className="p-3 rounded-xl hover:bg-slate-800 text-sm font-medium text-slate-200"
                >
                  All Industrial Catalog
                </Link>
                <Link
                  href="/about"
                  onClick={onClose}
                  className="p-3 rounded-xl hover:bg-slate-800 text-sm font-medium text-slate-200"
                >
                  About Propel Automation
                </Link>
                <Link
                  href="/resources"
                  onClick={onClose}
                  className="p-3 rounded-xl hover:bg-slate-800 text-sm font-medium text-slate-200"
                >
                  Technical Resources & Guides
                </Link>
                <Link
                  href="/contact"
                  onClick={onClose}
                  className="p-3 rounded-xl hover:bg-slate-800 text-sm font-medium text-slate-200"
                >
                  Contact & Locations
                </Link>
                <Link
                  href="/faq"
                  onClick={onClose}
                  className="p-3 rounded-xl hover:bg-slate-800 text-sm font-medium text-slate-200"
                >
                  Support FAQ
                </Link>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-3">
              <Link
                href="/quote"
                onClick={onClose}
                className="w-full text-center py-3 px-4 rounded-full bg-gradient-to-r from-sky-500 to-emerald-500 text-slate-950 font-bold text-sm shadow-lg"
              >
                Request a Bulk Quote
              </Link>
              <div className="flex items-center justify-center gap-2 type-body-small text-slate-400">
                <Phone className="w-3.5 h-3.5 text-sky-400" />
                <span>Call 1-800-555-AUTO (Mon-Fri)</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
