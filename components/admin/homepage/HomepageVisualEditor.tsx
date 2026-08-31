"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveHomepageConfigAction } from "@/app/actions/homepage";
import {
  HomepageData,
  HeroSlide,
  CategoryShowcaseConfig,
  MainframeHeroConfig,
  StickyShowcaseConfig,
  BrandMarqueeConfig,
  PromoBannerConfig,
  StatItem,
  WhyBuyItem,
  TestimonialItem,
  FaqItem,
  HeaderConfig,
  FooterConfig,
  OrbitStageConfig,
  CategoryGridConfig,
  TopFundamentalsConfig,
  FeaturedCatalogConfig,
  SolutionsShowcaseConfig,
  AssemblySequenceConfig,
  BestSellersConfig,
  SpecCompareConfig,
  ResourceHubConfig,
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
  DEFAULT_ORBIT_STAGE,
  DEFAULT_CATEGORY_GRID,
  DEFAULT_TOP_FUNDAMENTALS,
  DEFAULT_FEATURED_CATALOG,
  DEFAULT_SOLUTIONS_SHOWCASE,
  DEFAULT_ASSEMBLY_SEQUENCE,
  DEFAULT_BEST_SELLERS,
  DEFAULT_SPEC_COMPARE,
  DEFAULT_RESOURCE_HUB,
  DEFAULT_SECTION_ORDER,
  getBaseSectionId,
  getBaseSectionData,
  getSectionInstanceData,
  deepCloneSectionData,
  generateUniqueSectionId,
  BASE_SECTION_TEMPLATES,
} from "@/lib/homepage";
import { Product } from "@/types";
import { StorefrontCategory } from "@/lib/storefront";
import { InlineEditable } from "./InlineEditable";
import { EditableLink } from "./EditableLink";
import { EditableImage } from "./EditableImage";
import { HomepageManagementForm } from "./HomepageManagementForm";
import { useToastStore } from "@/store/useToastStore";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";
import { CategoryProductCarousel } from "@/components/home/CategoryProductCarousel";
import { CINEMATIC_PRODUCTS, CinematicProduct } from "@/components/cinematic/cinematicProducts";
import { CinematicProductStage } from "@/components/cinematic/CinematicProductStage";
import { AssemblyScenePreview } from "./AssemblyScenePreview";
import { TopFundamentals } from "@/components/home/TopFundamentals";
import {
  Save,
  RotateCcw,
  Undo2,
  Redo2,
  ExternalLink,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  Phone,
  Mail,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Search,
  ShoppingCart,
  FileText,
  Star,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Layers,
  ZoomIn,
  ZoomOut,
  PanelLeftClose,
  PanelLeft,
  Tv,
  MousePointerClick,
  Plus,
  PlusCircle,
  Trash2,
  FileSpreadsheet,
  SlidersHorizontal,
  Flame,
  Radio,
  BookOpen,
  ArrowUpDown,
  Compass,
  Cpu,
  Zap,
  Clock,
  User,
  Factory,
  Box,
  Activity,
  Truck,
  Tag,
  CheckCircle,
  Play,
  Pause,
  MoreVertical,
  GripVertical,
  Layout,
  ArrowUpRight,
  Home,
  Copy,
} from "lucide-react";

interface HomepageVisualEditorProps {
  initialData: HomepageData;
  categories: StorefrontCategory[];
  products: Product[];
}

export function HomepageVisualEditor({
  initialData,
  categories,
  products,
}: HomepageVisualEditorProps) {
  const router = useRouter();
  const { addToast } = useToastStore();

  const { theme } = useAdminThemeStore();
  const isLight = theme === "light";

  // Mode: "visual" or "form"
  const [editorMode, setEditorMode] = useState<"visual" | "form">("visual");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Wix Studio Layout States
  const [sidebarWidth, setSidebarWidth] = useState<number>(320);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(0.8);
  const [activeSectionId, setActiveSectionId] = useState<string>("sec-mainframe");
  const [sidebarSearch, setSidebarSearch] = useState<string>("");

  // Scaled container height measurement
  const canvasInnerRef = useRef<HTMLDivElement>(null);
  const previewScrollContainerRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number>(6500);

  // Active slide index for hero slider preview
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);

  // Selected vertical index for industrial solutions showcase preview
  const [selectedVerticalIdx, setSelectedVerticalIdx] = useState(0);

  // 3D Orbit Stage interactive state
  const [orbitProgress, setOrbitProgress] = useState<number>(0);
  const [isOrbitPlaying, setIsOrbitPlaying] = useState<boolean>(true);

  // Working state for all 21 homepage sections
  const [homepageState, setHomepageState] = useState<HomepageData>(() => ({
    promoTicker: initialData.promoTicker || "",
    promoTickerUrl: initialData.promoTickerUrl || "/products",
    promoTickerActive: initialData.promoTickerActive !== undefined ? initialData.promoTickerActive : true,
    mainframeHero: initialData.mainframeHero || DEFAULT_MAINFRAME_HERO,
    heroSlides: initialData.heroSlides && initialData.heroSlides.length > 0 ? initialData.heroSlides : DEFAULT_HERO_SLIDES,
    categoryShowcases: initialData.categoryShowcases && initialData.categoryShowcases.length > 0 ? initialData.categoryShowcases : DEFAULT_CATEGORY_SHOWCASES,
    stickyShowcase: initialData.stickyShowcase || DEFAULT_STICKY_SHOWCASE,
    brandMarquee: initialData.brandMarquee || DEFAULT_BRAND_MARQUEE,
    promoBanner: initialData.promoBanner || DEFAULT_PROMO_BANNER,
    stats: initialData.stats && initialData.stats.length > 0 ? initialData.stats : DEFAULT_STATS,
    whyBuyFromUs: initialData.whyBuyFromUs && initialData.whyBuyFromUs.length > 0 ? initialData.whyBuyFromUs : DEFAULT_WHY_BUY,
    whyBuy: initialData.whyBuy && initialData.whyBuy.length > 0 ? initialData.whyBuy : DEFAULT_WHY_BUY,
    whyBuyEyebrow: initialData.whyBuyEyebrow || "VALUE GUARANTEE",
    whyBuyTitle: initialData.whyBuyTitle || "Why Leading Engineering Teams Choose OM AUTOMATION",
    testimonials: initialData.testimonials && initialData.testimonials.length > 0 ? initialData.testimonials : DEFAULT_TESTIMONIALS,
    testimonialsEyebrow: initialData.testimonialsEyebrow || "CLIENT FEEDBACK",
    testimonialsTitle: initialData.testimonialsTitle || "Trusted by Industrial Automation Leaders",
    faqs: initialData.faqs && initialData.faqs.length > 0 ? initialData.faqs : DEFAULT_FAQS,
    faqsEyebrow: initialData.faqsEyebrow || "SUPPORT & HELP",
    faqsTitle: initialData.faqsTitle || "Frequently Asked Questions",
    headerConfig: initialData.headerConfig || DEFAULT_HEADER_CONFIG,
    footerConfig: initialData.footerConfig || DEFAULT_FOOTER_CONFIG,
    orbitStage: initialData.orbitStage || DEFAULT_ORBIT_STAGE,
    categoryGrid: initialData.categoryGrid || DEFAULT_CATEGORY_GRID,
    featuredCatalog: initialData.featuredCatalog || DEFAULT_FEATURED_CATALOG,
    solutionsShowcase: initialData.solutionsShowcase || DEFAULT_SOLUTIONS_SHOWCASE,
    assemblySequence: initialData.assemblySequence || DEFAULT_ASSEMBLY_SEQUENCE,
    bestSellers: initialData.bestSellers || DEFAULT_BEST_SELLERS,
    specCompare: initialData.specCompare || DEFAULT_SPEC_COMPARE,
    resourceHub: initialData.resourceHub || DEFAULT_RESOURCE_HUB,
    sectionOrder: initialData.sectionOrder && initialData.sectionOrder.length > 0 ? initialData.sectionOrder : DEFAULT_SECTION_ORDER,
    hiddenSectionIds: initialData.hiddenSectionIds || [],
    sectionInstances: initialData.sectionInstances || {},
  }));

  // Track last saved state for revert
  const [lastSavedState, setLastSavedState] = useState<HomepageData>(initialData);

  // Sidebar drag resizer handler (min 280px, max 380px)
  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);

    const onMouseMove = (mouseMoveEvent: MouseEvent) => {
      const newWidth = Math.min(380, Math.max(280, mouseMoveEvent.clientX - 256));
      setSidebarWidth(newWidth);
    };

    const onMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }, []);

  // ResizeObserver for canvas scaling
  useEffect(() => {
    if (!canvasInnerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.height > 0) {
          setMeasuredHeight(entry.contentRect.height);
        }
      }
    });
    observer.observe(canvasInnerRef.current);
    return () => observer.disconnect();
  }, []);

  // Continuous animation loop for 3D Orbit Stage
  useEffect(() => {
    if (!isOrbitPlaying) return;
    let animFrameId: number;
    let lastTimestamp: number | null = null;

    const updateLoop = (timestamp: number) => {
      if (lastTimestamp !== null) {
        const deltaSec = (timestamp - lastTimestamp) / 1000;
        setOrbitProgress((prev) => prev + deltaSec * 0.35);
      }
      lastTimestamp = timestamp;
      animFrameId = requestAnimationFrame(updateLoop);
    };

    animFrameId = requestAnimationFrame(updateLoop);
    return () => cancelAnimationFrame(animFrameId);
  }, [isOrbitPlaying]);

  // Smooth scroll to section inside scaled preview
  const scrollToSection = (sectionId: string) => {
    setActiveSectionId(sectionId);
    if (!previewScrollContainerRef.current) return;
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Resolved Category Showcases
  const showcases = (homepageState.categoryShowcases || DEFAULT_CATEGORY_SHOWCASES)
    .filter((s) => s.isActive)
    .map((showcase, index) => {
      const matchedCat = categories.find((c) => c.id === showcase.categoryId || c.slug === showcase.categoryId);
      const catName = matchedCat?.name || `Featured Category #${index + 1}`;
      const catSlug = matchedCat?.slug || showcase.categoryId || "products";

      let categoryProducts = products.filter((p) => {
        if (!matchedCat) return true;
        return (
          p.categoryId === matchedCat.id ||
          p.categoryId === matchedCat.slug ||
          p.categoryIds?.includes(matchedCat.id) ||
          p.categoryIds?.includes(matchedCat.slug)
        );
      });

      if (categoryProducts.length === 0 && products.length > 0) {
        const start = (index * 4) % products.length;
        categoryProducts = products.slice(start, start + 8);
        if (categoryProducts.length < 4) {
          categoryProducts = products.slice(0, 8);
        }
      }

      return {
        showcase,
        index,
        categoryName: catName,
        categorySlug: catSlug,
        products: categoryProducts,
      };
    });

  const activeSlide =
    (homepageState.heroSlides || DEFAULT_HERO_SLIDES)[activeSlideIdx] ||
    (homepageState.heroSlides || DEFAULT_HERO_SLIDES)[0];

  const currentSolutions = homepageState.solutionsShowcase || DEFAULT_SOLUTIONS_SHOWCASE;
  const activeVertical = (currentSolutions.verticals || DEFAULT_SOLUTIONS_SHOWCASE.verticals)[selectedVerticalIdx] || DEFAULT_SOLUTIONS_SHOWCASE.verticals[0];

  // 3D Orbit Products List
  const currentOrbitStage = homepageState.orbitStage || DEFAULT_ORBIT_STAGE;
  const orbitProducts: CinematicProduct[] =
    currentOrbitStage.products && currentOrbitStage.products.length > 0
      ? currentOrbitStage.products.map((p, idx) => ({
          id: p.id || `cine-${idx}`,
          sku: p.sku || `SKU-${idx + 1}`,
          name: p.name,
          category: p.category,
          subtitle: p.subtitle,
          description: "",
          price: p.price,
          specs: p.specs || [],
          image: p.image || CINEMATIC_PRODUCTS[idx % CINEMATIC_PRODUCTS.length].image,
        }))
      : CINEMATIC_PRODUCTS;

  const numOrbitProds = orbitProducts.length;
  const activeOrbitIdx =
    ((Math.floor(orbitProgress + 0.5) % numOrbitProds) + numOrbitProds) % numOrbitProds;
  const activeOrbitProd = orbitProducts[activeOrbitIdx] || orbitProducts[0];

  // 3-Tab Wix Studio Sidebar Navigation State
  type SidebarTab = "sections" | "add_section" | "pages";
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("sections");
  const [addSectionCategory, setAddSectionCategory] = useState<string>("all");
  const [addSectionSearch, setAddSectionSearch] = useState<string>("");
  const [hiddenSectionIds, setHiddenSectionIds] = useState<Set<string>>(() =>
    new Set(initialData.hiddenSectionIds || [])
  );
  const [activeMenuSectionId, setActiveMenuSectionId] = useState<string | null>(null);

  // Section Selection & Insertion State (Wix Studio Style)
  const [selectedSectionId, setSelectedSectionId] = useState<string>("sec-mainframe");
  const [insertTargetIndex, setInsertTargetIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // All 21 homepage sections metadata
  const SECTION_NAV_ITEMS = [
    { id: "sec-ticker", label: "1. Announcement Ticker", icon: Sparkles, tag: "Top Bar" },
    { id: "sec-header", label: "2. Navigation Header", icon: Compass, tag: "Nav" },
    { id: "sec-mainframe", label: "3. Mainframe Hero", icon: Tv, tag: "Hero 1" },
    { id: "sec-slider", label: "4. Hero Slider", icon: Layers, tag: "Hero 2" },
    { id: "sec-showcases", label: "5. Category Showcases", icon: ShoppingCart, tag: "Featured" },
    { id: "sec-brand-marquee", label: "6. OEM Brand Partners", icon: ShieldCheck, tag: "Brands" },
    { id: "sec-cinematic", label: "7. 3D Product Orbit Stage", icon: Compass, tag: "3D Stage" },
    { id: "sec-categories-grid", label: "8. Hardware Categories Grid", icon: Layers, tag: "Grid" },
    { id: "sec-top-fundamentals", label: "8.5. Top 10 Fundamentals", icon: Sparkles, tag: "Deck" },
    { id: "sec-featured-catalog", label: "9. Featured Components Catalog", icon: Sparkles, tag: "Catalog" },
    { id: "sec-solutions", label: "10. Industrial Solutions (BOM)", icon: SlidersHorizontal, tag: "BOM" },
    { id: "sec-assembly", label: "11. Product Assembly Sequence", icon: Sliders, tag: "3D Stages" },
    { id: "sec-why-buy", label: "12. Why Buy From Us", icon: ShieldCheck, tag: "Value" },
    { id: "sec-sticky-showcase", label: "13. Sticky Flagship Controller", icon: Radio, tag: "Flagship" },
    { id: "sec-best-sellers", label: "14. Best Sellers Rail", icon: Flame, tag: "Fast Move" },
    { id: "sec-stats", label: "15. Key Metrics & Stats", icon: BarChart3, tag: "Metrics" },
    { id: "sec-promo-banner", label: "16. Volume Procurement Banner", icon: FileText, tag: "Banner" },
    { id: "sec-testimonials", label: "17. Client Testimonials", icon: Star, tag: "Reviews" },
    { id: "sec-compare", label: "18. Benchmark Matrix", icon: ArrowUpDown, tag: "Matrix" },
    { id: "sec-resource-hub", label: "19. Knowledge Base & Hub", icon: BookOpen, tag: "Articles" },
    { id: "sec-faqs", label: "20. Support FAQs", icon: HelpCircle, tag: "Help" },
    { id: "sec-footer-config", label: "21. Footer & Catalog Download", icon: FileText, tag: "Footer" },
  ];

  const [orderedSectionIds, setOrderedSectionIds] = useState<string[]>(() => {
    const rawOrder =
      initialData.sectionOrder && initialData.sectionOrder.length > 0
        ? initialData.sectionOrder
        : DEFAULT_SECTION_ORDER;
    const seen = new Map<string, number>();
    return rawOrder.map((id) => {
      const base = getBaseSectionId(id);
      const count = seen.get(base) || 0;
      seen.set(base, count + 1);
      if (count === 0 && id === base) return id;
      if (id !== base && !seen.has(id)) {
        seen.set(id, 1);
        return id;
      }
      return `${base}-copy-${count}`;
    });
  });

  // ==========================================
  // UNDO & REDO HISTORY ENGINE (Wix Studio Style - 20 Actions)
  // ==========================================
  interface HistorySnapshot {
    state: HomepageData;
    orderedSectionIds: string[];
    hiddenSectionIds: string[];
    selectedSectionId: string | null;
    description: string;
  }

  const [undoStack, setUndoStack] = useState<HistorySnapshot[]>([]);
  const [redoStack, setRedoStack] = useState<HistorySnapshot[]>([]);
  const MAX_HISTORY = 20;

  // Capture immutable snapshot
  const pushHistorySnapshot = useCallback(
    (description: string) => {
      const currentSnapshot: HistorySnapshot = {
        state: JSON.parse(JSON.stringify(homepageState)),
        orderedSectionIds: [...orderedSectionIds],
        hiddenSectionIds: Array.from(hiddenSectionIds),
        selectedSectionId,
        description,
      };

      setUndoStack((prev) => {
        const next = [...prev, currentSnapshot];
        if (next.length > MAX_HISTORY) {
          next.shift();
        }
        return next;
      });

      // Clear redo stack on any new edit
      setRedoStack([]);
    },
    [homepageState, orderedSectionIds, hiddenSectionIds, selectedSectionId]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      state: JSON.parse(JSON.stringify(homepageState)),
      orderedSectionIds: [...orderedSectionIds],
      hiddenSectionIds: Array.from(hiddenSectionIds),
      selectedSectionId,
      description: "Current Editor State",
    };

    const previousSnapshot = undoStack[undoStack.length - 1];
    const newUndoStack = undoStack.slice(0, -1);

    setRedoStack((prev) => {
      const next = [...prev, currentSnapshot];
      if (next.length > MAX_HISTORY) {
        next.shift();
      }
      return next;
    });

    setUndoStack(newUndoStack);

    setHomepageState(previousSnapshot.state);
    setOrderedSectionIds(previousSnapshot.orderedSectionIds);
    setHiddenSectionIds(new Set(previousSnapshot.hiddenSectionIds));
    if (previousSnapshot.selectedSectionId) {
      setSelectedSectionId(previousSnapshot.selectedSectionId);
      setActiveSectionId(previousSnapshot.selectedSectionId);
    }
    setHasUnsavedChanges(true);
    addToast("info", "Undo Action", `Reverted: ${previousSnapshot.description}`);
  }, [undoStack, homepageState, orderedSectionIds, hiddenSectionIds, selectedSectionId]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;

    const currentSnapshot: HistorySnapshot = {
      state: JSON.parse(JSON.stringify(homepageState)),
      orderedSectionIds: [...orderedSectionIds],
      hiddenSectionIds: Array.from(hiddenSectionIds),
      selectedSectionId,
      description: "Current Editor State",
    };

    const nextSnapshot = redoStack[redoStack.length - 1];
    const newRedoStack = redoStack.slice(0, -1);

    setUndoStack((prev) => {
      const next = [...prev, currentSnapshot];
      if (next.length > MAX_HISTORY) {
        next.shift();
      }
      return next;
    });

    setRedoStack(newRedoStack);

    setHomepageState(nextSnapshot.state);
    setOrderedSectionIds(nextSnapshot.orderedSectionIds);
    setHiddenSectionIds(new Set(nextSnapshot.hiddenSectionIds));
    if (nextSnapshot.selectedSectionId) {
      setSelectedSectionId(nextSnapshot.selectedSectionId);
      setActiveSectionId(nextSnapshot.selectedSectionId);
    }
    setHasUnsavedChanges(true);
    addToast("info", "Redo Action", `Restored: ${nextSnapshot.description}`);
  }, [redoStack, homepageState, orderedSectionIds, hiddenSectionIds, selectedSectionId]);

  const updateSectionContent = (
    instanceId: string,
    patch: any | ((prevContent: any) => any),
    actionDesc?: string
  ) => {
    const baseId = getBaseSectionId(instanceId);
    const isCustomCopy = instanceId !== baseId;

    pushHistorySnapshot(actionDesc || `Edit ${instanceId}`);

    setHomepageState((prev) => {
      const currentInstanceData = getSectionInstanceData(instanceId, prev);
      const updated =
        typeof patch === "function" ? patch(currentInstanceData) : { ...currentInstanceData, ...patch };

      const updatedInstances = {
        ...(prev.sectionInstances || {}),
        [instanceId]: updated,
      };

      if (isCustomCopy) {
        return {
          ...prev,
          sectionInstances: updatedInstances,
        };
      } else {
        const next: HomepageData = {
          ...prev,
          sectionInstances: updatedInstances,
        };
        switch (baseId) {
          case "sec-ticker":
            if (updated.promoTicker !== undefined) next.promoTicker = updated.promoTicker;
            if (updated.promoTickerUrl !== undefined) next.promoTickerUrl = updated.promoTickerUrl;
            if (updated.promoTickerActive !== undefined) next.promoTickerActive = updated.promoTickerActive;
            break;
          case "sec-header":
            next.headerConfig = updated;
            break;
          case "sec-mainframe":
            next.mainframeHero = updated;
            break;
          case "sec-slider":
            next.heroSlides = Array.isArray(updated) ? updated : (updated.heroSlides || updated);
            break;
          case "sec-showcases":
            next.categoryShowcases = Array.isArray(updated) ? updated : (updated.categoryShowcases || updated);
            break;
          case "sec-brand-marquee":
            next.brandMarquee = updated;
            break;
          case "sec-cinematic":
            next.orbitStage = updated;
            break;
          case "sec-categories-grid":
            next.categoryGrid = updated;
            break;
          case "sec-top-fundamentals":
            next.topFundamentals = updated;
            break;
          case "sec-featured-catalog":
            next.featuredCatalog = updated;
            break;
          case "sec-solutions":
            next.solutionsShowcase = updated;
            break;
          case "sec-assembly":
            next.assemblySequence = updated;
            break;
          case "sec-why-buy":
            if (updated.whyBuy !== undefined) {
              next.whyBuy = updated.whyBuy;
              next.whyBuyFromUs = updated.whyBuy;
            }
            if (updated.whyBuyEyebrow !== undefined) next.whyBuyEyebrow = updated.whyBuyEyebrow;
            if (updated.whyBuyTitle !== undefined) next.whyBuyTitle = updated.whyBuyTitle;
            break;
          case "sec-sticky-showcase":
            next.stickyShowcase = updated;
            break;
          case "sec-best-sellers":
            next.bestSellers = updated;
            break;
          case "sec-stats":
            next.stats = Array.isArray(updated) ? updated : (updated.stats || updated);
            break;
          case "sec-promo-banner":
            next.promoBanner = updated;
            break;
          case "sec-testimonials":
            if (updated.testimonials !== undefined) next.testimonials = updated.testimonials;
            if (updated.testimonialsEyebrow !== undefined) next.testimonialsEyebrow = updated.testimonialsEyebrow;
            if (updated.testimonialsTitle !== undefined) next.testimonialsTitle = updated.testimonialsTitle;
            break;
          case "sec-compare":
            next.specCompare = updated;
            break;
          case "sec-resource-hub":
            next.resourceHub = updated;
            break;
          case "sec-faqs":
            if (updated.faqs !== undefined) next.faqs = updated.faqs;
            if (updated.faqsEyebrow !== undefined) next.faqsEyebrow = updated.faqsEyebrow;
            if (updated.faqsTitle !== undefined) next.faqsTitle = updated.faqsTitle;
            break;
          case "sec-footer-config":
            next.footerConfig = updated;
            break;
        }
        return next;
      }
    });

    setHasUnsavedChanges(true);
  };

  // General state updater (with auto history push)
  const updateState = (updater: (prev: HomepageData) => HomepageData, actionDesc?: string) => {
    pushHistorySnapshot(actionDesc || "Page Edit");
    setHomepageState((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const stateToSave: HomepageData = {
        ...homepageState,
        sectionOrder: orderedSectionIds,
        hiddenSectionIds: Array.from(hiddenSectionIds),
      };
      const res = await saveHomepageConfigAction(stateToSave);
      if (res.success) {
        setLastSavedState(stateToSave);
        setHomepageState(stateToSave);
        setHasUnsavedChanges(false);
        addToast("success", "Changes Published Successfully!", "Homepage section layout and order are now live on the storefront.");
        router.refresh();
      } else {
        addToast("error", "Failed to Publish", res.error || "Could not save homepage updates.");
      }
    } catch (err: any) {
      addToast("error", "Error", err.message || "An error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    pushHistorySnapshot("Reset to Published State");
    setHomepageState(lastSavedState);
    setOrderedSectionIds(
      lastSavedState.sectionOrder && lastSavedState.sectionOrder.length > 0
        ? lastSavedState.sectionOrder
        : DEFAULT_SECTION_ORDER
    );
    setHiddenSectionIds(new Set(lastSavedState.hiddenSectionIds || []));
    setHasUnsavedChanges(false);
    addToast("info", "Changes Reverted", "All edits have been reset to the last published state.");
  };

  // Global Keyboard Shortcuts: Ctrl+Z (Undo), Ctrl+Y / Cmd+Shift+Z (Redo), Ctrl+S (Save)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      if (isCmdOrCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
        return;
      }

      if ((isCmdOrCtrl && e.key.toLowerCase() === "y") || (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === "z")) {
        e.preventDefault();
        handleRedo();
        return;
      }

      if (isCmdOrCtrl && !e.shiftKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        handleUndo();
        return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, handleUndo, handleRedo]);

  // Section Template Library for "Add Section" Tab
  const SECTION_LIBRARY = [
    // HERO
    {
      id: "tpl-mainframe-hero",
      targetSectionId: "sec-mainframe",
      name: "Mainframe Hero",
      category: "hero",
      categoryLabel: "Hero Sections",
      description: "Precision grid hero with instant RFQ trigger, category pills, and direct sales desk hotline.",
      icon: Tv,
      thumbnailBg: "from-sky-950 to-slate-900",
    },
    {
      id: "tpl-hero-slider",
      targetSectionId: "sec-slider",
      name: "Full Width Image Slider",
      category: "hero",
      categoryLabel: "Hero Sections",
      description: "High-impact carousel slider with customizable slide images, titles, badges, and CTAs.",
      icon: Layers,
      thumbnailBg: "from-amber-950 to-slate-900",
    },
    {
      id: "tpl-gradient-banner",
      targetSectionId: "sec-ticker",
      name: "Top Announcement & Ticker",
      category: "hero",
      categoryLabel: "Hero Sections",
      description: "Ultra-compact top alert marquee with direct phone/email shortcuts and promo text.",
      icon: Sparkles,
      thumbnailBg: "from-emerald-950 to-slate-900",
    },

    // PRODUCTS
    {
      id: "tpl-category-showcases",
      targetSectionId: "sec-showcases",
      name: "Category Product Showcase",
      category: "product",
      categoryLabel: "Product Sections",
      description: "Multi-category collection spotlights with high-res imagery, badges, and 4-product grid cards.",
      icon: ShoppingCart,
      thumbnailBg: "from-blue-950 to-slate-900",
    },
    {
      id: "tpl-featured-catalog",
      targetSectionId: "sec-featured-catalog",
      name: "Featured Industrial Catalog",
      category: "product",
      categoryLabel: "Product Sections",
      description: "Comprehensive 8-card hardware catalog grid featuring specs, instant pricing, and RFQ carting.",
      icon: Box,
      thumbnailBg: "from-indigo-950 to-slate-900",
    },
    {
      id: "tpl-best-sellers",
      targetSectionId: "sec-best-sellers",
      name: "Top Best Sellers Rail",
      category: "product",
      categoryLabel: "Product Sections",
      description: "Horizontal fast-moving components rail with stock availability tags and quick-dispatch cues.",
      icon: Flame,
      thumbnailBg: "from-orange-950 to-slate-900",
    },
    {
      id: "tpl-sticky-showcase",
      targetSectionId: "sec-sticky-showcase",
      name: "Flagship Motion Controller",
      category: "product",
      categoryLabel: "Product Sections",
      description: "Deep-dive spotlight featuring technical bullet points, SIL safety level, and spec sheet CTA.",
      icon: Radio,
      thumbnailBg: "from-slate-950 to-slate-900",
    },

    // BRANDS
    {
      id: "tpl-brand-marquee",
      targetSectionId: "sec-brand-marquee",
      name: "OEM Brand Marquee",
      category: "brand",
      categoryLabel: "Brand Sections",
      description: "Continuous ticker of authorized industrial automation manufacturers (Siemens, Omron, ABB).",
      icon: ShieldCheck,
      thumbnailBg: "from-slate-950 to-sky-950",
    },

    // INDUSTRIAL
    {
      id: "tpl-categories-grid",
      targetSectionId: "sec-categories-grid",
      name: "Hardware Categories Grid",
      category: "industrial",
      categoryLabel: "Industrial Sections",
      description: "8-domain visual card grid covering Sensors, PLCs, VFDs, HMIs, Servos, Relays, and Power Supplies.",
      icon: Layers,
      thumbnailBg: "from-cyan-950 to-slate-900",
    },
    {
      id: "tpl-solutions-bom",
      targetSectionId: "sec-solutions",
      name: "Industrial Solutions (BOM)",
      category: "industrial",
      categoryLabel: "Industrial Sections",
      description: "Interactive Bill-of-Materials blueprint explorer with live parts breakdown and instant RFQ scoping.",
      icon: SlidersHorizontal,
      thumbnailBg: "from-emerald-950 to-slate-900",
    },
    {
      id: "tpl-3d-orbit",
      targetSectionId: "sec-cinematic",
      name: "3D Product Orbit Stage",
      category: "industrial",
      categoryLabel: "Industrial Sections",
      description: "Interactive 360° product rotation showcase with live specs bar and full-screen telemetry.",
      icon: Compass,
      thumbnailBg: "from-violet-950 to-slate-900",
    },
    {
      id: "tpl-assembly-sequence",
      targetSectionId: "sec-assembly",
      name: "Product Assembly Sequence",
      category: "industrial",
      categoryLabel: "Industrial Sections",
      description: "Exploded engineering part breakdown illustrating modular multi-axis assembly.",
      icon: Sliders,
      thumbnailBg: "from-fuchsia-950 to-slate-900",
    },

    // MARKETING
    {
      id: "tpl-why-buy",
      targetSectionId: "sec-why-buy",
      name: "Why Buy From Us",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "4-pillar trust & quality guarantee cards (Same-Day Dispatch, GST Invoice, 100% Genuine).",
      icon: ShieldCheck,
      thumbnailBg: "from-teal-950 to-slate-900",
    },
    {
      id: "tpl-stats-counter",
      targetSectionId: "sec-stats",
      name: "Key Metrics & Statistics",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "4-point operational metrics counter (50,000+ Parts in Stock, 4Hr Dispatch, 99.8% Uptime).",
      icon: BarChart3,
      thumbnailBg: "from-slate-950 to-amber-950",
    },
    {
      id: "tpl-promo-banner",
      targetSectionId: "sec-promo-banner",
      name: "Volume Procurement Banner",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "High-contrast promotional callout with dual action buttons for enterprise procurement.",
      icon: FileText,
      thumbnailBg: "from-amber-950 to-rose-950",
    },
    {
      id: "tpl-testimonials",
      targetSectionId: "sec-testimonials",
      name: "Client Testimonials",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "Verified customer review cards with 5-star ratings, author roles, and plant credentials.",
      icon: Star,
      thumbnailBg: "from-yellow-950 to-slate-900",
    },
    {
      id: "tpl-spec-compare",
      targetSectionId: "sec-compare",
      name: "Specification Benchmark Matrix",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "Side-by-side engineering comparison table comparing Sensors, PLCs, and VFD parameters.",
      icon: ArrowUpDown,
      thumbnailBg: "from-sky-950 to-indigo-950",
    },
    {
      id: "tpl-resource-hub",
      targetSectionId: "sec-resource-hub",
      name: "Knowledge Base & Guides",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "Engineering selection guides, whitepapers, and technical application notes.",
      icon: BookOpen,
      thumbnailBg: "from-blue-950 to-cyan-950",
    },
    {
      id: "tpl-faqs",
      targetSectionId: "sec-faqs",
      name: "Support & FAQ Accordion",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "Expandable questions and answers addressing GST invoicing, ordering, and dispatch times.",
      icon: HelpCircle,
      thumbnailBg: "from-slate-950 to-slate-900",
    },
    {
      id: "tpl-footer",
      targetSectionId: "sec-footer-config",
      name: "Footer & Catalog Download",
      category: "marketing",
      categoryLabel: "Marketing Sections",
      description: "Full-width PDF catalog download banner, multi-column navigation links, WhatsApp, and legal info.",
      icon: FileText,
      thumbnailBg: "from-slate-950 to-black",
    },
  ];

  // Pages List for "Pages" Tab
  const PAGES_LIST = [
    {
      id: "home",
      name: "Home",
      route: "/admin/homepage",
      liveUrl: "/",
      isCurrent: true,
      description: "Homepage Visual Editor Canvas",
      badge: "Active Canvas",
      icon: Tv,
    },
    {
      id: "products",
      name: "Products",
      route: "/admin/products",
      liveUrl: "/products",
      isCurrent: false,
      description: "Catalog, Pricing, SKUs & Inventory",
      badge: "Catalog Management",
      icon: Box,
    },
    {
      id: "categories",
      name: "Categories",
      route: "/admin/categories",
      liveUrl: "/categories",
      isCurrent: false,
      description: "Taxonomy, Hierarchy & Navigation",
      badge: "Storefront Structure",
      icon: Layers,
    },
  ];

  // Dynamic ordered sections list based on orderedSectionIds (supports unique instance copies)
  const orderedNavItems = orderedSectionIds.map((instanceId) => {
    const baseId = getBaseSectionId(instanceId);
    const baseNav = SECTION_NAV_ITEMS.find((s) => s.id === baseId) || {
      id: baseId,
      label: baseId,
      icon: Layers,
      tag: "Custom",
    };
    const isDuplicate = instanceId !== baseId;
    let copyLabel = baseNav.label;
    if (isDuplicate) {
      const match = instanceId.match(/-copy-(\d+)$/);
      const copyNum = match ? match[1] : "1";
      copyLabel = `${baseNav.label} (Copy ${copyNum})`;
    }
    return {
      ...baseNav,
      id: instanceId, // unique instance ID!
      baseId: baseId,
      label: copyLabel,
      isDuplicate,
    };
  });

  const filteredOrderedNavItems = orderedNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(sidebarSearch.toLowerCase()) ||
      item.tag.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  // Filtered Add Section Templates
  const filteredSectionLibrary = SECTION_LIBRARY.filter((tpl) => {
    const matchesCat = addSectionCategory === "all" || tpl.category === addSectionCategory;
    const matchesSearch =
      tpl.name.toLowerCase().includes(addSectionSearch.toLowerCase()) ||
      tpl.description.toLowerCase().includes(addSectionSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const toggleSectionVisibility = (instanceId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const baseId = getBaseSectionId(instanceId);
    const baseNav = SECTION_NAV_ITEMS.find((s) => s.id === baseId);
    const isNowHidden = hiddenSectionIds.has(instanceId);

    pushHistorySnapshot(`${isNowHidden ? "Show" : "Hide"} Section: ${baseNav?.label || instanceId}`);

    setHiddenSectionIds((prev) => {
      const next = new Set(prev);
      if (next.has(instanceId)) {
        next.delete(instanceId);
        setHomepageState((p) => ({
          ...p,
          hiddenSectionIds: (p.hiddenSectionIds || []).filter((id) => id !== instanceId),
        }));
        setHasUnsavedChanges(true);
        addToast("info", "Section Visible", `Enabled visibility for "${baseNav?.label || instanceId}".`);
      } else {
        next.add(instanceId);
        setHomepageState((p) => ({
          ...p,
          hiddenSectionIds: [...(p.hiddenSectionIds || []).filter((id) => id !== instanceId), instanceId],
        }));
        setHasUnsavedChanges(true);
        addToast("info", "Section Hidden", `Section hidden from live preview.`);
      }
      return next;
    });
  };

  const moveSection = (index: number, direction: "up" | "down", e?: React.MouseEvent) => {
    e?.stopPropagation();
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedSectionIds.length) return;
    const newOrder = [...orderedSectionIds];
    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const baseId = getBaseSectionId(temp);
    const baseNav = SECTION_NAV_ITEMS.find((s) => s.id === baseId);

    pushHistorySnapshot(`Move "${baseNav?.label || temp}" ${direction}`);

    setOrderedSectionIds(newOrder);
    setHomepageState((prev) => ({ ...prev, sectionOrder: newOrder }));
    setHasUnsavedChanges(true);
    setSelectedSectionId(temp);
    setActiveSectionId(temp);

    setTimeout(() => {
      scrollToSection(temp);
    }, 50);

    addToast("info", "Section Moved", `Moved "${baseNav?.label || temp}" ${direction}.`);
  };

  const duplicateSection = (instanceId: string, index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const baseId = getBaseSectionId(instanceId);
    const baseNav = SECTION_NAV_ITEMS.find((s) => s.id === baseId);

    pushHistorySnapshot(`Duplicate ${baseNav?.label || baseId}`);

    // Generate guaranteed unique instance ID (e.g. sec-mainframe-copy-1, sec-mainframe-copy-2)
    const newInstanceId = generateUniqueSectionId(baseId, orderedSectionIds);

    // Deep clone the source section's content with freshly generated nested item IDs
    const sourceContent = getSectionInstanceData(instanceId, homepageState);
    const clonedContent = deepCloneSectionData(sourceContent, baseId);

    const newOrder = [...orderedSectionIds];
    newOrder.splice(index + 1, 0, newInstanceId);
    setOrderedSectionIds(newOrder);

    setHomepageState((prev) => ({
      ...prev,
      sectionOrder: newOrder,
      sectionInstances: {
        ...(prev.sectionInstances || {}),
        [newInstanceId]: clonedContent,
      },
    }));
    setHasUnsavedChanges(true);

    setSelectedSectionId(newInstanceId);
    setActiveSectionId(newInstanceId);

    setTimeout(() => {
      scrollToSection(newInstanceId);
    }, 50);

    addToast("success", "Section Duplicated", `Created an independent instance of "${baseNav?.label || baseId}".`);
  };

  const removeSection = (instanceId: string, index?: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const baseId = getBaseSectionId(instanceId);
    const baseNav = SECTION_NAV_ITEMS.find((s) => s.id === baseId);

    pushHistorySnapshot(`Delete ${baseNav?.label || instanceId}`);

    const newOrder = [...orderedSectionIds];
    const targetIdx = index !== undefined && index >= 0 ? index : newOrder.indexOf(instanceId);
    if (targetIdx !== -1) {
      newOrder.splice(targetIdx, 1);
    }

    setHiddenSectionIds((prev) => {
      const next = new Set(prev);
      next.delete(instanceId);
      return next;
    });

    setOrderedSectionIds(newOrder);
    setHomepageState((prev) => {
      const updatedInstances = { ...(prev.sectionInstances || {}) };
      delete updatedInstances[instanceId];
      return {
        ...prev,
        sectionOrder: newOrder,
        hiddenSectionIds: (prev.hiddenSectionIds || []).filter((id) => id !== instanceId),
        sectionInstances: updatedInstances,
      };
    });
    setHasUnsavedChanges(true);

    if (selectedSectionId === instanceId) {
      const fallback = newOrder[Math.min(targetIdx, newOrder.length - 1)] || "sec-mainframe";
      setSelectedSectionId(fallback);
      setActiveSectionId(fallback);
    }

    addToast("info", "Section Deleted", `Removed "${baseNav?.label || instanceId}" from homepage.`);
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `${index}`);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    pushHistorySnapshot("Reorder Section (Drag & Drop)");

    const newOrder = [...orderedSectionIds];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);

    setOrderedSectionIds(newOrder);
    setHomepageState((prev) => ({ ...prev, sectionOrder: newOrder }));
    setHasUnsavedChanges(true);
    setSelectedSectionId(removed);
    setActiveSectionId(removed);

    setDraggedIndex(null);
    setDragOverIndex(null);
    addToast("info", "Section Reordered", `Moved "${SECTION_NAV_ITEMS.find((s) => s.id === removed)?.label || removed}" to position #${targetIndex + 1}.`);
  };

  const handleAddSection = (tpl: any) => {
    const targetId = tpl.targetSectionId;
    const baseId = getBaseSectionId(targetId);
    let nextOrder = [...orderedSectionIds];

    pushHistorySnapshot(`Add Section: ${tpl.name}`);

    // If targetId already exists in nextOrder, create a unique instance copy ID (e.g. baseId-copy-1)
    let newInstanceId = targetId;
    if (nextOrder.includes(targetId)) {
      newInstanceId = generateUniqueSectionId(baseId, nextOrder);
    }

    let insertIdx: number;
    if (insertTargetIndex !== null) {
      insertIdx = insertTargetIndex;
    } else {
      const selIdx = nextOrder.indexOf(selectedSectionId);
      insertIdx = selIdx !== -1 ? selIdx + 1 : nextOrder.length;
    }

    insertIdx = Math.max(0, Math.min(insertIdx, nextOrder.length));
    nextOrder.splice(insertIdx, 0, newInstanceId);

    // Deep clone from base template with freshly generated unique IDs
    const templateData = BASE_SECTION_TEMPLATES[baseId]?.defaultData || getBaseSectionData(baseId, homepageState);
    const clonedContent = deepCloneSectionData(templateData, baseId);

    setOrderedSectionIds(nextOrder);
    setHomepageState((prev) => ({
      ...prev,
      sectionOrder: nextOrder,
      sectionInstances: {
        ...(prev.sectionInstances || {}),
        [newInstanceId]: clonedContent,
      },
    }));
    setHasUnsavedChanges(true);

    // Unhide new instance if it was marked hidden
    setHiddenSectionIds((prev) => {
      const next = new Set(prev);
      next.delete(newInstanceId);
      return next;
    });

    setSidebarTab("sections");
    setSelectedSectionId(newInstanceId);
    setActiveSectionId(newInstanceId);
    setInsertTargetIndex(null);

    setTimeout(() => {
      scrollToSection(newInstanceId);
    }, 100);

    const baseNav = SECTION_NAV_ITEMS.find((s) => s.id === baseId);
    const label = newInstanceId !== baseId ? `${baseNav?.label || baseId} (Copy)` : (baseNav?.label || baseId);
    addToast("success", "Section Added", `Inserted "${label}" at position #${insertIdx + 1}.`);
  };

  return (
    <div className={`min-h-screen flex flex-col overflow-hidden font-sans transition-colors duration-300 ${isLight ? "bg-slate-100 text-slate-900" : "bg-slate-950 text-slate-100"}`}>
      {/* 1. TOP MASTER TOOLBAR */}
      <header className={`sticky top-0 z-50 h-14 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shadow-lg shrink-0 transition-colors duration-300 ${isLight ? "bg-white/95 border-b border-slate-200 text-slate-700" : "bg-slate-900/95 border-b border-slate-800 text-slate-200"}`}>
        {/* Left: Mode Toggle & Sidebar Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isLight ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
            title={isSidebarOpen ? "Collapse Section Panel" : "Expand Section Panel"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4 text-sky-500" /> : <PanelLeft className="w-4 h-4" />}
          </button>

          <div className={`flex p-0.5 rounded-lg border ${isLight ? "bg-slate-100 border-slate-300" : "bg-slate-950 border-slate-800"}`}>
            <button
              type="button"
              onClick={() => setEditorMode("visual")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                editorMode === "visual"
                  ? "bg-sky-600 text-white shadow"
                  : isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual Editor</span>
            </button>

            <button
              type="button"
              onClick={() => setEditorMode("form")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                editorMode === "form"
                  ? "bg-purple-600 text-white shadow"
                  : isLight ? "text-slate-500 hover:text-slate-900" : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Form Mode</span>
            </button>
          </div>

          {hasUnsavedChanges && (
            <span className="hidden md:inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-500 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Unpublished
            </span>
          )}
        </div>

        {/* Center: Canvas Zoom Controls */}
        {editorMode === "visual" && (
          <div className={`hidden lg:flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs ${isLight ? "bg-slate-100 border-slate-300 text-slate-600" : "bg-slate-950/80 border-slate-800 text-slate-400"}`}>
            <span className={`text-[11px] font-bold font-mono ${isLight ? "text-slate-500" : "text-slate-400"}`}>Zoom:</span>

            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.max(0.6, Number((prev - 0.05).toFixed(2))))}
              className={`p-1 rounded transition-colors cursor-pointer ${isLight ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>

            <div className="flex gap-1">
              {[
                { label: "75%", val: 0.75 },
                { label: "80% (Opt)", val: 0.8 },
                { label: "90%", val: 0.9 },
                { label: "100%", val: 1.0 },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setZoomScale(opt.val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold transition-all cursor-pointer ${
                    zoomScale === opt.val
                      ? "bg-sky-500 text-white shadow-xs"
                      : isLight
                        ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setZoomScale((prev) => Math.min(1.1, Number((prev + 0.05).toFixed(2))))}
              className={`p-1 rounded transition-colors cursor-pointer ${isLight ? "text-slate-500 hover:text-slate-900 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-slate-800"}`}
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Right: Undo, Redo, Reset, Live Site & Publish */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Undo & Redo (Wix Studio Style) */}
          <div className={`flex items-center p-0.5 rounded-lg border ${isLight ? "bg-slate-100 border-slate-300" : "bg-slate-950 border-slate-800"}`}>
            <button
              type="button"
              disabled={undoStack.length === 0 || isSaving}
              onClick={handleUndo}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight
                  ? "hover:bg-white text-slate-700 hover:text-sky-600 shadow-xs"
                  : "hover:bg-slate-800 text-slate-300 hover:text-sky-400"
              }`}
              title={undoStack.length > 0 ? `Undo: ${undoStack[undoStack.length - 1].description} (Ctrl+Z)` : "Undo (Ctrl+Z)"}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">Undo</span>
              {undoStack.length > 0 && (
                <span className="text-[9px] font-mono px-1 rounded bg-sky-500/20 text-sky-400 font-bold">
                  {undoStack.length}
                </span>
              )}
            </button>

            <button
              type="button"
              disabled={redoStack.length === 0 || isSaving}
              onClick={handleRedo}
              className={`p-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                isLight
                  ? "hover:bg-white text-slate-700 hover:text-sky-600 shadow-xs"
                  : "hover:bg-slate-800 text-slate-300 hover:text-sky-400"
              }`}
              title={redoStack.length > 0 ? `Redo: ${redoStack[redoStack.length - 1].description} (Ctrl+Y)` : "Redo (Ctrl+Y)"}
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-xs font-semibold">Redo</span>
              {redoStack.length > 0 && (
                <span className="text-[9px] font-mono px-1 rounded bg-amber-500/20 text-amber-400 font-bold">
                  {redoStack.length}
                </span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleReset}
            disabled={!hasUnsavedChanges || isSaving}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"}`}
            title="Revert all unsaved edits"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border transition-colors ${isLight ? "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300" : "bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700"}`}
            title="Open live storefront in new tab"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">Live Site</span>
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            title="Publish all changes to live storefront (Ctrl+S)"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Publishing..." : "Publish Changes"}</span>
          </button>
        </div>
      </header>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* VIEW A: STRUCTURED FORM */}
        {editorMode === "form" ? (
          <div className={`flex-1 overflow-y-auto p-4 sm:p-6 ${isLight ? "bg-slate-100" : "bg-slate-900"}`}>
            <div className="max-w-5xl mx-auto">
              <HomepageManagementForm
                initialData={homepageState}
                categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
              />
            </div>
          </div>
        ) : (
          /* VIEW B: WIX STUDIO VISUAL EDITOR */
          <div className="flex-1 flex w-full overflow-hidden">
            {/* LEFT NARROW SIDEBAR (320px) - WIX STUDIO 3-TAB INTERFACE */}
            {isSidebarOpen && (
              <aside
                style={{ width: `${sidebarWidth}px` }}
                className={`shrink-0 border-r flex flex-col h-[calc(100vh-3.5rem)] z-30 transition-all duration-75 relative select-none ${isLight ? "bg-white border-slate-200" : "bg-slate-900 border-slate-800"}`}
              >
                {/* TOP 3-TAB NAVIGATION BAR */}
                <div className={`p-2 border-b flex items-center justify-between gap-1 shrink-0 ${isLight ? "bg-slate-50 border-slate-200" : "bg-slate-950/80 border-slate-800"}`}>
                  <button
                    type="button"
                    onClick={() => setSidebarTab("sections")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      sidebarTab === "sections"
                        ? isLight
                          ? "bg-white text-sky-600 shadow-sm border border-slate-200"
                          : "bg-slate-800 text-sky-400 shadow border border-slate-700"
                        : isLight
                        ? "text-slate-500 hover:text-slate-900"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Sections</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                      sidebarTab === "sections"
                        ? "bg-sky-500/20 text-sky-500 font-bold"
                        : isLight ? "bg-slate-200 text-slate-600" : "bg-slate-800 text-slate-400"
                    }`}>
                      21
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidebarTab("add_section")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      sidebarTab === "add_section"
                        ? isLight
                          ? "bg-white text-sky-600 shadow-sm border border-slate-200"
                          : "bg-slate-800 text-sky-400 shadow border border-slate-700"
                        : isLight
                        ? "text-slate-500 hover:text-slate-900"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-sky-500" />
                    <span>Add</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSidebarTab("pages")}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      sidebarTab === "pages"
                        ? isLight
                          ? "bg-white text-sky-600 shadow-sm border border-slate-200"
                          : "bg-slate-800 text-sky-400 shadow border border-slate-700"
                        : isLight
                        ? "text-slate-500 hover:text-slate-900"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Layout className="w-3.5 h-3.5" />
                    <span>Pages</span>
                    <span className={`text-[9px] px-1 py-0.2 rounded-full font-mono ${
                      sidebarTab === "pages"
                        ? "bg-sky-500/20 text-sky-500 font-bold"
                        : isLight ? "bg-slate-200 text-slate-600" : "bg-slate-800 text-slate-400"
                    }`}>
                      3
                    </span>
                  </button>
                </div>

                {/* TAB 1: SECTIONS LIST */}
                {sidebarTab === "sections" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Search & Counter */}
                    <div className={`p-3 border-b space-y-2 shrink-0 ${isLight ? "border-slate-200 bg-white" : "border-slate-800 bg-slate-900"}`}>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                          <Layers className="w-3.5 h-3.5 text-sky-500" />
                          <span>Homepage Sections</span>
                        </div>
                        <span className="text-[10px] font-mono bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded border border-sky-500/20 font-bold">
                          {filteredOrderedNavItems.length} active
                        </span>
                      </div>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search 21 sections..."
                          value={sidebarSearch}
                          onChange={(e) => setSidebarSearch(e.target.value)}
                          className={`w-full border rounded-lg pl-8 pr-2 py-1 text-xs placeholder-slate-400 focus:outline-none focus:border-sky-500 font-sans ${isLight ? "bg-slate-50 border-slate-200 text-slate-800" : "bg-slate-950 border-slate-800 text-slate-200"}`}
                        />
                      </div>
                    </div>

                    {/* Section List (Scrollable with between-section '+' buttons) */}
                    <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                      {/* 1. Insert Button Before Section 0 */}
                      <div className="relative py-0.5 group/insert flex items-center justify-center">
                        <div className="absolute inset-x-2 h-px bg-transparent group-hover/insert:bg-sky-500/50 transition-colors duration-200" />
                        <button
                          type="button"
                          onClick={() => {
                            setInsertTargetIndex(0);
                            setSidebarTab("add_section");
                          }}
                          className="relative z-10 opacity-0 group-hover/insert:opacity-100 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold shadow-md transform scale-90 group-hover/insert:scale-100 transition-all cursor-pointer"
                          title="Insert section at top"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Insert Section at Top</span>
                        </button>
                      </div>

                      {filteredOrderedNavItems.map((item, idx) => {
                        const Icon = item.icon;
                        const isActive = activeSectionId === item.id;
                        const isSelected = selectedSectionId === item.id;
                        const isHidden = hiddenSectionIds.has(item.id);
                        const isMenuOpen = activeMenuSectionId === item.id;
                        const isBeingDragged = draggedIndex === idx;
                        const isDropTarget = dragOverIndex === idx;

                        return (
                          <React.Fragment key={item.id}>
                            <div
                              draggable
                              onDragStart={(e) => handleDragStart(e, idx)}
                              onDragOver={(e) => handleDragOver(e, idx)}
                              onDragEnd={handleDragEnd}
                              onDrop={(e) => handleDrop(e, idx)}
                              className={`group relative rounded-xl border transition-all my-1 ${
                                isDropTarget
                                  ? "border-sky-500 bg-sky-500/10 shadow-lg scale-[1.02] ring-2 ring-sky-500"
                                  : isBeingDragged
                                  ? "opacity-40 border-dashed border-sky-400 bg-slate-800"
                                  : isSelected || isActive
                                  ? isLight
                                    ? "bg-sky-50/90 border-sky-400 shadow-sm ring-2 ring-sky-400/30"
                                    : "bg-sky-950/40 border-sky-500/60 shadow-md ring-2 ring-sky-500/40"
                                  : isHidden
                                  ? isLight
                                    ? "bg-slate-50/50 border-slate-200/60 opacity-60"
                                    : "bg-slate-950/40 border-slate-800/60 opacity-60"
                                  : isLight
                                  ? "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/80"
                                  : "bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                              }`}
                            >
                              <div
                                onClick={() => {
                                  setSelectedSectionId(item.id);
                                  scrollToSection(item.id);
                                }}
                                className="flex items-center justify-between p-2 cursor-pointer gap-1.5"
                              >
                                {/* Left: Drag Handle & Icon & Name */}
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  <span
                                    className="text-slate-400 hover:text-sky-400 cursor-grab active:cursor-grabbing p-0.5 shrink-0"
                                    title="Drag to reorder section"
                                  >
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </span>

                                  <Icon className={`w-3.5 h-3.5 shrink-0 ${
                                    isSelected || isActive
                                      ? "text-sky-500"
                                      : isHidden
                                      ? "text-slate-400"
                                      : isLight ? "text-slate-600" : "text-slate-400"
                                  }`} />

                                  <span className={`text-xs truncate font-medium ${
                                    isSelected || isActive
                                      ? "font-bold text-sky-600 dark:text-sky-400"
                                      : isHidden
                                      ? "text-slate-400 line-through"
                                      : isLight ? "text-slate-800" : "text-slate-200"
                                  }`}>
                                    {item.label}
                                  </span>
                                </div>

                                {/* Right: Tag & Action Controls */}
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded mr-0.5 ${
                                    isLight ? "bg-slate-100 text-slate-500 border border-slate-200" : "bg-slate-800 text-slate-400"
                                  }`}>
                                    {item.tag}
                                  </span>

                                  {/* Move Up / Down Buttons (Always accessible on hover) */}
                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={(e) => moveSection(idx, "up", e)}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-sky-500 rounded disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                      title="Move section up"
                                    >
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === filteredOrderedNavItems.length - 1}
                                      onClick={(e) => moveSection(idx, "down", e)}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-sky-500 rounded disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer"
                                      title="Move section down"
                                    >
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    </button>
                                  </div>

                                  {/* Visibility Toggle Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => toggleSectionVisibility(item.id, e)}
                                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                                      isHidden
                                        ? "text-rose-400 hover:bg-rose-500/20 bg-rose-500/10"
                                        : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800"
                                    }`}
                                    title={isHidden ? "Show in preview" : "Hide from preview"}
                                  >
                                    {isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                  </button>

                                  {/* Duplicate Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => duplicateSection(item.id, idx, e)}
                                    className="p-1 rounded-md text-slate-400 hover:text-sky-500 hover:bg-sky-500/10 transition-colors cursor-pointer"
                                    title="Duplicate section"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Delete / Remove Button */}
                                  <button
                                    type="button"
                                    onClick={(e) => removeSection(item.id, idx, e)}
                                    className="p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                    title="Delete section"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Three-Dot Menu */}
                                  <div className="relative">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveMenuSectionId(isMenuOpen ? null : item.id);
                                      }}
                                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                                      title="More options"
                                    >
                                      <MoreVertical className="w-3.5 h-3.5" />
                                    </button>

                                    {isMenuOpen && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className={`absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border p-1 shadow-xl text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100 ${
                                          isLight ? "bg-white border-slate-200 text-slate-700 shadow-slate-300/50" : "bg-slate-900 border-slate-800 text-slate-200 shadow-black/80"
                                        }`}
                                      >
                                        <button
                                          type="button"
                                          onClick={() => {
                                            scrollToSection(item.id);
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500/10 hover:text-sky-500 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Compass className="w-3.5 h-3.5 text-sky-500" />
                                          <span>Jump in Preview</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setInsertTargetIndex(idx + 1);
                                            setSidebarTab("add_section");
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-sky-500/10 hover:text-sky-500 flex items-center gap-2 cursor-pointer font-semibold"
                                        >
                                          <Plus className="w-3.5 h-3.5 text-sky-500" />
                                          <span>Insert Section Below</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === 0}
                                          onClick={(e) => {
                                            moveSection(idx, "up", e);
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                                        >
                                          <ChevronUp className="w-3.5 h-3.5" />
                                          <span>Move Up</span>
                                        </button>
                                        <button
                                          type="button"
                                          disabled={idx === filteredOrderedNavItems.length - 1}
                                          onClick={(e) => {
                                            moveSection(idx, "down", e);
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                                        >
                                          <ChevronDown className="w-3.5 h-3.5" />
                                          <span>Move Down</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            duplicateSection(item.id, idx, e);
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Copy className="w-3.5 h-3.5 text-sky-500" />
                                          <span>Duplicate Section</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            toggleSectionVisibility(item.id, e);
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 cursor-pointer"
                                        >
                                          {isHidden ? <Eye className="w-3.5 h-3.5 text-emerald-500" /> : <EyeOff className="w-3.5 h-3.5 text-rose-500" />}
                                          <span>{isHidden ? "Show Section" : "Hide Section"}</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            removeSection(item.id, idx, e);
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center gap-2 cursor-pointer"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                          <span>Remove Section</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard.writeText(`#${item.id}`);
                                            addToast("info", "Anchor Copied", `Copied #${item.id} to clipboard.`);
                                            setActiveMenuSectionId(null);
                                          }}
                                          className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 font-mono text-[10px] cursor-pointer"
                                        >
                                          <span>#{item.id}</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* 2. Hover "+" Insert Button Between Every Pair of Sections */}
                            <div className="relative py-0.5 group/insert flex items-center justify-center">
                              <div className="absolute inset-x-2 h-px bg-transparent group-hover/insert:bg-sky-500/50 transition-colors duration-200" />
                              <button
                                type="button"
                                onClick={() => {
                                  setInsertTargetIndex(idx + 1);
                                  setSidebarTab("add_section");
                                }}
                                className="relative z-10 opacity-0 group-hover/insert:opacity-100 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-600 hover:bg-sky-500 text-white text-[10px] font-bold shadow-md transform scale-90 group-hover/insert:scale-100 transition-all cursor-pointer"
                                title={`Insert section after ${item.label}`}
                              >
                                <Plus className="w-3 h-3" />
                                <span>Insert Section</span>
                              </button>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: ADD SECTION LIBRARY */}
                {sidebarTab === "add_section" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Header & Search */}
                    <div className={`p-3 border-b space-y-2 shrink-0 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"}`}>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                          <PlusCircle className="w-3.5 h-3.5 text-sky-500" />
                          <span>Built-in Section Library</span>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">
                          {filteredSectionLibrary.length} templates
                        </span>
                      </div>

                      {/* Insertion Target Indicator */}
                      {insertTargetIndex !== null ? (
                        <div className="flex items-center justify-between bg-sky-500/10 border border-sky-500/30 px-2.5 py-1 rounded-lg text-[11px] text-sky-400">
                          <span>Inserting at position <b>#{insertTargetIndex + 1}</b></span>
                          <button
                            type="button"
                            onClick={() => setInsertTargetIndex(null)}
                            className="text-slate-400 hover:text-white font-bold text-xs"
                            title="Reset to selected section"
                          >
                            ×
                          </button>
                        </div>
                      ) : selectedSectionId ? (
                        <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700/80 px-2.5 py-1 rounded-lg text-[11px] text-slate-300">
                          <span className="truncate">
                            Inserting below: <b className="text-sky-400">{SECTION_NAV_ITEMS.find((s) => s.id === selectedSectionId)?.label || selectedSectionId}</b>
                          </span>
                        </div>
                      ) : null}

                      {/* Search */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search section library..."
                          value={addSectionSearch}
                          onChange={(e) => setAddSectionSearch(e.target.value)}
                          className={`w-full border rounded-lg pl-8 pr-2 py-1 text-xs placeholder-slate-400 focus:outline-none focus:border-sky-500 font-sans ${isLight ? "bg-white border-slate-200 text-slate-800" : "bg-slate-900 border-slate-800 text-slate-200"}`}
                        />
                      </div>

                      {/* Category Filter Pills */}
                      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none text-[10px] font-medium">
                        {[
                          { id: "all", label: "All" },
                          { id: "hero", label: "Hero" },
                          { id: "product", label: "Products" },
                          { id: "brand", label: "Brands" },
                          { id: "industrial", label: "Industrial" },
                          { id: "marketing", label: "Marketing" },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setAddSectionCategory(cat.id)}
                            className={`px-2 py-0.5 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                              addSectionCategory === cat.id
                                ? "bg-sky-600 text-white font-bold shadow-xs"
                                : isLight
                                ? "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                                : "bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800"
                            }`}
                          >
                            {cat.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Section Cards List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2.5 custom-scrollbar">
                      {filteredSectionLibrary.map((tpl) => {
                        const Icon = tpl.icon;
                        const isAlreadyVisible = !hiddenSectionIds.has(tpl.targetSectionId);

                        return (
                          <div
                            key={tpl.id}
                            className={`p-3 rounded-2xl border transition-all space-y-2.5 ${
                              isLight
                                ? "bg-white border-slate-200 hover:border-slate-300 hover:shadow-md"
                                : "bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:shadow-lg"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${tpl.thumbnailBg} border border-white/10 flex items-center justify-center text-sky-400 shrink-0 shadow-inner`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center justify-between gap-1">
                                  <h4 className={`text-xs font-bold truncate ${isLight ? "text-slate-900" : "text-white"}`}>
                                    {tpl.name}
                                  </h4>
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-500 uppercase font-semibold shrink-0">
                                    {tpl.category}
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-snug line-clamp-2 ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                                  {tpl.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <span className={`text-[10px] font-mono ${isAlreadyVisible ? "text-emerald-500 font-bold" : "text-slate-400"}`}>
                                {isAlreadyVisible ? "● Active in Canvas" : "○ Hidden"}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleAddSection(tpl)}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Section</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 3: PAGES NAVIGATOR */}
                {sidebarTab === "pages" && (
                  <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Header */}
                    <div className={`p-3 border-b space-y-1 shrink-0 ${isLight ? "border-slate-200 bg-slate-50" : "border-slate-800 bg-slate-950/60"}`}>
                      <div className="flex items-center justify-between">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isLight ? "text-slate-700" : "text-slate-200"}`}>
                          <Layout className="w-3.5 h-3.5 text-sky-500" />
                          <span>Pages Navigator</span>
                        </div>
                        <span className="text-[10px] font-mono bg-sky-500/10 text-sky-500 px-1.5 py-0.5 rounded border border-sky-500/20 font-bold">
                          3 Pages
                        </span>
                      </div>
                      <p className={`text-[11px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                        Switch active editor page or view storefront routes
                      </p>
                    </div>

                    {/* Pages List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {PAGES_LIST.map((page) => {
                        const Icon = page.icon;
                        return (
                          <div
                            key={page.id}
                            onClick={() => {
                              if (!page.isCurrent) {
                                router.push(page.route);
                              }
                            }}
                            className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-2 group ${
                              page.isCurrent
                                ? isLight
                                  ? "bg-sky-50 border-sky-300 shadow-sm"
                                  : "bg-sky-950/40 border-sky-500/50 shadow-md ring-1 ring-sky-500/20"
                                : isLight
                                ? "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                                : "bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                  page.isCurrent
                                    ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                                    : isLight
                                    ? "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                                    : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                                }`}>
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <h4 className={`text-xs font-bold ${page.isCurrent ? "text-sky-600 dark:text-sky-400" : isLight ? "text-slate-900" : "text-white"}`}>
                                      {page.name}
                                    </h4>
                                    {page.isCurrent && (
                                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    )}
                                  </div>
                                  <p className={`text-[11px] leading-tight ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                                    {page.description}
                                  </p>
                                </div>
                              </div>

                              <Link
                                href={page.liveUrl}
                                target="_blank"
                                onClick={(e) => e.stopPropagation()}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  isLight
                                    ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100 border-slate-200"
                                    : "text-slate-500 hover:text-slate-200 hover:bg-slate-800 border-slate-800"
                                }`}
                                title={`Open ${page.name} on live storefront`}
                              >
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[10px] font-mono">
                              <span className={page.isCurrent ? "text-sky-500 font-bold" : "text-slate-400"}>
                                {page.route}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                page.isCurrent
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : isLight
                                  ? "bg-slate-100 text-slate-500"
                                  : "bg-slate-800 text-slate-400"
                              }`}>
                                {page.badge}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Editor Tips */}
                <div className={`p-3 border-t text-[11px] space-y-1.5 shrink-0 ${isLight ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-800 bg-slate-950/80 text-slate-400"}`}>
                  <div className="flex items-center gap-1.5 text-amber-500 font-bold text-[10px] uppercase tracking-wider">
                    <MousePointerClick className="w-3.5 h-3.5" />
                    <span>Visual Controls</span>
                  </div>
                  <p className={`text-[10px] leading-tight ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                    • <b>Double-click text</b> to edit in place.
                    <br />
                    • <b>Click any image</b> to replace or pick presets.
                    <br />
                    • Press <kbd className={`px-1 py-0.5 rounded text-[9px] ${isLight ? "bg-slate-200 text-slate-700" : "bg-slate-800 text-white"}`}>Ctrl+S</kbd> to publish.
                  </p>
                </div>

                {/* Vertical Resizable Drag Handle */}
                <div
                  onMouseDown={startResizing}
                  className={`absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-sky-500/60 transition-colors z-40 ${
                    isResizing ? "bg-sky-500" : "bg-transparent"
                  }`}
                  title="Drag to resize panel (280px - 380px)"
                />
              </aside>
            )}

            {/* RIGHT SCALED PREVIEW CANVAS (80% Default Zoom) */}
            <main
              ref={previewScrollContainerRef}
              className={`flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto overflow-x-hidden p-3 sm:p-5 lg:p-6 flex flex-col items-center custom-scrollbar ${isLight ? "bg-slate-200" : "bg-slate-950"}`}
            >
              {/* Scaled Device Frame */}
              <div
                style={{
                  width: `${100 / zoomScale}%`,
                  maxWidth: "1480px",
                  minWidth: "1240px",
                  height: `${Math.round(measuredHeight * zoomScale) + 60}px`,
                }}
                className="relative origin-top transition-transform duration-200"
              >
                {/* Browser Header Bar */}
                <div className={`border rounded-t-2xl px-4 py-2 flex items-center justify-between text-xs shadow-md ${isLight ? "bg-white border-slate-300 text-slate-500" : "bg-slate-900 border-slate-800 text-slate-400"}`}>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className={`text-[11px] font-mono px-3 py-0.5 rounded-md border ml-2 ${isLight ? "bg-slate-100 border-slate-300 text-slate-500" : "bg-slate-950 border-slate-800 text-slate-400"}`}>
                      https://omautomation.com/
                    </span>
                  </div>

                  <div className={`flex items-center gap-2 text-[10px] font-mono ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                    <span>Scaled at {Math.round(zoomScale * 100)}%</span>
                    <span className="bg-emerald-500/20 text-emerald-500 px-1.5 py-0.5 rounded font-bold">Interactive Live Canvas</span>
                  </div>
                </div>

                {/* THE TRANSFORMED LIVE HOMEPAGE CANVAS */}
                <div
                  ref={canvasInnerRef}
                  style={{
                    transform: `scale(${zoomScale})`,
                    transformOrigin: "top center",
                    width: "100%",
                  }}
                  className={`rounded-b-2xl shadow-2xl bg-[#faf9f5] border-x border-b overflow-hidden pointer-events-auto text-slate-900 ${isLight ? "border-slate-300" : "border-slate-800"}`}
                >
                  {orderedSectionIds.map((secId) => {
                    const isHidden = hiddenSectionIds.has(secId);
                    const isSelected = selectedSectionId === secId || activeSectionId === secId;
                    const baseId = getBaseSectionId(secId);
                    const navItem = SECTION_NAV_ITEMS.find((s) => s.id === baseId);
                    const displayLabel = navItem?.label ? (secId !== baseId ? `${navItem.label} (Copy)` : navItem.label) : secId;

                    if (isHidden) {
                      return (
                        <div
                          key={secId}
                          id={secId}
                          className="py-3 px-6 bg-slate-900/90 border-b border-dashed border-slate-700 text-center text-xs text-slate-400 flex items-center justify-between transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <EyeOff className="w-4 h-4 text-slate-500" />
                            <span className="font-medium text-slate-300">
                              {displayLabel}
                            </span>
                            <span className="text-[10px] font-mono bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 font-semibold">
                              Hidden from Storefront
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleSectionVisibility(secId)}
                            className="text-sky-400 hover:text-sky-300 font-bold text-xs cursor-pointer flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Show in Preview</span>
                          </button>
                        </div>
                      );
                    }
                    const instanceData = getSectionInstanceData(secId, homepageState);

                    const sectionContent = (() => {
                      switch (baseId) {
                        case "sec-ticker": {
                          const tickerData = (instanceData || {}) as any;
                          const currentPromoTicker = tickerData.promoTicker ?? homepageState.promoTicker ?? "⚡ SAME-DAY DISPATCH ON ALL IN-STOCK INDUSTRIAL HARDWARE | 100% GENUINE OEM PARTS";
                          const currentPromoTickerUrl = tickerData.promoTickerUrl ?? homepageState.promoTickerUrl ?? "/products";

                          return (
                            <div id="sec-ticker" className="bg-slate-950 text-white text-xs py-2 px-4 border-b border-slate-800 flex items-center justify-between">
                              <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-1 justify-center sm:justify-start">
                                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                                  <EditableLink
                                    label={currentPromoTicker}
                                    href={currentPromoTickerUrl}
                                    onChange={(newLabel, newHref) =>
                                      updateSectionContent(
                                        secId,
                                        { promoTicker: newLabel, promoTickerUrl: newHref },
                                        "Edit Promo Ticker"
                                      )
                                    }
                                    className="font-medium text-slate-200 tracking-wide text-xs"
                                    fieldTitle="1. Top Promotional Marquee Banner"
                                  />
                                </div>

                                <div className="hidden sm:flex items-center gap-4 text-[11px] text-slate-400 font-mono">
                                  <div className="flex items-center gap-1">
                                    <PhoneCall className="w-3 h-3 text-sky-400" />
                                    <EditableLink
                                      label={homepageState.headerConfig.supportPhone}
                                      href={`tel:${homepageState.headerConfig.supportPhone.replace(/\s+/g, "")}`}
                                      onChange={(newLabel) =>
                                        updateState((prev) => ({
                                          ...prev,
                                          headerConfig: { ...prev.headerConfig, supportPhone: newLabel },
                                        }))
                                      }
                                      fieldTitle="Header Support Phone Action"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-amber-400" />
                                    <EditableLink
                                      label={homepageState.headerConfig.supportEmail}
                                      href={`mailto:${homepageState.headerConfig.supportEmail}`}
                                      onChange={(newLabel) =>
                                        updateState((prev) => ({
                                          ...prev,
                                          headerConfig: { ...prev.headerConfig, supportEmail: newLabel },
                                        }))
                                      }
                                      fieldTitle="Header Support Email Action"
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        }

                        case "sec-header": {
                          const currentHeader = (instanceData || homepageState.headerConfig || DEFAULT_HEADER_CONFIG) as HeaderConfig;

                          return (
                            <header id="sec-header" className="bg-slate-900 border-b border-slate-800 py-3 px-4 text-white">
                              <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-500 flex items-center justify-center font-black text-slate-950 text-sm font-mono shadow-md">
                                    OM
                                  </div>
                                  <div className="font-heading font-black text-xl tracking-tight text-white flex items-center gap-1 font-mono">
                                    <span className="text-amber-400">OM</span>
                                    <span>AUTOMATION</span>
                                  </div>
                                  <span className="text-[10px] font-mono bg-slate-800 text-sky-400 px-2 py-0.5 rounded border border-slate-700 hidden md:inline">
                                    INDUSTRIAL HARDWARE
                                  </span>
                                </div>

                                {/* Navigation links */}
                                <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
                                  {(currentHeader.navLinks || []).map((link, lIdx) => (
                                    <EditableLink
                                      key={lIdx}
                                      label={link.label}
                                      href={link.url}
                                      onChange={(newLabel, newHref) => {
                                        const copy = [...(currentHeader.navLinks || [])];
                                        copy[lIdx] = { label: newLabel, url: newHref };
                                        updateSectionContent(secId, { ...currentHeader, navLinks: copy }, "Edit Header Navigation");
                                      }}
                                      fieldTitle={`Header Navigation Menu Link #${lIdx + 1}`}
                                    />
                                  ))}
                                </nav>

                                <div className="flex items-center gap-3">
                                  <div className="relative hidden md:flex items-center w-64 bg-slate-950 border border-slate-800 rounded-full px-3 py-1 text-xs text-slate-400 gap-2">
                                    <Search className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Search sensors, PLCs, VFDs...</span>
                                  </div>
                                  <button type="button" className="p-2 bg-slate-800 rounded-lg text-slate-300">
                                    <ShoppingCart className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </header>
                          );
                        }

                        case "sec-mainframe": {
                          const currentHero = (instanceData || homepageState.mainframeHero || DEFAULT_MAINFRAME_HERO) as MainframeHeroConfig;

                          return (
                            <section id="sec-mainframe" className="relative bg-slate-950 text-white py-12 md:py-16 px-4 border-b border-slate-800 overflow-hidden">
                              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                <div className="lg:col-span-7 space-y-4 z-10">
                                  <div className="inline-flex items-center gap-2 bg-sky-500/10 border border-sky-500/30 px-3 py-1 rounded-full text-sky-400 text-xs font-mono font-bold tracking-widest uppercase">
                                    <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                                    <InlineEditable
                                      value={currentHero.eyebrow}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...currentHero, eyebrow: val }, "Edit Mainframe Eyebrow")
                                      }
                                      label="Mainframe Hero Eyebrow"
                                    />
                                  </div>

                                  <div className="space-y-2">
                                    <InlineEditable
                                      as="h2"
                                      value={currentHero.subheading}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...currentHero, subheading: val }, "Edit Mainframe Subheading")
                                      }
                                      className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-heading"
                                      label="Mainframe Hero Subheading"
                                    />

                                    <InlineEditable
                                      as="p"
                                      value={currentHero.headline}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...currentHero, headline: val }, "Edit Mainframe Headline")
                                      }
                                      multiline
                                      className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl"
                                      label="Mainframe Hero Headline Description"
                                    />
                                  </div>

                                  <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <div className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-sm px-6 py-3 rounded-xl shadow-lg transition-all">
                                      <EditableLink
                                        label={currentHero.ctaText}
                                        href={currentHero.ctaUrl || "/quote"}
                                        onChange={(newLabel, newHref) =>
                                          updateSectionContent(
                                            secId,
                                            { ...currentHero, ctaText: newLabel, ctaUrl: newHref },
                                            "Edit Mainframe CTA"
                                          )
                                        }
                                        className="text-slate-950 font-extrabold text-sm"
                                        fieldTitle="Mainframe Primary RFQ CTA Button"
                                      />
                                      <ArrowRight className="w-4 h-4" />
                                    </div>

                                    <div className="inline-flex items-center gap-2 bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono px-4 py-3 rounded-xl">
                                      <Mail className="w-3.5 h-3.5 text-amber-400" />
                                      <InlineEditable
                                        value={currentHero.salesEmailText || "Reach Sales:"}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...currentHero, salesEmailText: val }, "Edit Sales Email Label")
                                        }
                                        label="Sales Email Label"
                                      />
                                      <EditableLink
                                        label={currentHero.salesEmail || "omautomation2012@gmail.com"}
                                        href={`mailto:${currentHero.salesEmail || "omautomation2012@gmail.com"}`}
                                        onChange={(newLabel) =>
                                          updateSectionContent(secId, { ...currentHero, salesEmail: newLabel }, "Edit Sales Email")
                                        }
                                        className="text-sky-400 font-mono text-xs"
                                        fieldTitle="Sales Email Link & Action"
                                      />
                                    </div>
                                  </div>

                                  {/* Nav Pills */}
                                  <div className="flex flex-wrap items-center gap-2 pt-2">
                                    {(currentHero.navPills || []).map((pill, pIdx) => (
                                      <span key={pIdx} className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-xs font-mono text-slate-300">
                                        <EditableLink
                                          label={pill.label}
                                          href={pill.url}
                                          onChange={(newLabel, newHref) => {
                                            const copy = [...(currentHero.navPills || [])];
                                            copy[pIdx] = { label: newLabel, url: newHref };
                                            updateSectionContent(secId, { ...currentHero, navPills: copy }, "Edit Mainframe Nav Pill");
                                          }}
                                          fieldTitle={`Mainframe Nav Pill #${pIdx + 1}`}
                                        />
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-slate-800 aspect-video lg:aspect-square bg-slate-900 flex items-center justify-center">
                                  {currentHero.videoUrl ? (
                                    <video
                                      src={currentHero.videoUrl}
                                      autoPlay
                                      loop
                                      muted
                                      playsInline
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="text-slate-500 font-mono text-xs">Video Media</div>
                                  )}
                                  <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-mono flex items-center gap-2 border border-white/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                    <span>OM Automation Industrial Motion</span>
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-slider": {
                          const sliderSlides = (
                            Array.isArray(instanceData)
                              ? instanceData
                              : (instanceData?.heroSlides || homepageState.heroSlides || DEFAULT_HERO_SLIDES)
                          ) as HeroSlide[];
                          const activeSlide = sliderSlides[activeSlideIdx] || sliderSlides[0] || DEFAULT_HERO_SLIDES[0];

                          return (
                            <section id="sec-slider" className="relative bg-slate-900 text-white py-10 px-4 border-b border-slate-800">
                              <div className="max-w-7xl mx-auto space-y-4">
                                {/* Slide Controls Toolbar */}
                                <div className="flex items-center justify-between bg-slate-950/80 p-2.5 rounded-xl border border-slate-800 flex-wrap gap-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <Layers className="w-4 h-4 text-sky-400" />
                                    <span className="text-xs font-bold text-slate-300">Hero Slider:</span>
                                    <div className="flex gap-1.5">
                                      {sliderSlides.map((_, sIdx) => (
                                        <button
                                          key={sIdx}
                                          type="button"
                                          onClick={() => setActiveSlideIdx(sIdx)}
                                          className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                                            activeSlideIdx === sIdx
                                              ? "bg-sky-500 text-white shadow-md ring-2 ring-sky-400/40"
                                              : "bg-slate-800 text-slate-400 hover:text-white"
                                          }`}
                                        >
                                          Slide {sIdx + 1}
                                        </button>
                                      ))}
                                    </div>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newSlide: HeroSlide = {
                                          id: `slide-${Date.now()}`,
                                          desktopImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&auto=format&fit=crop&q=80",
                                          mobileImage: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
                                          title: "NEW INDUSTRIAL SOLUTION",
                                          subtitle: "Custom engineered automation components and systems",
                                          ctaText: "Explore More",
                                          ctaUrl: "/products",
                                          isActive: true,
                                          sortOrder: sliderSlides.length + 1,
                                        };
                                        const updated = [...sliderSlides, newSlide];
                                        updateSectionContent(secId, updated, "Add Hero Slide");
                                        setActiveSlideIdx(sliderSlides.length);
                                        addToast("info", "New Slide Added", "You can now edit its text and background image.");
                                      }}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-600/30 hover:bg-sky-600 text-sky-300 hover:text-white text-xs font-bold border border-sky-500/40 cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add Slide</span>
                                    </button>
                                  </div>

                                  {sliderSlides.length > 1 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this slide?")) {
                                          const updated = sliderSlides.filter((_, idx) => idx !== activeSlideIdx);
                                          updateSectionContent(secId, updated, "Delete Hero Slide");
                                          setActiveSlideIdx(0);
                                        }
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white text-xs font-bold border border-rose-500/30 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Delete Slide</span>
                                    </button>
                                  )}
                                </div>

                                {/* Active Slide Canvas Card */}
                                <div className="relative rounded-2xl overflow-hidden border border-slate-800 min-h-[380px] flex items-center p-8 sm:p-12 bg-slate-950 group">
                                  {/* Background Editable Image */}
                                  <div className="absolute inset-0 w-full h-full opacity-40">
                                    <EditableImage
                                      src={activeSlide.desktopImage}
                                      onChange={(newSrc) => {
                                        const copy = [...sliderSlides];
                                        copy[activeSlideIdx] = { ...copy[activeSlideIdx], desktopImage: newSrc, mobileImage: newSrc };
                                        updateSectionContent(secId, copy, "Edit Slide Image");
                                      }}
                                      fill
                                      label="Click to replace slide background image"
                                    />
                                  </div>

                                  {/* Navigation Arrows */}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveSlideIdx((prev) =>
                                        prev === 0 ? sliderSlides.length - 1 : prev - 1
                                      )
                                    }
                                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 hover:bg-sky-600 text-white border border-slate-700 flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
                                  >
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveSlideIdx((prev) =>
                                        prev === sliderSlides.length - 1 ? 0 : prev + 1
                                      )
                                    }
                                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-950/80 hover:bg-sky-600 text-white border border-slate-700 flex items-center justify-center shadow-lg transition-all z-20 cursor-pointer"
                                  >
                                    <ChevronRight className="w-5 h-5" />
                                  </button>

                                  {/* Slide Content */}
                                  <div className="relative z-10 max-w-2xl space-y-4">
                                    <div className="inline-block bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold px-2.5 py-1 rounded uppercase tracking-wider">
                                      SLIDE #{activeSlideIdx + 1}
                                    </div>

                                    <InlineEditable
                                      as="h2"
                                      value={activeSlide.title}
                                      onChange={(val) => {
                                        const copy = [...sliderSlides];
                                        copy[activeSlideIdx] = { ...copy[activeSlideIdx], title: val };
                                        updateSectionContent(secId, copy, "Edit Slide Title");
                                      }}
                                      className="text-2xl sm:text-4xl font-black text-white tracking-tight font-heading"
                                      label="Slide Title"
                                    />

                                    <InlineEditable
                                      as="p"
                                      value={activeSlide.subtitle}
                                      onChange={(val) => {
                                        const copy = [...sliderSlides];
                                        copy[activeSlideIdx] = { ...copy[activeSlideIdx], subtitle: val };
                                        updateSectionContent(secId, copy, "Edit Slide Subtitle");
                                      }}
                                      multiline
                                      className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl"
                                      label="Slide Subtitle"
                                    />

                                    <div className="pt-2">
                                      <div className="inline-flex items-center gap-2 bg-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow">
                                        <EditableLink
                                          label={activeSlide.ctaText || "Explore Catalog"}
                                          href={activeSlide.ctaUrl || "/products"}
                                          onChange={(newLabel, newHref) => {
                                            const copy = [...sliderSlides];
                                            copy[activeSlideIdx] = {
                                              ...copy[activeSlideIdx],
                                              ctaText: newLabel,
                                              ctaUrl: newHref,
                                            };
                                            updateSectionContent(secId, copy, "Edit Slide CTA");
                                          }}
                                          className="text-white font-bold text-xs"
                                          fieldTitle={`Slide #${activeSlideIdx + 1} CTA Button`}
                                        />
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-showcases": {
                          const showcasesList = (
                            Array.isArray(instanceData)
                              ? instanceData
                              : (instanceData?.categoryShowcases || homepageState.categoryShowcases || DEFAULT_CATEGORY_SHOWCASES)
                          ) as CategoryShowcaseConfig[];

                          const resolvedShowcases = showcasesList
                            .filter((s) => s.isActive)
                            .map((showcase, index) => {
                              const matchedCat = categories.find((c) => c.id === showcase.categoryId || c.slug === showcase.categoryId);
                              const catName = matchedCat?.name || showcase.customTitle || `Featured Category #${index + 1}`;
                              const catSlug = matchedCat?.slug || showcase.categoryId || "products";

                              let catProducts = products.filter((p) => {
                                if (!matchedCat) return true;
                                return (
                                  p.categoryId === matchedCat.id ||
                                  p.categoryId === matchedCat.slug ||
                                  p.categoryIds?.includes(matchedCat.id) ||
                                  p.categoryIds?.includes(matchedCat.slug)
                                );
                              });

                              if (catProducts.length === 0 && products.length > 0) {
                                const start = (index * 4) % products.length;
                                catProducts = products.slice(start, start + 8);
                                if (catProducts.length < 4) {
                                  catProducts = products.slice(0, 8);
                                }
                              }

                              return {
                                showcase,
                                index,
                                categoryName: catName,
                                categorySlug: catSlug,
                                products: catProducts,
                              };
                            });

                          return (
                            <div id="sec-showcases" className="bg-[#faf9f5] divide-y divide-slate-200">
                              {resolvedShowcases.map(({ showcase, index, categoryName, categorySlug, products: catProducts }) => {
                                const displayTitle = showcase.customTitle || categoryName;
                                return (
                                  <section key={showcase.id || index} className="py-10 px-4">
                                    <div className="max-w-7xl mx-auto space-y-6">
                                      {/* Header Row */}
                                      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                        <div className="space-y-0.5">
                                          <div className="flex items-center gap-1.5 text-xs font-mono uppercase font-bold text-amber-600 tracking-wider">
                                            <Sparkles className="w-3.5 h-3.5" />
                                            <InlineEditable
                                              value={showcase.eyebrow || "Explore Collection"}
                                              onChange={(val) => {
                                                const copy = [...showcasesList];
                                                copy[index] = { ...copy[index], eyebrow: val };
                                                updateSectionContent(secId, copy, "Edit Showcase Eyebrow");
                                              }}
                                              label="Showcase Eyebrow Text"
                                            />
                                          </div>

                                          <InlineEditable
                                            as="h2"
                                            value={showcase.customTitle || categoryName}
                                            onChange={(val) => {
                                              const copy = [...showcasesList];
                                              copy[index] = { ...copy[index], customTitle: val };
                                              updateSectionContent(secId, copy, "Edit Showcase Title");
                                            }}
                                            className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading"
                                            label="Showcase Section Title"
                                          />
                                        </div>

                                        <div className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-amber-600">
                                          <EditableLink
                                            label={showcase.viewAllText || "View All"}
                                            href={showcase.viewAllUrl || `/category/${categorySlug}`}
                                            onChange={(newLabel, newHref) => {
                                              const copy = [...showcasesList];
                                              copy[index] = {
                                                ...copy[index],
                                                viewAllText: newLabel,
                                                viewAllUrl: newHref,
                                              };
                                              updateSectionContent(secId, copy, "Edit Showcase View All");
                                            }}
                                            fieldTitle={`${displayTitle} - View All Action`}
                                          />
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </div>
                                      </div>

                                      {/* Banner Card with EditableImage */}
                                      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 p-6 sm:p-8 text-white min-h-[190px] flex items-center">
                                        <div className="absolute inset-0 w-full h-full opacity-40">
                                          <EditableImage
                                            src={showcase.heroImage}
                                            onChange={(newSrc) => {
                                              const copy = [...showcasesList];
                                              copy[index] = { ...copy[index], heroImage: newSrc };
                                              updateSectionContent(secId, copy, "Edit Showcase Banner Image");
                                            }}
                                            fill
                                            label="Click to replace showcase banner image"
                                          />
                                        </div>

                                        <div className="relative z-10 max-w-xl space-y-2">
                                          <div className="inline-block bg-amber-400 text-slate-950 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                            <InlineEditable
                                              value={showcase.bannerBadge || "Featured Category"}
                                              onChange={(val) => {
                                                const copy = [...showcasesList];
                                                copy[index] = { ...copy[index], bannerBadge: val };
                                                updateSectionContent(secId, copy, "Edit Showcase Banner Badge");
                                              }}
                                              label="Banner Badge Tag"
                                            />
                                          </div>

                                          <InlineEditable
                                            as="h3"
                                            value={showcase.bannerTitle || displayTitle}
                                            onChange={(val) => {
                                              const copy = [...showcasesList];
                                              copy[index] = { ...copy[index], bannerTitle: val };
                                              updateSectionContent(secId, copy, "Edit Showcase Banner Title");
                                            }}
                                            className="text-lg sm:text-2xl font-black text-white tracking-tight font-heading"
                                            label="Banner Headline Title"
                                          />

                                          <InlineEditable
                                            as="p"
                                            value={
                                              showcase.bannerDescription ||
                                              `Browse our certified, high-performance line of ${categoryName} hardware components.`
                                            }
                                            onChange={(val) => {
                                              const copy = [...showcasesList];
                                              copy[index] = { ...copy[index], bannerDescription: val };
                                              updateSectionContent(secId, copy, "Edit Showcase Banner Description");
                                            }}
                                            multiline
                                            className="text-xs sm:text-sm text-slate-200 line-clamp-2"
                                            label="Banner Description Paragraph"
                                          />
                                        </div>
                                      </div>

                                      {/* Carousel */}
                                      <CategoryProductCarousel products={catProducts} />
                                    </div>
                                  </section>
                                );
                              })}
                            </div>
                          );
                        }

                        case "sec-brand-marquee": {
                          const marqueeData = (instanceData || homepageState.brandMarquee || DEFAULT_BRAND_MARQUEE) as BrandMarqueeConfig;

                          return (
                            <section id="sec-brand-marquee" className="bg-slate-900 border-y border-slate-800 py-6 px-4 overflow-hidden text-white">
                              <div className="max-w-7xl mx-auto space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <div className="flex items-center gap-2 text-xs font-mono uppercase font-bold tracking-widest text-slate-400">
                                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                                    <InlineEditable
                                      value={marqueeData.eyebrow || "Authorized OEM Brand Distribution Partners"}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...marqueeData, eyebrow: val }, "Edit Marquee Eyebrow")
                                      }
                                      label="Brand Marquee Eyebrow"
                                    />
                                  </div>

                                  <div className="flex items-center gap-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newBrand = {
                                          id: `brand-${Date.now()}`,
                                          name: "New Partner",
                                          country: "Global",
                                          url: "/products",
                                        };
                                        const copy = [...(marqueeData.brands || []), newBrand];
                                        updateSectionContent(secId, { ...marqueeData, brands: copy }, "Add Brand");
                                      }}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-600/20 text-sky-400 hover:bg-sky-600 hover:text-white text-[10px] font-bold border border-sky-500/30 cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                      <span>Add Brand</span>
                                    </button>

                                    <div className="text-[10px] font-mono text-slate-500 hidden sm:inline">
                                      <InlineEditable
                                        value={marqueeData.note || "[Official licensing placeholder]"}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...marqueeData, note: val }, "Edit Brand Note")
                                        }
                                        label="Brand Note"
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Brand Badges */}
                                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
                                  {(marqueeData.brands || DEFAULT_BRAND_MARQUEE.brands).map((brand, bIdx) => (
                                    <div
                                      key={brand.id || bIdx}
                                      className="group/badge relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 whitespace-nowrap shrink-0 hover:border-slate-700 hover:bg-slate-900 transition-all"
                                    >
                                      <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                                      <EditableLink
                                        label={brand.name}
                                        href={brand.url || "/products"}
                                        onChange={(newLabel, newHref) => {
                                          const copy = [...(marqueeData.brands || DEFAULT_BRAND_MARQUEE.brands)];
                                          copy[bIdx] = { ...copy[bIdx], name: newLabel, url: newHref };
                                          updateSectionContent(secId, { ...marqueeData, brands: copy }, "Edit Brand");
                                        }}
                                        onDelete={() => {
                                          const brandsList = marqueeData.brands || DEFAULT_BRAND_MARQUEE.brands;
                                          const copy = brandsList.filter((_, idx) => idx !== bIdx);
                                          updateSectionContent(secId, { ...marqueeData, brands: copy }, "Delete Brand");
                                          addToast("info", "Brand Partner Removed", `Removed ${brand.name} from brand marquee.`);
                                        }}
                                        className="font-mono font-extrabold text-sm tracking-wider uppercase text-white"
                                        fieldTitle={`Brand Partner #${bIdx + 1} (${brand.name}) Link & Action`}
                                      />
                                      {brand.country && (
                                        <span className="text-[10px] font-mono text-slate-500">
                                          (
                                          <InlineEditable
                                            value={brand.country}
                                            onChange={(val) => {
                                              const copy = [...(marqueeData.brands || DEFAULT_BRAND_MARQUEE.brands)];
                                              copy[bIdx] = { ...copy[bIdx], country: val };
                                              updateSectionContent(secId, { ...marqueeData, brands: copy }, "Edit Brand Country");
                                            }}
                                            label={`Brand #${bIdx + 1} Country`}
                                          />
                                          )
                                        </span>
                                      )}

                                      {/* Direct Badge Delete Button */}
                                      {(marqueeData.brands || DEFAULT_BRAND_MARQUEE.brands).length > 1 && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            const brandsList = marqueeData.brands || DEFAULT_BRAND_MARQUEE.brands;
                                            const copy = brandsList.filter((_, idx) => idx !== bIdx);
                                            updateSectionContent(secId, { ...marqueeData, brands: copy }, "Delete Brand");
                                            addToast("info", "Brand Partner Removed", `Removed ${brand.name} from brand marquee.`);
                                          }}
                                          className="ml-1 p-1 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                                          title={`Delete brand ${brand.name}`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-cinematic": {
                          const orbitData = (instanceData || homepageState.orbitStage || DEFAULT_ORBIT_STAGE) as OrbitStageConfig;

                          return (
                            <section id="sec-cinematic" className="relative w-full py-12 sm:py-20 bg-slate-950 text-white font-sans border-b border-slate-800/80 overflow-hidden min-h-[85vh] flex flex-col justify-between">
                              {/* Header Area */}
                              <div className="relative z-30 text-center max-w-3xl mx-auto space-y-2.5 px-4">
                                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-semibold uppercase tracking-wider shadow-inner">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <InlineEditable
                                    value={orbitData.eyebrow}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...orbitData, eyebrow: val }, "Edit 3D Stage Eyebrow")
                                    }
                                    label="3D Orbit Section Eyebrow"
                                  />
                                </div>

                                <InlineEditable
                                  as="h2"
                                  value={orbitData.title}
                                  onChange={(val) =>
                                    updateSectionContent(secId, { ...orbitData, title: val }, "Edit 3D Stage Title")
                                  }
                                  className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white font-mono"
                                  label="3D Orbit Section Headline"
                                />

                                <InlineEditable
                                  as="p"
                                  value={orbitData.subtitle}
                                  onChange={(val) =>
                                    updateSectionContent(secId, { ...orbitData, subtitle: val }, "Edit 3D Stage Subtitle")
                                  }
                                  multiline
                                  className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto"
                                  label="3D Orbit Section Subtitle"
                                />
                              </div>

                              {/* Central 3D Stage */}
                              <div className="relative flex-1 w-full my-4 flex items-center justify-center">
                                <CinematicProductStage
                                  products={orbitProducts}
                                  progress={orbitProgress}
                                  isReducedMotion={false}
                                />
                              </div>

                              {/* Bottom Active Orbit Product Bar */}
                              <div className="relative z-30 max-w-4xl mx-auto w-full text-center space-y-4 px-4">
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                                    <Tag className="w-3.5 h-3.5" />
                                    <InlineEditable
                                      value={activeOrbitProd.category}
                                      onChange={(val) => {
                                        const prods = [...(orbitData.products || DEFAULT_ORBIT_STAGE.products || [])];
                                        prods[activeOrbitIdx] = { ...prods[activeOrbitIdx], category: val };
                                        updateSectionContent(secId, { ...orbitData, products: prods }, "Edit Orbit Product Category");
                                      }}
                                      className="text-amber-400 uppercase tracking-widest font-mono font-bold"
                                      label={`Product #${activeOrbitIdx + 1} Category Tag`}
                                    />
                                    <span className="text-slate-600">•</span>
                                    <InlineEditable
                                      value={activeOrbitProd.sku}
                                      onChange={(val) => {
                                        const prods = [...(orbitData.products || DEFAULT_ORBIT_STAGE.products || [])];
                                        prods[activeOrbitIdx] = { ...prods[activeOrbitIdx], sku: val };
                                        updateSectionContent(secId, { ...orbitData, products: prods }, "Edit Orbit Product SKU");
                                      }}
                                      className="text-slate-300 font-mono font-bold"
                                      label={`Product #${activeOrbitIdx + 1} SKU`}
                                    />
                                  </div>

                                  <InlineEditable
                                    as="h3"
                                    value={activeOrbitProd.name}
                                    onChange={(val) => {
                                      const prods = [...(orbitData.products || DEFAULT_ORBIT_STAGE.products || [])];
                                      prods[activeOrbitIdx] = { ...prods[activeOrbitIdx], name: val };
                                      updateSectionContent(secId, { ...orbitData, products: prods }, "Edit Orbit Product Name");
                                    }}
                                    className="text-xl sm:text-3xl font-bold text-white tracking-tight"
                                    label={`Product #${activeOrbitIdx + 1} Name`}
                                  />

                                  <InlineEditable
                                    as="p"
                                    value={activeOrbitProd.subtitle}
                                    onChange={(val) => {
                                      const prods = [...(orbitData.products || DEFAULT_ORBIT_STAGE.products || [])];
                                      prods[activeOrbitIdx] = { ...prods[activeOrbitIdx], subtitle: val };
                                      updateSectionContent(secId, { ...orbitData, products: prods }, "Edit Orbit Product Subtitle");
                                    }}
                                    className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto"
                                    label={`Product #${activeOrbitIdx + 1} Subtitle`}
                                  />

                                  {/* Specifications Rail */}
                                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                                    <span className="text-base sm:text-lg font-extrabold font-mono text-amber-400 bg-amber-500/10 px-3 py-0.5 rounded-lg border border-amber-500/20">
                                      <InlineEditable
                                        value={activeOrbitProd.price}
                                        onChange={(val) => {
                                          const prods = [...(orbitData.products || DEFAULT_ORBIT_STAGE.products || [])];
                                          prods[activeOrbitIdx] = { ...prods[activeOrbitIdx], price: val };
                                          updateSectionContent(secId, { ...orbitData, products: prods }, "Edit Orbit Product Price");
                                        }}
                                        className="text-amber-400 font-extrabold font-mono"
                                        label={`Product #${activeOrbitIdx + 1} Price`}
                                      />
                                    </span>
                                    {(activeOrbitProd.specs || []).map((spec, i) => (
                                      <div
                                        key={i}
                                        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300"
                                      >
                                        <CheckCircle className="w-3 h-3 text-emerald-400" />
                                        <InlineEditable
                                          value={spec.label}
                                          onChange={(val) => {
                                            const prods = [...(orbitData.products || DEFAULT_ORBIT_STAGE.products || [])];
                                            const specs = [...(prods[activeOrbitIdx].specs || [])];
                                            specs[i] = { ...specs[i], label: val };
                                            prods[activeOrbitIdx] = { ...prods[activeOrbitIdx], specs };
                                            updateSectionContent(secId, { ...orbitData, products: prods }, "Edit Orbit Product Spec");
                                          }}
                                          className="text-slate-400"
                                          label={`Product #${activeOrbitIdx + 1} Spec #${i + 1} Label`}
                                        />
                                        <span className="text-slate-500">:</span>
                                        <InlineEditable
                                          value={spec.value}
                                          onChange={(val) => {
                                            const prods = [...(orbitData.products || DEFAULT_ORBIT_STAGE.products || [])];
                                            const specs = [...(prods[activeOrbitIdx].specs || [])];
                                            specs[i] = { ...specs[i], value: val };
                                            prods[activeOrbitIdx] = { ...prods[activeOrbitIdx], specs };
                                            updateSectionContent(secId, { ...orbitData, products: prods }, "Edit Orbit Product Spec");
                                          }}
                                          className="font-semibold text-white"
                                          label={`Product #${activeOrbitIdx + 1} Spec #${i + 1} Value`}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>

                                {/* Controls */}
                                <div className="flex items-center justify-center gap-3 pt-2">
                                  <button
                                    type="button"
                                    onClick={() => setIsOrbitPlaying(!isOrbitPlaying)}
                                    className="p-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                                  >
                                    {isOrbitPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    {orbitProducts.map((p, idx) => (
                                      <button
                                        key={p.id}
                                        type="button"
                                        onClick={() => {
                                          const currentBase = Math.floor(orbitProgress / numOrbitProds) * numOrbitProds;
                                          setOrbitProgress(currentBase + idx);
                                        }}
                                        className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                                          activeOrbitIdx === idx
                                            ? "w-8 bg-amber-400 shadow-md shadow-amber-400/40"
                                            : "w-2 bg-slate-700 hover:bg-slate-500"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-categories-grid": {
                          const gridData = (instanceData || homepageState.categoryGrid || DEFAULT_CATEGORY_GRID) as CategoryGridConfig;

                          return (
                            <section id="sec-categories-grid" className="py-16 px-4 bg-[#faf9f5] text-slate-900 border-b border-slate-200">
                              <div className="max-w-7xl mx-auto space-y-10">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                                  <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-sky-600 mb-1">
                                      <Layers className="w-4 h-4" />
                                      <InlineEditable
                                        value={gridData.eyebrow || "Core Hardware Categories"}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...gridData, eyebrow: val }, "Edit Category Grid Eyebrow")
                                        }
                                        label="Categories Grid Eyebrow"
                                      />
                                    </div>
                                    <InlineEditable
                                      as="h2"
                                      value={gridData.title || "Shop by Industrial Domain"}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...gridData, title: val }, "Edit Category Grid Title")
                                      }
                                      className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading"
                                      label="Categories Grid Title"
                                    />
                                  </div>
                                  <InlineEditable
                                    as="p"
                                    value={
                                      gridData.subtitle ||
                                      "Architect your control system with 1,500+ stocked components classified by sensing precision, PLC logic execution, and power drive specs."
                                    }
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...gridData, subtitle: val }, "Edit Category Grid Subtitle")
                                    }
                                    multiline
                                    className="text-xs sm:text-sm text-slate-600 max-w-md"
                                    label="Categories Grid Subtitle"
                                  />
                                </div>

                                {/* 3 Domain Cards */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                  {(gridData.categories || DEFAULT_CATEGORY_GRID.categories).map((cat, cIdx) => (
                                    <div
                                      key={cat.id || cIdx}
                                      className="bg-white rounded-3xl p-8 border border-slate-200 shadow-md space-y-4"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-sky-400 flex items-center justify-center font-bold">
                                          {cIdx === 0 ? <Radio className="w-6 h-6" /> : cIdx === 1 ? <Cpu className="w-6 h-6" /> : <Zap className="w-6 h-6" />}
                                        </div>
                                        <span className="font-mono text-xs font-bold uppercase px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                                          <InlineEditable
                                            value={String(cat.itemCount)}
                                            onChange={(val) => {
                                              const copy = [...(gridData.categories || [])];
                                              copy[cIdx] = { ...copy[cIdx], itemCount: Number(val) || 0 };
                                              updateSectionContent(secId, { ...gridData, categories: copy }, "Edit Category Item Count");
                                            }}
                                            label={`Category #${cIdx + 1} Item Count`}
                                          />
                                          + Items
                                        </span>
                                      </div>

                                      <div className="space-y-1">
                                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-600">
                                          <InlineEditable
                                            value={cat.badge}
                                            onChange={(val) => {
                                              const copy = [...(gridData.categories || [])];
                                              copy[cIdx] = { ...copy[cIdx], badge: val };
                                              updateSectionContent(secId, { ...gridData, categories: copy }, "Edit Category Badge");
                                            }}
                                            label={`Category #${cIdx + 1} Badge`}
                                          />
                                        </span>
                                        <InlineEditable
                                          as="h3"
                                          value={cat.name}
                                          onChange={(val) => {
                                            const copy = [...(gridData.categories || [])];
                                            copy[cIdx] = { ...copy[cIdx], name: val };
                                            updateSectionContent(secId, { ...gridData, categories: copy }, "Edit Category Name");
                                          }}
                                          className="text-xl font-bold text-slate-900"
                                          label={`Category #${cIdx + 1} Name`}
                                        />
                                      </div>

                                      <InlineEditable
                                        as="p"
                                        value={cat.description}
                                        onChange={(val) => {
                                          const copy = [...(gridData.categories || [])];
                                          copy[cIdx] = { ...copy[cIdx], description: val };
                                          updateSectionContent(secId, { ...gridData, categories: copy }, "Edit Category Description");
                                        }}
                                        multiline
                                        className="text-xs text-slate-600 leading-relaxed"
                                        label={`Category #${cIdx + 1} Description`}
                                      />

                                      <div className="space-y-1.5 pt-2">
                                        {(cat.subcategories || []).map((sub, sIdx) => (
                                          <div key={sIdx} className="text-xs text-slate-700 font-medium flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                                            <InlineEditable
                                              value={sub}
                                              onChange={(val) => {
                                                const catCopy = [...(gridData.categories || [])];
                                                const subCopy = [...(catCopy[cIdx].subcategories || [])];
                                                subCopy[sIdx] = val;
                                                catCopy[cIdx] = { ...catCopy[cIdx], subcategories: subCopy };
                                                updateSectionContent(secId, { ...gridData, categories: catCopy }, "Edit Subcategory");
                                              }}
                                              label={`Subcategory Tag #${sIdx + 1}`}
                                            />
                                          </div>
                                        ))}
                                      </div>

                                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                        <EditableLink
                                          label="Explore Category"
                                          href={`/category/${cat.slug || cat.id}`}
                                          onChange={(newLabel, newHref) => {
                                            const copy = [...(gridData.categories || [])];
                                            copy[cIdx] = { ...copy[cIdx], slug: newHref.replace("/category/", "") };
                                            updateSectionContent(secId, { ...gridData, categories: copy }, "Edit Category Link");
                                          }}
                                          className="font-mono text-xs font-bold text-sky-600 hover:text-sky-800 flex items-center gap-1.5"
                                          fieldTitle={`Category #${cIdx + 1} (${cat.name}) Link`}
                                        >
                                          <span>Explore Category</span>
                                          <ArrowRight className="w-3.5 h-3.5" />
                                        </EditableLink>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-top-fundamentals": {
                          const fundamentalsData = (instanceData || homepageState.topFundamentals || DEFAULT_TOP_FUNDAMENTALS) as TopFundamentalsConfig;

                          return (
                            <div key={secId} id={secId} className="relative group">
                              <TopFundamentals config={fundamentalsData} />
                            </div>
                          );
                        }

                        case "sec-featured-catalog": {
                          const featuredData = (instanceData || homepageState.featuredCatalog || DEFAULT_FEATURED_CATALOG) as FeaturedCatalogConfig;

                          return (
                            <section id="sec-featured-catalog" className="py-16 px-4 bg-white border-b border-slate-200">
                              <div className="max-w-7xl mx-auto space-y-8">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                                  <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-sky-600 mb-1">
                                      <Sparkles className="w-4 h-4" />
                                      <InlineEditable
                                        value={featuredData.eyebrow || "Live Database Catalog"}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...featuredData, eyebrow: val }, "Edit Featured Catalog Eyebrow")
                                        }
                                        label="Featured Catalog Eyebrow"
                                      />
                                    </div>
                                    <InlineEditable
                                      as="h2"
                                      value={featuredData.title || "Featured Industrial Components"}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...featuredData, title: val }, "Edit Featured Catalog Title")
                                      }
                                      className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading"
                                      label="Featured Catalog Title"
                                    />
                                  </div>

                                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                    {/* Filter Tabs Labels */}
                                    <div className="flex items-center gap-2 p-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs">
                                      <span className="px-3 py-1.5 rounded-full bg-slate-900 text-white font-bold">
                                        <InlineEditable
                                          value={featuredData.allTabLabel || "All Top Components"}
                                          onChange={(val) =>
                                            updateSectionContent(secId, { ...featuredData, allTabLabel: val }, "Edit Tab Label")
                                          }
                                          label="All Tab Label"
                                        />
                                      </span>
                                      <span className="px-3 py-1.5 text-slate-600 font-medium">
                                        <InlineEditable
                                          value={featuredData.sensorsTabLabel || "Sensors"}
                                          onChange={(val) =>
                                            updateSectionContent(secId, { ...featuredData, sensorsTabLabel: val }, "Edit Tab Label")
                                          }
                                          label="Sensors Tab Label"
                                        />
                                      </span>
                                      <span className="px-3 py-1.5 text-slate-600 font-medium">
                                        <InlineEditable
                                          value={featuredData.plcsTabLabel || "PLCs"}
                                          onChange={(val) =>
                                            updateSectionContent(secId, { ...featuredData, plcsTabLabel: val }, "Edit Tab Label")
                                          }
                                          label="PLCs Tab Label"
                                        />
                                      </span>
                                      <span className="px-3 py-1.5 text-slate-600 font-medium">
                                        <InlineEditable
                                          value={featuredData.motorsTabLabel || "Motors & Drives"}
                                          onChange={(val) =>
                                            updateSectionContent(secId, { ...featuredData, motorsTabLabel: val }, "Edit Tab Label")
                                          }
                                          label="Motors Tab Label"
                                        />
                                      </span>
                                    </div>

                                    <EditableLink
                                      label="View All Products"
                                      href="/products"
                                      onChange={() => {}}
                                      className="font-mono text-xs font-bold text-sky-600 hover:text-sky-800 shrink-0"
                                      fieldTitle="Featured Catalog View All Link"
                                    >
                                      <span>View All Products</span>
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </EditableLink>
                                  </div>
                                </div>
                                <CategoryProductCarousel products={products.slice(0, 8)} />
                              </div>
                            </section>
                          );
                        }

                        case "sec-solutions": {
                          const solutionsData = (instanceData || homepageState.solutionsShowcase || DEFAULT_SOLUTIONS_SHOWCASE) as SolutionsShowcaseConfig;
                          const activeVert = (solutionsData.verticals || [])[selectedVerticalIdx] || (solutionsData.verticals || [])[0] || DEFAULT_SOLUTIONS_SHOWCASE.verticals[0];

                          return (
                            <section id="sec-solutions" className="py-16 px-4 bg-slate-950 text-white border-b border-slate-800">
                              <div className="max-w-7xl mx-auto space-y-10">
                                <div className="text-center max-w-3xl mx-auto space-y-3">
                                  <span className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-sky-400 bg-sky-500/10 px-3.5 py-1.5 rounded-full border border-sky-500/20">
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    <InlineEditable
                                      value={solutionsData.eyebrow}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...solutionsData, eyebrow: val }, "Edit Solutions Eyebrow")
                                      }
                                      label="Solutions Eyebrow"
                                    />
                                  </span>
                                  <InlineEditable
                                    as="h2"
                                    value={solutionsData.title}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...solutionsData, title: val }, "Edit Solutions Title")
                                    }
                                    className="text-2xl sm:text-3xl font-bold font-mono text-white"
                                    label="Solutions Title"
                                  />
                                  <InlineEditable
                                    as="p"
                                    value={solutionsData.subtitle}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...solutionsData, subtitle: val }, "Edit Solutions Subtitle")
                                    }
                                    multiline
                                    className="text-xs sm:text-sm text-slate-300"
                                    label="Solutions Subtitle"
                                  />
                                </div>

                                {/* Verticals Switcher */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                  {(solutionsData.verticals || []).map((vert, vIdx) => (
                                    <div
                                      key={vert.id || vIdx}
                                      onClick={() => setSelectedVerticalIdx(vIdx)}
                                      className={`p-5 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                                        selectedVerticalIdx === vIdx
                                          ? "bg-sky-600/20 border-sky-500 shadow-lg"
                                          : "bg-slate-900/80 border-slate-800 opacity-70 hover:opacity-100"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 rounded-xl bg-slate-800 text-sky-400 flex items-center justify-center font-bold">
                                          {vIdx === 0 ? <Factory className="w-5 h-5" /> : vIdx === 1 ? <Box className="w-5 h-5" /> : vIdx === 2 ? <Activity className="w-5 h-5" /> : <Truck className="w-5 h-5" />}
                                        </div>
                                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          <InlineEditable
                                            value={vert.stats}
                                            onChange={(val) => {
                                              const copy = [...(solutionsData.verticals || [])];
                                              copy[vIdx] = { ...copy[vIdx], stats: val };
                                              updateSectionContent(secId, { ...solutionsData, verticals: copy }, "Edit Vertical Stat");
                                            }}
                                            label={`Vertical #${vIdx + 1} Stat`}
                                          />
                                        </span>
                                      </div>

                                      <InlineEditable
                                        as="h4"
                                        value={vert.title}
                                        onChange={(val) => {
                                          const copy = [...(solutionsData.verticals || [])];
                                          copy[vIdx] = { ...copy[vIdx], title: val };
                                          updateSectionContent(secId, { ...solutionsData, verticals: copy }, "Edit Vertical Title");
                                        }}
                                        className="font-bold text-sm text-white"
                                        label={`Vertical #${vIdx + 1} Title`}
                                      />

                                      <InlineEditable
                                        as="p"
                                        value={vert.description}
                                        onChange={(val) => {
                                          const copy = [...(solutionsData.verticals || [])];
                                          copy[vIdx] = { ...copy[vIdx], description: val };
                                          updateSectionContent(secId, { ...solutionsData, verticals: copy }, "Edit Vertical Description");
                                        }}
                                        multiline
                                        className="text-[11px] text-slate-300 line-clamp-2"
                                        label={`Vertical #${vIdx + 1} Description`}
                                      />
                                    </div>
                                  ))}
                                </div>

                                {/* Active Vertical Bill of Materials (BOM Table Inline Editable) */}
                                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
                                    <div className="flex items-center gap-2">
                                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                                      <h3 className="font-mono font-bold text-sm text-white">
                                        Active Architecture Bill of Materials (BOM): {activeVert.title}
                                      </h3>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <EditableLink
                                        label="Request Architecture Package RFQ"
                                        href={`/quote?scope=${encodeURIComponent(activeVert.title)}`}
                                        onChange={() => {}}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold font-mono transition-colors"
                                        fieldTitle={`${activeVert.title} RFQ CTA Action`}
                                      >
                                        <span>Request Architecture RFQ</span>
                                        <ArrowRight className="w-3.5 h-3.5" />
                                      </EditableLink>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newRow = {
                                            partNo: "NEW-PART-001",
                                            name: "Custom Sensor / Module",
                                            category: "Automation",
                                            specs: "24V DC, IP67 rating",
                                            manufacturer: "OMRON",
                                          };
                                          const vCopy = [...(solutionsData.verticals || [])];
                                          const bomCopy = [...(vCopy[selectedVerticalIdx].bom || []), newRow];
                                          vCopy[selectedVerticalIdx] = { ...vCopy[selectedVerticalIdx], bom: bomCopy };
                                          updateSectionContent(secId, { ...solutionsData, verticals: vCopy }, "Add BOM Item");
                                        }}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>Add BOM Item</span>
                                      </button>
                                    </div>
                                  </div>

                                  <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-950">
                                    <table className="w-full text-left text-xs font-mono">
                                      <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
                                        <tr>
                                          <th className="p-3">Part Number</th>
                                          <th className="p-3">Component Name</th>
                                          <th className="p-3">Category</th>
                                          <th className="p-3">Specifications</th>
                                          <th className="p-3">Brand</th>
                                          <th className="p-3 text-right">Action</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800 text-slate-300">
                                        {(activeVert.bom || []).map((bomRow, rIdx) => (
                                          <tr key={rIdx} className="hover:bg-slate-900/50 transition-colors">
                                            <td className="p-3 text-sky-400 font-bold">
                                              <InlineEditable
                                                value={bomRow.partNo}
                                                onChange={(val) => {
                                                  const vCopy = [...(solutionsData.verticals || [])];
                                                  const bCopy = [...(vCopy[selectedVerticalIdx].bom || [])];
                                                  bCopy[rIdx] = { ...bCopy[rIdx], partNo: val };
                                                  vCopy[selectedVerticalIdx] = { ...vCopy[selectedVerticalIdx], bom: bCopy };
                                                  updateSectionContent(secId, { ...solutionsData, verticals: vCopy }, "Edit Part Number");
                                                }}
                                                label="Part Number"
                                              />
                                            </td>
                                            <td className="p-3 text-white">
                                              <InlineEditable
                                                value={bomRow.name}
                                                onChange={(val) => {
                                                  const vCopy = [...(solutionsData.verticals || [])];
                                                  const bCopy = [...(vCopy[selectedVerticalIdx].bom || [])];
                                                  bCopy[rIdx] = { ...bCopy[rIdx], name: val };
                                                  vCopy[selectedVerticalIdx] = { ...vCopy[selectedVerticalIdx], bom: bCopy };
                                                  updateSectionContent(secId, { ...solutionsData, verticals: vCopy }, "Edit Component Name");
                                                }}
                                                label="Component Name"
                                              />
                                            </td>
                                            <td className="p-3">
                                              <InlineEditable
                                                value={bomRow.category}
                                                onChange={(val) => {
                                                  const vCopy = [...(solutionsData.verticals || [])];
                                                  const bCopy = [...(vCopy[selectedVerticalIdx].bom || [])];
                                                  bCopy[rIdx] = { ...bCopy[rIdx], category: val };
                                                  vCopy[selectedVerticalIdx] = { ...vCopy[selectedVerticalIdx], bom: bCopy };
                                                  updateSectionContent(secId, { ...solutionsData, verticals: vCopy }, "Edit Category");
                                                }}
                                                label="Category"
                                              />
                                            </td>
                                            <td className="p-3 text-slate-400">
                                              <InlineEditable
                                                value={bomRow.specs}
                                                onChange={(val) => {
                                                  const vCopy = [...(solutionsData.verticals || [])];
                                                  const bCopy = [...(vCopy[selectedVerticalIdx].bom || [])];
                                                  bCopy[rIdx] = { ...bCopy[rIdx], specs: val };
                                                  vCopy[selectedVerticalIdx] = { ...vCopy[selectedVerticalIdx], bom: bCopy };
                                                  updateSectionContent(secId, { ...solutionsData, verticals: vCopy }, "Edit Specifications");
                                                }}
                                                label="Specifications"
                                              />
                                            </td>
                                            <td className="p-3">
                                              <span className="bg-slate-800 text-slate-200 px-2 py-0.5 rounded text-[10px] border border-slate-700">
                                                <InlineEditable
                                                  value={bomRow.manufacturer}
                                                  onChange={(val) => {
                                                    const vCopy = [...(solutionsData.verticals || [])];
                                                    const bCopy = [...(vCopy[selectedVerticalIdx].bom || [])];
                                                    bCopy[rIdx] = { ...bCopy[rIdx], manufacturer: val };
                                                    vCopy[selectedVerticalIdx] = { ...vCopy[selectedVerticalIdx], bom: bCopy };
                                                    updateSectionContent(secId, { ...solutionsData, verticals: vCopy }, "Edit Manufacturer");
                                                  }}
                                                  label="Manufacturer"
                                                />
                                              </span>
                                            </td>
                                            <td className="p-3 text-right">
                                              {(activeVert.bom || []).length > 1 && (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    const vCopy = [...(solutionsData.verticals || [])];
                                                    const bCopy = (vCopy[selectedVerticalIdx].bom || []).filter((_, idx) => idx !== rIdx);
                                                    vCopy[selectedVerticalIdx] = { ...vCopy[selectedVerticalIdx], bom: bCopy };
                                                    updateSectionContent(secId, { ...solutionsData, verticals: vCopy }, "Delete BOM Item");
                                                  }}
                                                  className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-assembly":
                          return <AssemblyScenePreview key={secId} />;

                        case "sec-why-buy": {
                          const whyBuyData = (instanceData || {}) as any;
                          const whyBuyList = (whyBuyData.whyBuy || whyBuyData.whyBuyFromUs || homepageState.whyBuy || DEFAULT_WHY_BUY) as WhyBuyItem[];
                          const whyBuyEyebrow = whyBuyData.whyBuyEyebrow || homepageState.whyBuyEyebrow || "VALUE GUARANTEE";
                          const whyBuyTitle = whyBuyData.whyBuyTitle || homepageState.whyBuyTitle || "Why Leading Engineering Teams Choose OM AUTOMATION";

                          return (
                            <section id="sec-why-buy" className="py-12 px-4 bg-white border-y border-slate-200">
                              <div className="max-w-7xl mx-auto space-y-8">
                                <div className="text-center max-w-6xl mx-auto space-y-2">
                                  <span className="text-xs font-mono font-bold text-amber-600 uppercase tracking-widest">
                                    <InlineEditable
                                      value={whyBuyEyebrow}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { whyBuy: whyBuyList, whyBuyEyebrow: val, whyBuyTitle }, "Edit Why Buy Eyebrow")
                                      }
                                      label="Value Guarantee Eyebrow"
                                    />
                                  </span>
                                  <InlineEditable
                                    as="h2"
                                    value={whyBuyTitle}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { whyBuy: whyBuyList, whyBuyEyebrow, whyBuyTitle: val }, "Edit Why Buy Title")
                                    }
                                    className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight font-heading leading-tight"
                                    label="Why Buy Section Title"
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                  {whyBuyList.map((item, wIdx) => (
                                    <div
                                      key={item.id || wIdx}
                                      className="p-6 rounded-2xl bg-[#faf9f5] border border-slate-200 space-y-2 hover:shadow-md transition-shadow"
                                    >
                                      <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-600 flex items-center justify-center font-bold text-xs font-mono">
                                        0{wIdx + 1}
                                      </div>

                                      <InlineEditable
                                        as="h3"
                                        value={item.title}
                                        onChange={(val) => {
                                          const copy = [...whyBuyList];
                                          copy[wIdx] = { ...copy[wIdx], title: val };
                                          updateSectionContent(secId, { whyBuy: copy, whyBuyEyebrow, whyBuyTitle }, "Edit Value Card Title");
                                        }}
                                        className="text-base font-bold text-slate-900"
                                        label={`Value Card #${wIdx + 1} Title`}
                                      />

                                      <InlineEditable
                                        as="p"
                                        value={item.description}
                                        onChange={(val) => {
                                          const copy = [...whyBuyList];
                                          copy[wIdx] = { ...copy[wIdx], description: val };
                                          updateSectionContent(secId, { whyBuy: copy, whyBuyEyebrow, whyBuyTitle }, "Edit Value Card Description");
                                        }}
                                        multiline
                                        className="text-xs text-slate-600 leading-relaxed"
                                        label={`Value Card #${wIdx + 1} Description`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-sticky-showcase": {
                          const stickyData = (instanceData || homepageState.stickyShowcase || DEFAULT_STICKY_SHOWCASE) as StickyShowcaseConfig;

                          return (
                            <section id="sec-sticky-showcase" className="py-12 px-4 bg-slate-950 text-white border-b border-slate-800">
                              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                <div className="lg:col-span-7 space-y-4">
                                  <div className="inline-block bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
                                    <InlineEditable
                                      value={stickyData.eyebrow}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...stickyData, eyebrow: val }, "Edit Sticky Showcase Eyebrow")
                                      }
                                      label="Sticky Showcase Eyebrow"
                                    />
                                  </div>

                                  <InlineEditable
                                    as="h2"
                                    value={stickyData.title}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...stickyData, title: val }, "Edit Sticky Showcase Title")
                                    }
                                    className="text-2xl sm:text-4xl font-black text-white tracking-tight font-heading"
                                    label="Sticky Showcase Title"
                                  />

                                  <InlineEditable
                                    as="p"
                                    value={stickyData.description}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...stickyData, description: val }, "Edit Sticky Showcase Description")
                                    }
                                    multiline
                                    className="text-sm text-slate-300 leading-relaxed"
                                    label="Sticky Showcase Description"
                                  />

                                  <div className="space-y-2 pt-2">
                                    {(stickyData.bullets || []).map((bullet, bIdx) => (
                                      <div key={bIdx} className="flex items-start gap-2 text-xs text-slate-200">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                        <InlineEditable
                                          value={bullet}
                                          onChange={(val) => {
                                            const copy = [...(stickyData.bullets || [])];
                                            copy[bIdx] = val;
                                            updateSectionContent(secId, { ...stickyData, bullets: copy }, "Edit Sticky Bullet");
                                          }}
                                          label={`Sticky Showcase Bullet #${bIdx + 1}`}
                                        />
                                      </div>
                                    ))}
                                  </div>

                                  <div className="pt-3">
                                    <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow">
                                      <EditableLink
                                        label={stickyData.ctaText}
                                        href={stickyData.ctaUrl || "/products"}
                                        onChange={(newLabel, newHref) =>
                                          updateSectionContent(
                                            secId,
                                            { ...stickyData, ctaText: newLabel, ctaUrl: newHref },
                                            "Edit Sticky CTA"
                                          )
                                        }
                                        className="text-slate-950 font-extrabold text-xs"
                                        fieldTitle="Sticky Flagship Controller CTA Button"
                                      />
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                </div>

                                {/* Flagship Controller Image */}
                                <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 aspect-video lg:aspect-square relative">
                                  <EditableImage
                                    src={stickyData.image}
                                    onChange={(newSrc) =>
                                      updateSectionContent(secId, { ...stickyData, image: newSrc }, "Edit Sticky Image")
                                    }
                                    fill
                                    label="Click to replace flagship controller image"
                                  />
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-best-sellers": {
                          const bestSellersData = (instanceData || homepageState.bestSellers || DEFAULT_BEST_SELLERS) as BestSellersConfig;

                          return (
                            <section id="sec-best-sellers" className="py-12 px-4 bg-[#faf9f5] border-b border-slate-200">
                              <div className="max-w-7xl mx-auto space-y-6">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-rose-600 mb-1">
                                      <Flame className="w-4 h-4 fill-rose-500" />
                                      <InlineEditable
                                        value={bestSellersData.eyebrow || "Highest B2B Demand"}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...bestSellersData, eyebrow: val }, "Edit Best Sellers Eyebrow")
                                        }
                                        label="Best Sellers Eyebrow"
                                      />
                                    </div>
                                    <InlineEditable
                                      as="h2"
                                      value={bestSellersData.title || "Top Best Sellers & Fast Movers"}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...bestSellersData, title: val }, "Edit Best Sellers Title")
                                      }
                                      className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading"
                                      label="Best Sellers Title"
                                    />
                                  </div>

                                  <EditableLink
                                    label="View All Fast Movers"
                                    href="/products"
                                    onChange={() => {}}
                                    className="font-mono text-xs font-bold text-rose-600 hover:text-rose-800"
                                    fieldTitle="Best Sellers View All Link"
                                  >
                                    <span>View All Fast Movers</span>
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                  </EditableLink>
                                </div>
                                <CategoryProductCarousel products={products.slice(0, 8)} />
                              </div>
                            </section>
                          );
                        }

                        case "sec-stats": {
                          const statsList = (
                            Array.isArray(instanceData)
                              ? instanceData
                              : (instanceData?.stats || homepageState.stats || DEFAULT_STATS)
                          ) as StatItem[];

                          return (
                            <section id="sec-stats" className="py-12 px-4 bg-slate-900 text-white border-b border-slate-800">
                              <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
                                {statsList.map((st, sIdx) => (
                                  <div key={st.id || sIdx} className="space-y-1 border-l-2 border-amber-400 pl-4">
                                    <InlineEditable
                                      as="div"
                                      value={st.value}
                                      onChange={(val) => {
                                        const copy = [...statsList];
                                        copy[sIdx] = { ...copy[sIdx], value: val };
                                        updateSectionContent(secId, copy, "Edit Stat Number");
                                      }}
                                      className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight"
                                      label={`Stat #${sIdx + 1} Number`}
                                    />

                                    <InlineEditable
                                      as="div"
                                      value={st.label}
                                      onChange={(val) => {
                                        const copy = [...statsList];
                                        copy[sIdx] = { ...copy[sIdx], label: val };
                                        updateSectionContent(secId, copy, "Edit Stat Label");
                                      }}
                                      className="text-xs font-bold text-white uppercase tracking-wider"
                                      label={`Stat #${sIdx + 1} Label`}
                                    />

                                    <InlineEditable
                                      as="div"
                                      value={st.detail}
                                      onChange={(val) => {
                                        const copy = [...statsList];
                                        copy[sIdx] = { ...copy[sIdx], detail: val };
                                        updateSectionContent(secId, copy, "Edit Stat Detail");
                                      }}
                                      className="text-[11px] text-slate-400"
                                      label={`Stat #${sIdx + 1} Detail`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </section>
                          );
                        }

                        case "sec-promo-banner": {
                          const promoData = (instanceData || homepageState.promoBanner || DEFAULT_PROMO_BANNER) as PromoBannerConfig;

                          return (
                            <section id="sec-promo-banner" className="py-12 px-4 bg-[#faf9f5]">
                              <div className="max-w-7xl mx-auto bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                                <div className="lg:col-span-8 space-y-4">
                                  <div className="inline-block bg-amber-400 text-slate-950 font-mono text-[10px] font-extrabold px-3 py-1 rounded uppercase tracking-wider">
                                    <InlineEditable
                                      value={promoData.badge}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...promoData, badge: val }, "Edit Promo Badge")
                                      }
                                      label="Promo Banner Badge"
                                    />
                                  </div>

                                  <InlineEditable
                                    as="h2"
                                    value={promoData.title}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...promoData, title: val }, "Edit Promo Title")
                                    }
                                    className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading"
                                    label="Promo Banner Title"
                                  />

                                  <InlineEditable
                                    as="p"
                                    value={promoData.description}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...promoData, description: val }, "Edit Promo Description")
                                    }
                                    multiline
                                    className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl"
                                    label="Promo Banner Description"
                                  />

                                  <div className="flex flex-wrap items-center gap-3 pt-2">
                                    <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 font-extrabold text-xs px-5 py-3 rounded-xl shadow">
                                      <EditableLink
                                        label={promoData.primaryCtaText}
                                        href={promoData.primaryCtaUrl || "/quote"}
                                        onChange={(newLabel, newHref) =>
                                          updateSectionContent(
                                            secId,
                                            { ...promoData, primaryCtaText: newLabel, primaryCtaUrl: newHref },
                                            "Edit Promo Primary CTA"
                                          )
                                        }
                                        className="text-slate-950 font-extrabold text-xs"
                                        fieldTitle="Promo Banner Primary CTA Button"
                                      />
                                      <ArrowRight className="w-3.5 h-3.5" />
                                    </div>

                                    <div className="inline-flex items-center gap-2 bg-slate-800 text-slate-300 font-bold text-xs px-5 py-3 rounded-xl border border-slate-700">
                                      <EditableLink
                                        label={promoData.secondaryCtaText}
                                        href={promoData.secondaryCtaUrl || "/contact"}
                                        onChange={(newLabel, newHref) =>
                                          updateSectionContent(
                                            secId,
                                            { ...promoData, secondaryCtaText: newLabel, secondaryCtaUrl: newHref },
                                            "Edit Promo Secondary CTA"
                                          )
                                        }
                                        className="text-slate-300 font-bold text-xs"
                                        fieldTitle="Promo Banner Secondary CTA Button"
                                      />
                                    </div>
                                  </div>
                                </div>

                                <div className="lg:col-span-4 rounded-2xl overflow-hidden border border-slate-800 aspect-video lg:aspect-square bg-slate-900 relative">
                                  <EditableImage
                                    src={promoData.image}
                                    onChange={(newSrc) =>
                                      updateSectionContent(secId, { ...promoData, image: newSrc }, "Edit Promo Image")
                                    }
                                    fill
                                    label="Click to replace volume promo banner image"
                                  />
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-testimonials": {
                          const testData = (instanceData || {}) as any;
                          const testList = (testData.testimonials || homepageState.testimonials || DEFAULT_TESTIMONIALS) as TestimonialItem[];
                          const testEyebrow = testData.testimonialsEyebrow || homepageState.testimonialsEyebrow || "CLIENT FEEDBACK";
                          const testTitle = testData.testimonialsTitle || homepageState.testimonialsTitle || "Trusted by Industrial Automation Leaders";

                          return (
                            <section id="sec-testimonials" className="py-16 px-4 bg-slate-950 text-white border-b border-slate-800">
                              <div className="max-w-7xl mx-auto space-y-10">
                                <div className="text-center max-w-2xl mx-auto space-y-2">
                                  <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                                    <InlineEditable
                                      value={testEyebrow}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { testimonials: testList, testimonialsEyebrow: val, testimonialsTitle: testTitle }, "Edit Testimonials Eyebrow")
                                      }
                                      label="Testimonials Eyebrow"
                                    />
                                  </span>
                                  <InlineEditable
                                    as="h2"
                                    value={testTitle}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { testimonials: testList, testimonialsEyebrow: testEyebrow, testimonialsTitle: val }, "Edit Testimonials Title")
                                    }
                                    className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading"
                                    label="Testimonials Title"
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {testList.map((item, tIdx) => (
                                    <div
                                      key={item.id || tIdx}
                                      className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 relative flex flex-col justify-between"
                                    >
                                      <div className="flex items-center gap-1 text-amber-400">
                                        {[...Array(item.rating || 5)].map((_, rIdx) => (
                                          <Star key={rIdx} className="w-4 h-4 fill-amber-400" />
                                        ))}
                                      </div>

                                      <InlineEditable
                                        as="p"
                                        value={`"${item.quote}"`}
                                        onChange={(val) => {
                                          const copy = [...testList];
                                          copy[tIdx] = { ...copy[tIdx], quote: val.replace(/^"|"$/g, "") };
                                          updateSectionContent(secId, { testimonials: copy, testimonialsEyebrow: testEyebrow, testimonialsTitle: testTitle }, "Edit Testimonial Quote");
                                        }}
                                        multiline
                                        className="text-xs sm:text-sm text-slate-300 italic leading-relaxed"
                                        label={`Testimonial #${tIdx + 1} Quote`}
                                      />

                                      <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                                        <div>
                                          <InlineEditable
                                            as="h4"
                                            value={item.author}
                                            onChange={(val) => {
                                              const copy = [...testList];
                                              copy[tIdx] = { ...copy[tIdx], author: val };
                                              updateSectionContent(secId, { testimonials: copy, testimonialsEyebrow: testEyebrow, testimonialsTitle: testTitle }, "Edit Author Name");
                                            }}
                                            className="font-bold text-xs text-white"
                                            label={`Testimonial #${tIdx + 1} Author`}
                                          />
                                          <InlineEditable
                                            as="p"
                                            value={item.role}
                                            onChange={(val) => {
                                              const copy = [...testList];
                                              copy[tIdx] = { ...copy[tIdx], role: val };
                                              updateSectionContent(secId, { testimonials: copy, testimonialsEyebrow: testEyebrow, testimonialsTitle: testTitle }, "Edit Author Role");
                                            }}
                                            className="text-[11px] text-slate-400 font-mono"
                                            label={`Testimonial #${tIdx + 1} Role`}
                                          />
                                        </div>

                                        {testList.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const copy = testList.filter((_, idx) => idx !== tIdx);
                                              updateSectionContent(secId, { testimonials: copy, testimonialsEyebrow: testEyebrow, testimonialsTitle: testTitle }, "Delete Testimonial");
                                            }}
                                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-compare": {
                          const compareData = (instanceData || homepageState.specCompare || DEFAULT_SPEC_COMPARE) as SpecCompareConfig;

                          return (
                            <section id="sec-compare" className="py-16 px-4 bg-slate-900 text-white border-b border-slate-800">
                              <div className="max-w-7xl mx-auto space-y-8">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-4">
                                  <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-sky-400 mb-1">
                                      <ArrowUpDown className="w-4 h-4" />
                                      <InlineEditable
                                        value={compareData.eyebrow}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...compareData, eyebrow: val }, "Edit Spec Matrix Eyebrow")
                                        }
                                        label="Benchmark Matrix Eyebrow"
                                      />
                                    </div>
                                    <InlineEditable
                                      as="h2"
                                      value={compareData.title}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...compareData, title: val }, "Edit Spec Matrix Title")
                                      }
                                      className="text-2xl sm:text-3xl font-black text-white tracking-tight font-heading"
                                      label="Benchmark Matrix Title"
                                    />
                                  </div>

                                  <EditableLink
                                    label={compareData.ctaText || "Launch Full Side-by-Side Comparison Tool"}
                                    href={compareData.ctaUrl || "/compare"}
                                    onChange={(newLabel, newHref) =>
                                      updateSectionContent(
                                        secId,
                                        { ...compareData, ctaText: newLabel, ctaUrl: newHref },
                                        "Edit Spec Matrix CTA"
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold font-mono transition-colors"
                                    fieldTitle="Specification Matrix CTA Button"
                                  />
                                </div>

                                <div className="overflow-x-auto border border-slate-800 rounded-2xl bg-slate-950">
                                  <table className="w-full text-left text-xs font-mono">
                                    <thead className="bg-slate-900 border-b border-slate-800 text-slate-300">
                                      <tr>
                                        <th className="p-4">Technical Parameter</th>
                                        <th className="p-4 text-sky-400">Sensors & Perception</th>
                                        <th className="p-4 text-amber-400">PLCs & Controllers</th>
                                        <th className="p-4 text-emerald-400">Drives & Motion</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-slate-300">
                                      {(compareData.rows || DEFAULT_SPEC_COMPARE.rows).map((row, rIdx) => (
                                        <tr key={rIdx} className="hover:bg-slate-900/50">
                                          <td className="p-4 font-bold text-white">
                                            <InlineEditable
                                              value={row.parameter}
                                              onChange={(val) => {
                                                const copy = [...(compareData.rows || DEFAULT_SPEC_COMPARE.rows)];
                                                copy[rIdx] = { ...copy[rIdx], parameter: val };
                                                updateSectionContent(secId, { ...compareData, rows: copy }, "Edit Matrix Parameter");
                                              }}
                                              label={`Parameter #${rIdx + 1}`}
                                            />
                                          </td>
                                          <td className="p-4 text-slate-300">
                                            <InlineEditable
                                              value={row.sensorVal}
                                              onChange={(val) => {
                                                const copy = [...(compareData.rows || DEFAULT_SPEC_COMPARE.rows)];
                                                copy[rIdx] = { ...copy[rIdx], sensorVal: val };
                                                updateSectionContent(secId, { ...compareData, rows: copy }, "Edit Sensor Val");
                                              }}
                                              label={`Sensor Val #${rIdx + 1}`}
                                            />
                                          </td>
                                          <td className="p-4 text-slate-300">
                                            <InlineEditable
                                              value={row.plcVal}
                                              onChange={(val) => {
                                                const copy = [...(compareData.rows || DEFAULT_SPEC_COMPARE.rows)];
                                                copy[rIdx] = { ...copy[rIdx], plcVal: val };
                                                updateSectionContent(secId, { ...compareData, rows: copy }, "Edit PLC Val");
                                              }}
                                              label={`PLC Val #${rIdx + 1}`}
                                            />
                                          </td>
                                          <td className="p-4 text-slate-300">
                                            <InlineEditable
                                              value={row.driveVal}
                                              onChange={(val) => {
                                                const copy = [...(compareData.rows || DEFAULT_SPEC_COMPARE.rows)];
                                                copy[rIdx] = { ...copy[rIdx], driveVal: val };
                                                updateSectionContent(secId, { ...compareData, rows: copy }, "Edit Drive Val");
                                              }}
                                              label={`Drive Val #${rIdx + 1}`}
                                            />
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-resource-hub": {
                          const resourceData = (instanceData || homepageState.resourceHub || DEFAULT_RESOURCE_HUB) as ResourceHubConfig;

                          return (
                            <section id="sec-resource-hub" className="py-16 px-4 bg-[#faf9f5] border-b border-slate-200">
                              <div className="max-w-7xl mx-auto space-y-8">
                                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200 pb-4">
                                  <div>
                                    <div className="inline-flex items-center gap-2 text-xs font-mono uppercase font-bold text-sky-600 mb-1">
                                      <BookOpen className="w-4 h-4" />
                                      <InlineEditable
                                        value={resourceData.eyebrow}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...resourceData, eyebrow: val }, "Edit Resource Hub Eyebrow")
                                        }
                                        label="Resource Hub Eyebrow"
                                      />
                                    </div>
                                    <InlineEditable
                                      as="h2"
                                      value={resourceData.title}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...resourceData, title: val }, "Edit Resource Hub Title")
                                      }
                                      className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading"
                                      label="Resource Hub Title"
                                    />
                                  </div>

                                  <EditableLink
                                    label={resourceData.ctaText || "View All Engineering Articles"}
                                    href={resourceData.ctaUrl || "/resources"}
                                    onChange={(newLabel, newHref) =>
                                      updateSectionContent(
                                        secId,
                                        { ...resourceData, ctaText: newLabel, ctaUrl: newHref },
                                        "Edit Resource Hub CTA"
                                      )
                                    }
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold font-mono hover:bg-slate-800 transition-colors"
                                    fieldTitle="Resource Hub View All CTA Button"
                                  />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {(resourceData.articles || DEFAULT_RESOURCE_HUB.articles).map((art, aIdx) => (
                                    <div
                                      key={art.id || aIdx}
                                      className="p-6 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between"
                                    >
                                      <div className="space-y-2">
                                        <div className="flex items-center justify-between text-[11px] font-mono text-sky-600">
                                          <InlineEditable
                                            value={art.category}
                                            onChange={(val) => {
                                              const copy = [...(resourceData.articles || DEFAULT_RESOURCE_HUB.articles)];
                                              copy[aIdx] = { ...copy[aIdx], category: val };
                                              updateSectionContent(secId, { ...resourceData, articles: copy }, "Edit Article Category");
                                            }}
                                            label={`Article #${aIdx + 1} Category`}
                                          />
                                          <span className="text-slate-400">
                                            <InlineEditable
                                              value={art.readTime}
                                              onChange={(val) => {
                                                const copy = [...(resourceData.articles || DEFAULT_RESOURCE_HUB.articles)];
                                                copy[aIdx] = { ...copy[aIdx], readTime: val };
                                                updateSectionContent(secId, { ...resourceData, articles: copy }, "Edit Read Time");
                                              }}
                                              label={`Article #${aIdx + 1} Read Time`}
                                            />
                                          </span>
                                        </div>

                                        <InlineEditable
                                          as="h3"
                                          value={art.title}
                                          onChange={(val) => {
                                            const copy = [...(resourceData.articles || DEFAULT_RESOURCE_HUB.articles)];
                                            copy[aIdx] = { ...copy[aIdx], title: val };
                                            updateSectionContent(secId, { ...resourceData, articles: copy }, "Edit Article Title");
                                          }}
                                          className="text-base font-bold text-slate-900 leading-snug"
                                          label={`Article #${aIdx + 1} Title`}
                                        />

                                        <InlineEditable
                                          as="p"
                                          value={art.summary}
                                          onChange={(val) => {
                                            const copy = [...(resourceData.articles || DEFAULT_RESOURCE_HUB.articles)];
                                            copy[aIdx] = { ...copy[aIdx], summary: val };
                                            updateSectionContent(secId, { ...resourceData, articles: copy }, "Edit Article Summary");
                                          }}
                                          multiline
                                          className="text-xs text-slate-600 leading-relaxed"
                                          label={`Article #${aIdx + 1} Summary`}
                                        />
                                      </div>

                                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                        <span className="text-slate-500 font-mono text-[11px]">
                                          By{" "}
                                          <InlineEditable
                                            value={art.author}
                                            onChange={(val) => {
                                              const copy = [...(resourceData.articles || DEFAULT_RESOURCE_HUB.articles)];
                                              copy[aIdx] = { ...copy[aIdx], author: val };
                                              updateSectionContent(secId, { ...resourceData, articles: copy }, "Edit Author");
                                            }}
                                            label={`Article #${aIdx + 1} Author`}
                                          />
                                        </span>
                                        <Link
                                          href={`/resources/${art.slug}`}
                                          className="text-sky-600 font-bold hover:text-sky-800 flex items-center gap-1 font-mono text-[11px]"
                                        >
                                          Read <ArrowRight className="w-3 h-3" />
                                        </Link>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-faqs": {
                          const faqData = (instanceData || {}) as any;
                          const faqList = (faqData.faqs || homepageState.faqs || DEFAULT_FAQS) as FaqItem[];
                          const faqEyebrow = faqData.faqsEyebrow || homepageState.faqsEyebrow || "SUPPORT & HELP";
                          const faqTitle = faqData.faqsTitle || homepageState.faqsTitle || "Frequently Asked Questions";

                          return (
                            <section id="sec-faqs" className="py-16 px-4 bg-white border-b border-slate-200">
                              <div className="max-w-4xl mx-auto space-y-10">
                                <div className="text-center space-y-2">
                                  <span className="text-xs font-mono font-bold text-sky-600 uppercase tracking-widest">
                                    <InlineEditable
                                      value={faqEyebrow}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { faqs: faqList, faqsEyebrow: val, faqsTitle: faqTitle }, "Edit FAQ Eyebrow")
                                      }
                                      label="FAQ Eyebrow"
                                    />
                                  </span>
                                  <InlineEditable
                                    as="h2"
                                    value={faqTitle}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { faqs: faqList, faqsEyebrow: faqEyebrow, faqsTitle: val }, "Edit FAQ Title")
                                    }
                                    className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight font-heading"
                                    label="FAQ Section Title"
                                  />
                                </div>

                                <div className="space-y-4">
                                  {faqList.map((item, fIdx) => (
                                    <div
                                      key={item.id || fIdx}
                                      className="p-6 rounded-2xl bg-[#faf9f5] border border-slate-200 space-y-2"
                                    >
                                      <div className="flex items-start justify-between gap-4">
                                        <InlineEditable
                                          as="h3"
                                          value={item.question}
                                          onChange={(val) => {
                                            const copy = [...faqList];
                                            copy[fIdx] = { ...copy[fIdx], question: val };
                                            updateSectionContent(secId, { faqs: copy, faqsEyebrow: faqEyebrow, faqsTitle: faqTitle }, "Edit FAQ Question");
                                          }}
                                          className="text-sm sm:text-base font-bold text-slate-900"
                                          label={`FAQ #${fIdx + 1} Question`}
                                        />

                                        {faqList.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const copy = faqList.filter((_, idx) => idx !== fIdx);
                                              updateSectionContent(secId, { faqs: copy, faqsEyebrow: faqEyebrow, faqsTitle: faqTitle }, "Delete FAQ");
                                            }}
                                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                          >
                                            <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                        )}
                                      </div>

                                      <InlineEditable
                                        as="p"
                                        value={item.answer}
                                        onChange={(val) => {
                                          const copy = [...faqList];
                                          copy[fIdx] = { ...copy[fIdx], answer: val };
                                          updateSectionContent(secId, { faqs: copy, faqsEyebrow: faqEyebrow, faqsTitle: faqTitle }, "Edit FAQ Answer");
                                        }}
                                        multiline
                                        className="text-xs sm:text-sm text-slate-600 leading-relaxed"
                                        label={`FAQ #${fIdx + 1} Answer`}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </section>
                          );
                        }

                        case "sec-footer-config": {
                          const footerData = (instanceData || homepageState.footerConfig || DEFAULT_FOOTER_CONFIG) as FooterConfig;

                          return (
                            <footer id="sec-footer-config" className="bg-slate-950 text-white pt-12 pb-8 px-4 border-t border-slate-800">
                              <div className="max-w-7xl mx-auto space-y-12">
                                {/* Catalog Download Callout */}
                                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
                                  <div className="space-y-2">
                                    <div className="inline-block bg-sky-500/20 text-sky-400 font-mono text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                      <InlineEditable
                                        value={footerData.catalogBadge}
                                        onChange={(val) =>
                                          updateSectionContent(secId, { ...footerData, catalogBadge: val }, "Edit Catalog Badge")
                                        }
                                        label="Catalog Badge"
                                      />
                                    </div>

                                    <InlineEditable
                                      as="h3"
                                      value={footerData.catalogTitle}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...footerData, catalogTitle: val }, "Edit Catalog Title")
                                      }
                                      className="text-xl font-bold text-white"
                                      label="Catalog Title"
                                    />

                                    <InlineEditable
                                      as="p"
                                      value={footerData.catalogDesc}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...footerData, catalogDesc: val }, "Edit Catalog Description")
                                      }
                                      className="text-xs text-slate-400 max-w-xl"
                                      label="Catalog Description"
                                    />
                                  </div>

                                  <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 font-bold text-xs px-5 py-3 rounded-xl shrink-0 shadow-lg">
                                    <FileText className="w-4 h-4" />
                                    <EditableLink
                                      label={footerData.catalogCtaText}
                                      href={footerData.catalogCtaUrl || "/downloads/OM_AUTOMATION_Catalog.pdf"}
                                      onChange={(newLabel, newHref) =>
                                        updateSectionContent(
                                          secId,
                                          { ...footerData, catalogCtaText: newLabel, catalogCtaUrl: newHref },
                                          "Edit Catalog PDF CTA"
                                        )
                                      }
                                      className="text-slate-950 font-bold text-xs"
                                      fieldTitle="Catalog Download PDF CTA Button"
                                    />
                                  </div>
                                </div>

                                {/* Multi-Column Footer Links */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 border-t border-slate-800/80 pt-8 text-xs">
                                  {/* Col 1: Brand & Contact */}
                                  <div className="space-y-3">
                                    <div className="font-heading font-black text-lg text-white font-mono flex items-center gap-1">
                                      <span className="text-amber-400">OM</span>
                                      <span>AUTOMATION</span>
                                    </div>
                                    <p className="text-slate-400 leading-relaxed text-[11px]">
                                      High-precision industrial hardware supplier. Same-day B2B dispatch for sensors, PLCs, and VFD drives.
                                    </p>
                                    <div className="space-y-1 text-slate-300 font-mono text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-sky-400" />
                                        <EditableLink
                                          label={homepageState.headerConfig.supportPhone}
                                          href={`tel:${homepageState.headerConfig.supportPhone.replace(/\s+/g, "")}`}
                                          onChange={(newLabel) =>
                                            updateState((prev) => ({
                                              ...prev,
                                              headerConfig: { ...prev.headerConfig, supportPhone: newLabel },
                                            }))
                                          }
                                          fieldTitle="Footer Phone Action"
                                        />
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-amber-400" />
                                        <EditableLink
                                          label={homepageState.headerConfig.supportEmail}
                                          href={`mailto:${homepageState.headerConfig.supportEmail}`}
                                          onChange={(newLabel) =>
                                            updateState((prev) => ({
                                              ...prev,
                                              headerConfig: { ...prev.headerConfig, supportEmail: newLabel },
                                            }))
                                          }
                                          fieldTitle="Footer Email Action"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Col 2: Useful Links */}
                                  <div className="space-y-3">
                                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">Useful Links</h4>
                                    <div className="space-y-1.5 flex flex-col text-slate-400">
                                      {(footerData.usefulLinks || [
                                        { label: "Products Catalog", url: "/products" },
                                        { label: "Categories Hub", url: "/categories" },
                                        { label: "Instant RFQ Portal", url: "/quote" },
                                        { label: "About OM Automation", url: "/about" },
                                        { label: "Contact Engineering Desk", url: "/contact" },
                                      ]).map((link, uIdx) => (
                                        <EditableLink
                                          key={uIdx}
                                          label={link.label}
                                          href={link.url}
                                          onChange={(newLabel, newHref) => {
                                            const copy = [...(footerData.usefulLinks || [])];
                                            copy[uIdx] = { label: newLabel, url: newHref };
                                            updateSectionContent(secId, { ...footerData, usefulLinks: copy }, "Edit Useful Link");
                                          }}
                                          className="text-slate-400 hover:text-white"
                                          fieldTitle={`Useful Link #${uIdx + 1}`}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  {/* Col 3: Customer Support & Policies */}
                                  <div className="space-y-3">
                                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">Customer Support</h4>
                                    <div className="space-y-1.5 flex flex-col text-slate-400">
                                      {(footerData.helpLinks || [
                                        { label: "Delivery Information", url: "/delivery" },
                                        { label: "Support & FAQs", url: "/faq" },
                                        { label: "Terms of Service", url: "/terms-of-service" },
                                        { label: "Privacy Policy", url: "/privacy" },
                                        { label: "Legal Notice", url: "/legal-notice" },
                                      ]).map((link, hIdx) => (
                                        <EditableLink
                                          key={hIdx}
                                          label={link.label}
                                          href={link.url}
                                          onChange={(newLabel, newHref) => {
                                            const copy = [...(footerData.helpLinks || [])];
                                            copy[hIdx] = { label: newLabel, url: newHref };
                                            updateSectionContent(secId, { ...footerData, helpLinks: copy }, "Edit Customer Support Link");
                                          }}
                                          className="text-slate-400 hover:text-white"
                                          fieldTitle={`Customer Support Link #${hIdx + 1}`}
                                        />
                                      ))}
                                    </div>
                                  </div>

                                  {/* Col 4: Social Channels & WhatsApp */}
                                  <div className="space-y-3">
                                    <h4 className="font-bold text-white uppercase tracking-wider text-xs">Direct Support</h4>
                                    <div className="space-y-2">
                                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                                        <span className="text-[10px] text-slate-400 font-mono">WhatsApp Support:</span>
                                        <div>
                                          <EditableLink
                                            label={footerData.whatsappNumber || "+91 90993 92066"}
                                            href={`https://wa.me/${(footerData.whatsappNumber || "919099392066").replace(/[^0-9]/g, "")}`}
                                            onChange={(newLabel) =>
                                              updateSectionContent(secId, { ...footerData, whatsappNumber: newLabel }, "Edit WhatsApp Number")
                                            }
                                            className="text-emerald-400 font-mono font-bold text-xs"
                                            fieldTitle="WhatsApp Number & Chat Link"
                                          />
                                        </div>
                                      </div>

                                      <div className="flex flex-wrap gap-2 text-slate-400">
                                        <EditableLink
                                          label="Facebook"
                                          href={footerData.facebookUrl || "https://facebook.com"}
                                          onChange={(newLabel, newHref) =>
                                            updateSectionContent(secId, { ...footerData, facebookUrl: newHref }, "Edit Facebook URL")
                                          }
                                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px]"
                                          fieldTitle="Facebook Page URL"
                                        />
                                        <EditableLink
                                          label="Instagram"
                                          href={footerData.instagramUrl || "https://instagram.com"}
                                          onChange={(newLabel, newHref) =>
                                            updateSectionContent(secId, { ...footerData, instagramUrl: newHref }, "Edit Instagram URL")
                                          }
                                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px]"
                                          fieldTitle="Instagram Page URL"
                                        />
                                        <EditableLink
                                          label="LinkedIn"
                                          href={footerData.linkedinUrl || "https://linkedin.com"}
                                          onChange={(newLabel, newHref) =>
                                            updateSectionContent(secId, { ...footerData, linkedinUrl: newHref }, "Edit LinkedIn URL")
                                          }
                                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px]"
                                          fieldTitle="LinkedIn Profile URL"
                                        />
                                        <EditableLink
                                          label="YouTube"
                                          href={footerData.youtubeUrl || "https://youtube.com"}
                                          onChange={(newLabel, newHref) =>
                                            updateSectionContent(secId, { ...footerData, youtubeUrl: newHref }, "Edit YouTube URL")
                                          }
                                          className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px]"
                                          fieldTitle="YouTube Channel URL"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Bottom Copyright & Address */}
                                <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
                                  <InlineEditable
                                    value={footerData.copyrightText}
                                    onChange={(val) =>
                                      updateSectionContent(secId, { ...footerData, copyrightText: val }, "Edit Copyright Text")
                                    }
                                    label="Footer Copyright Text"
                                  />

                                  <div className="flex items-center gap-4 text-slate-400">
                                    <InlineEditable
                                      value={footerData.addressLine1}
                                      onChange={(val) =>
                                        updateSectionContent(secId, { ...footerData, addressLine1: val }, "Edit Address")
                                      }
                                      label="Address Line 1"
                                    />
                                  </div>
                                </div>
                              </div>
                            </footer>
                          );
                        }

                        default:
                          return null;
                      }
                    })();

          return (
            <div
              key={secId}
              className={`relative transition-all duration-300 ${
                isSelected ? "ring-2 ring-sky-500/80 ring-offset-2 ring-offset-slate-950" : ""
              }`}
            >
              {sectionContent}
            </div>
          );
        })}
      </div>
              </div>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
