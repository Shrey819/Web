"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ShoppingCart,
  Check,
  Layers,
} from "lucide-react";
import { StorefrontCategory } from "@/lib/storefront";
import { Product } from "@/types";
import { useCartStore } from "@/store/useCartStore";
import { FALLBACK_CATEGORY_IMAGES } from "../CategoryDistribution3D/category3DData";

interface CategoryHorizontalShowcaseProps {
  categories?: StorefrontCategory[];
  products?: Product[];
  config?: any;
}

export interface DomainCategoryConfig {
  id: string;
  name: string;
  slug: string;
  description: string;
  itemCount: number;
  badge: string;
  image: string;
  products: Product[];
}

interface FloatingElementConfig {
  id: string;
  top: string;
  left?: string;
  right?: string;
  type: "crosshair" | "dial" | "badge" | "diamond" | "trace";
  content: string;
  subContent?: string;
}

const FLOATING_BG_ELEMENTS: FloatingElementConfig[] = [
  {
    id: "fl-h1",
    top: "6%",
    left: "4%",
    type: "crosshair",
    content: "+ [ X: 042.8 | Y: 110.2 ]",
    subContent: "AXIS-REF-01",
  },
  {
    id: "fl-h2",
    top: "12%",
    right: "5%",
    type: "dial",
    content: "Ø 45.00mm",
    subContent: "RUNOUT ±0.002",
  },
  {
    id: "fl-h3",
    top: "35%",
    left: "6%",
    type: "badge",
    content: "C5 GROUND LEAD",
    subContent: "PITCH: 5.0mm",
  },
  {
    id: "fl-h4",
    top: "42%",
    right: "7%",
    type: "diamond",
    content: "⌖ SERVO-SYNC",
    subContent: "4000 RPM // CANopen",
  },
  {
    id: "fl-h5",
    top: "70%",
    left: "5%",
    type: "trace",
    content: "SIGNAL: IP65",
    subContent: "4-20mA / MODBUS",
  },
  {
    id: "fl-h6",
    top: "84%",
    right: "4%",
    type: "crosshair",
    content: "+ [ Z: -25.000mm ]",
    subContent: "STREAM-PLANE",
  },
];

/**
 * Web Audio API synthesizer for the fixed tactile haptic click.
 * Works purely in the background without any UI toggles.
 */
class TactileAudioSynthesizer {
  private ctx: AudioContext | null = null;
  private lastTrigger = 0;

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playScrollTick() {
    const now = Date.now();
    if (now - this.lastTrigger < 55) return;
    this.lastTrigger = now;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      // Tight high-to-mid tactile transient in 16ms
      osc.frequency.setValueAtTime(1600, t);
      osc.frequency.exponentialRampToValueAtTime(380, t + 0.016);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.016);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.016);
    } catch {}
  }

  public playAddToCartChime() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const t = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, t);
      osc.frequency.setValueAtTime(659.25, t + 0.05);
      osc.frequency.setValueAtTime(783.99, t + 0.1);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.25);
    } catch {}
  }
}

const audioSynth = new TactileAudioSynthesizer();

/**
 * Format price in INR
 */
function formatPrice(val?: number | string): string {
  if (val === undefined || val === null || val === "") return "₹2,500";
  const num = typeof val === "string" ? parseFloat(val) : val;
  if (isNaN(num)) return "₹2,500";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Product banner badge matching Image 2
 */
function getProductBadge(product: Product, index: number): { text: string; isDiscount: boolean } {
  const price = product.basePrice || (product as any).price || 0;
  const comparePrice = product.compareAtPrice || 0;

  if (comparePrice > price && price > 0) {
    const discount = Math.round(((comparePrice - price) / comparePrice) * 100);
    if (discount > 5) {
      return { text: `-${discount}%`, isDiscount: true };
    }
  }

  const badgePresets = ["STOCK", "STOCK", "-16%", "-17%", "STOCK", "-17%"];
  const preset = badgePresets[index % badgePresets.length];
  return {
    text: preset,
    isDiscount: preset.startsWith("-"),
  };
}

/**
 * Single Category Horizontal Product Showcase Track.
 */
function CategoryHorizontalTrack({
  category,
  categoryIndex,
  onSoundTrigger,
}: {
  category: DomainCategoryConfig;
  categoryIndex: number;
  onSoundTrigger: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);

  // Mouse Drag-To-Scroll state for free-style dragging
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  const { addItem, openCart } = useCartStore();

  const products = useMemo(() => {
    let prods = category.products || [];
    if (prods.length === 0) return [];

    const targetCount = 28;
    const copiesNeeded = Math.ceil(targetCount / prods.length);
    const expanded: Product[] = [];

    for (let c = 0; c < copiesNeeded; c++) {
      prods.forEach((p, idx) => {
        expanded.push({
          ...p,
          id: `${p.id}_stream_${c}_${idx}`,
        });
      });
    }

    return expanded.slice(0, Math.max(prods.length, targetCount));
  }, [category.products]);

  // Center initial active card on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (containerRef.current && cardRefs.current[0]) {
        const container = containerRef.current;
        const initialCard = cardRefs.current[0];
        if (initialCard) {
          const target = initialCard.offsetLeft + initialCard.offsetWidth / 2 - container.clientWidth / 2;
          container.scrollTo({ left: target, behavior: "smooth" });
        }
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [products]);

  const lastCenterIndex = useRef(0);

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerCenter = container.scrollLeft + container.clientWidth / 2;

    let closestIdx = 0;
    let minDistance = Infinity;

    cardRefs.current.forEach((card, idx) => {
      if (!card) return;
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(containerCenter - cardCenter);
      if (distance < minDistance) {
        minDistance = distance;
        closestIdx = idx;
      }
    });

    if (closestIdx !== lastCenterIndex.current) {
      lastCenterIndex.current = closestIdx;
      setActiveIndex(closestIdx);
      onSoundTrigger();
    }
  }, [onSoundTrigger]);

  const scrollToIndex = useCallback(
    (targetIdx: number) => {
      if (!containerRef.current) return;
      const clamped = Math.max(0, Math.min(targetIdx, products.length - 1));
      const targetCard = cardRefs.current[clamped];
      if (targetCard) {
        const container = containerRef.current;
        const targetScrollLeft = targetCard.offsetLeft + targetCard.offsetWidth / 2 - container.clientWidth / 2;
        container.scrollTo({
          left: targetScrollLeft,
          behavior: "smooth",
        });
        setActiveIndex(clamped);
        onSoundTrigger();
      }
    },
    [products.length, onSoundTrigger]
  );

  const scrollByAmount = useCallback((direction: number) => {
    if (!containerRef.current) return;
    containerRef.current.scrollBy({
      left: direction * 650,
      behavior: "smooth",
    });
  }, []);

  const handleWheel = (e: React.WheelEvent) => {
    if (!containerRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    if (Math.abs(e.deltaY) > 0) {
      containerRef.current.scrollLeft += e.deltaY * 1.35;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    isDraggingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = e.pageX - containerRef.current.offsetLeft;
    startScrollLeftRef.current = containerRef.current.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.4;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    containerRef.current.scrollLeft = startScrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addItem(product, 1);
    openCart();
    audioSynth.playAddToCartChime();
    setAddedProductId(product.id);
    setTimeout(() => {
      setAddedProductId((current) => (current === product.id ? null : current));
    }, 1800);
  };

  return (
    <div className="w-full flex flex-col py-3 select-none">
      {/* -------------------------------------------------------------
          CATEGORY HEADER: RIGID LEFT ALIGNMENT
         ------------------------------------------------------------- */}
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-8 mb-2 text-left">
        <div className="flex items-center gap-2 mb-1 justify-start">
          <span className="font-mono text-[10px] text-sky-700 bg-sky-100/80 border border-sky-300/80 px-2 py-0.5 rounded uppercase tracking-wider font-semibold">
            Domain 0{categoryIndex + 1}
          </span>
          <span className="text-slate-400 font-mono text-xs">
            {products.length} Products Cataloged
          </span>
        </div>
        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight text-left">
          {category.name}
        </h3>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-xl text-left">
          {category.description || "Precision engineered industrial components."}
        </p>
      </div>

      {/* -------------------------------------------------------------
          HORIZONTAL TRACK: FREE-STYLE GLIDE & RIGID CARD HEIGHT
         ------------------------------------------------------------- */}
      <div className="relative w-full max-w-[1400px] mx-auto px-2 sm:px-6">
        {/* Left Arrow Button */}
        <button
          onClick={() => scrollByAmount(-1)}
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-lg border border-slate-700/60 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md opacity-90 hover:opacity-100"
          title="Glide Backward"
          aria-label="Glide Backward"
        >
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Right Arrow Button */}
        <button
          onClick={() => scrollByAmount(1)}
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-40 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-900/90 hover:bg-slate-900 text-white shadow-lg border border-slate-700/60 flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md opacity-90 hover:opacity-100"
          title="Glide Forward"
          aria-label="Glide Forward"
        >
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Scroll Container */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="relative w-full h-[350px] overflow-x-auto scrollbar-none flex items-center transition-all cursor-grab active:cursor-grabbing select-none"
          style={{
            paddingLeft: "calc(50% - 115px)",
            paddingRight: "calc(50% - 115px)",
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorX: "contain",
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            {products.map((product, idx) => {
              const isCenter = idx === activeIndex;
              const badgeInfo = getProductBadge(product, idx);
              const displayImg =
                product.images?.[0]?.url ||
                (product as any).image ||
                category.image ||
                FALLBACK_CATEGORY_IMAGES.default;

              const price = product.basePrice || (product as any).price || 2500;
              const comparePrice = product.compareAtPrice;
              const brandName = product.brand || "HIWIN";

              return (
                <div
                  key={`${product.id}-${idx}`}
                  ref={(el) => {
                    cardRefs.current[idx] = el;
                  }}
                  onClick={() => {
                    if (!hasMovedRef.current) {
                      scrollToIndex(idx);
                    }
                  }}
                  className={`relative shrink-0 w-[215px] sm:w-[235px] h-[310px] rounded-2xl transition-all duration-200 ease-out flex flex-col justify-between p-3.5 select-none ${
                    isCenter
                      ? "bg-white shadow-xl ring-2 ring-sky-500/50 shadow-sky-950/15 z-30 opacity-100 cursor-default"
                      : "bg-white/85 border border-slate-200/80 shadow-sm z-10 opacity-35 hover:opacity-50 cursor-pointer"
                  }`}
                >
                  {/* Banner Badge */}
                  <div
                    className={`absolute top-2.5 left-2.5 z-20 transition-opacity duration-200 ${
                      isCenter ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    {badgeInfo.isDiscount ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[10px] shadow-sm">
                        {badgeInfo.text}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold text-[9px] uppercase tracking-wider shadow-sm">
                        {badgeInfo.text}
                      </span>
                    )}
                  </div>

                  {/* Stock Ping Dot */}
                  <div
                    className={`absolute top-3 right-3 z-20 transition-opacity duration-200 ${
                      isCenter ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                  </div>

                  {/* Product Image */}
                  <div className="relative w-full h-[135px] flex items-center justify-center shrink-0 overflow-hidden my-auto pointer-events-none">
                    <Image
                      src={displayImg}
                      alt={product.name || "Precision hardware component"}
                      fill
                      sizes="240px"
                      className="object-contain drop-shadow-sm pointer-events-none"
                      priority={categoryIndex === 0 && idx < 3}
                    />
                  </div>

                  {/* Bottom Details Box */}
                  <div
                    className={`w-full h-[115px] flex flex-col justify-between shrink-0 transition-opacity duration-200 pt-1.5 border-t border-slate-100 ${
                      isCenter ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                    }`}
                  >
                    <div>
                      <div className="text-[10px] font-mono font-bold text-sky-600 uppercase tracking-wider truncate">
                        {brandName}
                      </div>

                      <Link
                        href={`/product/${product.slug || product.id}`}
                        onClick={(e) => {
                          if (hasMovedRef.current) e.preventDefault();
                        }}
                        className="group block mt-0.5"
                      >
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors line-clamp-2 leading-snug h-[34px]">
                          {product.name}
                        </h4>
                      </Link>
                    </div>

                    <div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <span className="text-sm sm:text-base font-extrabold text-slate-900">
                          {formatPrice(price)}
                        </span>
                        {comparePrice && comparePrice > price && (
                          <span className="text-[11px] text-slate-400 line-through">
                            {formatPrice(comparePrice)}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`w-full py-1.5 px-3 rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all duration-150 active:scale-95 cursor-pointer h-[30px] ${
                          addedProductId === product.id
                            ? "bg-emerald-600 text-white"
                            : "bg-slate-900 hover:bg-sky-600 text-white hover:shadow"
                        }`}
                        title="Add to cart"
                      >
                        {addedProductId === product.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-3.5 h-3.5" />
                            <span>Add to Cart</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Line */}
        <div className="flex items-center justify-start max-w-[1400px] mx-auto px-4 sm:px-8 gap-2 mt-1 font-mono text-[10px] text-slate-400">
          <span>Item 0{activeIndex + 1}</span>
          <span className="text-slate-300">/</span>
          <span>0{products.length}</span>
          <span className="text-slate-300">•</span>
          <span className="text-sky-600 font-medium">Free-style scroll: drag or mouse wheel horizontally</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Main Section: CategoryHorizontalShowcase
 */
export function CategoryHorizontalShowcase({
  categories: initialCategories = [],
  products: initialProducts = [],
}: CategoryHorizontalShowcaseProps) {
  const [categories, setCategories] = useState<StorefrontCategory[]>(initialCategories);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [activeTabMode, setActiveTabMode] = useState<"tabbed" | "all">("tabbed");
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<number>(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setCategories(data);
      })
      .catch(() => {});

    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setProducts(data);
      })
      .catch(() => {});
  }, []);

  const domainCategories: DomainCategoryConfig[] = useMemo(() => {
    if (!products || products.length === 0) return [];

    const linearProds = products.filter((p) => {
      const text = `${p.name || ""} ${p.categoryId || ""} ${p.slug || ""}`.toLowerCase();
      return (
        text.includes("guideway") ||
        text.includes("linear guide") ||
        text.includes("block") ||
        p.categoryId === "cat_bda477a346d8"
      );
    });

    const ballProds = products.filter((p) => {
      const text = `${p.name || ""} ${p.categoryId || ""} ${p.slug || ""}`.toLowerCase();
      return (
        text.includes("ballscrew") ||
        text.includes("ball screw") ||
        p.categoryId === "cat_ac116a5aa652"
      );
    });

    const actuatorProds = products.filter((p) => {
      const text = `${p.name || ""} ${p.brand || ""} ${p.categoryId || ""}`.toLowerCase();
      return (
        text.includes("actuator") ||
        text.includes("cylinder") ||
        text.includes("festo") ||
        p.categoryId === "cat_4c27e09d4255c71e"
      );
    });

    const sensorProds = products.filter((p) => {
      const text = `${p.name || ""} ${p.brand || ""}`.toLowerCase();
      return (
        text.includes("sensor") ||
        text.includes("proximity") ||
        text.includes("omron") ||
        text.includes("laser") ||
        text.includes("distance")
      );
    });

    const driveProds = products.filter((p) => {
      const text = `${p.name || ""} ${p.brand || ""}`.toLowerCase();
      return (
        text.includes("servo") ||
        text.includes("plc") ||
        text.includes("vfd") ||
        text.includes("contactor") ||
        text.includes("siemens") ||
        text.includes("yaskawa") ||
        text.includes("schneider")
      );
    });

    return [
      {
        id: "cat_linear_guideway",
        name: "Linear Guideway",
        slug: "linear-guideway",
        description: "Heavy-duty guideways, runner carriages, and dust-resistant scrapers.",
        itemCount: linearProds.length,
        badge: "Class P Precision",
        image: linearProds[0]?.images?.[0]?.url || "/cinematic-products/linear-guide-rail.png",
        products: linearProds,
      },
      {
        id: "cat_ballscrew",
        name: "Ballscrew",
        slug: "ballscrew",
        description: "Zero backlash C5/C7 ground & rolled ballscrews engineered for dynamic axes.",
        itemCount: ballProds.length,
        badge: "Zero Backlash C5/C7",
        image: ballProds[0]?.images?.[0]?.url || "/cinematic-products/linear-guide-rail.png",
        products: ballProds,
      },
      {
        id: "cat_actuators",
        name: "Actuators & Pneumatics",
        slug: "actuators",
        description: "Electric linear cylinders, high-thrust actuators, and pneumatic slide stages.",
        itemCount: actuatorProds.length,
        badge: "High-Repeatability",
        image: actuatorProds[0]?.images?.[0]?.url || "/cinematic-products/spindle-servo-actuator.png",
        products: actuatorProds,
      },
      {
        id: "cat_sensors",
        name: "Sensors & Measurement",
        slug: "sensors",
        description: "Inductive proximity, laser distance, and optical displacement sensors.",
        itemCount: sensorProds.length,
        badge: "Sub-Millisecond Response",
        image: sensorProds[0]?.images?.[0]?.url || "/cinematic-products/round-gauge.webp",
        products: sensorProds,
      },
      {
        id: "cat_drives",
        name: "Drives & Motion Control",
        slug: "drives",
        description: "Micro-PLCs, AC brushless servo motors, and vector VFD inverters.",
        itemCount: driveProds.length,
        badge: "High-Torque Density",
        image: driveProds[0]?.images?.[0]?.url || "/cinematic-products/spindle-servo-actuator.png",
        products: driveProds,
      },
    ];
  }, [products]);

  const handleSoundTrigger = useCallback(() => {
    audioSynth.playScrollTick();
  }, []);

  if (domainCategories.length === 0) return null;

  return (
    <section
      data-scene="category-horizontal-showcase"
      className="relative w-full bg-gradient-to-b from-slate-100/70 via-white to-slate-100/70 text-slate-900 border-b border-slate-300/80 select-none py-10 overflow-hidden"
    >
      {/* Precision Drafting Grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #0f172a 1px, transparent 1px),
            linear-gradient(to bottom, #0f172a 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px",
        }}
      />

      {/* Radial Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 92% 76% at 50% 50%, rgba(255, 255, 255, 0) 35%, rgba(241, 245, 249, 0.45) 65%, rgba(226, 232, 240, 0.75) 85%, rgba(203, 213, 225, 0.95) 100%)
          `,
        }}
      />

      {/* Left & Right Edge Depth Accents */}
      <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-r from-slate-200/60 via-slate-100/20 to-transparent pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 bg-gradient-to-l from-slate-200/60 via-slate-100/20 to-transparent pointer-events-none" />

      {/* Glow Lines */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent pointer-events-none" />

      {/* Technical Corner Brackets */}
      <div className="absolute top-4 left-4 pointer-events-none hidden sm:flex items-start gap-1 font-mono text-[9px] text-slate-400">
        <span className="text-sky-600 font-bold">┌</span>
        <span>SEC: HORIZONTAL-FOCUS // OM-PRECISION</span>
      </div>
      <div className="absolute top-4 right-4 pointer-events-none hidden sm:flex items-start gap-1 font-mono text-[9px] text-slate-400">
        <span>SYS: ACTIVE-TRACK</span>
        <span className="text-sky-600 font-bold">┐</span>
      </div>

      {/* Floating Elements */}
      {FLOATING_BG_ELEMENTS.map((el) => (
        <div
          key={el.id}
          className="absolute pointer-events-none select-none z-10 hidden md:block"
          style={{ top: el.top, left: el.left, right: el.right }}
        >
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/70 backdrop-blur-[3px] border border-slate-300/60 shadow-sm opacity-50">
            {el.type === "crosshair" && <span className="w-2 h-2 text-sky-600 font-bold text-xs leading-none">+</span>}
            {el.type === "dial" && <span className="w-2.5 h-2.5 rounded-full border border-sky-500/80 border-dashed" />}
            {el.type === "badge" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-200" />}
            {el.type === "diamond" && <span className="w-2 h-2 rotate-45 border border-sky-600 bg-sky-100" />}
            {el.type === "trace" && <span className="w-2 h-2 rounded-sm bg-slate-300 ring-1 ring-slate-400" />}
            <div className="font-mono text-[9px] leading-tight text-slate-600">
              <div className="font-semibold text-slate-800">{el.content}</div>
              {el.subContent && <div className="text-[8px] text-slate-400">{el.subContent}</div>}
            </div>
          </div>
        </div>
      ))}

      {/* -------------------------------------------------------------
          SECTION GLOBAL HEADER: LEFT ALIGNED (CLEAN, NO AUDIO BUTTONS IN UI)
         ------------------------------------------------------------- */}
      <div className="relative z-20 w-full max-w-[1400px] mx-auto px-4 sm:px-8 mb-6 text-left">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-100/90 border border-slate-200 text-slate-700 text-[11px] font-mono font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
              <span>Industrial Spotlight Stream</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight text-left">
              Featured Hardware Domains
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-mono text-left">
              5 Core Component Domains • Free-Style Horizontal Scroll
            </p>
          </div>

          {/* Clean View Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTabMode(activeTabMode === "tabbed" ? "all" : "tabbed")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-mono font-medium shadow-sm transition-all cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>{activeTabMode === "tabbed" ? "View All 5 Domains" : "Tabbed View"}</span>
            </button>
          </div>
        </div>

        {/* 5 Domains Category Navigation Tabs */}
        {activeTabMode === "tabbed" && (
          <div className="flex flex-wrap items-center justify-start gap-2 mt-5">
            {domainCategories.map((cat, idx) => {
              const isSelected = selectedCategoryTab === idx;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryTab(idx);
                    audioSynth.playScrollTick();
                  }}
                  className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer flex items-center gap-2 ${
                    isSelected
                      ? "bg-slate-900 text-white shadow-md ring-2 ring-sky-500/40"
                      : "bg-white/90 hover:bg-white text-slate-700 border border-slate-200/90 shadow-sm hover:shadow"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-sky-400" : "bg-slate-300"}`} />
                  <span>{cat.name}</span>
                  <span className="font-mono text-[11px] opacity-70">
                    ({cat.products?.length || 0})
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          DOMAIN PRODUCT STREAMS
         ------------------------------------------------------------- */}
      <div className="relative z-10 w-full flex flex-col items-center gap-6">
        {activeTabMode === "tabbed" ? (
          <CategoryHorizontalTrack
            key={domainCategories[selectedCategoryTab].id}
            category={domainCategories[selectedCategoryTab]}
            categoryIndex={selectedCategoryTab}
            onSoundTrigger={handleSoundTrigger}
          />
        ) : (
          domainCategories.map((category, idx) => (
            <div key={category.id} className="w-full">
              {idx > 0 && (
                <div className="w-full max-w-[1400px] mx-auto h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent my-2" />
              )}
              <CategoryHorizontalTrack
                category={category}
                categoryIndex={idx}
                onSoundTrigger={handleSoundTrigger}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
