"use server";

import { query } from "@/lib/db";
import { DEFAULT_HERO_SLIDES, DEFAULT_CATEGORY_SHOWCASES } from "@/lib/homepage";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function getAdminMediaLibrary(): Promise<string[]> {
  const imagesSet = new Set<string>();

  // 1. Fetch newest uploaded assets directly from Cloudinary (Newest first)
  if (process.env.CLOUDINARY_API_SECRET && process.env.CLOUDINARY_API_KEY) {
    try {
      const cldRes = await cloudinary.api.resources({
        type: "upload",
        max_results: 100,
      });

      if (cldRes?.resources && Array.isArray(cldRes.resources)) {
        cldRes.resources.forEach((r: any) => {
          if (r.secure_url) {
            imagesSet.add(r.secure_url);
          }
        });
      }
    } catch (cldErr) {
      console.warn("Could not fetch Cloudinary resources:", cldErr);
    }
  }

  // 2. Fetch images from ProductImage table (most recent first)
  try {
    const productImgRes = await query(
      `SELECT DISTINCT url, "createdAt" FROM "ProductImage" WHERE url IS NOT NULL AND url != '' ORDER BY "createdAt" DESC LIMIT 100`
    );
    productImgRes.rows.forEach((r: any) => {
      if (r.url && typeof r.url === "string") {
        imagesSet.add(r.url);
      }
    });

    // 3. Fetch images from ProductVariant table (mediaUrl)
    const variantImgRes = await query(
      `SELECT DISTINCT "mediaUrl" FROM "ProductVariant" WHERE "mediaUrl" IS NOT NULL AND "mediaUrl" != '' LIMIT 50`
    );
    variantImgRes.rows.forEach((r: any) => {
      if (r.mediaUrl && typeof r.mediaUrl === "string") {
        imagesSet.add(r.mediaUrl);
      }
    });

    // 4. Fetch images from SystemSetting table
    const settingsRes = await query(
      `SELECT key, value FROM "SystemSetting" WHERE key IN ('homepage_hero_slides', 'homepage_category_showcases')`
    );
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

  // 5. Add default hero slides and category showcase images
  DEFAULT_HERO_SLIDES.forEach((slide) => {
    if (slide.desktopImage) imagesSet.add(slide.desktopImage);
    if (slide.mobileImage) imagesSet.add(slide.mobileImage);
  });

  DEFAULT_CATEGORY_SHOWCASES.forEach((showcase) => {
    if (showcase.heroImage) imagesSet.add(showcase.heroImage);
  });

  // Curated additional high-quality product presets
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
