"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const generateId = () => "cl" + crypto.randomBytes(12).toString("hex");

export interface BulkImageInput {
  url: string;
  isPrimary: boolean;
  order: number;
  alt?: string;
}

export interface BulkProductRowInput {
  productCode: string;
  name: string;
  description?: string;
  originalPrice: number;
  currentPrice: number;
  categoryName: string;
  visibility: boolean;
  images: BulkImageInput[];
}

export interface BulkCreateResult {
  success: boolean;
  totalProcessed: number;
  createdCount: number;
  failedCount: number;
  errors: string[];
}

/**
 * Generate unique slug for products
 */
async function generateUniqueSlug(baseName: string): Promise<string> {
  let baseSlug = baseName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (!baseSlug) baseSlug = "product-" + Date.now();

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await query(
      `SELECT "id" FROM "Product" WHERE "slug" = $1 LIMIT 1`,
      [slug]
    );

    if (existing.rows.length === 0) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Helper to ensure Category exists by name, returning its ID
 */
async function getOrCreateCategory(categoryName: string): Promise<string> {
  const cleanName = categoryName.trim() || "General";
  let slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  if (!slug) slug = "category-" + Date.now();

  // Try finding existing category by slug or name
  const existing = await query(
    `SELECT "id" FROM "Category" WHERE LOWER("name") = LOWER($1) OR "slug" = $2 LIMIT 1`,
    [cleanName, slug]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0].id;
  }

  // Create new category
  const newCatId = generateId();
  await query(
    `INSERT INTO "Category" ("id", "name", "slug", "status", "sortOrder", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name"
     RETURNING "id"`,
    [newCatId, cleanName, slug]
  );

  return newCatId;
}

/**
 * Bulk Create Products Action
 */
export async function bulkCreateProducts(products: BulkProductRowInput[]): Promise<BulkCreateResult> {
  if (!products || products.length === 0) {
    return {
      success: false,
      totalProcessed: 0,
      createdCount: 0,
      failedCount: 0,
      errors: ["No products provided for bulk upload."],
    };
  }

  let createdCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  // Category Cache to avoid repeated DB lookups
  const categoryMap = new Map<string, string>();

  for (let i = 0; i < products.length; i++) {
    const item = products[i];
    const rowNum = i + 1;

    try {
      if (!item.name || item.name.trim() === "") {
        throw new Error(`Row #${rowNum}: Product Name is required.`);
      }

      const basePrice = Math.round((Number(item.originalPrice) || 0) * 100) / 100;
      const salePrice = Number(item.currentPrice) > 0 ? Math.round(Number(item.currentPrice) * 100) / 100 : null;

      // 1. Multi-Category Resolution (Supporting ';' delimited categories e.g. "PLC & Controllers; Demo category; Sensors & Switches; Motors & Servo Drives")
      const rawCategoryStr = item.categoryName ? item.categoryName.trim() : "General";
      const categoryNames = rawCategoryStr
        .split(";")
        .map((c) => c.trim())
        .filter(Boolean);

      if (categoryNames.length === 0) categoryNames.push("General");

      const categoryIds: string[] = [];
      for (const catName of categoryNames) {
        let catId = categoryMap.get(catName.toLowerCase());
        if (!catId) {
          catId = await getOrCreateCategory(catName);
          categoryMap.set(catName.toLowerCase(), catId);
        }
        if (catId && !categoryIds.includes(catId)) {
          categoryIds.push(catId);
        }
      }

      const primaryCategoryId = categoryIds[0] || null;

      // 2. Code & Slug Generation
      const productCode = item.productCode ? item.productCode.trim() : `PRD-${Date.now()}-${rowNum}`;
      const sku = `SKU-${productCode.toUpperCase()}`;
      const slug = await generateUniqueSlug(item.name);
      const productId = generateId();
      const status = item.visibility ? "ACTIVE" : "DRAFT";

      await transaction(async (client) => {
        // Ensure default brand exists
        await client.query(`
          INSERT INTO "Brand" ("id", "name", "slug", "status", "sortOrder", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("slug") DO NOTHING
        `, ["default-brand", "Default Brand", "default-brand"]);

        // Insert core product
        await client.query(
          `INSERT INTO "Product" (
            "id", "name", "slug", "sku", "productCode",
            "shortDescription", "description", "categoryId", "brandId", "status",
            "basePrice", "salePrice", "compareAtPrice",
            "gstRate", "priceIncTax", "unit", "packSize", "minOrderQuantity",
            "publishedAt", "createdAt", "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9, $10,
            $11, $12, $13,
            18.0, false, 'PIECE', 1, 1,
            ${status === "ACTIVE" ? "CURRENT_TIMESTAMP" : "NULL"},
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )`,
          [
            productId,
            item.name.trim(),
            slug,
            sku,
            productCode,
            item.description ? item.description.slice(0, 200) : null,
            item.description || null,
            primaryCategoryId,
            "default-brand",
            status,
            basePrice,
            salePrice,
            basePrice > (salePrice || 0) ? basePrice : null,
          ]
        );

        // Insert all categories into ProductCategory join table
        for (const catId of categoryIds) {
          await client.query(
            `INSERT INTO "ProductCategory" ("productId", "categoryId")
             VALUES ($1, $2)
             ON CONFLICT ("productId", "categoryId") DO NOTHING`,
            [productId, catId]
          );
        }

        // Insert Inventory record
        await client.query(
          `INSERT INTO "Inventory" ("id", "productId", "quantity", "status", "reserved", "updatedAt")
           VALUES ($1, $2, $3, 'IN_STOCK', 0, CURRENT_TIMESTAMP)`,
          [generateId(), productId, 100]
        );

        // Insert Images if present
        if (item.images && item.images.length > 0) {
          for (let imgIdx = 0; imgIdx < item.images.length; imgIdx++) {
            const img = item.images[imgIdx];
            await client.query(
              `INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
               VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
              [
                generateId(),
                productId,
                img.url,
                img.alt || item.name,
                img.isPrimary,
                img.order ?? imgIdx,
              ]
            );
          }
        }
      });

      createdCount++;
    } catch (err: unknown) {
      failedCount++;
      const errorMessage = err instanceof Error ? err.message : String(err);
      errors.push(`Row #${rowNum} (${item.productCode || item.name}): ${errorMessage}`);
    }
  }

  try {
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/");
  } catch {
    // Ignore outside request context
  }

  return {
    success: createdCount > 0,
    totalProcessed: products.length,
    createdCount,
    failedCount,
    errors,
  };
}
