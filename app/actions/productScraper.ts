"use server";
import http from "node:http";
import https from "node:https";
import * as cheerio from "cheerio";
import { v2 as cloudinary } from "cloudinary";
import { requireAdmin } from "@/lib/auth-checks";
import { createProduct, updateProduct } from "@/app/actions/product";
import type { ProductFormValues } from "@/lib/validations/product";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const insecureHttpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

/**
 * Robust HTTP/HTTPS buffer fetcher with automatic redirect following
 * and support for competitor/supplier servers with incomplete SSL intermediate chains.
 */
async function fetchRemoteBuffer(urlStr: string, maxRedirects = 5): Promise<Buffer | null> {
  if (maxRedirects < 0) return null;
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const isHttps = parsed.protocol === "https:";
      const client = isHttps ? https : http;

      const req = client.get(
        parsed,
        {
          agent: isHttps ? insecureHttpsAgent : undefined,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            Accept: "*/*",
          },
          timeout: 20000,
        },
        (res) => {
          if (
            (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) &&
            res.headers.location
          ) {
            const redirectUrl = new URL(res.headers.location, urlStr).href;
            resolve(fetchRemoteBuffer(redirectUrl, maxRedirects - 1));
            return;
          }

          if (res.statusCode && res.statusCode >= 400) {
            resolve(null);
            return;
          }

          const chunks: Buffer[] = [];
          res.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
          res.on("end", () => resolve(Buffer.concat(chunks)));
          res.on("error", () => resolve(null));
        }
      );

      req.on("error", () => resolve(null));
      req.on("timeout", () => {
        req.destroy();
        resolve(null);
      });
    } catch {
      resolve(null);
    }
  });
}

async function fetchRemoteHtml(urlStr: string): Promise<string | null> {
  const buf = await fetchRemoteBuffer(urlStr);
  return buf ? buf.toString("utf-8") : null;
}

export interface ScrapedProductImage {
  url: string;
  originalUrl?: string;
  altText?: string;
  isPrimary: boolean;
  cloudinaryUploaded?: boolean;
}

export interface ScrapedProductRow {
  id: string; // client temporary row id
  sourceUrl: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  categoryId?: string;
  price: number | "";
  strikethroughPrice?: number | "";
  costPrice?: number | "";
  imageUrl: string;
  originalImageUrl: string;
  cloudinaryUploaded: boolean;
  images: ScrapedProductImage[];
  description: string;
  featureHighlights: { label: string; value: string }[];
  applications: string[];
  technicalSupportLinks: { title: string; url: string }[];
  status: "ACTIVE" | "DRAFT";
  saveStatus?: "idle" | "saving" | "saved" | "error";
  saveError?: string;
  savedProductId?: string;
  savedMode?: "created" | "updated";
  existingProduct?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sku?: string;
    brand?: string;
    images?: ScrapedProductImage[];
  } | null;
  saveMode: "create" | "update";
}

/**
 * Downloads a remote image and uploads it directly to Cloudinary.
 * Falls back to the original URL if Cloudinary fails or is not configured.
 */
async function uploadRemoteImageToCloudinary(
  remoteUrl: string,
  productTitle: string
): Promise<{ url: string; uploaded: boolean }> {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "hecyltpu";
    const apiKey = process.env.CLOUDINARY_API_KEY || process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY || "763898212434464";
    const apiSecret = process.env.CLOUDINARY_API_SECRET || "FhdYnS4JPGFZ2HnpXmWNfc5jJUo";

    if (!apiSecret || !apiKey || !cloudName) {
      console.warn("Cloudinary configuration missing, keeping original URL:", remoteUrl);
      return { url: remoteUrl, uploaded: false };
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    const buffer = await fetchRemoteBuffer(remoteUrl);
    if (!buffer || buffer.length === 0) {
      return { url: remoteUrl, uploaded: false };
    }

    const safeTitle = productTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .slice(0, 40);
    const publicId = `scraped_${safeTitle}_${Date.now()}`;

    const uploadResult = await new Promise<any>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "products",
          public_id: publicId,
          resource_type: "image",
          overwrite: true,
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    if (uploadResult?.secure_url) {
      return { url: uploadResult.secure_url, uploaded: true };
    }

    return { url: remoteUrl, uploaded: false };
  } catch (err) {
    console.warn("Failed to upload image to Cloudinary, using original:", err);
    return { url: remoteUrl, uploaded: false };
  }
}

/**
 * Scrapes product data from any competitor or manufacturer product URL
 * and uploads primary image to Cloudinary.
 */
export async function extractProductFromUrlAction(
  targetUrl: string
): Promise<{ success: boolean; data?: ScrapedProductRow; error?: string }> {
  try {
    await requireAdmin();

    const trimmed = targetUrl.trim();
    if (!trimmed || !trimmed.startsWith("http")) {
      return { success: false, error: "Please enter a valid HTTP or HTTPS URL." };
    }

    const html = await fetchRemoteHtml(trimmed);
    if (!html) {
      return {
        success: false,
        error: `Could not reach ${trimmed}. Please verify the URL and try again.`,
      };
    }

    const $ = cheerio.load(html);

    // 1. Name / Title
    let name =
      $("h1.product-title").text().trim() ||
      $(".product-header h1").text().trim() ||
      $("h1").first().text().trim() ||
      $('meta[property="og:title"]').attr("content") ||
      $("title").text().trim() ||
      "Imported Industrial Component";

    // Clean up site branding prefixes/suffixes from title
    name = name.split(" - Shree")[0].split(" | Shree")[0].split(" | OM")[0].trim();

    // 2. Brand
    let brand = "";
    // Check breadcrumbs
    $(".breadcrumb-item, .breadcrumb a, nav[aria-label='breadcrumb'] li").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).find("a").attr("href") || $(el).attr("href") || "";
      if (href.includes("/brands/") || text.toLowerCase() === "hiwin" || text.toLowerCase() === "siemens" || text.toLowerCase() === "omron") {
        brand = text;
      }
    });

    if (!brand) {
      // Common brand detection from product title
      const brandPatterns = ["HIWIN", "SIEMENS", "SCHNEIDER", "OMRON", "ABB", "DELTA", "MITSUBISHI", "SICK", "FESTO", "SMC", "PANASONIC"];
      for (const b of brandPatterns) {
        if (name.toUpperCase().includes(b)) {
          brand = b;
          break;
        }
      }
    }
    if (!brand) brand = "Generic";

    // 3. Category
    let category = "";
    $(".breadcrumb-item, .breadcrumb a, nav[aria-label='breadcrumb'] li").each((_, el) => {
      const text = $(el).text().trim();
      const href = $(el).find("a").attr("href") || $(el).attr("href") || "";
      if (
        (href.includes("category=") || href.includes("/category/") || href.includes("/products/")) &&
        text.toLowerCase() !== "home" &&
        text.toLowerCase() !== "brands" &&
        text.toLowerCase() !== brand.toLowerCase() &&
        text !== name
      ) {
        category = text;
      }
    });
    if (!category) {
      if (name.toLowerCase().includes("ballscrew") || name.toLowerCase().includes("ball screw")) {
        category = "Ballscrews";
      } else if (name.toLowerCase().includes("guideway") || name.toLowerCase().includes("linear guide") || name.toLowerCase().includes("linear block")) {
        category = "Linear Guides & Blocks";
      } else if (name.toLowerCase().includes("sensor")) {
        category = "Sensors & Perception";
      } else if (name.toLowerCase().includes("plc") || name.toLowerCase().includes("controller")) {
        category = "PLCs & Controllers";
      } else if (name.toLowerCase().includes("drive") || name.toLowerCase().includes("vfd") || name.toLowerCase().includes("servo")) {
        category = "Drives & Servo Motors";
      } else {
        category = "Industrial Automation";
      }
    }

    // 4. Description
    let description =
      $(".feature-description").first().text().trim() ||
      $(".product-description").first().html() ||
      $(".description").first().html() ||
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      `<p>High-precision ${name} engineered for reliable industrial performance.</p>`;

    // 5. Features / Specs
    const featureHighlights: { label: string; value: string }[] = [];
    $(".feature-item").each((_, el) => {
      const label = $(el).find(".feature-label").text().trim();
      const value = $(el).find(".feature-value").text().trim();
      if (label && value) {
        featureHighlights.push({ label, value });
      }
    });

    // Also look for HTML tables (common for specifications)
    if (featureHighlights.length === 0) {
      $("table tr, .specifications-section tr, .specs-grid .spec-item").each((_, el) => {
        const th = $(el).find("th, .spec-label, td:first-child").first().text().trim();
        const td = $(el).find("td:last-child, .spec-value").last().text().trim();
        if (th && td && th !== td && th.length < 50) {
          featureHighlights.push({ label: th, value: td });
        }
      });
    }

    // 6. Applications
    const applications: string[] = [];
    $(".app-tag, .applications-section .tag, .application-item").each((_, el) => {
      const appText = $(el).text().trim();
      if (appText && !applications.includes(appText)) {
        applications.push(appText);
      }
    });

    // 7. Technical Support Links
    const technicalSupportLinks: { title: string; url: string }[] = [];
    $(".support-btn, .support-buttons a, a.download-btn, .technical-downloads a").each((_, el) => {
      const title = $(el).find("span").text().trim() || $(el).text().trim();
      let href = $(el).attr("href") || "";
      if (href && !href.startsWith("#") && !href.startsWith("javascript:")) {
        try {
          href = new URL(href, trimmed).href;
          technicalSupportLinks.push({ title: title || "Technical Document", url: href });
        } catch {}
      }
    });

    // 8. Generate Default SKU
    const brandInitials = brand.substring(0, 3).toUpperCase();
    const cleanNameParts = name
      .replace(/[^a-zA-Z0-9]/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    const nameCode = cleanNameParts.slice(0, 3).map((w) => w.substring(0, 3).toUpperCase()).join("-");
    const sku = `PRD-${brandInitials}-${nameCode || "SKU"}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 9. Try to match or find categoryId from DB
    let categoryId = "";
    try {
      const catMatch = await query(
        `SELECT id FROM "Category" WHERE LOWER(name) = LOWER($1) OR LOWER(slug) = LOWER($2) LIMIT 1`,
        [category, category.toLowerCase().replace(/[^a-z0-9]+/g, "-")]
      );
      if (catMatch.rows.length > 0) {
        categoryId = catMatch.rows[0].id;
      }
    } catch {}

    // 10. Check if product already exists in database (BEFORE uploading images)
    let existingProduct: ScrapedProductRow["existingProduct"] = null;
    let existingImages: ScrapedProductImage[] = [];

    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    try {
      const matchRes = await query(
        `SELECT p."id", p."name", p."slug", p."price", p."brand",
                (SELECT pv."sku" FROM "ProductVariant" pv WHERE pv."productId" = p."id" LIMIT 1) as "variantSku"
         FROM "Product" p
         WHERE LOWER(TRIM(p."name")) = LOWER(TRIM($1))
            OR p."slug" = $2
         ORDER BY p."createdAt" DESC
         LIMIT 1`,
        [name, cleanSlug]
      );

      if (matchRes.rows.length > 0) {
        const p = matchRes.rows[0];
        existingProduct = {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price ? p.price / 100 : 0,
          sku: p.variantSku || sku,
          brand: p.brand || brand,
        };

        // Query previously uploaded images for this product from DB
        const imgMatch = await query(
          `SELECT "url", "alt", "isPrimary", "order" 
           FROM "ProductImage" 
           WHERE "productId" = $1 
           ORDER BY "order" ASC`,
          [p.id]
        );

        if (imgMatch.rows.length > 0) {
          existingImages = imgMatch.rows.map((r, idx) => ({
            url: r.url,
            originalUrl: r.url,
            altText: r.alt || name,
            isPrimary: r.isPrimary ?? (idx === 0),
            cloudinaryUploaded: r.url.includes("cloudinary"),
          }));
          existingProduct.images = existingImages;
        }
      }
    } catch (err) {
      console.warn("Error checking existing product:", err);
    }

    // 11. Image Extraction & Handling
    let finalImages: ScrapedProductImage[] = [];

    if (existingImages.length > 0) {
      // PREVIOUS UPLOADED IMAGES FOUND IN DB: REUSE DIRECTLY, DO NOT RE-UPLOAD TO CLOUDINARY!
      finalImages = existingImages;
    } else {
      // NEW PRODUCT: EXTRACT MULTIPLE IMAGES FROM REMOTE PAGE & UPLOAD TO CLOUDINARY
      const candidateImageUrls: string[] = [];

      const imageSelectors = [
        ".image-section img",
        ".product-gallery img",
        ".product-images img",
        ".product-image img",
        ".product-media img",
        ".woocommerce-product-gallery img",
        ".product__media img",
        "img.product-image",
        ".main-image img",
        "main img",
      ];

      $(imageSelectors.join(", ")).each((_, el) => {
        const src =
          $(el).attr("src") ||
          $(el).attr("data-src") ||
          $(el).attr("data-zoom") ||
          $(el).attr("data-large_image") ||
          "";

        if (src && !src.startsWith("data:")) {
          const lower = src.toLowerCase();
          const isJunk =
            lower.includes("logo") ||
            lower.includes("icon") ||
            lower.includes("arrow") ||
            lower.includes("badge") ||
            lower.includes("payment") ||
            lower.includes("footer") ||
            lower.includes("header") ||
            lower.includes("cart") ||
            lower.includes("avatar");

          if (!isJunk) {
            try {
              const abs = new URL(src, trimmed).href;
              if (!candidateImageUrls.includes(abs)) {
                candidateImageUrls.push(abs);
              }
            } catch {}
          }
        }
      });

      // Fallback to og:image if none found
      if (candidateImageUrls.length === 0) {
        const og = $('meta[property="og:image"]').attr("content") || $('meta[name="twitter:image"]').attr("content");
        if (og && !og.startsWith("data:")) {
          try {
            candidateImageUrls.push(new URL(og, trimmed).href);
          } catch {
            candidateImageUrls.push(og);
          }
        }
      }

      // Limit to at most 6 product images
      const urlsToUpload = candidateImageUrls.slice(0, 6);

      for (let i = 0; i < urlsToUpload.length; i++) {
        const rawUrl = urlsToUpload[i];
        const uploadRes = await uploadRemoteImageToCloudinary(rawUrl, `${name}-${i + 1}`);
        finalImages.push({
          url: uploadRes.url,
          originalUrl: rawUrl,
          altText: `${name} - Image ${i + 1}`,
          isPrimary: i === 0,
          cloudinaryUploaded: uploadRes.uploaded,
        });
      }
    }

    const primaryImg = finalImages.find((img) => img.isPrimary) || finalImages[0];
    const finalImageUrl = primaryImg ? primaryImg.url : "";
    const originalImageUrl = primaryImg?.originalUrl || finalImageUrl;
    const cloudinaryUploaded = primaryImg ? Boolean(primaryImg.cloudinaryUploaded) : false;

    const row: ScrapedProductRow = {
      id: "row_" + Math.random().toString(36).substring(2, 9),
      sourceUrl: trimmed,
      name,
      sku: existingProduct?.sku || sku,
      brand: existingProduct?.brand || brand,
      category,
      categoryId,
      price: existingProduct && existingProduct.price > 0 ? existingProduct.price : "",
      imageUrl: finalImageUrl,
      originalImageUrl,
      cloudinaryUploaded,
      images: finalImages,
      description,
      featureHighlights,
      applications,
      technicalSupportLinks,
      status: "ACTIVE",
      saveStatus: "idle",
      existingProduct,
      saveMode: existingProduct ? "update" : "create",
    };

    return { success: true, data: row };
  } catch (error: any) {
    console.error("Error scraping product from URL:", error);
    return {
      success: false,
      error: error?.message || "Failed to extract product data from URL.",
    };
  }
}

/**
 * Checks if a product exists by name or SKU
 */
export async function checkProductExistsAction(
  name: string,
  sku?: string
): Promise<{
  exists: boolean;
  product?: {
    id: string;
    name: string;
    slug: string;
    price: number;
    sku?: string;
    brand?: string;
    images?: ScrapedProductImage[];
  };
}> {
  try {
    await requireAdmin();
    const cleanSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const matchRes = await query(
      `SELECT p."id", p."name", p."slug", p."price", p."brand",
              (SELECT pv."sku" FROM "ProductVariant" pv WHERE pv."productId" = p."id" LIMIT 1) as "variantSku"
       FROM "Product" p
       WHERE LOWER(TRIM(p."name")) = LOWER(TRIM($1))
          OR p."slug" = $2
          ${sku ? 'OR p."id" IN (SELECT "productId" FROM "ProductVariant" WHERE LOWER(TRIM("sku")) = LOWER(TRIM($3)))' : ''}
       ORDER BY p."createdAt" DESC
       LIMIT 1`,
      sku ? [name, cleanSlug, sku] : [name, cleanSlug]
    );

    if (matchRes.rows.length > 0) {
      const p = matchRes.rows[0];
      const imgMatch = await query(
        `SELECT "url", "alt", "isPrimary", "order" 
         FROM "ProductImage" 
         WHERE "productId" = $1 
         ORDER BY "order" ASC`,
        [p.id]
      );
      const existingImages: ScrapedProductImage[] = imgMatch.rows.map((r, idx) => ({
        url: r.url,
        originalUrl: r.url,
        altText: r.alt || p.name,
        isPrimary: r.isPrimary ?? (idx === 0),
        cloudinaryUploaded: r.url.includes("cloudinary"),
      }));

      return {
        exists: true,
        product: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: p.price ? p.price / 100 : 0,
          sku: p.variantSku || sku,
          brand: p.brand || undefined,
          images: existingImages,
        },
      };
    }
    return { exists: false };
  } catch {
    return { exists: false };
  }
}

/**
 * Saves a single reviewed row from the spreadsheet modal to the database
 */
export async function saveScrapedProductRowAction(
  row: ScrapedProductRow
): Promise<{ success: boolean; productId?: string; mode?: "created" | "updated"; error?: string }> {
  try {
    await requireAdmin();

    const priceNum = typeof row.price === "number" ? row.price : parseFloat(row.price || "0");
    if (isNaN(priceNum) || priceNum <= 0) {
      return { success: false, error: "Please enter a valid selling price greater than 0." };
    }

    if (!row.name || row.name.trim() === "") {
      return { success: false, error: "Product name cannot be empty." };
    }

    // 1. Resolve or create category
    let primaryCatId = row.categoryId || "";
    if (!primaryCatId && row.category) {
      const catSlug = row.category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const existingCat = await query(
        `SELECT id FROM "Category" WHERE LOWER(slug) = LOWER($1) OR LOWER(name) = LOWER($2) LIMIT 1`,
        [catSlug, row.category]
      );
      if (existingCat.rows.length > 0) {
        primaryCatId = existingCat.rows[0].id;
      } else {
        const newCatId = "cat_" + catSlug.replace(/-/g, "_");
        await query(
          `INSERT INTO "Category" (id, name, slug, description, status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
           ON CONFLICT (slug) DO UPDATE SET name = $2
           RETURNING id`,
          [newCatId, row.category, catSlug, `Industrial ${row.category} automation components`]
        );
        primaryCatId = newCatId;
      }
    }

    // 2. Prepare images
    const images = row.imageUrl
      ? [
          {
            url: row.imageUrl,
            altText: row.name,
            isPrimary: true,
          },
        ]
      : [];

    const productInput: ProductFormValues = {
      name: row.name.trim().slice(0, 80),
      description: row.description || `<p>${row.name}</p>`,
      brand: row.brand || "Generic",
      price: priceNum,
      strikethroughPrice: row.strikethroughPrice ? Number(row.strikethroughPrice) : null,
      costPrice: row.costPrice ? Number(row.costPrice) : null,
      categoryId: primaryCatId || "",
      categoryIds: primaryCatId ? [primaryCatId] : [],
      primaryCategoryId: primaryCatId || null,
      primaryRibbon: null,
      visible: row.status === "ACTIVE",
      showInPos: true,
      enableBuyerNote: true,
      taxGroup: "STANDARD",
      showPricePerUnit: false,
      baseUnit: 1,
      baseUnitMeasurement: "PCS",
      totalUnits: 1,
      totalUnitsMeasurement: "PCS",
      featureHighlights: (row.featureHighlights || []).slice(0, 6),
      applications: (row.applications || []).slice(0, 20),
      technicalSupportLinks: (row.technicalSupportLinks || []).slice(0, 6).map((link) => ({
        title: link.title.slice(0, 100),
        url: link.url,
        icon: "specs" as const,
      })),
      images: (row.images && row.images.length > 0)
        ? row.images.slice(0, 10).map((img, idx) => ({
            url: img.url,
            altText: img.altText || row.name,
            isPrimary: img.isPrimary ?? (idx === 0),
            sortOrder: idx,
          }))
        : (row.imageUrl
            ? [
                {
                  url: row.imageUrl,
                  altText: row.name,
                  isPrimary: true,
                  sortOrder: 0,
                },
              ]
            : []),
      options: [],
      variants: [],
      tagIds: [],
      infoSectionIds: [],
      status: row.status === "ACTIVE" ? "ACTIVE" : "DRAFT",
      slug: null,
      videoUrl: "",
      seoTitle: null,
      seoDesc: null,
    };

    if (row.saveMode === "update" && row.existingProduct?.id) {
      const updateRes = await updateProduct(row.existingProduct.id, productInput);
      if (!updateRes.success) {
        return { success: false, error: updateRes.error || "Database update failed." };
      }
      revalidatePath("/admin/products");
      revalidatePath("/products");
      return { success: true, productId: row.existingProduct.id, mode: "updated" };
    }

    const res = await createProduct(productInput);
    if (!res.success) {
      return { success: false, error: res.error || "Database insert failed." };
    }

    revalidatePath("/admin/products");
    revalidatePath("/products");

    return { success: true, productId: res.id, mode: "created" };
  } catch (error: any) {
    console.error("Error saving scraped product:", error);
    return { success: false, error: error?.message || "Failed to save product to database." };
  }
}
