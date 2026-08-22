"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ChevronRight,
  ChevronLeft,
  X,
  ZoomIn,
  Plus,
  Minus,
  Check,
  CheckCircle2,
  Share2,
  Heart,
  HelpCircle,
  Sparkles
} from "lucide-react";
import { useCartStore } from "@/store/useCartStore";
import { useToastStore } from "@/store/useToastStore";

interface OptionChoice {
  id?: string;
  name: string;
  colorHex?: string;
}

interface ProductOptionItem {
  id?: string;
  name: string;
  fieldType: "TEXT_CHOICES" | "SWATCH_CHOICES";
  choices: OptionChoice[];
}

interface VariantItem {
  id?: string;
  sku: string;
  price: number;
  strikethroughPrice?: number | null;
  stockQuantity?: number;
  inventoryStatus?: string;
  totalUnits?: number;
  totalUnitsMeasurement?: string;
  mediaUrl?: string;
  attributes: Record<string, string>;
}

interface InfoSectionItem {
  id?: string;
  title: string;
  internalName?: string;
  content: string;
}

interface ProductDetailProps {
  product: {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    brand?: string;
    description?: string;
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
    options?: ProductOptionItem[];
    variants?: VariantItem[];
    infoSections?: InfoSectionItem[];
  };
  relatedProducts?: any[];
}

export function ProductDetailClient({ product, relatedProducts = [] }: ProductDetailProps) {
  const { addItem } = useCartStore();
  const { addToast } = useToastStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [openAccordionIds, setOpenAccordionIds] = useState<string[]>([]);

  // Selected Option Choices State: e.g. { Color: "Butter Yellow", Size: "4", Model: "f" }
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    product.options?.forEach((opt) => {
      if (opt.choices && opt.choices.length > 0) {
        initial[opt.name] = opt.choices[0].name;
      }
    });
    return initial;
  });

  if (!product) return notFound();

  const images = product.images && product.images.length > 0
    ? product.images
    : [{ url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80", alt: product.name }];

  // Match selected options to exact or partial variant override
  const activeVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) return null;
    return product.variants.find((v) => {
      const vAttrs = v.attributes || {};
      const entries = Object.entries(vAttrs);
      if (entries.length === 0) return false;
      return entries.every(([optName, optVal]) => selectedOptions[optName] === optVal);
    }) || null;
  }, [product.variants, selectedOptions]);

  // Active Price calculations
  const activePrice = activeVariant ? activeVariant.price : (product.price ?? product.basePrice ?? 0);
  const activeStrikethrough = activeVariant ? activeVariant.strikethroughPrice : (product.strikethroughPrice ?? product.compareAtPrice);

  // Price per unit calculation: (activePrice / totalUnits) * baseUnit
  const totalUnits = activeVariant ? (activeVariant.totalUnits ?? product.totalUnits) : product.totalUnits;
  const unitMeasure = product.baseUnitMeasurement || activeVariant?.totalUnitsMeasurement || product.totalUnitsMeasurement || "g";
  const baseUnit = product.baseUnit || 100;
  const pricePerUnit = (totalUnits && totalUnits > 0) ? (activePrice / totalUnits) * baseUnit : null;

  const activeSku = activeVariant?.sku || product.sku || "--";
  const isInStock = activeVariant ? activeVariant.inventoryStatus !== "OUT_OF_STOCK" : true;

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for Lightbox (Left / Right / Esc)
  useEffect(() => {
    if (!isLightboxOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      } else if (e.key === "ArrowRight") {
        setSelectedImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
      } else if (e.key === "ArrowLeft") {
        setSelectedImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen, images.length]);

  const handleOptionChange = (optionName: string, choiceName: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: choiceName }));
  };

  const handleToggleAccordion = (id: string) => {
    setOpenAccordionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAddToCart = () => {
    const optionSummary = Object.values(selectedOptions).filter(Boolean).join(" / ");
    const cartProduct = {
      ...product,
      id: product.id,
      name: optionSummary ? `${product.name} (${optionSummary})` : product.name,
      slug: product.slug,
      basePrice: activePrice,
      images: [{ url: activeVariant?.mediaUrl || images[selectedImageIndex]?.url || images[0].url }],
    } as any;

    addItem(
      cartProduct,
      quantity,
      activeVariant ? ({ ...activeVariant, price: activePrice } as any) : undefined
    );
    addToast("success", "Added to Cart", `${quantity}x ${cartProduct.name} added.`);
  };

  return (
    <div className="bg-white min-h-screen py-10 font-sans text-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Main Product Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Left: Gallery (Thumbnails on Left + Hero Viewport) */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4 items-start">
            {/* Vertical Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto max-h-[520px] pb-2 sm:pb-0 scrollbar-thin">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                      selectedImageIndex === idx
                        ? "border-slate-900 shadow-xs"
                        : "border-transparent opacity-70 hover:opacity-100 hover:border-slate-300"
                    }`}
                  >
                    <img src={img.url} alt={img.alt || product.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image Viewport with Click-to-Zoom */}
            <div
              onClick={() => setIsLightboxOpen(true)}
              className="group/hero flex-1 aspect-square sm:aspect-4/5 w-full bg-slate-50 border border-slate-100 rounded-lg overflow-hidden flex items-center justify-center relative cursor-zoom-in"
            >
              <img
                src={images[selectedImageIndex]?.url || images[0]?.url}
                alt={product.name}
                className="w-full h-full object-cover group-hover/hero:scale-102 transition-all duration-300"
              />
              {product.primaryRibbon && (
                <span className="absolute top-3 left-3 px-3 py-1 bg-slate-900 text-white text-xs font-bold uppercase tracking-wider rounded-xs shadow-xs">
                  {product.primaryRibbon}
                </span>
              )}
              <div className="absolute bottom-3 right-3 p-2 rounded-full bg-white/80 backdrop-blur-xs text-slate-700 opacity-0 group-hover/hero:opacity-100 transition-opacity shadow-xs">
                <ZoomIn className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Right: Info, Price, Options, Buy CTAs & Accordions */}
          <div className="lg:col-span-5 space-y-6">
            {/* Title & Brand Header */}
            <div className="space-y-1">
              <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900">
                {product.name}
              </h1>

              {/* Pricing Section */}
              <div className="pt-2 space-y-0.5">
                <div className="flex items-baseline gap-2.5">
                  <span className="text-xl sm:text-2xl font-normal text-slate-900">
                    ₹{activePrice.toFixed(2)}
                  </span>
                  {activeStrikethrough && (
                    <span className="text-lg text-slate-400 line-through">
                      ₹{activeStrikethrough.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Price per unit (e.g. ₹200.00 per 1 kg) */}
                {product.showPricePerUnit && (
                  <p className="text-xs text-slate-500 font-normal">
                    ₹{(product.totalUnits ?? activePrice).toFixed(2)} per {product.baseUnit || 1} {unitMeasure}
                  </p>
                )}
              </div>
            </div>

            {/* Dynamic Product Options */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-5 pt-2 border-t border-slate-100">
                {product.options.map((opt) => {
                  const currentSelected = selectedOptions[opt.name];
                  const isColorSwatch = opt.fieldType === "SWATCH_CHOICES";

                  return (
                    <div key={opt.id || opt.name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-800">
                        <span className="font-normal">{opt.name} *</span>
                        {isColorSwatch && (
                          <span className="text-slate-500 font-normal">{currentSelected}</span>
                        )}
                      </div>

                      {/* Choices Selectors */}
                      <div className="flex items-center gap-2.5 flex-wrap">
                        {opt.choices?.map((choice) => {
                          const isChoiceActive = currentSelected === choice.name;

                          if (isColorSwatch) {
                            return (
                              <button
                                key={choice.name}
                                type="button"
                                onClick={() => handleOptionChange(opt.name, choice.name)}
                                title={choice.name}
                                className={`w-7 h-7 rounded-full transition-all relative flex items-center justify-center cursor-pointer ${
                                  isChoiceActive
                                    ? "ring-2 ring-slate-900 ring-offset-2 scale-105"
                                    : "hover:ring-1 hover:ring-slate-400 opacity-90 hover:opacity-100"
                                }`}
                                style={{ backgroundColor: choice.colorHex || "#e2e8f0" }}
                              >
                                {isChoiceActive && (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      choice.colorHex === "#ffffff" || choice.colorHex?.toLowerCase() === "#fff"
                                        ? "bg-black"
                                        : "bg-white"
                                    }`}
                                  />
                                )}
                              </button>
                            );
                          }

                          // Choice Pills (e.g. Size: 4, 5, 6 or Model: f, a, m)
                          return (
                            <button
                              key={choice.name}
                              type="button"
                              onClick={() => handleOptionChange(opt.name, choice.name)}
                              className={`min-w-10 h-10 px-3.5 flex items-center justify-center text-xs font-normal border transition-all rounded-xs cursor-pointer ${
                                isChoiceActive
                                  ? "border-slate-900 bg-slate-900 text-white shadow-xs"
                                  : "border-slate-300 text-slate-800 hover:border-slate-600 bg-white"
                              }`}
                            >
                              {choice.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="space-y-1.5 pt-2">
              <label className="block text-xs text-slate-800 font-normal">Quantity *</label>
              <div className="flex items-center border border-slate-300 rounded-xs w-32 bg-white">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="flex-1 text-center text-sm font-normal text-slate-900">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-3">
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-6 bg-[#FF5722] hover:bg-[#F4511E] text-white text-sm font-medium rounded-xs shadow-xs transition-all cursor-pointer"
              >
                Add to Cart
              </button>

              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-3.5 px-6 bg-[#0B1527] hover:bg-[#1E293B] text-white text-sm font-medium rounded-xs shadow-xs transition-all cursor-pointer"
              >
                Buy Now
              </button>
            </div>

            {/* Description with Read more toggle */}
            {product.description && (
              <div className="pt-4 border-t border-slate-100 text-xs text-slate-700 leading-relaxed font-normal">
                <div
                  className={`overflow-hidden text-slate-700 font-normal [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-1.5 [&>li]:my-0.5 leading-relaxed ${
                    !isDescriptionExpanded ? "max-h-24" : ""
                  }`}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
                {product.description.length > 120 && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="text-xs underline text-slate-900 font-medium mt-1 hover:text-blue-600 cursor-pointer"
                  >
                    {isDescriptionExpanded ? "Read less" : "Read more"}
                  </button>
                )}
              </div>
            )}

            {/* Collapsible Info Accordions */}
            {product.infoSections && product.infoSections.length > 0 && (
              <div className="pt-4 border-t border-slate-200 divide-y divide-slate-200">
                {product.infoSections.map((sec, idx) => {
                  const secId = sec.id || `sec_${idx}`;
                  const isOpen = openAccordionIds.includes(secId);
                  return (
                    <div key={secId} className="py-3">
                      <button
                        type="button"
                        onClick={() => handleToggleAccordion(secId)}
                        className="w-full flex items-center justify-between text-left text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <span>{sec.title}</span>
                        <span className="text-base text-slate-500 font-light">
                          {isOpen ? "−" : "+"}
                        </span>
                      </button>

                      {isOpen && (
                        <div
                          className="pt-2.5 pb-1 text-xs text-slate-600 leading-relaxed [&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>p]:mb-1.5 [&>li]:my-0.5 animate-in fade-in duration-150"
                          dangerouslySetInnerHTML={{ __html: sec.content }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox / Zoom Popup Modal */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Close button in top right corner */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            className="absolute top-5 right-5 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close image popup"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Navigation Arrow */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 cursor-pointer shadow-lg"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}

          {/* Center Image Container */}
          <div
            className="relative max-w-4xl max-h-[85vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[selectedImageIndex]?.url || images[0]?.url}
              alt={product.name}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-2xl transition-all duration-200"
            />

            {/* Bottom Indicator & Thumbnails */}
            <div className="mt-4 flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-white/80 tracking-wider">
                {selectedImageIndex + 1} / {images.length}
              </span>

              {images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto max-w-md py-1 px-2">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedImageIndex(idx);
                      }}
                      className={`w-10 h-10 rounded-md overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                        selectedImageIndex === idx
                          ? "border-white scale-105 shadow-md"
                          : "border-transparent opacity-50 hover:opacity-100"
                      }`}
                    >
                      <img src={img.url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
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
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-110 cursor-pointer shadow-lg"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
