"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { saveHomepageConfigAction } from "@/app/actions/homepage";
import {
  HomepageData,
  HeroSlide,
  CategoryShowcaseConfig,
  MainframeHeroConfig,
  StickyShowcaseConfig,
  BrandMarqueeConfig,
  BrandItem,
  PromoBannerConfig,
  StatItem,
  WhyBuyItem,
  TestimonialItem,
  FaqItem,
  HeaderConfig,
  FooterConfig,
  DEFAULT_MAINFRAME_HERO,
  DEFAULT_HERO_SLIDES,
  DEFAULT_CATEGORY_SHOWCASES,
  DEFAULT_STICKY_SHOWCASE,
  DEFAULT_BRAND_MARQUEE,
  DEFAULT_PROMO_BANNER,
  DEFAULT_STATS,
  DEFAULT_WHY_BUY,
  DEFAULT_TESTIMONIALS,
  DEFAULT_FAQS,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_FOOTER_CONFIG,
} from "@/lib/homepage";
import { useToastStore } from "@/store/useToastStore";
import { MediaLibraryModal } from "./MediaLibraryModal";
import {
  Save,
  Image as ImageIcon,
  Sliders,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  HelpCircle,
  MessageSquare,
  BarChart3,
  ShieldCheck,
  Megaphone,
  LayoutTemplate,
  Compass,
  Link as LinkIcon,
  ExternalLink,
  GripVertical,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
}

const KNOWN_STATIC_ROUTES = new Set([
  "/",
  "/about",
  "/contact",
  "/quote",
  "/products",
  "/categories",
  "/cart",
  "/checkout",
  "/compare",
  "/wishlist",
  "/orders",
  "/profile",
  "/login",
  "/register",
  "/forgot-password",
  "/faq",
  "/delivery",
  "/shipping-policy",
  "/refund-policy",
  "/terms-of-service",
  "/privacy",
  "/legal-notice",
  "/resources",
  "/admin",
  "/admin/homepage",
  "/admin/products",
  "/admin/categories",
  "/admin/orders",
  "/admin/quotes",
  "/admin/forms",
  "/admin/settings",
  "/admin/live-tracker",
]);

function checkUrlValidity(
  url: string | undefined | null,
  validSlugs: string[] = []
): { isValid: boolean; error?: string } {
  if (!url || typeof url !== "string" || url.trim() === "") {
    return { isValid: true };
  }

  const trimmed = url.trim();

  // Allow anchor, tel, mailto
  if (trimmed.startsWith("#") || trimmed.startsWith("mailto:") || trimmed.startsWith("tel:")) {
    return { isValid: true };
  }

  // External full URLs
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      new URL(trimmed);
      return { isValid: true };
    } catch {
      return { isValid: false, error: "Invalid external URL format (must be valid https://...)." };
    }
  }

  // Internal URLs must start with /
  if (!trimmed.startsWith("/")) {
    return {
      isValid: false,
      error: "Internal URL must start with '/' (e.g. /products, /quote, /about).",
    };
  }

  // Normalize path (strip query params and hash for route verification)
  const pathname = trimmed.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  // Check known static routes
  if (KNOWN_STATIC_ROUTES.has(pathname)) {
    return { isValid: true };
  }

  // Check dynamic route patterns
  // 1. /category/:slug or /categories/:slug
  const catMatch = pathname.match(/^\/(category|categories)\/([a-zA-Z0-9-_]+)$/);
  if (catMatch) {
    const slug = catMatch[2].toLowerCase();
    if (validSlugs.length > 0) {
      const slugExists = validSlugs.some((s) => s.toLowerCase() === slug);
      if (!slugExists) {
        return {
          isValid: false,
          error: `Category "${slug}" does not exist in catalog (404 Error).`,
        };
      }
    }
    return { isValid: true };
  }

  // 2. /product/:slug or /products/:id
  const prodMatch = pathname.match(/^\/products?\/([a-zA-Z0-9-_]+)$/);
  if (prodMatch) {
    return { isValid: true };
  }

  // 3. /resources/:slug
  const resMatch = pathname.match(/^\/resources\/([a-zA-Z0-9-_]+)$/);
  if (resMatch) {
    return { isValid: true };
  }

  // 4. /orders/:id
  const orderMatch = pathname.match(/^\/orders\/([a-zA-Z0-9-_]+)$/);
  if (orderMatch) {
    return { isValid: true };
  }

  // 5. Static assets /videos/ /images/ /uploads/ /assets/
  if (
    pathname.startsWith("/videos/") ||
    pathname.startsWith("/images/") ||
    pathname.startsWith("/uploads/") ||
    pathname.startsWith("/assets/")
  ) {
    return { isValid: true };
  }

  // Route does not exist
  return {
    isValid: false,
    error: `Page "${pathname}" does not exist in website (404 Error).`,
  };
}

interface HomepageManagementFormProps {
  initialData: HomepageData;
  categories: CategoryOption[];
}

export function HomepageManagementForm({ initialData, categories }: HomepageManagementFormProps) {
  const router = useRouter();
  const { addToast } = useToastStore();
  const [isSaving, setIsSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("ticker");

  // Track last successfully saved state for full revert
  const [lastSavedData, setLastSavedData] = useState<HomepageData>(initialData);
  // Track URL validation 404 errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validCategorySlugs = React.useMemo(() => categories.map((c) => c.slug), [categories]);

  // Section 1: Promo Ticker
  const [promoTicker, setPromoTicker] = useState(initialData.promoTicker || "");
  const [promoTickerUrl, setPromoTickerUrl] = useState(initialData.promoTickerUrl || "/products");
  const [promoTickerActive, setPromoTickerActive] = useState(
    initialData.promoTickerActive !== undefined ? initialData.promoTickerActive : true
  );

  // Section 2: Mainframe Hero
  const [mainframeHero, setMainframeHero] = useState<MainframeHeroConfig>(() => {
    const raw = initialData.mainframeHero || DEFAULT_MAINFRAME_HERO;
    return {
      ...raw,
      subheading: raw.subheading || DEFAULT_MAINFRAME_HERO.subheading,
      salesEmailText: raw.salesEmailText || DEFAULT_MAINFRAME_HERO.salesEmailText,
      salesEmail: raw.salesEmail || DEFAULT_MAINFRAME_HERO.salesEmail,
      videoUrl:
        raw.videoUrl && raw.videoUrl !== "/videos/character-opt.mp4"
          ? raw.videoUrl
          : DEFAULT_MAINFRAME_HERO.videoUrl,
    };
  });

  // Section 3: Hero Slides
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(() => {
    if (initialData.heroSlides && initialData.heroSlides.length > 0) {
      return initialData.heroSlides;
    }
    return DEFAULT_HERO_SLIDES;
  });

  // Section 4: Category Showcases
  const [categoryShowcases, setCategoryShowcases] = useState<CategoryShowcaseConfig[]>(() => {
    if (initialData.categoryShowcases && initialData.categoryShowcases.length > 0) {
      return initialData.categoryShowcases;
    }
    return DEFAULT_CATEGORY_SHOWCASES;
  });

  // Section 5: Sticky Showcase
  const [stickyShowcase, setStickyShowcase] = useState<StickyShowcaseConfig>(
    initialData.stickyShowcase || DEFAULT_STICKY_SHOWCASE
  );

  // Section 6: Brand Marquee (OEM Partners)
  const [brandMarquee, setBrandMarquee] = useState<BrandMarqueeConfig>(() => {
    const raw = initialData.brandMarquee || DEFAULT_BRAND_MARQUEE;
    return {
      ...raw,
      eyebrow: raw.eyebrow || DEFAULT_BRAND_MARQUEE.eyebrow,
      note: raw.note !== undefined ? raw.note : DEFAULT_BRAND_MARQUEE.note,
      isActive: raw.isActive !== undefined ? raw.isActive : true,
      brands: raw.brands && raw.brands.length > 0 ? raw.brands : DEFAULT_BRAND_MARQUEE.brands,
    };
  });
  const [draggedBrandIdx, setDraggedBrandIdx] = useState<number | null>(null);

  // Section 7: Promo Banner
  const [promoBanner, setPromoBanner] = useState<PromoBannerConfig>(
    initialData.promoBanner || DEFAULT_PROMO_BANNER
  );

  // Section 7: Stats
  const [stats, setStats] = useState<StatItem[]>(
    initialData.stats && initialData.stats.length > 0 ? initialData.stats : DEFAULT_STATS
  );

  // Section 8: Why Buy
  const [whyBuy, setWhyBuy] = useState<WhyBuyItem[]>(() => {
    if (initialData.whyBuyFromUs && initialData.whyBuyFromUs.length > 0) {
      return initialData.whyBuyFromUs;
    }
    if (initialData.whyBuy && initialData.whyBuy.length > 0) {
      return initialData.whyBuy;
    }
    return DEFAULT_WHY_BUY;
  });

  // Section 9: Testimonials
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>(
    initialData.testimonials && initialData.testimonials.length > 0
      ? initialData.testimonials
      : DEFAULT_TESTIMONIALS
  );

  // Section 10: FAQs
  const [faqs, setFaqs] = useState<FaqItem[]>(
    initialData.faqs && initialData.faqs.length > 0 ? initialData.faqs : DEFAULT_FAQS
  );

  // Section 11: Header Config
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig>(
    initialData.headerConfig || DEFAULT_HEADER_CONFIG
  );

  // Section 12: Footer Config
  const [footerConfig, setFooterConfig] = useState<FooterConfig>(
    initialData.footerConfig || DEFAULT_FOOTER_CONFIG
  );

  // Media Library Target state
  const [activeMediaTarget, setActiveMediaTarget] = useState<{
    target: "slideDesktop" | "slideMobile" | "showcaseHero" | "stickyImage" | "promoImage";
    index?: number;
  } | null>(null);

  // Mainframe Hero Pills Drag & Drop + Reorder Handlers
  const [draggedPillIdx, setDraggedPillIdx] = useState<number | null>(null);

  const handlePillDragStart = (e: React.DragEvent, index: number) => {
    setDraggedPillIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handlePillDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handlePillDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedPillIdx === null || draggedPillIdx === targetIndex) return;

    setMainframeHero((prev) => {
      const list = [...(prev.navPills || [])];
      const item = list.splice(draggedPillIdx, 1)[0];
      list.splice(targetIndex, 0, item);
      return { ...prev, navPills: list };
    });
    setDraggedPillIdx(null);
  };

  const handlePillDragEnd = () => {
    setDraggedPillIdx(null);
  };

  const handleMovePill = (index: number, direction: "up" | "down") => {
    const list = [...(mainframeHero.navPills || [])];
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === list.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[target];
    list[target] = temp;
    setMainframeHero({ ...mainframeHero, navPills: list });
  };

  // Handlers for Slides
  const handleSlideChange = (index: number, field: keyof HeroSlide, value: any) => {
    setHeroSlides((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddSlide = () => {
    setHeroSlides((prev) => [
      ...prev,
      {
        id: `slide-${Date.now()}`,
        desktopImage: "",
        mobileImage: "",
        title: `Slide ${prev.length + 1}`,
        subtitle: "Promotional Subtitle",
        ctaText: "Explore Now",
        ctaUrl: "/products",
        isActive: true,
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const handleDeleteSlide = (index: number) => {
    if (heroSlides.length <= 1) {
      addToast("warning", "Required", "You must keep at least 1 hero slide.");
      return;
    }
    setHeroSlides((prev) => prev.filter((_, i) => i !== index));
  };

  const [draggedSlideIdx, setDraggedSlideIdx] = useState<number | null>(null);

  const handleSlideDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSlideIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleSlideDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleSlideDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedSlideIdx === null || draggedSlideIdx === targetIndex) return;

    setHeroSlides((prev) => {
      const copy = [...prev];
      const item = copy.splice(draggedSlideIdx, 1)[0];
      copy.splice(targetIndex, 0, item);
      return copy;
    });
    setDraggedSlideIdx(null);
  };

  const handleSlideDragEnd = () => {
    setDraggedSlideIdx(null);
  };

  const handleMoveSlide = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === heroSlides.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    setHeroSlides((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // Handlers for Category Showcases
  const [draggedShowcaseIdx, setDraggedShowcaseIdx] = useState<number | null>(null);

  const handleShowcaseDragStart = (e: React.DragEvent, index: number) => {
    setDraggedShowcaseIdx(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleShowcaseDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleShowcaseDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedShowcaseIdx === null || draggedShowcaseIdx === targetIndex) return;

    setCategoryShowcases((prev) => {
      const copy = [...prev];
      const item = copy.splice(draggedShowcaseIdx, 1)[0];
      copy.splice(targetIndex, 0, item);
      return copy;
    });
    setDraggedShowcaseIdx(null);
  };

  const handleShowcaseDragEnd = () => {
    setDraggedShowcaseIdx(null);
  };

  const handleShowcaseChange = (index: number, field: keyof CategoryShowcaseConfig, value: any) => {
    setCategoryShowcases((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddShowcase = () => {
    setCategoryShowcases((prev) => [
      ...prev,
      {
        id: `showcase-${Date.now()}`,
        categoryId: categories[0]?.id || "sensors",
        eyebrow: "Explore Collection",
        customTitle: "Featured Category Showcase",
        viewAllText: "View All",
        viewAllUrl: "",
        bannerBadge: "Featured Category",
        bannerTitle: "Featured Category",
        bannerDescription: "Browse our certified, high-performance line of hardware components.",
        heroImage: "",
        isActive: true,
        sortOrder: prev.length + 1,
      },
    ]);
  };

  const handleDeleteShowcase = (index: number) => {
    if (categoryShowcases.length <= 1) {
      addToast("warning", "Required", "You must keep at least 1 category showcase.");
      return;
    }
    setCategoryShowcases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveShowcase = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === categoryShowcases.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    setCategoryShowcases((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return copy;
    });
  };

  // Handlers for Brand Marquee (Section 6)
  const [draggedBrandIndex, setDraggedBrandIndex] = useState<number | null>(null);

  const handleBrandDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBrandIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleBrandDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleBrandDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedBrandIndex === null || draggedBrandIndex === targetIndex) return;

    setBrandMarquee((prev) => {
      const copy = [...prev.brands];
      const item = copy.splice(draggedBrandIndex, 1)[0];
      copy.splice(targetIndex, 0, item);
      return { ...prev, brands: copy };
    });
    setDraggedBrandIndex(null);
  };

  const handleBrandDragEnd = () => {
    setDraggedBrandIndex(null);
  };

  const handleBrandChange = (index: number, field: keyof BrandItem, value: any) => {
    setBrandMarquee((prev) => {
      const copy = [...prev.brands];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, brands: copy };
    });
  };

  const handleAddBrand = () => {
    setBrandMarquee((prev) => ({
      ...prev,
      brands: [
        ...prev.brands,
        {
          id: `brand-${Date.now()}`,
          name: "NEW BRAND",
          country: "USA",
          url: "/products",
        },
      ],
    }));
  };

  const handleDeleteBrand = (index: number) => {
    if (brandMarquee.brands.length <= 1) {
      addToast("warning", "Required", "You must keep at least 1 brand partner.");
      return;
    }
    setBrandMarquee((prev) => ({
      ...prev,
      brands: prev.brands.filter((_, i) => i !== index),
    }));
  };

  const handleMoveBrand = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === brandMarquee.brands.length - 1) return;
    const target = direction === "up" ? index - 1 : index + 1;
    setBrandMarquee((prev) => {
      const copy = [...prev.brands];
      const temp = copy[index];
      copy[index] = copy[target];
      copy[target] = temp;
      return { ...prev, brands: copy };
    });
  };

  // Media Library Selection
  const handleSelectMediaImage = (url: string) => {
    if (!activeMediaTarget) return;
    const { target, index } = activeMediaTarget;

    if (target === "slideDesktop" && index !== undefined) {
      handleSlideChange(index, "desktopImage", url);
    } else if (target === "slideMobile" && index !== undefined) {
      handleSlideChange(index, "mobileImage", url);
    } else if (target === "showcaseHero" && index !== undefined) {
      handleShowcaseChange(index, "heroImage", url);
    } else if (target === "stickyImage") {
      setStickyShowcase((prev) => ({ ...prev, image: url }));
    } else if (target === "promoImage") {
      setPromoBanner((prev) => ({ ...prev, image: url }));
    }
  };

  // Validate all URLs across all 13 sections
  const validateAllUrls = () => {
    const newErrors: Record<string, string> = {};

    // Section 1: Promo Ticker
    if (promoTickerUrl) {
      const v = checkUrlValidity(promoTickerUrl, validCategorySlugs);
      if (!v.isValid && v.error) newErrors["promoTickerUrl"] = v.error;
    }

    // Section 2: Mainframe Hero
    if (mainframeHero.ctaUrl) {
      const v = checkUrlValidity(mainframeHero.ctaUrl, validCategorySlugs);
      if (!v.isValid && v.error) newErrors["mainframeHero.ctaUrl"] = v.error;
    }
    (mainframeHero.navPills || []).forEach((pill, idx) => {
      if (pill.url) {
        const v = checkUrlValidity(pill.url, validCategorySlugs);
        if (!v.isValid && v.error) newErrors[`mainframeHero.navPills.${idx}`] = v.error;
      }
    });

    // Section 3: Hero Slides
    heroSlides.forEach((slide, idx) => {
      if (slide.ctaUrl) {
        const v = checkUrlValidity(slide.ctaUrl, validCategorySlugs);
        if (!v.isValid && v.error) newErrors[`heroSlides.${idx}.ctaUrl`] = v.error;
      }
    });

    // Section 4: Category Showcases
    categoryShowcases.forEach((sc, idx) => {
      if (sc.viewAllUrl) {
        const v = checkUrlValidity(sc.viewAllUrl, validCategorySlugs);
        if (!v.isValid && v.error) newErrors[`categoryShowcases.${idx}.viewAllUrl`] = v.error;
      }
    });

    // Section 5: Sticky Showcase
    if (stickyShowcase.ctaUrl) {
      const v = checkUrlValidity(stickyShowcase.ctaUrl, validCategorySlugs);
      if (!v.isValid && v.error) newErrors["stickyShowcase.ctaUrl"] = v.error;
    }

    // Section 6: Brand Marquee
    (brandMarquee.brands || []).forEach((b, idx) => {
      if (b.url) {
        const v = checkUrlValidity(b.url, validCategorySlugs);
        if (!v.isValid && v.error) newErrors[`brandMarquee.brands.${idx}.url`] = v.error;
      }
    });

    // Section 7: Promo Banner
    if (promoBanner.primaryCtaUrl) {
      const v = checkUrlValidity(promoBanner.primaryCtaUrl, validCategorySlugs);
      if (!v.isValid && v.error) newErrors["promoBanner.primaryCtaUrl"] = v.error;
    }
    if (promoBanner.secondaryCtaUrl) {
      const v = checkUrlValidity(promoBanner.secondaryCtaUrl, validCategorySlugs);
      if (!v.isValid && v.error) newErrors["promoBanner.secondaryCtaUrl"] = v.error;
    }

    // Section 12: Header Nav Links
    (headerConfig.navLinks || []).forEach((link, idx) => {
      if (link.url) {
        const v = checkUrlValidity(link.url, validCategorySlugs);
        if (!v.isValid && v.error) newErrors[`headerConfig.navLinks.${idx}`] = v.error;
      }
    });

    // Section 13: Footer Useful & Help Links
    (footerConfig.usefulLinks || []).forEach((link, idx) => {
      if (link.url) {
        const v = checkUrlValidity(link.url, validCategorySlugs);
        if (!v.isValid && v.error) newErrors[`footerConfig.usefulLinks.${idx}`] = v.error;
      }
    });
    (footerConfig.helpLinks || []).forEach((link, idx) => {
      if (link.url) {
        const v = checkUrlValidity(link.url, validCategorySlugs);
        if (!v.isValid && v.error) newErrors[`footerConfig.helpLinks.${idx}`] = v.error;
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  // Revert all form changes to the last successfully saved state
  const handleResetToLastSaved = () => {
    setPromoTicker(lastSavedData.promoTicker || "");
    setPromoTickerUrl(lastSavedData.promoTickerUrl || "/products");
    setPromoTickerActive(
      lastSavedData.promoTickerActive !== undefined ? lastSavedData.promoTickerActive : true
    );

    const rawMainframe = lastSavedData.mainframeHero || DEFAULT_MAINFRAME_HERO;
    setMainframeHero({
      ...rawMainframe,
      subheading: rawMainframe.subheading || DEFAULT_MAINFRAME_HERO.subheading,
      salesEmailText: rawMainframe.salesEmailText || DEFAULT_MAINFRAME_HERO.salesEmailText,
      salesEmail: rawMainframe.salesEmail || DEFAULT_MAINFRAME_HERO.salesEmail,
      videoUrl:
        rawMainframe.videoUrl && rawMainframe.videoUrl !== "/videos/character-opt.mp4"
          ? rawMainframe.videoUrl
          : DEFAULT_MAINFRAME_HERO.videoUrl,
    });

    setHeroSlides(
      lastSavedData.heroSlides && lastSavedData.heroSlides.length > 0
        ? lastSavedData.heroSlides
        : DEFAULT_HERO_SLIDES
    );

    setCategoryShowcases(
      lastSavedData.categoryShowcases && lastSavedData.categoryShowcases.length > 0
        ? lastSavedData.categoryShowcases
        : DEFAULT_CATEGORY_SHOWCASES
    );

    setStickyShowcase(lastSavedData.stickyShowcase || DEFAULT_STICKY_SHOWCASE);

    const rawBrands = lastSavedData.brandMarquee || DEFAULT_BRAND_MARQUEE;
    setBrandMarquee({
      ...rawBrands,
      eyebrow: rawBrands.eyebrow || DEFAULT_BRAND_MARQUEE.eyebrow,
      note: rawBrands.note !== undefined ? rawBrands.note : DEFAULT_BRAND_MARQUEE.note,
      isActive: rawBrands.isActive !== undefined ? rawBrands.isActive : true,
      brands: rawBrands.brands && rawBrands.brands.length > 0 ? rawBrands.brands : DEFAULT_BRAND_MARQUEE.brands,
    });

    setPromoBanner(lastSavedData.promoBanner || DEFAULT_PROMO_BANNER);
    setStats(
      lastSavedData.stats && lastSavedData.stats.length > 0
        ? lastSavedData.stats
        : DEFAULT_STATS
    );
    setWhyBuy(
      lastSavedData.whyBuyFromUs && lastSavedData.whyBuyFromUs.length > 0
        ? lastSavedData.whyBuyFromUs
        : (lastSavedData.whyBuy && lastSavedData.whyBuy.length > 0
          ? lastSavedData.whyBuy
          : DEFAULT_WHY_BUY)
    );
    setTestimonials(
      lastSavedData.testimonials && lastSavedData.testimonials.length > 0
        ? lastSavedData.testimonials
        : DEFAULT_TESTIMONIALS
    );
    setFaqs(
      lastSavedData.faqs && lastSavedData.faqs.length > 0
        ? lastSavedData.faqs
        : DEFAULT_FAQS
    );
    setHeaderConfig(lastSavedData.headerConfig || DEFAULT_HEADER_CONFIG);
    setFooterConfig(lastSavedData.footerConfig || DEFAULT_FOOTER_CONFIG);

    setErrors({});
    addToast("info", "Changes Reverted", "All fields have been reset to the last saved state.");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Validate all URLs before saving
    const validationErrors = validateAllUrls();
    const errorCount = Object.keys(validationErrors).length;

    if (errorCount > 0) {
      addToast(
        "error",
        "404 Error: Non-Existent Page Links",
        `Found ${errorCount} invalid or 404 URL(s). Highlighted in red below. You can fix them or click 'Reset Last Changes'.`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSaving(true);

    try {
      const payload: HomepageData = {
        promoTicker,
        promoTickerUrl,
        promoTickerActive,
        mainframeHero,
        heroSlides,
        categoryShowcases,
        stickyShowcase,
        brandMarquee,
        promoBanner,
        stats,
        whyBuyFromUs: whyBuy,
        whyBuy,
        testimonials,
        faqs,
        headerConfig,
        footerConfig,
      };

      const res = await saveHomepageConfigAction(payload);

      if (res.success) {
        setLastSavedData(payload);
        setErrors({});
        addToast("success", "Homepage Updated", "All homepage, header, and footer sections saved successfully!");
        router.refresh();
      } else {
        addToast("error", "Save Failed", res.error || "Failed to update homepage settings.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const sectionsNav = [
    { id: "ticker", label: "1. Announcement Bar", icon: Megaphone },
    { id: "mainframe", label: "2. Mainframe Hero", icon: Sparkles },
    { id: "hero-slider", label: "3. Full-Width Slider", icon: Layers },
    { id: "showcases", label: "4. Category Showcases", icon: LayoutTemplate },
    { id: "sticky-showcase", label: "5. Sticky Showcase", icon: Compass },
    { id: "brand-marquee", label: "6. OEM Brand Partners", icon: ShieldCheck },
    { id: "promo-banner", label: "7. Volume Banner", icon: Sparkles },
    { id: "stats", label: "8. Metrics & Stats", icon: BarChart3 },
    { id: "why-buy", label: "9. Why Choose Us", icon: ShieldCheck },
    { id: "testimonials", label: "10. Testimonials", icon: MessageSquare },
    { id: "faqs", label: "11. Support FAQs", icon: HelpCircle },
    { id: "header-config", label: "12. Header Nav", icon: LinkIcon },
    { id: "footer-config", label: "13. Footer & Catalog", icon: LayoutTemplate },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-6xl pb-20">
      {/* Top Header & Sticky Save Bar */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-5 h-5 text-sky-500" />
            Homepage & Navigation CMS
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Directly customize texts, images, buttons, and URLs for all homepage sections, header, and footer.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
          >
            <span>Live Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            type="button"
            onClick={handleResetToLastSaved}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 border border-transparent hover:border-rose-300 dark:hover:border-rose-800"
            title="Revert all unsaved changes back to last saved state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Last Changes</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50 shrink-0"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? "Saving..." : "Save All Changes"}</span>
          </button>
        </div>
      </div>

      {/* Top 404 URL Error Banner */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/80 border-2 border-rose-500/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-900 dark:text-rose-200 shadow-md animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-rose-500/15 rounded-xl text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-950 dark:text-rose-100 flex items-center gap-2">
                <span>{Object.keys(errors).length} Page Link Error{Object.keys(errors).length > 1 ? "s" : ""} (404 Non-Existent Routes)</span>
              </h3>
              <p className="text-xs text-rose-800 dark:text-rose-300 mt-0.5">
                Some links or buttons point to pages that do not exist. We marked them in red below with an error tag. You can fix them directly or click &quot;Reset Last Changes&quot; to restore previous state.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleResetToLastSaved}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Last Changes</span>
          </button>
        </div>
      )}

      {/* Quick Jump Navigation Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {sectionsNav.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <a
              key={sec.id}
              href={`#${sec.id}`}
              onClick={() => setActiveSection(sec.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                isActive
                  ? "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </a>
          );
        })}
      </div>

      {/* SECTION 1: Top Announcement Bar & Ticker */}
      <section
        id="ticker"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              1. Top Promotional Announcement Bar & Ticker
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={promoTickerActive}
                onChange={(e) => setPromoTickerActive(e.target.checked)}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Active on Storefront</span>
            </label>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-8 space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Ticker Announcement Text
            </label>
            <input
              type="text"
              value={promoTicker}
              onChange={(e) => setPromoTicker(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-sky-500 font-mono"
              placeholder="🎁 BUY ANY 2 PRODUCTS & GET 1 PREMIUM GOGGLE FREE • FREE SHIPPING • CASH ON DELIVERY"
            />
          </div>

          <div className="md:col-span-4 space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Direct Link URL
            </label>
            <input
              type="text"
              value={promoTickerUrl}
              onChange={(e) => {
                setPromoTickerUrl(e.target.value);
                if (errors["promoTickerUrl"]) {
                  const copy = { ...errors };
                  delete copy["promoTickerUrl"];
                  setErrors(copy);
                }
              }}
              className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none font-mono transition-colors ${
                errors["promoTickerUrl"]
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
              }`}
              placeholder="/products or /quote"
            />
            {errors["promoTickerUrl"] && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors["promoTickerUrl"]}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 2: Mainframe Hero Section */}
      <section
        id="mainframe"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-5"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              2. Mainframe Hero Section (Typewriter, Video, Actions & Pills)
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-slate-500 hidden sm:inline">Top visual hero</span>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Eyebrow Badge Text
            </label>
            <input
              type="text"
              value={mainframeHero.eyebrow}
              onChange={(e) => setMainframeHero({ ...mainframeHero, eyebrow: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Subheading / Subtitle
            </label>
            <input
              type="text"
              value={mainframeHero.subheading || ""}
              onChange={(e) => setMainframeHero({ ...mainframeHero, subheading: e.target.value })}
              placeholder="High-Precision Sensors, PLCs & Factory Drives"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Main Video MP4 URL
          </label>
          <input
            type="text"
            value={mainframeHero.videoUrl}
            onChange={(e) => setMainframeHero({ ...mainframeHero, videoUrl: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            Headline & Typewriter Copy
          </label>
          <textarea
            rows={2}
            value={mainframeHero.headline}
            onChange={(e) => setMainframeHero({ ...mainframeHero, headline: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Primary CTA Button Text
            </label>
            <input
              type="text"
              value={mainframeHero.ctaText}
              onChange={(e) => setMainframeHero({ ...mainframeHero, ctaText: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Primary CTA Link URL
            </label>
            <input
              type="text"
              value={mainframeHero.ctaUrl}
              onChange={(e) => {
                setMainframeHero({ ...mainframeHero, ctaUrl: e.target.value });
                if (errors["mainframeHero.ctaUrl"]) {
                  const copy = { ...errors };
                  delete copy["mainframeHero.ctaUrl"];
                  setErrors(copy);
                }
              }}
              className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-mono transition-colors ${
                errors["mainframeHero.ctaUrl"]
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
              }`}
            />
            {errors["mainframeHero.ctaUrl"] && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors["mainframeHero.ctaUrl"]}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Reach Sales Callout Label
            </label>
            <input
              type="text"
              value={mainframeHero.salesEmailText || ""}
              onChange={(e) => setMainframeHero({ ...mainframeHero, salesEmailText: e.target.value })}
              placeholder="Reach Sales:"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Sales Email Address (Copy to Clipboard)
            </label>
            <input
              type="text"
              value={mainframeHero.salesEmail || ""}
              onChange={(e) => setMainframeHero({ ...mainframeHero, salesEmail: e.target.value })}
              placeholder="omautomation2012@gmail.com"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
            />
          </div>
        </div>

        {/* Hero Navigation & Pill Buttons with Drag and Drop */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Mainframe Direct Pill Action Links
              </label>
              <p className="text-[10px] text-slate-500">
                Drag handles <GripVertical className="w-3 h-3 inline text-slate-400" /> or use arrows to change button sequence
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setMainframeHero({
                  ...mainframeHero,
                  navPills: [...(mainframeHero.navPills || []), { label: "New Link", url: "/products" }],
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Pill Link</span>
            </button>
          </div>

          <div className="space-y-2">
            {(mainframeHero.navPills || []).map((pill, pIdx) => {
              const isDragging = draggedPillIdx === pIdx;
              const hasErr = !!errors[`mainframeHero.navPills.${pIdx}`];
              return (
                <div
                  key={pIdx}
                  draggable
                  onDragStart={(e) => handlePillDragStart(e, pIdx)}
                  onDragOver={handlePillDragOver}
                  onDrop={(e) => handlePillDrop(e, pIdx)}
                  onDragEnd={handlePillDragEnd}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border transition-all ${
                    isDragging
                      ? "opacity-50 border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/50 dark:bg-sky-950/30"
                      : hasErr
                      ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                      title="Drag and drop to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                      {pIdx + 1}
                    </span>

                    <input
                      type="text"
                      value={pill.label}
                      onChange={(e) => {
                        const copy = [...(mainframeHero.navPills || [])];
                        copy[pIdx].label = e.target.value;
                        setMainframeHero({ ...mainframeHero, navPills: copy });
                      }}
                      placeholder="Label (e.g. Sensors)"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-sky-500"
                    />

                    <div className="flex-1 space-y-0.5">
                      <input
                        type="text"
                        value={pill.url}
                        onChange={(e) => {
                          const copy = [...(mainframeHero.navPills || [])];
                          copy[pIdx].url = e.target.value;
                          setMainframeHero({ ...mainframeHero, navPills: copy });
                          if (errors[`mainframeHero.navPills.${pIdx}`]) {
                            const errCopy = { ...errors };
                            delete errCopy[`mainframeHero.navPills.${pIdx}`];
                            setErrors(errCopy);
                          }
                        }}
                        placeholder="URL (e.g. /products)"
                        className={`w-full bg-white dark:bg-slate-900 border rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 focus:outline-none font-mono transition-colors ${
                          hasErr
                            ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                            : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
                        }`}
                      />
                      {hasErr && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors[`mainframeHero.navPills.${pIdx}`]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reorder Arrows & Delete */}
                  <div className="flex items-center justify-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMovePill(pIdx, "up")}
                      disabled={pIdx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMovePill(pIdx, "down")}
                      disabled={pIdx === (mainframeHero.navPills || []).length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (mainframeHero.navPills || []).filter((_, i) => i !== pIdx);
                        setMainframeHero({ ...mainframeHero, navPills: copy });
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors shrink-0"
                      title="Delete Pill"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 3: Full-Width Hero Slider */}
      <section
        id="hero-slider"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              3. Full-Width Premium Hero Image Slider
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddSlide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Slide</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {heroSlides.map((slide, idx) => (
            <div
              key={slide.id || idx}
              draggable
              onDragStart={(e) => handleSlideDragStart(e, idx)}
              onDragOver={handleSlideDragOver}
              onDrop={(e) => handleSlideDrop(e, idx)}
              onDragEnd={handleSlideDragEnd}
              className={`bg-slate-50/70 dark:bg-slate-950/60 border rounded-xl p-4 space-y-3.5 transition-all ${
                draggedSlideIdx === idx
                  ? "opacity-50 border-sky-500 ring-2 ring-sky-500/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <div className="flex items-center gap-2">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Drag and drop to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="w-5 h-5 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-400 text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    Slide #{idx + 1}: {slide.title || "Untitled"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium mr-2">
                    <input
                      type="checkbox"
                      checked={slide.isActive}
                      onChange={(e) => handleSlideChange(idx, "isActive", e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                    />
                    <span>Active</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleMoveSlide(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveSlide(idx, "down")}
                    disabled={idx === heroSlides.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSlide(idx)}
                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                    title="Delete Slide"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Slide Images Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Desktop Image */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Desktop Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slide.desktopImage}
                      onChange={(e) => handleSlideChange(idx, "desktopImage", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveMediaTarget({ target: "slideDesktop", index: idx })}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <ImageIcon className="w-3 h-3 text-sky-500" />
                      <span>Pick</span>
                    </button>
                  </div>
                  {slide.desktopImage && (
                    <div className="h-20 w-full rounded border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
                      <img src={slide.desktopImage} alt="Desktop Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                {/* Mobile Image */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Mobile Image URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={slide.mobileImage}
                      onChange={(e) => handleSlideChange(idx, "mobileImage", e.target.value)}
                      placeholder="https://..."
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setActiveMediaTarget({ target: "slideMobile", index: idx })}
                      className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
                    >
                      <ImageIcon className="w-3 h-3 text-sky-500" />
                      <span>Pick</span>
                    </button>
                  </div>
                  {slide.mobileImage && (
                    <div className="h-20 w-full rounded border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
                      <img src={slide.mobileImage} alt="Mobile Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              {/* Title, Subtitle, CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Title</label>
                  <input
                    type="text"
                    value={slide.title}
                    onChange={(e) => handleSlideChange(idx, "title", e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Subtitle</label>
                  <input
                    type="text"
                    value={slide.subtitle}
                    onChange={(e) => handleSlideChange(idx, "subtitle", e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Button Text</label>
                  <input
                    type="text"
                    value={slide.ctaText}
                    onChange={(e) => handleSlideChange(idx, "ctaText", e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-slate-500">Button Direct URL</label>
                  <input
                    type="text"
                    value={slide.ctaUrl}
                    onChange={(e) => {
                      handleSlideChange(idx, "ctaUrl", e.target.value);
                      if (errors[`heroSlides.${idx}.ctaUrl`]) {
                        const copy = { ...errors };
                        delete copy[`heroSlides.${idx}.ctaUrl`];
                        setErrors(copy);
                      }
                    }}
                    className={`w-full bg-white dark:bg-slate-900 border rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono transition-colors ${
                      errors[`heroSlides.${idx}.ctaUrl`]
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  {errors[`heroSlides.${idx}.ctaUrl`] && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors[`heroSlides.${idx}.ctaUrl`]}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: Category Product Showcases */}
      <section
        id="showcases"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-5"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              4. Category Product Showcases (Side-by-Side Banners & Product Rails)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddShowcase}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Showcase</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {categoryShowcases.map((showcase, idx) => (
            <div
              key={showcase.id || idx}
              draggable
              onDragStart={(e) => handleShowcaseDragStart(e, idx)}
              onDragOver={handleShowcaseDragOver}
              onDrop={(e) => handleShowcaseDrop(e, idx)}
              onDragEnd={handleShowcaseDragEnd}
              className={`bg-slate-50/70 dark:bg-slate-950/60 border rounded-xl p-4 space-y-3.5 transition-all ${
                draggedShowcaseIdx === idx
                  ? "opacity-50 border-purple-500 ring-2 ring-purple-500/20"
                  : "border-slate-200 dark:border-slate-800"
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <div
                    className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    title="Drag and drop to reorder"
                  >
                    <GripVertical className="w-4 h-4" />
                  </div>
                  <span className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-400 text-[11px] font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  Showcase #{idx + 1}: {showcase.customTitle || "Category Showcase"}
                </span>

                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 dark:text-slate-300 font-medium mr-2">
                    <input
                      type="checkbox"
                      checked={showcase.isActive}
                      onChange={(e) => handleShowcaseChange(idx, "isActive", e.target.checked)}
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                    />
                    <span>Active</span>
                  </label>

                  <button
                    type="button"
                    onClick={() => handleMoveShowcase(idx, "up")}
                    disabled={idx === 0}
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMoveShowcase(idx, "down")}
                    disabled={idx === categoryShowcases.length - 1}
                    className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteShowcase(idx)}
                    className="p-1 text-rose-500 hover:bg-rose-500/10 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Category Header Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Linked Catalog Category
                  </label>
                  <select
                    value={showcase.categoryId}
                    onChange={(e) => handleShowcaseChange(idx, "categoryId", e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  >
                    <option value="">Select a Category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} ({cat.slug})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Eyebrow Text (Top)
                  </label>
                  <input
                    type="text"
                    value={showcase.eyebrow || ""}
                    onChange={(e) => handleShowcaseChange(idx, "eyebrow", e.target.value)}
                    placeholder="Explore Collection"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Section Display Title
                  </label>
                  <input
                    type="text"
                    value={showcase.customTitle || ""}
                    onChange={(e) => handleShowcaseChange(idx, "customTitle", e.target.value)}
                    placeholder="Sensors & Perception"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    View All Text
                  </label>
                  <input
                    type="text"
                    value={showcase.viewAllText || ""}
                    onChange={(e) => handleShowcaseChange(idx, "viewAllText", e.target.value)}
                    placeholder="View All"
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    View All URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={showcase.viewAllUrl || ""}
                    onChange={(e) => {
                      handleShowcaseChange(idx, "viewAllUrl", e.target.value);
                      if (errors[`categoryShowcases.${idx}.viewAllUrl`]) {
                        const copy = { ...errors };
                        delete copy[`categoryShowcases.${idx}.viewAllUrl`];
                        setErrors(copy);
                      }
                    }}
                    placeholder="Auto: /category/:slug"
                    className={`w-full bg-white dark:bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono transition-colors ${
                      errors[`categoryShowcases.${idx}.viewAllUrl`]
                        ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                        : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
                    }`}
                  />
                  {errors[`categoryShowcases.${idx}.viewAllUrl`] && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors[`categoryShowcases.${idx}.viewAllUrl`]}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hero Banner Box Settings */}
              <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                    Hero Banner Overlay & Background Settings
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">Banner Badge (Yellow Tag)</label>
                    <input
                      type="text"
                      value={showcase.bannerBadge || ""}
                      onChange={(e) => handleShowcaseChange(idx, "bannerBadge", e.target.value)}
                      placeholder="Featured Category"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">Banner Headline Title</label>
                    <input
                      type="text"
                      value={showcase.bannerTitle || ""}
                      onChange={(e) => handleShowcaseChange(idx, "bannerTitle", e.target.value)}
                      placeholder="Sensors & Perception"
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-semibold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">Banner Hero Image</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={showcase.heroImage || ""}
                        onChange={(e) => handleShowcaseChange(idx, "heroImage", e.target.value)}
                        placeholder="https://..."
                        className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setActiveMediaTarget({ target: "showcaseHero", index: idx })}
                        className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 rounded text-xs font-semibold flex items-center gap-1 shrink-0"
                      >
                        <ImageIcon className="w-3 h-3 text-purple-500" />
                        <span>Pick</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500">Banner Description Paragraph</label>
                  <textarea
                    rows={2}
                    value={showcase.bannerDescription || ""}
                    onChange={(e) => handleShowcaseChange(idx, "bannerDescription", e.target.value)}
                    placeholder="Browse our certified, high-performance line of Sensors & Perception hardware components."
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                {showcase.heroImage && (
                  <div className="relative h-20 w-full rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden bg-slate-950">
                    <img src={showcase.heroImage} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-transparent flex items-center px-4">
                      <div className="text-white space-y-0.5">
                        <span className="bg-amber-400 text-slate-950 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {showcase.bannerBadge || "Featured Category"}
                        </span>
                        <div className="text-xs font-bold">{showcase.bannerTitle || showcase.customTitle || "Banner Title"}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: Sticky Product Showcase */}
      <section
        id="sticky-showcase"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              5. Sticky Product Feature Showcase
            </h2>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            title="Save All Homepage Settings"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Badge Eyebrow
            </label>
            <input
              type="text"
              value={stickyShowcase.eyebrow}
              onChange={(e) => setStickyShowcase({ ...stickyShowcase, eyebrow: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Headline Title
            </label>
            <input
              type="text"
              value={stickyShowcase.title}
              onChange={(e) => setStickyShowcase({ ...stickyShowcase, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Feature Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={stickyShowcase.image}
                onChange={(e) => setStickyShowcase({ ...stickyShowcase, image: e.target.value })}
                className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
              <button
                type="button"
                onClick={() => setActiveMediaTarget({ target: "stickyImage" })}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 shrink-0"
              >
                <ImageIcon className="w-3 h-3 text-blue-500" />
                <span>Pick</span>
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
            Description
          </label>
          <textarea
            rows={2}
            value={stickyShowcase.description}
            onChange={(e) => setStickyShowcase({ ...stickyShowcase, description: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              CTA Button Text
            </label>
            <input
              type="text"
              value={stickyShowcase.ctaText}
              onChange={(e) => setStickyShowcase({ ...stickyShowcase, ctaText: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              CTA Button URL
            </label>
            <input
              type="text"
              value={stickyShowcase.ctaUrl}
              onChange={(e) => {
                setStickyShowcase({ ...stickyShowcase, ctaUrl: e.target.value });
                if (errors["stickyShowcase.ctaUrl"]) {
                  const copy = { ...errors };
                  delete copy["stickyShowcase.ctaUrl"];
                  setErrors(copy);
                }
              }}
              className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono transition-colors ${
                errors["stickyShowcase.ctaUrl"]
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
              }`}
            />
            {errors["stickyShowcase.ctaUrl"] && (
              <div className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 mt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errors["stickyShowcase.ctaUrl"]}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6: Authorized OEM Brand Distribution Partners (Brand Marquee) */}
      <section
        id="brand-marquee"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              6. Authorized OEM Brand Distribution Partners (Brand Marquee)
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={brandMarquee.isActive}
                onChange={(e) => setBrandMarquee({ ...brandMarquee, isActive: e.target.checked })}
                className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span>Active on Storefront</span>
            </label>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Marquee Eyebrow Header
            </label>
            <input
              type="text"
              value={brandMarquee.eyebrow}
              onChange={(e) => setBrandMarquee({ ...brandMarquee, eyebrow: e.target.value })}
              placeholder="Authorized OEM Brand Distribution Partners"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Disclaimer / Reference Note (Right)
            </label>
            <input
              type="text"
              value={brandMarquee.note || ""}
              onChange={(e) => setBrandMarquee({ ...brandMarquee, note: e.target.value })}
              placeholder="[Placeholder brand names marked for official licensing reference]"
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>
        </div>

        {/* Brand Items List with Drag & Drop */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Brand Partner Badges & Navigation Links
              </label>
              <p className="text-[10px] text-slate-500">
                Drag handles <GripVertical className="w-3 h-3 inline text-slate-400" /> or use arrows to reorder brands in the ticker
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddBrand}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/60 text-[11px] font-semibold transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Brand</span>
            </button>
          </div>

          <div className="space-y-2">
            {(brandMarquee.brands || []).map((brand, bIdx) => {
              const isDragging = draggedBrandIndex === bIdx;
              const hasErr = !!errors[`brandMarquee.brands.${bIdx}.url`];
              return (
                <div
                  key={brand.id || bIdx}
                  draggable
                  onDragStart={(e) => handleBrandDragStart(e, bIdx)}
                  onDragOver={handleBrandDragOver}
                  onDrop={(e) => handleBrandDrop(e, bIdx)}
                  onDragEnd={handleBrandDragEnd}
                  className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-lg border transition-all ${
                    isDragging
                      ? "opacity-50 border-sky-500 ring-2 ring-sky-500/20 bg-sky-50/50 dark:bg-sky-950/30"
                      : hasErr
                      ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1">
                    <div
                      className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors shrink-0"
                      title="Drag and drop to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    <span className="text-[11px] font-mono font-bold text-slate-400 w-5 text-center shrink-0">
                      {bIdx + 1}
                    </span>

                    <input
                      type="text"
                      value={brand.name}
                      onChange={(e) => handleBrandChange(bIdx, "name", e.target.value)}
                      placeholder="Brand Name (e.g. SIEMENS)"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold uppercase"
                    />

                    <input
                      type="text"
                      value={brand.country || ""}
                      onChange={(e) => handleBrandChange(bIdx, "country", e.target.value)}
                      placeholder="Country / Tag (e.g. Germany)"
                      className="w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100"
                    />

                    <div className="flex-1 space-y-0.5">
                      <input
                        type="text"
                        value={brand.url || ""}
                        onChange={(e) => {
                          handleBrandChange(bIdx, "url", e.target.value);
                          if (errors[`brandMarquee.brands.${bIdx}.url`]) {
                            const errCopy = { ...errors };
                            delete errCopy[`brandMarquee.brands.${bIdx}.url`];
                            setErrors(errCopy);
                          }
                        }}
                        placeholder="Link URL (e.g. /products?brand=siemens)"
                        className={`w-full bg-white dark:bg-slate-900 border rounded px-2.5 py-1.5 text-xs font-mono transition-colors ${
                          hasErr
                            ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                            : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
                        }`}
                      />
                      {hasErr && (
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>{errors[`brandMarquee.brands.${bIdx}.url`]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Reorder Arrows & Delete */}
                  <div className="flex items-center justify-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveBrand(bIdx, "up")}
                      disabled={bIdx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveBrand(bIdx, "down")}
                      disabled={bIdx === (brandMarquee.brands || []).length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 rounded"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(bIdx)}
                      className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded transition-colors shrink-0"
                      title="Delete Brand"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Marquee Preview */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>LIVE TICKER PREVIEW</span>
            <span>{brandMarquee.brands?.length || 0} Brands Active</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {(brandMarquee.brands || []).map((brand, bIdx) => (
              <div
                key={bIdx}
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs whitespace-nowrap shrink-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" />
                <span className="font-mono font-bold">{brand.name}</span>
                {brand.country && (
                  <span className="text-[9px] font-mono text-slate-500">({brand.country})</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7: Volume Procurement Promo Banner */}
      <section
        id="promo-banner"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              7. Promotional Volume Procurement Banner
            </h2>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            title="Save All Homepage Settings"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Badge Tag
            </label>
            <input
              type="text"
              value={promoBanner.badge}
              onChange={(e) => setPromoBanner({ ...promoBanner, badge: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Banner Headline
            </label>
            <input
              type="text"
              value={promoBanner.title}
              onChange={(e) => setPromoBanner({ ...promoBanner, title: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
            Description Paragraph
          </label>
          <textarea
            rows={2}
            value={promoBanner.description}
            onChange={(e) => setPromoBanner({ ...promoBanner, description: e.target.value })}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500">Primary CTA Text</label>
            <input
              type="text"
              value={promoBanner.primaryCtaText}
              onChange={(e) => setPromoBanner({ ...promoBanner, primaryCtaText: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500">Primary CTA URL</label>
            <input
              type="text"
              value={promoBanner.primaryCtaUrl}
              onChange={(e) => {
                setPromoBanner({ ...promoBanner, primaryCtaUrl: e.target.value });
                if (errors["promoBanner.primaryCtaUrl"]) {
                  const copy = { ...errors };
                  delete copy["promoBanner.primaryCtaUrl"];
                  setErrors(copy);
                }
              }}
              className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 font-mono transition-colors ${
                errors["promoBanner.primaryCtaUrl"]
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
              }`}
            />
            {errors["promoBanner.primaryCtaUrl"] && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors["promoBanner.primaryCtaUrl"]}</span>
              </div>
            )}
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500">Secondary CTA Text</label>
            <input
              type="text"
              value={promoBanner.secondaryCtaText}
              onChange={(e) => setPromoBanner({ ...promoBanner, secondaryCtaText: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-slate-500">Secondary CTA URL</label>
            <input
              type="text"
              value={promoBanner.secondaryCtaUrl}
              onChange={(e) => {
                setPromoBanner({ ...promoBanner, secondaryCtaUrl: e.target.value });
                if (errors["promoBanner.secondaryCtaUrl"]) {
                  const copy = { ...errors };
                  delete copy["promoBanner.secondaryCtaUrl"];
                  setErrors(copy);
                }
              }}
              className={`w-full bg-slate-50 dark:bg-slate-950 border rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 font-mono transition-colors ${
                errors["promoBanner.secondaryCtaUrl"]
                  ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20"
                  : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
              }`}
            />
            {errors["promoBanner.secondaryCtaUrl"] && (
              <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors["promoBanner.secondaryCtaUrl"]}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 8: Key Metrics & Statistics */}
      <section
        id="stats"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              8. Key Metrics & Industry Statistics Cards
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setStats([
                  ...stats,
                  { id: `stat-${Date.now()}`, value: "100%", label: "Metric Label", detail: "Metric description" },
                ])
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Metric</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((st, sIdx) => (
            <div
              key={st.id || sIdx}
              className="bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Stat #{sIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => setStats(stats.filter((_, i) => i !== sIdx))}
                  className="text-rose-500 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={st.value}
                onChange={(e) => {
                  const copy = [...stats];
                  copy[sIdx].value = e.target.value;
                  setStats(copy);
                }}
                placeholder="Value (e.g. 2,000+)"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
              />
              <input
                type="text"
                value={st.label}
                onChange={(e) => {
                  const copy = [...stats];
                  copy[sIdx].label = e.target.value;
                  setStats(copy);
                }}
                placeholder="Label (e.g. Components)"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-100"
              />
              <input
                type="text"
                value={st.detail}
                onChange={(e) => {
                  const copy = [...stats];
                  copy[sIdx].detail = e.target.value;
                  setStats(copy);
                }}
                placeholder="Detail note"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-[11px] text-slate-500"
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 9: Why Buy From Us */}
      <section
        id="why-buy"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              9. Why Choose Us (Value Proposition Cards)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setWhyBuy([
                  ...whyBuy,
                  { id: `why-${Date.now()}`, title: "New Guarantee", description: "Guarantee description." },
                ])
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Value Card</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {whyBuy.map((item, wIdx) => (
            <div
              key={item.id || wIdx}
              className="bg-slate-50 dark:bg-slate-950 p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Feature #{wIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => setWhyBuy(whyBuy.filter((_, i) => i !== wIdx))}
                  className="text-rose-500 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={item.title}
                onChange={(e) => {
                  const copy = [...whyBuy];
                  copy[wIdx].title = e.target.value;
                  setWhyBuy(copy);
                }}
                placeholder="Title"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs font-bold text-slate-900 dark:text-white"
              />
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => {
                  const copy = [...whyBuy];
                  copy[wIdx].description = e.target.value;
                  setWhyBuy(copy);
                }}
                placeholder="Description"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 10: Reviews & Testimonials */}
      <section
        id="testimonials"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              10. Customer Reviews & Industry Testimonials
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setTestimonials([
                  ...testimonials,
                  {
                    id: `test-${Date.now()}`,
                    author: "New Reviewer",
                    role: "Plant Engineer, Tech Corp",
                    quote: "Outstanding product quality and dispatch.",
                    rating: 5,
                  },
                ])
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Review</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testimonials.map((rev, rIdx) => (
            <div
              key={rev.id || rIdx}
              className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Review #{rIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => setTestimonials(testimonials.filter((_, i) => i !== rIdx))}
                  className="text-rose-500 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <textarea
                rows={3}
                value={rev.quote}
                onChange={(e) => {
                  const copy = [...testimonials];
                  copy[rIdx].quote = e.target.value;
                  setTestimonials(copy);
                }}
                placeholder="Review Quote"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs text-slate-800 dark:text-slate-200"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={rev.author}
                  onChange={(e) => {
                    const copy = [...testimonials];
                    copy[rIdx].author = e.target.value;
                    setTestimonials(copy);
                  }}
                  placeholder="Author Name"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                />
                <input
                  type="text"
                  value={rev.role}
                  onChange={(e) => {
                    const copy = [...testimonials];
                    copy[rIdx].role = e.target.value;
                    setTestimonials(copy);
                  }}
                  placeholder="Role & Company"
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 11: Frequently Asked Questions (FAQs) */}
      <section
        id="faqs"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              11. Frequently Asked Questions (FAQs)
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setFaqs([
                  ...faqs,
                  { id: `faq-${Date.now()}`, question: "New FAQ Question?", answer: "Detailed answer goes here." },
                ])
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add FAQ</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, fIdx) => (
            <div
              key={faq.id || fIdx}
              className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2.5 relative"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">FAQ #{fIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => setFaqs(faqs.filter((_, i) => i !== fIdx))}
                  className="text-rose-500 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <input
                type="text"
                value={faq.question}
                onChange={(e) => {
                  const copy = [...faqs];
                  copy[fIdx].question = e.target.value;
                  setFaqs(copy);
                }}
                placeholder="Question"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs font-semibold text-slate-900 dark:text-white"
              />
              <textarea
                rows={2}
                value={faq.answer}
                onChange={(e) => {
                  const copy = [...faqs];
                  copy[fIdx].answer = e.target.value;
                  setFaqs(copy);
                }}
                placeholder="Answer"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded p-2 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 12: Header Nav & Contacts */}
      <section
        id="header-config"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              12. Header Navigation & Quick Contacts
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setHeaderConfig({
                  ...headerConfig,
                  navLinks: [...(headerConfig.navLinks || []), { label: "New Link", url: "/products" }],
                })
              }
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Header Nav Link</span>
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
              title="Save All Homepage Settings"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Support Phone
            </label>
            <input
              type="text"
              value={headerConfig.supportPhone}
              onChange={(e) => setHeaderConfig({ ...headerConfig, supportPhone: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
              Support Email
            </label>
            <input
              type="text"
              value={headerConfig.supportEmail}
              onChange={(e) => setHeaderConfig({ ...headerConfig, supportEmail: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 text-xs font-mono"
            />
          </div>
        </div>

        {/* Nav Links */}
        <div className="space-y-2 pt-1">
          <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-400">
            Header Main Navigation Links
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(headerConfig.navLinks || []).map((lnk, lIdx) => {
              const hasErr = !!errors[`headerConfig.navLinks.${lIdx}`];
              return (
                <div
                  key={lIdx}
                  className={`flex flex-col gap-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border transition-colors ${
                    hasErr ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={lnk.label}
                      onChange={(e) => {
                        const copy = [...(headerConfig.navLinks || [])];
                        copy[lIdx].label = e.target.value;
                        setHeaderConfig({ ...headerConfig, navLinks: copy });
                      }}
                      placeholder="Label"
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      value={lnk.url}
                      onChange={(e) => {
                        const copy = [...(headerConfig.navLinks || [])];
                        copy[lIdx].url = e.target.value;
                        setHeaderConfig({ ...headerConfig, navLinks: copy });
                        if (errors[`headerConfig.navLinks.${lIdx}`]) {
                          const errCopy = { ...errors };
                          delete errCopy[`headerConfig.navLinks.${lIdx}`];
                          setErrors(errCopy);
                        }
                      }}
                      placeholder="URL (e.g. /products)"
                      className={`flex-1 bg-white dark:bg-slate-900 border rounded px-2 py-1 text-xs font-mono transition-colors ${
                        hasErr ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (headerConfig.navLinks || []).filter((_, i) => i !== lIdx);
                        setHeaderConfig({ ...headerConfig, navLinks: copy });
                      }}
                      className="text-rose-500 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {hasErr && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors[`headerConfig.navLinks.${lIdx}`]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 13: Footer & Catalog Callout */}
      <section
        id="footer-config"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-2xs space-y-5"
      >
        <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700 dark:bg-slate-300" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              13. Footer Configuration & Catalog Download Box
            </h2>
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
            title="Save All Homepage Settings"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save"}</span>
          </button>
        </div>

        {/* Catalog Download Box */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Catalog Download Callout Box
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500">Badge</label>
              <input
                type="text"
                value={footerConfig.catalogBadge}
                onChange={(e) => setFooterConfig({ ...footerConfig, catalogBadge: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500">Title</label>
              <input
                type="text"
                value={footerConfig.catalogTitle}
                onChange={(e) => setFooterConfig({ ...footerConfig, catalogTitle: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs"
              />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">Description</label>
            <textarea
              rows={2}
              value={footerConfig.catalogDesc}
              onChange={(e) => setFooterConfig({ ...footerConfig, catalogDesc: e.target.value })}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500">Button Text</label>
              <input
                type="text"
                value={footerConfig.catalogCtaText}
                onChange={(e) => setFooterConfig({ ...footerConfig, catalogCtaText: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500">Download Link URL</label>
              <input
                type="text"
                value={footerConfig.catalogCtaUrl}
                onChange={(e) => setFooterConfig({ ...footerConfig, catalogCtaUrl: e.target.value })}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Useful & Help Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Useful Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">Useful Links</label>
              <button
                type="button"
                onClick={() =>
                  setFooterConfig({
                    ...footerConfig,
                    usefulLinks: [...(footerConfig.usefulLinks || []), { label: "New Link", url: "/" }],
                  })
                }
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold"
              >
                + Add Link
              </button>
            </div>
            {(footerConfig.usefulLinks || []).map((lnk, idx) => {
              const hasErr = !!errors[`footerConfig.usefulLinks.${idx}`];
              return (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border transition-colors ${
                    hasErr ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={lnk.label}
                      onChange={(e) => {
                        const copy = [...(footerConfig.usefulLinks || [])];
                        copy[idx].label = e.target.value;
                        setFooterConfig({ ...footerConfig, usefulLinks: copy });
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      value={lnk.url}
                      onChange={(e) => {
                        const copy = [...(footerConfig.usefulLinks || [])];
                        copy[idx].url = e.target.value;
                        setFooterConfig({ ...footerConfig, usefulLinks: copy });
                        if (errors[`footerConfig.usefulLinks.${idx}`]) {
                          const errCopy = { ...errors };
                          delete errCopy[`footerConfig.usefulLinks.${idx}`];
                          setErrors(errCopy);
                        }
                      }}
                      className={`flex-1 bg-white dark:bg-slate-900 border rounded px-2 py-1 text-xs font-mono transition-colors ${
                        hasErr ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (footerConfig.usefulLinks || []).filter((_, i) => i !== idx);
                        setFooterConfig({ ...footerConfig, usefulLinks: copy });
                      }}
                      className="text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {hasErr && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors[`footerConfig.usefulLinks.${idx}`]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Help Links */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-900 dark:text-white">Help & Policy Links</label>
              <button
                type="button"
                onClick={() =>
                  setFooterConfig({
                    ...footerConfig,
                    helpLinks: [...(footerConfig.helpLinks || []), { label: "New Link", url: "/" }],
                  })
                }
                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold"
              >
                + Add Link
              </button>
            </div>
            {(footerConfig.helpLinks || []).map((lnk, idx) => {
              const hasErr = !!errors[`footerConfig.helpLinks.${idx}`];
              return (
                <div
                  key={idx}
                  className={`flex flex-col gap-1 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border transition-colors ${
                    hasErr ? "border-rose-500 bg-rose-50/30 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={lnk.label}
                      onChange={(e) => {
                        const copy = [...(footerConfig.helpLinks || [])];
                        copy[idx].label = e.target.value;
                        setFooterConfig({ ...footerConfig, helpLinks: copy });
                      }}
                      className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs"
                    />
                    <input
                      type="text"
                      value={lnk.url}
                      onChange={(e) => {
                        const copy = [...(footerConfig.helpLinks || [])];
                        copy[idx].url = e.target.value;
                        setFooterConfig({ ...footerConfig, helpLinks: copy });
                        if (errors[`footerConfig.helpLinks.${idx}`]) {
                          const errCopy = { ...errors };
                          delete errCopy[`footerConfig.helpLinks.${idx}`];
                          setErrors(errCopy);
                        }
                      }}
                      className={`flex-1 bg-white dark:bg-slate-900 border rounded px-2 py-1 text-xs font-mono transition-colors ${
                        hasErr ? "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/40 dark:bg-rose-950/20" : "border-slate-200 dark:border-slate-800 focus:border-sky-500"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = (footerConfig.helpLinks || []).filter((_, i) => i !== idx);
                        setFooterConfig({ ...footerConfig, helpLinks: copy });
                      }}
                      className="text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {hasErr && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{errors[`footerConfig.helpLinks.${idx}`]}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Social Media & Address */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500">Facebook URL</label>
            <input
              type="text"
              value={footerConfig.facebookUrl}
              onChange={(e) => setFooterConfig({ ...footerConfig, facebookUrl: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">Instagram URL</label>
            <input
              type="text"
              value={footerConfig.instagramUrl}
              onChange={(e) => setFooterConfig({ ...footerConfig, instagramUrl: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">WhatsApp Number</label>
            <input
              type="text"
              value={footerConfig.whatsappNumber}
              onChange={(e) => setFooterConfig({ ...footerConfig, whatsappNumber: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">YouTube URL</label>
            <input
              type="text"
              value={footerConfig.youtubeUrl}
              onChange={(e) => setFooterConfig({ ...footerConfig, youtubeUrl: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono"
            />
          </div>
        </div>

        {/* Address Lines & Copyright */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-[10px] font-bold text-slate-500">Address Line 1</label>
            <input
              type="text"
              value={footerConfig.addressLine1}
              onChange={(e) => setFooterConfig({ ...footerConfig, addressLine1: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">Address Line 2</label>
            <input
              type="text"
              value={footerConfig.addressLine2}
              onChange={(e) => setFooterConfig({ ...footerConfig, addressLine2: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-500">Copyright Text</label>
            <input
              type="text"
              value={footerConfig.copyrightText}
              onChange={(e) => setFooterConfig({ ...footerConfig, copyrightText: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2.5 py-1.5 text-xs"
            />
          </div>
        </div>
      </section>

      {/* Floating Save Button at Bottom */}
      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm shadow-xl transition-all cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? "Saving Homepage..." : "Save All Homepage Settings"}</span>
        </button>
      </div>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={Boolean(activeMediaTarget)}
        onClose={() => setActiveMediaTarget(null)}
        onSelectImage={handleSelectMediaImage}
      />
    </form>
  );
}
