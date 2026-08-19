"use server";

import { query } from "@/lib/db";
import { DEFAULT_HERO_SLIDES, DEFAULT_CATEGORY_SHOWCASES } from "@/lib/homepage";

export async function getAdminMediaLibrary(): Promise<string[]> {
  const imagesSet = new Set<string>();

  // 1. Add default hero slides and category showcase images
  DEFAULT_HERO_SLIDES.forEach((slide) => {
    if (slide.desktopImage) imagesSet.add(slide.desktopImage);
    if (slide.mobileImage) imagesSet.add(slide.mobileImage);
  });

  DEFAULT_CATEGORY_SHOWCASES.forEach((showcase) => {
    if (showcase.heroImage) imagesSet.add(showcase.heroImage);
  });

  try {
    // 2. Fetch images from ProductImage table
    const productImgRes = await query(`SELECT DISTINCT url FROM "ProductImage" WHERE url IS NOT NULL AND url != '' LIMIT 50`);
    productImgRes.rows.forEach((r: any) => {
      if (r.url && typeof r.url === "string") {
        imagesSet.add(r.url);
      }
    });

    // 3. Fetch images from SystemSetting table
    const settingsRes = await query(`SELECT key, value FROM "SystemSetting" WHERE key IN ('homepage_hero_slides', 'homepage_category_showcases')`);
    settingsRes.rows.forEach((r: any) => {
      if (r.value) {
        try {
          const parsed = JSON.parse(r.value);
          if (Array.isArray(parsed)) {
            parsed.forEach((item: any) => {
              if (item.desktopImage) imagesSet.add(item.desktopImage);
              if (item.mobileImage) imagesSet.add(item.mobileImage);
              if (item.heroImage) imagesSet.add(item.heroImage);
            });
          }
        } catch (e) {
          // ignore
        }
      }
    });
  } catch (error) {
    console.error("Error fetching media library from DB:", error);
  }

  // Curated additional high-quality presets
  const curatedPresets = [
    "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=1600&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&auto=format&fit=crop&q=80",
  ];

  curatedPresets.forEach((img) => imagesSet.add(img));

  return Array.from(imagesSet);
}
