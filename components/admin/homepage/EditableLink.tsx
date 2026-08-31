"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Link2,
  ExternalLink,
  Mail,
  Phone,
  Anchor,
  Globe,
  FileDown,
  Sparkles,
  Check,
  X,
  Sliders,
  ChevronRight,
  Trash2,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export type ActionType =
  | "page"
  | "anchor"
  | "external"
  | "email"
  | "phone"
  | "download"
  | "custom";

export interface LinkValidationResult {
  isValid: boolean;
  error?: string;
  suggestion?: string;
  resolvedType?: string;
}

// Popular internal routes
export const INTERNAL_PAGE_PRESETS = [
  { label: "All Products", url: "/products" },
  { label: "Categories Hub", url: "/categories" },
  { label: "RFQ Portal / Quote", url: "/quote" },
  { label: "Contact Us", url: "/contact" },
  { label: "About Us", url: "/about" },
  { label: "Knowledge Hub", url: "/resources" },
  { label: "Shopping Cart", url: "/cart" },
  { label: "Help & FAQs", url: "/faq" },
  { label: "Delivery Policy", url: "/delivery" },
  { label: "Search Catalog", url: "/search" },
];

// All valid internal static routes on the website
export const KNOWN_INTERNAL_ROUTES = [
  "/",
  "/products",
  "/categories",
  "/quote",
  "/contact",
  "/about",
  "/resources",
  "/cart",
  "/checkout",
  "/compare",
  "/faq",
  "/delivery",
  "/search",
  "/orders",
  "/profile",
  "/wishlist",
  "/login",
  "/register",
  "/forgot-password",
  "/privacy",
  "/terms-of-service",
  "/legal-notice",
  "/refund-policy",
  "/shipping-policy",
];

const KNOWN_DYNAMIC_PREFIXES = [
  "/category/",
  "/categories/",
  "/product/",
  "/products/",
  "/resources/",
  "/downloads/",
  "/api/",
];

// All 21 Homepage sections for in-page anchors
export const SECTION_ANCHOR_PRESETS = [
  { label: "1. Top Announcement", anchor: "#sec-ticker" },
  { label: "2. Navigation Header", anchor: "#sec-header" },
  { label: "3. Mainframe Hero", anchor: "#sec-mainframe" },
  { label: "4. Hero Slider", anchor: "#sec-slider" },
  { label: "5. Category Showcases", anchor: "#sec-showcases" },
  { label: "6. OEM Brand Partners", anchor: "#sec-brand-marquee" },
  { label: "7. 3D Product Orbit", anchor: "#sec-cinematic" },
  { label: "8. Categories Grid", anchor: "#sec-categories-grid" },
  { label: "8.5. Top 10 Fundamentals", anchor: "#sec-top-fundamentals" },
  { label: "9. Featured Catalog", anchor: "#sec-featured-catalog" },
  { label: "10. Solutions BOM", anchor: "#sec-solutions" },
  { label: "11. Product Assembly", anchor: "#sec-assembly" },
  { label: "12. Why Buy From Us", anchor: "#sec-why-buy" },
  { label: "13. Sticky Flagship", anchor: "#sec-sticky-showcase" },
  { label: "14. Best Sellers Rail", anchor: "#sec-best-sellers" },
  { label: "15. Key Metrics & Stats", anchor: "#sec-stats" },
  { label: "16. Volume Banner", anchor: "#sec-promo-banner" },
  { label: "17. Testimonials", anchor: "#sec-testimonials" },
  { label: "18. Benchmark Matrix", anchor: "#sec-compare" },
  { label: "19. Knowledge Hub", anchor: "#sec-resource-hub" },
  { label: "20. Support FAQs", anchor: "#sec-faqs" },
  { label: "21. Footer & Downloads", anchor: "#sec-footer-config" },
];

const VALID_ANCHOR_IDS = SECTION_ANCHOR_PRESETS.map((p) => p.anchor);

function levenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;
  const matrix: number[][] = Array.from({ length: bn + 1 }, (_, i) => [i]);
  for (let j = 0; j <= an; j++) matrix[0][j] = j;
  for (let i = 1; i <= bn; i++) {
    for (let j = 1; j <= an; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  return matrix[bn][an];
}

function findClosestRoute(input: string, candidateRoutes: string[]): string | undefined {
  const clean = input.toLowerCase().split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  // 1. Prefix match (e.g. "/produc" -> "/products", "/cat" -> "/categories")
  const prefixMatch = candidateRoutes.find(
    (r) => r.toLowerCase().startsWith(clean) && r.toLowerCase() !== clean
  );
  if (prefixMatch) return prefixMatch;

  // 2. Contains match
  const containsMatch = candidateRoutes.find(
    (r) => r.toLowerCase().includes(clean.replace(/^\//, "")) && r.toLowerCase() !== clean
  );
  if (containsMatch) return containsMatch;

  // 3. Levenshtein distance (up to distance 4)
  let bestMatch: string | undefined;
  let minDistance = 5;

  for (const route of candidateRoutes) {
    const dist = levenshteinDistance(clean, route.toLowerCase());
    if (dist < minDistance) {
      minDistance = dist;
      bestMatch = route;
    }
  }

  return bestMatch;
}

function findClosestAnchor(input: string): string | undefined {
  const clean = input.startsWith("#") ? input : `#${input}`;
  const prefix = VALID_ANCHOR_IDS.find((a) => a.startsWith(clean) && a !== clean);
  if (prefix) return prefix;
  let best: string | undefined;
  let minDist = 5;
  for (const a of VALID_ANCHOR_IDS) {
    const dist = levenshteinDistance(clean, a);
    if (dist < minDist) {
      minDist = dist;
      best = a;
    }
  }
  return best;
}

export function validateLink(url: string, actionType: ActionType): LinkValidationResult {
  const trimmed = (url || "").trim();

  // Empty is valid (treated as no link or placeholder)
  if (!trimmed) {
    return {
      isValid: true,
      resolvedType: "No destination (Click action only)",
    };
  }

  switch (actionType) {
    case "page": {
      if (!trimmed.startsWith("/")) {
        const suggestion = `/${trimmed.replace(/^\/+/, "")}`;
        const closest = findClosestRoute(suggestion, KNOWN_INTERNAL_ROUTES);
        return {
          isValid: false,
          error: `Internal page route must start with '/' (e.g. /products, /quote, /contact).`,
          suggestion: closest || suggestion,
        };
      }
      if (trimmed.includes(" ") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        return {
          isValid: false,
          error: "Internal page routes cannot contain spaces or 'https://'. Select 'External' tab for external websites.",
        };
      }

      // Check if it's a section anchor written in page tab (e.g. /#sec-solutions or /sec-solutions)
      if (trimmed.includes("#sec-") || trimmed.startsWith("/sec-")) {
        const anchorSuggestion = trimmed.startsWith("/sec-") ? trimmed.replace("/sec-", "#sec-") : trimmed.replace("/", "");
        return {
          isValid: false,
          error: `"${trimmed}" looks like a Homepage Section anchor. Switch to 'Section' tab or fix to "${anchorSuggestion}".`,
          suggestion: anchorSuggestion,
        };
      }

      // Path normalization (ignore query params & trailing slashes for validation)
      const pathname = trimmed.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

      // 1. Exact match on known routes
      if (KNOWN_INTERNAL_ROUTES.includes(pathname)) {
        return {
          isValid: true,
          resolvedType: "Internal Page Route",
        };
      }

      // 2. Dynamic patterns (/category/xyz, /product/xyz, /resources/xyz, etc.)
      const isDynamicValid = KNOWN_DYNAMIC_PREFIXES.some((prefix) => {
        if (pathname.startsWith(prefix) && pathname.length > prefix.length) {
          const rest = pathname.substring(prefix.length);
          return rest.trim().length > 0 && !rest.includes("//");
        }
        return false;
      });

      if (isDynamicValid) {
        return {
          isValid: true,
          resolvedType: "Dynamic Catalog Route",
        };
      }

      // 3. If route is not recognized (e.g. /produc, /cotnact, /fake-route) -> 404 DIRECT ERROR!
      const closest = findClosestRoute(pathname, KNOWN_INTERNAL_ROUTES);
      return {
        isValid: false,
        error: `Route "${pathname}" does not exist on this website (404 Page Not Found).${
          closest ? ` Did you mean "${closest}"?` : ""
        }`,
        suggestion: closest,
      };
    }

    case "anchor": {
      const clean = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
      if (VALID_ANCHOR_IDS.includes(clean)) {
        return {
          isValid: true,
          resolvedType: "Homepage In-Page Section Anchor",
        };
      }

      const closestAnchor = findClosestAnchor(clean);
      return {
        isValid: false,
        error: `Section anchor "${trimmed}" is not a recognized section ID.${
          closestAnchor ? ` Did you mean "${closestAnchor}"?` : ""
        }`,
        suggestion: closestAnchor,
      };
    }

    case "external": {
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return {
          isValid: false,
          error: "External URL must start with 'https://' or 'http://' (e.g. https://example.com).",
          suggestion: `https://${trimmed}`,
        };
      }
      try {
        new URL(trimmed);
        return {
          isValid: true,
          resolvedType: "External Web URL",
        };
      } catch {
        return {
          isValid: false,
          error: "Invalid URL syntax. Please enter a valid web address (e.g. https://omautomation.com).",
        };
      }
    }

    case "email": {
      const emailPart = trimmed.replace(/^mailto:/i, "").trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailPart)) {
        return {
          isValid: false,
          error: "Invalid email format. Must be a valid email (e.g. omautomation2012@gmail.com).",
        };
      }
      return {
        isValid: true,
        resolvedType: "Email Action (mailto:)",
      };
    }

    case "phone": {
      const phonePart = trimmed.replace(/^tel:/i, "").trim();
      const digitsOnly = phonePart.replace(/[^0-9]/g, "");
      if (digitsOnly.length < 6) {
        return {
          isValid: false,
          error: "Invalid phone number. Must contain at least 6 digits (e.g. +91 90993 92066).",
        };
      }
      return {
        isValid: true,
        resolvedType: "Phone Action (tel:)",
      };
    }

    case "download": {
      if (!trimmed.startsWith("/") && !trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        return {
          isValid: false,
          error: "Download URL must start with '/' or 'https://' (e.g. /downloads/catalog.pdf).",
          suggestion: `/${trimmed.replace(/^\/+/, "")}`,
        };
      }
      return {
        isValid: true,
        resolvedType: "Document / File Download",
      };
    }

    default: {
      return {
        isValid: true,
        resolvedType: "Custom Link Action",
      };
    }
  }
}

export interface EditableLinkProps {
  label: string | undefined | null;
  href?: string | undefined | null;
  onChange: (newLabel: string, newHref: string) => void;
  onDelete?: () => void;
  as?: "span" | "p" | "h1" | "h2" | "h3" | "h4" | "h5" | "div" | "a" | "button";
  className?: string;
  badgeClassName?: string;
  style?: React.CSSProperties;
  fieldTitle?: string;
  placeholder?: string;
  linkPlaceholder?: string;
  children?: React.ReactNode;
}

export function EditableLink({
  label,
  href = "",
  onChange,
  as: Component = "span",
  className = "",
  style,
  fieldTitle = "Link & Action",
  placeholder = "Button Label",
  linkPlaceholder = "/products",
  onDelete,
  children,
}: EditableLinkProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [tempLabel, setTempLabel] = useState(label || "");
  const [tempHref, setTempHref] = useState(href || "");
  const [actionType, setActionType] = useState<ActionType>("page");
  const [showErrorWarning, setShowErrorWarning] = useState(false);

  const labelInputRef = useRef<HTMLInputElement>(null);
  const hrefInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Live validation on every change
  const validation = validateLink(tempHref, actionType);

  // Synchronize state from props
  useEffect(() => {
    setTempLabel(label || "");
    setTempHref(href || "");
    detectActionType(href || "");
    setShowErrorWarning(false);
  }, [label, href]);

  // Detect action type from current href
  const detectActionType = (url: string) => {
    if (!url) {
      setActionType("page");
    } else if (url.startsWith("mailto:")) {
      setActionType("email");
    } else if (url.startsWith("tel:")) {
      setActionType("phone");
    } else if (url.startsWith("#")) {
      setActionType("anchor");
    } else if (url.startsWith("http://") || url.startsWith("https://")) {
      setActionType("external");
    } else if (url.endsWith(".pdf") || url.includes("/download")) {
      setActionType("download");
    } else if (url.startsWith("/")) {
      setActionType("page");
    } else {
      setActionType("custom");
    }
  };

  useEffect(() => {
    if (isOpen && labelInputRef.current) {
      labelInputRef.current.focus({ preventScroll: true });
      labelInputRef.current.select();
    }
  }, [isOpen]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setTempLabel(label || "");
    setTempHref(href || "");
    detectActionType(href || "");
    setShowErrorWarning(false);
    setIsOpen(true);
  };

  const handleApply = () => {
    let cleanHref = tempHref.trim();
    if (actionType === "email" && cleanHref && !cleanHref.startsWith("mailto:") && cleanHref.includes("@")) {
      cleanHref = `mailto:${cleanHref}`;
    } else if (actionType === "phone" && cleanHref && !cleanHref.startsWith("tel:")) {
      cleanHref = `tel:${cleanHref.replace(/\s+/g, "")}`;
    }

    const currentValidation = validateLink(cleanHref, actionType);
    if (!currentValidation.isValid) {
      setShowErrorWarning(true);
      if (hrefInputRef.current) {
        hrefInputRef.current.focus();
      }
      return;
    }

    onChange(tempLabel.trim() || placeholder, cleanHref);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempLabel(label || "");
    setTempHref(href || "");
    setShowErrorWarning(false);
    setIsOpen(false);
  };

  const setPresetUrl = (newUrl: string, type: ActionType) => {
    setTempHref(newUrl);
    setActionType(type);
    setShowErrorWarning(false);
  };

  return (
    <>
      <Component
        onClick={handleOpen}
        onDoubleClick={handleOpen}
        title={`${fieldTitle} • Destination: ${href || "No link"} (Click to edit)`}
        className={`group relative cursor-pointer inline-flex items-center gap-1 transition-all duration-150 rounded outline-dashed outline-1 outline-transparent hover:outline-sky-400 hover:bg-sky-500/10 hover:shadow-[0_0_0_2px_rgba(56,189,248,0.25)] ${className}`}
        style={style}
      >
        {children || <span>{label || placeholder}</span>}

        {/* Hover Link Icon Indicator */}
        <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 inline-flex items-center text-sky-400 shrink-0 pointer-events-none">
          <Link2 className="w-3 h-3" />
        </span>
      </Component>

      {/* Wix Studio-Style Popover / Modal Dialog (Portaled to body to prevent canvas background jumping/scrolling) */}
      {isOpen && mounted && typeof document !== "undefined" && createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            handleCancel();
          }}
          className="fixed inset-0 z-[999999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 cursor-default"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 text-white animate-in fade-in zoom-in duration-150"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                  <Link2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span>Edit Link & Action</span>
                    <span className="text-[10px] font-mono bg-sky-500/10 text-sky-400 px-1.5 py-0.2 rounded border border-sky-500/20">
                      Wix Studio
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400">{fieldTitle}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Label Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">
                Button / Text Label
              </label>
              <input
                ref={labelInputRef}
                type="text"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApply();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder={placeholder}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 font-sans"
              />
            </div>

            {/* 2. Action Type Tabs */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-400">
                Action / Link Type
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px]">
                {[
                  { type: "page" as ActionType, label: "Page", icon: Globe },
                  { type: "anchor" as ActionType, label: "Section", icon: Anchor },
                  { type: "external" as ActionType, label: "External", icon: ExternalLink },
                  { type: "email" as ActionType, label: "Email", icon: Mail },
                  { type: "phone" as ActionType, label: "Phone", icon: Phone },
                  { type: "custom" as ActionType, label: "Custom", icon: Sliders },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = actionType === tab.type;
                  return (
                    <button
                      key={tab.type}
                      type="button"
                      onClick={() => {
                        setActionType(tab.type);
                        setShowErrorWarning(false);
                      }}
                      className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg font-mono text-[10px] transition-all cursor-pointer ${
                        isActive
                          ? "bg-sky-600 text-white font-bold shadow"
                          : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Destination URL / Action Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-slate-400">
                <span>Destination / Target URL</span>
                {tempHref && (
                  <span className={`text-[10px] font-mono lowercase truncate max-w-[220px] ${
                    validation.isValid ? "text-emerald-400" : "text-rose-400 font-bold"
                  }`}>
                    {tempHref}
                  </span>
                )}
              </div>
              <input
                ref={hrefInputRef}
                type="text"
                value={tempHref}
                onChange={(e) => {
                  setTempHref(e.target.value);
                  setShowErrorWarning(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleApply();
                  if (e.key === "Escape") handleCancel();
                }}
                placeholder={
                  actionType === "email"
                    ? "mailto:omautomation2012@gmail.com"
                    : actionType === "phone"
                    ? "tel:+919099392066"
                    : actionType === "anchor"
                    ? "#sec-solutions"
                    : actionType === "external"
                    ? "https://..."
                    : linkPlaceholder
                }
                className={`w-full bg-slate-950 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none transition-colors ${
                  !validation.isValid && (showErrorWarning || tempHref.trim().length > 0)
                    ? "border-2 border-rose-500 bg-rose-950/20 text-rose-100 focus:border-rose-400 ring-2 ring-rose-500/20"
                    : validation.isValid && tempHref.trim()
                    ? "border border-emerald-500/50 focus:border-emerald-400 ring-1 ring-emerald-500/20"
                    : "border border-slate-700 focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                }`}
              />

              {/* Direct Error Banner */}
              {!validation.isValid && (showErrorWarning || tempHref.trim().length > 0) && (
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-rose-200">{validation.error}</p>
                    {validation.suggestion && (
                      <div className="flex items-center gap-2 pt-0.5">
                        <span className="text-[11px] text-slate-400">Quick Fix:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setTempHref(validation.suggestion!);
                            setShowErrorWarning(false);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500 text-rose-200 hover:text-white font-mono text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Change to &quot;{validation.suggestion}&quot;</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Verified Status Badge */}
              {validation.isValid && tempHref.trim() && (
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono pt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Valid {validation.resolvedType}</span>
                </div>
              )}
            </div>

            {/* 4. Quick Presets based on Action Type */}
            {actionType === "page" && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Popular Internal Pages</span>
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {INTERNAL_PAGE_PRESETS.map((p) => (
                    <button
                      key={p.url}
                      type="button"
                      onClick={() => setPresetUrl(p.url, "page")}
                      className={`px-2 py-1 rounded-md text-[10px] font-mono transition-all cursor-pointer ${
                        tempHref === p.url
                          ? "bg-sky-600 text-white font-bold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {p.label} <span className="text-slate-400">({p.url})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionType === "anchor" && (
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase text-slate-400 flex items-center gap-1">
                  <Anchor className="w-3 h-3 text-sky-400" />
                  <span>Jump To Homepage Section</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1 bg-slate-950/60 rounded-xl border border-slate-800">
                  {SECTION_ANCHOR_PRESETS.map((p) => (
                    <button
                      key={p.anchor}
                      type="button"
                      onClick={() => setPresetUrl(p.anchor, "anchor")}
                      className={`text-left px-2 py-1 rounded-md text-[10px] font-mono truncate transition-all cursor-pointer ${
                        tempHref === p.anchor
                          ? "bg-sky-600 text-white font-bold"
                          : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {actionType === "email" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTempHref("mailto:omautomation2012@gmail.com")}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  omautomation2012@gmail.com
                </button>
                <button
                  type="button"
                  onClick={() => setTempHref("mailto:sales@omautomation.com")}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  sales@omautomation.com
                </button>
              </div>
            )}

            {actionType === "phone" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setTempHref("tel:+919099392066")}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  +91 90993 92066
                </button>
                <button
                  type="button"
                  onClick={() => setTempHref("tel:+919913085220")}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer"
                >
                  +91 99130 85220
                </button>
              </div>
            )}

            {/* Footer Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              {onDelete ? (
                <button
                  type="button"
                  onClick={() => {
                    onDelete();
                    setIsOpen(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold border border-rose-500/30 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel (Esc)
                </button>
                <button
                  type="button"
                  onClick={handleApply}
                  disabled={!validation.isValid}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-black shadow-lg transition-all ${
                    !validation.isValid
                      ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60"
                      : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 cursor-pointer"
                  }`}
                  title={!validation.isValid ? validation.error : "Save Link & Action"}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Link & Action</span>
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
