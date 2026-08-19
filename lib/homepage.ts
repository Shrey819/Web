import { query } from "@/lib/db";

export interface HeroSlide {
  id: string;
  desktopImage: string;
  mobileImage: string;
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaUrl?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface CategoryShowcaseConfig {
  id: string;
  categoryId: string; // matches Category.id or Category.slug
  heroImage?: string;
  isActive: boolean;
  sortOrder: number;
}

export interface HomepageData {
  promoTicker: string;
  heroSlides: HeroSlide[];
  categoryShowcases: CategoryShowcaseConfig[];
}

export const DEFAULT_PROMO_TICKER =
  "🎁 BUY ANY 2 PRODUCTS & GET 1 PREMIUM GOGGLE FREE • FREE SHIPPING • CASH ON DELIVERY • SHOP NOW";

export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    desktopImage:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&auto=format&fit=crop&q=80",
    mobileImage:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    title: "NEXT-GEN INDUSTRIAL AUTOMATION",
    subtitle: "Precision PLCs, VFDs & Sensors with Same-Day Dispatch",
    ctaText: "Explore Catalog",
    ctaUrl: "/products",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "slide-2",
    desktopImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&auto=format&fit=crop&q=80",
    mobileImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&auto=format&fit=crop&q=80",
    title: "SMART FACTORY CONTROL HARDWARE",
    subtitle: "Certified Heavy-Duty OEM Components for Industrial Operations",
    ctaText: "Request a Quote",
    ctaUrl: "/quote",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "slide-3",
    desktopImage:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80",
    mobileImage:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800&auto=format&fit=crop&q=80",
    title: "HIGH PERFORMANCE DRIVES & MOTORS",
    subtitle: "Energy Efficient Industrial Controllers & Servo Drives",
    ctaText: "View Hardware",
    ctaUrl: "/products",
    isActive: true,
    sortOrder: 3,
  },
];

export const DEFAULT_CATEGORY_SHOWCASES: CategoryShowcaseConfig[] = [
  {
    id: "showcase-1",
    categoryId: "cat_sensors",
    heroImage:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80",
    isActive: true,
    sortOrder: 1,
  },
  {
    id: "showcase-2",
    categoryId: "cat_plc",
    heroImage:
      "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop&q=80",
    isActive: true,
    sortOrder: 2,
  },
  {
    id: "showcase-3",
    categoryId: "cat_vfd",
    heroImage:
      "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80",
    isActive: true,
    sortOrder: 3,
  },
];

export async function getHomepageData(): Promise<HomepageData> {
  try {
    const res = await query(
      `SELECT key, value FROM "SystemSetting" WHERE key IN ('homepage_promo_ticker', 'homepage_hero_slides', 'homepage_category_showcases')`
    );

    const settingsMap: Record<string, string> = {};
    res.rows.forEach((row: any) => {
      if (row.key && row.value !== null) {
        settingsMap[row.key] = row.value;
      }
    });

    const promoTicker =
      settingsMap.homepage_promo_ticker || DEFAULT_PROMO_TICKER;

    let heroSlides: HeroSlide[] = DEFAULT_HERO_SLIDES;
    if (settingsMap.homepage_hero_slides) {
      try {
        const parsed = JSON.parse(settingsMap.homepage_hero_slides);
        if (Array.isArray(parsed) && parsed.length > 0) {
          heroSlides = parsed;
        }
      } catch (e) {
        console.error("Error parsing homepage_hero_slides JSON:", e);
      }
    }

    let categoryShowcases: CategoryShowcaseConfig[] = DEFAULT_CATEGORY_SHOWCASES;
    if (settingsMap.homepage_category_showcases) {
      try {
        const parsed = JSON.parse(settingsMap.homepage_category_showcases);
        if (Array.isArray(parsed) && parsed.length > 0) {
          categoryShowcases = parsed;
        }
      } catch (e) {
        console.error("Error parsing homepage_category_showcases JSON:", e);
      }
    }

    return {
      promoTicker,
      heroSlides,
      categoryShowcases,
    };
  } catch (error) {
    console.error("Failed to fetch homepage data from DB:", error);
    return {
      promoTicker: DEFAULT_PROMO_TICKER,
      heroSlides: DEFAULT_HERO_SLIDES,
      categoryShowcases: DEFAULT_CATEGORY_SHOWCASES,
    };
  }
}

export async function updateHomepageData(data: Partial<HomepageData>): Promise<{ success: boolean; error?: string }> {
  try {
    if (data.promoTicker !== undefined) {
      await query(
        `INSERT INTO "SystemSetting" ("key", "value", "updatedAt") VALUES ('homepage_promo_ticker', $1, CURRENT_TIMESTAMP)
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
        [data.promoTicker]
      );
    }

    if (data.heroSlides !== undefined) {
      await query(
        `INSERT INTO "SystemSetting" ("key", "value", "updatedAt") VALUES ('homepage_hero_slides', $1, CURRENT_TIMESTAMP)
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
        [JSON.stringify(data.heroSlides)]
      );
    }

    if (data.categoryShowcases !== undefined) {
      await query(
        `INSERT INTO "SystemSetting" ("key", "value", "updatedAt") VALUES ('homepage_category_showcases', $1, CURRENT_TIMESTAMP)
         ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
        [JSON.stringify(data.categoryShowcases)]
      );
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to update homepage data:", error);
    return { success: false, error: error.message || "Failed to update homepage data" };
  }
}
