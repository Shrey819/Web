"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { notFound, useRouter } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  X,
  ZoomIn,
  Plus,
  Minus,
  Check,
  ShoppingBag,
  ArrowRight,
  FileDown,
  Wrench,
  Calculator,
  Download,
  ExternalLink,
  ShieldCheck,
  Share2,
  SlidersHorizontal,
  Info,
  Zap
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";
import { formatCurrency } from "@/lib/utils";
import { isSafeUrl } from "@/lib/url-sanitizer";

export interface FeatureHighlight {
  label: string;
  value: string;
}

export interface TechnicalSupportLink {
  title: string;
  url: string;
  icon?: "specs" | "selection" | "calculation" | "cad";
}

/**
 * Inserts soft hyphens (\u00AD) into long unbroken words so that when text exceeds
 * container boundaries, the browser cleanly wraps it to a new line with a visible hyphen (-)
 * instead of overflowing outside the card.
 */
function formatWithHyphens(text?: string | null, chunkLength = 9): string {
  if (!text || typeof text !== "string") return "";
  return text
    .split(/(\s+)/)
    .map((token) => {
      if (/^\s+$/.test(token)) return token;
      return token
        .split("-")
        .map((subWord) => {
          if (subWord.length <= chunkLength) return subWord;
          const chunks: string[] = [];
          for (let i = 0; i < subWord.length; i += chunkLength) {
            chunks.push(subWord.slice(i, i + chunkLength));
          }
          return chunks.join("\u00AD");
        })
        .join("-");
    })
    .join("");
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    brand?: string;
    description?: string;
    shortDescription?: string;
    categoryId?: string;
    basePrice: number;
    price?: number;
    compareAtPrice?: number;
    strikethroughPrice?: number;
    showPricePerUnit?: boolean;
    baseUnit?: number;
    baseUnitMeasurement?: string;
    totalUnits?: number;
    totalUnitsMeasurement?: string;
    primaryRibbon?: string;
    images: { url: string; alt?: string; isPrimary?: boolean }[];
    features?: string[];
    featureHighlights?: FeatureHighlight[];
    applications?: string[];
    technicalSupportLinks?: TechnicalSupportLink[];
    enableBuyerNote?: boolean;
    videoUrl?: string;
    datasheetUrl?: string;
    drawingUrl?: string;
  };
  relatedProducts?: any[];
}

export function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailProps) {
  const router = useRouter();
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  const [quantity, setQuantity] = useState(1);
  const [buyerNote, setBuyerNote] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!product) return notFound();

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80", alt: product.name }];

  const activePrice = product.price ?? product.basePrice ?? 0;
  const activeStrikethrough = product.strikethroughPrice ?? product.compareAtPrice;
  const brandName = product.brand || "HIWIN";

  // 1. Dynamic Feature Highlight Cards (2 or 3 cards: top gray label, bottom green bold value)
  const highlightCards: FeatureHighlight[] = useMemo(() => {
    if (product.featureHighlights && product.featureHighlights.length > 0) {
      return product.featureHighlights;
    }

    // Default highlights for HIWIN & automation hardware matching competitor benchmark
    return [
      { label: "COST SAVING", value: "lubrication free" },
      { label: "EASY INSTALLATION", value: "Replaceable" },
      { label: "EXTENDED MAINTENANCE", value: "Up to 10000 KM" },
    ];
  }, [product.featureHighlights]);

  // 2. Applications Tags
  const applicationsList: string[] = useMemo(() => {
    if (product.applications && product.applications.length > 0) {
      return product.applications;
    }
    return [
      "Automation equipment",
      "Industrial machine",
      "Electronic machine",
      "Medical equipment",
      "Transportation",
      "Construction",
    ];
  }, [product.applications]);

  // 3. Technical Support Links
  const supportLinks: TechnicalSupportLink[] = useMemo(() => {
    if (product.technicalSupportLinks && product.technicalSupportLinks.length > 0) {
      return product.technicalSupportLinks;
    }

    const isBallscrew = product.name.toLowerCase().includes("ballscrew");

    return [
      {
        title: "Full Specs",
        url: product.datasheetUrl || "https://www.hiwinsupport.com/download_center.aspx?pid=" + (isBallscrew ? "BS" : "GW"),
        icon: "specs",
      },
      {
        title: "Product Selection",
        url: "https://www.hiwinsupport.com/product_select/" + (isBallscrew ? "ballscrew.aspx" : "guideway.aspx"),
        icon: "selection",
      },
      {
        title: "Life Calculation",
        url: "https://www.hiwinsupport.com/life_Calculate/" + (isBallscrew ? "ballscrew.aspx" : "guideway.aspx"),
        icon: "calculation",
      },
      {
        title: "CAD Download",
        url: product.drawingUrl || "https://www.hiwinsupport.com/cad_download/" + (isBallscrew ? "ballscrew.aspx" : "guideway.aspx"),
        icon: "cad",
      },
    ];
  }, [product.technicalSupportLinks, product.name, product.datasheetUrl, product.drawingUrl]);

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Touch swipe handlers (Finger left and right swap)
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;

    const deltaX = touchStartX.current - touchEndX;
    const deltaY = touchStartY.current - touchEndY;

    // Minimum swipe threshold (30px) and must be predominantly horizontal
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
      if (deltaX > 0) {
        // Swiped Left -> go to Next image
        setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else {
        // Swiped Right -> go to Previous image
        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Keyboard navigation & vertical scroll prevention for Lightbox
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    };

    const preventTouchMove = (e: TouchEvent) => {
      if (!(e.target as HTMLElement)?.closest?.(".lightbox-scrollable")) {
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("touchmove", preventTouchMove, { passive: false });

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("touchmove", preventTouchMove);
    };
  }, [isLightboxOpen, images.length]);

  const handleAddToCart = () => {
    const cleanNote = buyerNote.trim();
    const cartProduct = {
      ...product,
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: activePrice,
      images: [{ url: images[selectedImageIndex]?.url || images[0].url }],
    } as any;

    addItem(cartProduct, quantity, undefined, cleanNote || undefined);
    addToast(
      "success",
      "Added to Cart",
      `${quantity}x ${product.name} added to cart${cleanNote ? " with your custom note" : ""}.`
    );
  };

  const handleBuyNow = () => {
    const cleanNote = buyerNote.trim();
    const cartProduct = {
      ...product,
      id: product.id,
      name: product.name,
      slug: product.slug,
      basePrice: activePrice,
      images: [{ url: images[selectedImageIndex]?.url || images[0].url }],
    } as any;

    addItem(cartProduct, quantity, undefined, cleanNote || undefined);
    router.push("/checkout");
  };

  const renderSupportIcon = (type?: string, className = "w-3.5 h-3.5 sm:w-4 sm:h-4") => {
    switch (type) {
      case "specs":
        return <FileDown className={className} />;
      case "selection":
        return <Wrench className={className} />;
      case "calculation":
        return <Calculator className={className} />;
      case "cad":
        return <Download className={className} />;
      default:
        return <ExternalLink className={className} />;
    }
  };

  return (
    <div className="bg-white min-h-screen font-sans text-slate-900 pb-16">
      {/* 1. Header Banner with Breadcrumbs (Competitor Style) */}
      <section className="bg-gradient-to-b from-[#1a1a1a] to-[#242424] text-white py-12 px-4 border-b border-slate-800 text-center relative overflow-hidden">
        <div className="max-w-5xl mx-auto relative z-10">
          <nav aria-label="breadcrumb" className="flex items-center justify-center gap-2 text-xs sm:text-sm text-slate-300 mb-3 flex-wrap">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <Link href="/brands" className="hover:text-white transition-colors">Brands</Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <Link href={`/products?brand=${encodeURIComponent(brandName.toLowerCase())}`} className="hover:text-white transition-colors">
              {brandName}
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-slate-200 font-medium truncate max-w-xs">{product.name}</span>
          </nav>
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-2">
            {product.name}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Reliable and high-performance {product.name} from {brandName}.
          </p>
        </div>
      </section>

      {/* 2. Main Product Grid Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left: Product Image & Gallery */}
          <div className="lg:col-span-6 flex flex-col-reverse sm:flex-row gap-4 items-start relative lg:sticky lg:top-24">
            {/* Vertical Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[500px] pb-2 sm:pb-0 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white p-1 ${
                      selectedImageIndex === idx
                        ? "border-[#00a651] shadow-xs"
                        : "border-slate-200 opacity-70 hover:opacity-100 hover:border-slate-400"
                    }`}
                  >
                    <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Viewport with Click-to-Zoom & Touch Swipe */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              className="group/hero flex-1 aspect-square w-full bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center p-8 relative cursor-zoom-in hover:shadow-md transition-shadow select-none"
            >
              <img
                src={images[selectedImageIndex]?.url || images[0]?.url}
                alt={product.name}
                className="max-w-full max-h-[420px] object-contain group-hover/hero:scale-105 transition-all duration-300 pointer-events-none select-none"
              />
              {product.primaryRibbon && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-[#00a651] text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs">
                  {product.primaryRibbon}
                </span>
              )}

              {/* Prev / Next navigation arrows on main image */}
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:text-black hover:bg-white shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover/hero:opacity-100 cursor-pointer active:scale-90"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:text-black hover:bg-white shadow-md flex items-center justify-center transition-all opacity-90 sm:opacity-0 sm:group-hover/hero:opacity-100 cursor-pointer active:scale-90"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  </button>
                </>
              )}

              <div className="absolute bottom-4 right-4 p-2.5 rounded-full bg-white/90 border border-slate-200 text-slate-700 opacity-80 group-hover/hero:opacity-100 group-hover/hero:scale-110 transition-all shadow-sm">
                <ZoomIn className="w-4 h-4 text-[#00a651]" />
              </div>
            </div>
          </div>

          {/* Right: Competitor-styled details (Elements 1 through 8) */}
          <div className="lg:col-span-6 space-y-7">
            
            {/* 1. Name with Green Underline */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1a1a1a] pb-3 border-b-3 border-[#00a651] leading-tight">
                {product.name}
              </h1>

              {/* Price Row */}
              <div className="flex items-baseline gap-3 pt-3">
                <span className="text-2xl sm:text-3xl font-bold text-slate-900 font-mono">
                  {formatCurrency(activePrice)}
                </span>
                {activeStrikethrough && activeStrikethrough > activePrice && (
                  <span className="text-lg text-slate-400 line-through font-mono">
                    {formatCurrency(activeStrikethrough)}
                  </span>
                )}
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  In Stock & Ready to Dispatch
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                Price includes standard industrial warranty. GST calculated at checkout.
              </p>
            </div>

            {/* 2. Feature Section (Title & Rich HTML Description) */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#1a1a1a]">Feature</h2>
              {product.description ? (
                <div
                  className="wix-rich-content text-sm text-slate-700 leading-relaxed max-w-none space-y-2 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:my-2 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:my-2 [&>p]:mb-2 [&>a]:text-[#00a651] [&>a]:underline [&>li]:my-0.5"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-sm text-slate-600 leading-relaxed">
                  {product.shortDescription || `Reliable and high-performance ${product.name} engineered by ${brandName} for superior industrial performance.`}
                </p>
              )}

              {/* 3. Custom Highlight Feature Cards (2 or 3 columns, up to 6 cards) */}
              <div className={`grid grid-cols-1 ${highlightCards.length === 2 || highlightCards.length === 4 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'} gap-3 pt-1`}>
                {highlightCards.map((item, idx) => (
                  <div
                    key={idx}
                    className="border border-slate-200 rounded-md p-4 text-center bg-white hover:border-[#00a651] hover:shadow-md transition-all group overflow-hidden min-w-0 flex flex-col justify-center"
                  >
                    <div
                      lang="en"
                      className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 group-hover:text-slate-600 transition-colors break-words hyphens-auto [overflow-wrap:anywhere]"
                    >
                      {formatWithHyphens(item.label, 9)}
                    </div>
                    <div
                      lang="en"
                      className="text-base sm:text-lg font-bold text-[#00a651] leading-snug break-words hyphens-auto [overflow-wrap:anywhere]"
                    >
                      {formatWithHyphens(item.value, 9)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 4. Applications Section */}
            <div className="space-y-3">
              <h2 className="text-lg font-bold text-[#1a1a1a]">Applications</h2>
              <div className="flex flex-wrap gap-2">
                {applicationsList.map((app, idx) => (
                  <span
                    key={idx}
                    className="bg-[#4a4a4a] text-white px-3.5 py-1.5 rounded-md text-xs sm:text-sm font-medium hover:bg-[#00a651] transition-colors cursor-default"
                  >
                    {app}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Brand Technical Support (4 redirecting tool boxes) */}
            {supportLinks.filter((link) => isSafeUrl(link.url)).length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm sm:text-base font-bold text-[#1a1a1a]">
                    {brandName} Technical Support
                  </h2>
                  <span className="text-[11px] text-slate-400 font-medium">Engineering Tools</span>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                  {supportLinks
                    .filter((link) => isSafeUrl(link.url))
                    .map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 py-2 px-2.5 sm:py-2.5 sm:px-3 border border-emerald-300/80 bg-emerald-50/50 hover:bg-[#00a651] text-emerald-900 hover:text-white rounded-lg text-xs sm:text-sm font-semibold transition-all shadow-2xs group cursor-pointer active:scale-[0.98]"
                      >
                        <span className="w-6 h-6 rounded-md bg-white group-hover:bg-white/20 border border-emerald-200/60 group-hover:border-transparent flex items-center justify-center shrink-0 transition-colors shadow-2xs text-[#00a651] group-hover:text-white">
                          {renderSupportIcon(link.icon)}
                        </span>
                        <span className="truncate">{link.title}</span>
                      </a>
                    ))}
                </div>
              </div>
            )}

            {/* 6. Custom Field for Buyer (Model Preference / Special Note) - Controlled by enableBuyerNote */}
            {product.enableBuyerNote !== false && (
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-3.5 transition-all focus-within:border-[#00a651] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#00a651]/15">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <label htmlFor="buyer-order-note" className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      Model Preference / Custom Requirements
                    </label>
                  </div>
                  <span className="text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200/80 text-slate-600 shrink-0">
                    Optional
                  </span>
                </div>

                <textarea
                  id="buyer-order-note"
                  value={buyerNote}
                  onChange={(e) => setBuyerNote(e.target.value)}
                  placeholder="e.g. Model E2-15-C, custom stroke length, carriage preload, or specific instructions..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00a651] focus:ring-0 transition-all resize-none shadow-2xs"
                />

                <p className="flex items-start sm:items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 leading-normal">
                  <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5 sm:mt-0" />
                  <span>Custom specs, stroke lengths, or instructions attach directly to your order.</span>
                </p>
              </div>
            )}

            {/* 7 & 8. Quantity, Add to Cart & Buy Now Buttons */}
            <div className="space-y-2.5 pt-1">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                {/* Mobile Row 1 (Stepper + Add to Cart) / Desktop Left items */}
                <div className="flex items-center gap-2.5 flex-1">
                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between border border-slate-200 rounded-xl bg-slate-50 p-1 w-32 sm:w-36 h-12 shrink-0 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-9 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all active:scale-95 shadow-2xs cursor-pointer disabled:opacity-40"
                      aria-label="Decrease quantity"
                      disabled={quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="flex-1 text-center font-bold text-base text-slate-900 font-mono select-none">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="w-9 h-9 rounded-lg bg-white border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-all active:scale-95 shadow-2xs cursor-pointer"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="flex-1 h-12 px-4 rounded-xl bg-[#00a651] hover:bg-[#008f45] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span className="truncate">Add to Cart</span>
                  </button>
                </div>

                {/* Buy Now Button */}
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="w-full sm:flex-1 h-12 px-5 rounded-xl bg-[#0f172a] hover:bg-[#1e293b] active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 shrink-0" />
                  <span>Buy Now</span>
                </button>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-between sm:justify-start gap-4 pt-1 px-1 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00a651]" />
                  <span>Genuine Brand Guarantee</span>
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-[#00a651]" />
                  <span>Ready for Dispatch</span>
                </span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* 3. Related Products Section ("Other Products in This Category") */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="bg-[#f8f8f8] py-16 border-t border-slate-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#1a1a1a] mb-10">
              Other Products in This Category
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => {
                const relImg = rel.images && rel.images.length > 0 ? rel.images[0].url : "/placeholder.png";
                const relDesc = rel.shortDescription || rel.description?.replace(/<[^>]*>?/gm, "").slice(0, 80) || `Reliable and high-performance ${rel.name}...`;

                return (
                  <div
                    key={rel.id}
                    className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-xs hover:shadow-xl hover:border-[#00a651] transition-all flex flex-col group"
                  >
                    <div className="h-56 bg-white flex items-center justify-center p-6 border-b border-slate-100 overflow-hidden">
                      <img
                        src={relImg}
                        alt={rel.name}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <h3 className="font-bold text-base text-[#1a1a1a] line-clamp-2 leading-snug group-hover:text-[#00a651] transition-colors">
                          {rel.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                          {relDesc}
                        </p>
                      </div>
                      <div className="pt-2 flex items-center justify-between">
                        <span className="font-bold font-mono text-slate-900 text-sm">
                          {formatCurrency(rel.price ?? rel.basePrice ?? 0)}
                        </span>
                        <Link
                          href={`/product/${rel.slug}`}
                          className="inline-flex items-center gap-1.5 text-[#00a651] hover:text-[#008a41] font-bold text-xs sm:text-sm group-hover:translate-x-1 transition-all"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 4. Lightbox Zoom Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-[100000] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4 select-none touch-none overscroll-none overflow-hidden animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button in top right corner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[100010] p-2.5 sm:p-3 rounded-full bg-slate-900/85 hover:bg-slate-950 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-md shadow-xl active:scale-95"
            aria-label="Close image popup"
          >
            <X className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          </button>

          {/* Left Navigation Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-[100010] p-2.5 sm:p-3.5 rounded-full bg-slate-900/85 hover:bg-slate-950 text-white border-2 border-white/40 shadow-2xl transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5]" />
            </button>
          )}

          {/* Center Image Container */}
          <div
            className="relative max-w-4xl max-h-[85vh] w-full flex flex-col items-center justify-center px-6 sm:px-12"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedImageIndex]?.url || images[0]?.url}
              alt={product.name}
              className="max-w-full max-h-[70vh] sm:max-h-[75vh] object-contain rounded-xl shadow-2xl transition-all duration-200 pointer-events-none select-none"
            />

            {/* Bottom Indicator & Thumbnails */}
            <div className="mt-4 flex flex-col items-center gap-2 lightbox-scrollable">
              <span className="text-xs sm:text-sm font-semibold text-white/90 tracking-wider bg-white/10 px-3 py-1 rounded-full backdrop-blur-xs">
                {selectedImageIndex + 1} / {images.length}
              </span>

              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto max-w-md py-1.5 px-3 scrollbar-none">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(idx);
                      }}
                      className={`w-11 h-11 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer p-0.5 bg-white ${
                        selectedImageIndex === idx
                          ? "border-[#00a651] scale-105 shadow-lg ring-2 ring-[#00a651]/50"
                          : "border-transparent opacity-60 hover:opacity-100"
                      }`}
                    >
                      <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-contain pointer-events-none" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Navigation Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-[100010] p-2.5 sm:p-3.5 rounded-full bg-slate-900/85 hover:bg-slate-950 text-white border-2 border-white/40 shadow-2xl transition-all hover:scale-110 active:scale-90 cursor-pointer backdrop-blur-md"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8 stroke-[2.5]" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
