import { query } from "@/lib/db";
import {
  HomepageData,
  MainframeHeroConfig,
  HeroSlide,
  CategoryShowcaseConfig,
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
  DEFAULT_PROMO_TICKER,
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
} from "@/lib/homepage";

function safeParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString) return fallback;
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

export async function getHomepageData(): Promise<HomepageData> {
  try {
    const res = await query(
      `SELECT "key", "value" FROM "SystemSetting" WHERE "key" IN (
        'homepage_promo_ticker',
        'homepage_promo_ticker_url',
        'homepage_promo_ticker_active',
        'homepage_hero_slides',
        'homepage_category_showcases',
        'homepage_mainframe_hero',
        'homepage_sticky_showcase',
        'homepage_brand_marquee',
        'homepage_promo_banner',
        'homepage_stats',
        'homepage_why_buy',
        'homepage_why_buy_eyebrow',
        'homepage_why_buy_title',
        'homepage_testimonials',
        'homepage_testimonials_eyebrow',
        'homepage_testimonials_title',
        'homepage_faqs',
        'homepage_faqs_eyebrow',
        'homepage_faqs_title',
        'homepage_header_config',
        'homepage_footer_config',
        'homepage_orbit_stage',
        'homepage_category_grid',
        'homepage_top_fundamentals',
        'homepage_featured_catalog',
        'homepage_solutions_showcase',
        'homepage_assembly_sequence',
        'homepage_best_sellers',
        'homepage_spec_compare',
        'homepage_resource_hub',
        'homepage_section_order',
        'homepage_hidden_sections',
        'homepage_section_instances'
      )`
    );

    const map: Record<string, string> = {};
    res.rows.forEach((row: any) => {
      if (row.key && row.value !== null) {
        map[row.key] = row.value;
      }
    });

    const promoTicker = map.homepage_promo_ticker || DEFAULT_PROMO_TICKER;
    const promoTickerUrl = map.homepage_promo_ticker_url || "/products";
    const promoTickerActive = map.homepage_promo_ticker_active !== "false";

    const mainframeHero = safeParse<MainframeHeroConfig>(
      map.homepage_mainframe_hero,
      DEFAULT_MAINFRAME_HERO
    );
    if (!mainframeHero.videoUrl || mainframeHero.videoUrl === "/videos/character-opt.mp4") {
      mainframeHero.videoUrl = DEFAULT_MAINFRAME_HERO.videoUrl;
    }
    if (!mainframeHero.subheading) {
      mainframeHero.subheading = DEFAULT_MAINFRAME_HERO.subheading;
    }
    if (!mainframeHero.salesEmailText) {
      mainframeHero.salesEmailText = DEFAULT_MAINFRAME_HERO.salesEmailText;
    }
    if (!mainframeHero.salesEmail) {
      mainframeHero.salesEmail = DEFAULT_MAINFRAME_HERO.salesEmail;
    }

    const heroSlides = safeParse<HeroSlide[]>(
      map.homepage_hero_slides,
      DEFAULT_HERO_SLIDES
    );

    const categoryShowcases = safeParse<CategoryShowcaseConfig[]>(
      map.homepage_category_showcases,
      DEFAULT_CATEGORY_SHOWCASES
    );

    const stickyShowcase = safeParse<StickyShowcaseConfig>(
      map.homepage_sticky_showcase,
      DEFAULT_STICKY_SHOWCASE
    );

    const brandMarquee = safeParse<BrandMarqueeConfig>(
      map.homepage_brand_marquee,
      DEFAULT_BRAND_MARQUEE
    );
    if (!brandMarquee.brands || brandMarquee.brands.length === 0) {
      brandMarquee.brands = DEFAULT_BRAND_MARQUEE.brands;
    }

    const promoBanner = safeParse<PromoBannerConfig>(
      map.homepage_promo_banner,
      DEFAULT_PROMO_BANNER
    );

    const stats = safeParse<StatItem[]>(
      map.homepage_stats,
      DEFAULT_STATS
    );

    const whyBuyFromUs = safeParse<WhyBuyItem[]>(
      map.homepage_why_buy,
      DEFAULT_WHY_BUY
    );
    const whyBuyEyebrow = map.homepage_why_buy_eyebrow || "VALUE GUARANTEE";
    const whyBuyTitle = map.homepage_why_buy_title || "Why Leading Engineering Teams Choose OM AUTOMATION";

    const testimonials = safeParse<TestimonialItem[]>(
      map.homepage_testimonials,
      DEFAULT_TESTIMONIALS
    );
    const testimonialsEyebrow = map.homepage_testimonials_eyebrow || "CLIENT FEEDBACK";
    const testimonialsTitle = map.homepage_testimonials_title || "Trusted by Industrial Automation Leaders";

    const faqs = safeParse<FaqItem[]>(
      map.homepage_faqs,
      DEFAULT_FAQS
    );
    const faqsEyebrow = map.homepage_faqs_eyebrow || "SUPPORT & HELP";
    const faqsTitle = map.homepage_faqs_title || "Frequently Asked Questions";

    const headerConfig = safeParse<HeaderConfig>(
      map.homepage_header_config,
      DEFAULT_HEADER_CONFIG
    );

    const footerConfig = safeParse<FooterConfig>(
      map.homepage_footer_config,
      DEFAULT_FOOTER_CONFIG
    );

    const orbitStage = safeParse<OrbitStageConfig>(
      map.homepage_orbit_stage,
      DEFAULT_ORBIT_STAGE
    );

    const categoryGrid = safeParse<CategoryGridConfig>(
      map.homepage_category_grid,
      DEFAULT_CATEGORY_GRID
    );

    const topFundamentals = safeParse<TopFundamentalsConfig>(
      map.homepage_top_fundamentals,
      DEFAULT_TOP_FUNDAMENTALS
    );

    const featuredCatalog = safeParse<FeaturedCatalogConfig>(
      map.homepage_featured_catalog,
      DEFAULT_FEATURED_CATALOG
    );

    const solutionsShowcase = safeParse<SolutionsShowcaseConfig>(
      map.homepage_solutions_showcase,
      DEFAULT_SOLUTIONS_SHOWCASE
    );

    const assemblySequence = safeParse<AssemblySequenceConfig>(
      map.homepage_assembly_sequence,
      DEFAULT_ASSEMBLY_SEQUENCE
    );

    const bestSellers = safeParse<BestSellersConfig>(
      map.homepage_best_sellers,
      DEFAULT_BEST_SELLERS
    );

    const specCompare = safeParse<SpecCompareConfig>(
      map.homepage_spec_compare,
      DEFAULT_SPEC_COMPARE
    );

    const resourceHub = safeParse<ResourceHubConfig>(
      map.homepage_resource_hub,
      DEFAULT_RESOURCE_HUB
    );

    const rawSectionOrder = safeParse<string[]>(
      map.homepage_section_order,
      DEFAULT_SECTION_ORDER
    );

    // Auto-insert sec-top-fundamentals after sec-categories-grid if missing
    let sectionOrder = [...rawSectionOrder];
    if (!sectionOrder.includes("sec-top-fundamentals")) {
      const catGridIndex = sectionOrder.indexOf("sec-categories-grid");
      if (catGridIndex !== -1) {
        sectionOrder.splice(catGridIndex + 1, 0, "sec-top-fundamentals");
      } else {
        sectionOrder.push("sec-top-fundamentals");
      }
    }

    const hiddenSectionIds = safeParse<string[]>(
      map.homepage_hidden_sections,
      []
    );

    const sectionInstances = safeParse<Record<string, any>>(
      map.homepage_section_instances,
      {}
    );

    return {
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
      whyBuyFromUs,
      whyBuy: whyBuyFromUs,
      whyBuyEyebrow,
      whyBuyTitle,
      testimonials,
      testimonialsEyebrow,
      testimonialsTitle,
      faqs,
      faqsEyebrow,
      faqsTitle,
      headerConfig,
      footerConfig,
      orbitStage,
      categoryGrid,
      topFundamentals,
      featuredCatalog,
      solutionsShowcase,
      assemblySequence,
      bestSellers,
      specCompare,
      resourceHub,
      sectionOrder,
      hiddenSectionIds,
      sectionInstances,
    };
  } catch (error) {
    console.error("Failed to fetch homepage data from DB:", error);
    return {
      promoTicker: DEFAULT_PROMO_TICKER,
      promoTickerUrl: "/products",
      promoTickerActive: true,
      mainframeHero: DEFAULT_MAINFRAME_HERO,
      heroSlides: DEFAULT_HERO_SLIDES,
      categoryShowcases: DEFAULT_CATEGORY_SHOWCASES,
      stickyShowcase: DEFAULT_STICKY_SHOWCASE,
      brandMarquee: DEFAULT_BRAND_MARQUEE,
      promoBanner: DEFAULT_PROMO_BANNER,
      stats: DEFAULT_STATS,
      whyBuyFromUs: DEFAULT_WHY_BUY,
      whyBuy: DEFAULT_WHY_BUY,
      whyBuyEyebrow: "VALUE GUARANTEE",
      whyBuyTitle: "Why Leading Engineering Teams Choose OM AUTOMATION",
      testimonials: DEFAULT_TESTIMONIALS,
      testimonialsEyebrow: "CLIENT FEEDBACK",
      testimonialsTitle: "Trusted by Industrial Automation Leaders",
      faqs: DEFAULT_FAQS,
      faqsEyebrow: "SUPPORT & HELP",
      faqsTitle: "Frequently Asked Questions",
      headerConfig: DEFAULT_HEADER_CONFIG,
      footerConfig: DEFAULT_FOOTER_CONFIG,
      orbitStage: DEFAULT_ORBIT_STAGE,
      categoryGrid: DEFAULT_CATEGORY_GRID,
      topFundamentals: DEFAULT_TOP_FUNDAMENTALS,
      featuredCatalog: DEFAULT_FEATURED_CATALOG,
      solutionsShowcase: DEFAULT_SOLUTIONS_SHOWCASE,
      assemblySequence: DEFAULT_ASSEMBLY_SEQUENCE,
      bestSellers: DEFAULT_BEST_SELLERS,
      specCompare: DEFAULT_SPEC_COMPARE,
      resourceHub: DEFAULT_RESOURCE_HUB,
      sectionOrder: DEFAULT_SECTION_ORDER,
      hiddenSectionIds: [],
      sectionInstances: {},
    };
  }
}

export async function updateHomepageData(
  data: Partial<HomepageData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const upsert = async (key: string, val: string) => {
      await query(
        `INSERT INTO "SystemSetting" ("key", "value", "updatedAt") VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
        [key, val]
      );
    };

    if (data.promoTicker !== undefined) {
      await upsert("homepage_promo_ticker", data.promoTicker);
    }
    if (data.promoTickerUrl !== undefined) {
      await upsert("homepage_promo_ticker_url", data.promoTickerUrl);
    }
    if (data.promoTickerActive !== undefined) {
      await upsert("homepage_promo_ticker_active", String(data.promoTickerActive));
    }
    if (data.mainframeHero !== undefined) {
      await upsert("homepage_mainframe_hero", JSON.stringify(data.mainframeHero));
    }
    if (data.heroSlides !== undefined) {
      await upsert("homepage_hero_slides", JSON.stringify(data.heroSlides));
    }
    if (data.categoryShowcases !== undefined) {
      await upsert("homepage_category_showcases", JSON.stringify(data.categoryShowcases));
    }
    if (data.stickyShowcase !== undefined) {
      await upsert("homepage_sticky_showcase", JSON.stringify(data.stickyShowcase));
    }
    if (data.brandMarquee !== undefined) {
      await upsert("homepage_brand_marquee", JSON.stringify(data.brandMarquee));
    }
    if (data.promoBanner !== undefined) {
      await upsert("homepage_promo_banner", JSON.stringify(data.promoBanner));
    }
    if (data.stats !== undefined) {
      await upsert("homepage_stats", JSON.stringify(data.stats));
    }
    if (data.whyBuyFromUs !== undefined || data.whyBuy !== undefined) {
      await upsert("homepage_why_buy", JSON.stringify(data.whyBuyFromUs || data.whyBuy));
    }
    if (data.whyBuyEyebrow !== undefined) {
      await upsert("homepage_why_buy_eyebrow", data.whyBuyEyebrow);
    }
    if (data.whyBuyTitle !== undefined) {
      await upsert("homepage_why_buy_title", data.whyBuyTitle);
    }
    if (data.testimonials !== undefined) {
      await upsert("homepage_testimonials", JSON.stringify(data.testimonials));
    }
    if (data.testimonialsEyebrow !== undefined) {
      await upsert("homepage_testimonials_eyebrow", data.testimonialsEyebrow);
    }
    if (data.testimonialsTitle !== undefined) {
      await upsert("homepage_testimonials_title", data.testimonialsTitle);
    }
    if (data.faqs !== undefined) {
      await upsert("homepage_faqs", JSON.stringify(data.faqs));
    }
    if (data.faqsEyebrow !== undefined) {
      await upsert("homepage_faqs_eyebrow", data.faqsEyebrow);
    }
    if (data.faqsTitle !== undefined) {
      await upsert("homepage_faqs_title", data.faqsTitle);
    }
    if (data.headerConfig !== undefined) {
      await upsert("homepage_header_config", JSON.stringify(data.headerConfig));
    }
    if (data.footerConfig !== undefined) {
      await upsert("homepage_footer_config", JSON.stringify(data.footerConfig));
    }
    if (data.orbitStage !== undefined) {
      await upsert("homepage_orbit_stage", JSON.stringify(data.orbitStage));
    }
    if (data.categoryGrid !== undefined) {
      await upsert("homepage_category_grid", JSON.stringify(data.categoryGrid));
    }
    if (data.topFundamentals !== undefined) {
      await upsert("homepage_top_fundamentals", JSON.stringify(data.topFundamentals));
    }
    if (data.featuredCatalog !== undefined) {
      await upsert("homepage_featured_catalog", JSON.stringify(data.featuredCatalog));
    }
    if (data.solutionsShowcase !== undefined) {
      await upsert("homepage_solutions_showcase", JSON.stringify(data.solutionsShowcase));
    }
    if (data.assemblySequence !== undefined) {
      await upsert("homepage_assembly_sequence", JSON.stringify(data.assemblySequence));
    }
    if (data.bestSellers !== undefined) {
      await upsert("homepage_best_sellers", JSON.stringify(data.bestSellers));
    }
    if (data.specCompare !== undefined) {
      await upsert("homepage_spec_compare", JSON.stringify(data.specCompare));
    }
    if (data.resourceHub !== undefined) {
      await upsert("homepage_resource_hub", JSON.stringify(data.resourceHub));
    }
    if (data.sectionOrder !== undefined) {
      await upsert("homepage_section_order", JSON.stringify(data.sectionOrder));
    }
    if (data.hiddenSectionIds !== undefined) {
      await upsert("homepage_hidden_sections", JSON.stringify(data.hiddenSectionIds));
    }
    if (data.sectionInstances !== undefined) {
      await upsert("homepage_section_instances", JSON.stringify(data.sectionInstances));
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update homepage data:", error);
    return { success: false, error: error.message || "Failed to update homepage data" };
  }
}
