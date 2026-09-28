"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";
import { requireAdmin } from "@/lib/auth-checks";
import { sanitizeRichHtml } from "@/lib/sanitize";
import { safeActionResponse } from "@/lib/safe-error";

const generateId = (prefix = "prd_") => prefix + crypto.randomBytes(8).toString("hex");

/**
 * Generate unique slug with numeric collision fallback
 */
async function generateUniqueSlug(baseName: string, currentId?: string): Promise<string> {
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
      `SELECT "id" FROM "Product" WHERE "slug" = $1 ${currentId ? 'AND "id" != $2' : ''} LIMIT 1`,
      currentId ? [slug, currentId] : [slug]
    );

    if (existing.rows.length === 0) {
      return slug;
    }

    counter++;
    slug = `${baseSlug}-${counter}`;
  }
}

/**
 * Public action to check and return an available unique slug
 */
export async function checkAndGetUniqueProductSlug(
  baseNameOrSlug: string,
  currentProductId?: string
): Promise<{ success: boolean; slug: string }> {
  try {
    const slug = await generateUniqueSlug(baseNameOrSlug, currentProductId);
    return { success: true, slug };
  } catch {
    const fallback =
      baseNameOrSlug
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "") || `product-${Date.now()}`;
    return { success: true, slug: fallback };
  }
}

/**
 * Check if a custom-typed slug already exists in database
 */
export async function checkSlugAvailability(
  slug: string,
  currentProductId?: string
): Promise<{ exists: boolean; availableSlug: string; message?: string; existingProductName?: string }> {
  try {
    const cleanSlug = slug
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    if (!cleanSlug) {
      return { exists: false, availableSlug: "" };
    }

    const existing = await query(
      `SELECT "id", "name" FROM "Product" WHERE "slug" = $1 ${currentProductId ? 'AND "id" != $2' : ''} LIMIT 1`,
      currentProductId ? [cleanSlug, currentProductId] : [cleanSlug]
    );

    if (existing.rows.length > 0) {
      const availableSlug = await generateUniqueSlug(cleanSlug, currentProductId);
      const existingProduct = existing.rows[0] as any;
      return {
        exists: true,
        availableSlug,
        existingProductName: existingProduct.name,
        message: `This URL is already in use by "${existingProduct.name}".`,
      };
    }

    return { exists: false, availableSlug: cleanSlug };
  } catch {
    return { exists: false, availableSlug: slug };
  }
}

/**
 * Helper to generate default SKU
 */
function generateDefaultSku(productId: string) {
  return `PRD-${productId.slice(-6).toUpperCase()}`;
}

/**
 * Safe revalidation helper
 */
function safeRevalidate(path: string) {
  try {
    revalidatePath(path);
  } catch {
    // Ignore outside Next.js request context
  }
}

/**
 * CREATE PRODUCT (Atomic PostgreSQL Transaction)
 */
export async function createProduct(input: ProductFormValues): Promise<
  { success: true; id: string; error?: never } | { success: false; error: string; id?: never }
> {
  try {
    await requireAdmin();
    const validated = productFormSchema.parse(input);
    const productId = validated.id || generateId("prd_");
    const slug = await generateUniqueSlug(validated.slug?.trim() || validated.name);
    const sku = generateDefaultSku(productId);

    const priceInPaise = Math.round(validated.price * 100);
    const strikethroughInPaise = validated.strikethroughPrice ? Math.round(validated.strikethroughPrice * 100) : null;
    const costInPaise = validated.costPrice ? Math.round(validated.costPrice * 100) : null;

    await transaction(async (client) => {
      // 1. Ensure Brand in Brand table
      const brandName = validated.brand?.trim() || "";
      if (brandName) {
        const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `brand-${Date.now()}`;
        const brandId = "brand_" + brandSlug.replace(/-/g, "_");
        await client.query(`
          INSERT INTO "Brand" ("id", "name", "slug", "status", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("slug") DO UPDATE SET "name" = $2
        `, [brandId, brandName, brandSlug]);
      }

      const primaryCat = validated.primaryCategoryId || validated.categoryIds[0] || validated.categoryId || null;

      // 2. Insert Core Product
      await client.query(`
        INSERT INTO "Product" (
          "id", "name", "slug", "sku", "description", "status", "visible", "showInPos",
          "categoryId", "primaryCategoryId", "primaryRibbon", "brand",
          "basePrice", "price", "compareAtPrice", "strikethroughPrice", "costPrice",
          "showPricePerUnit", "baseUnit", "baseUnitMeasurement", "totalUnits", "totalUnitsMeasurement", "taxGroup",
          "featureHighlights", "applications", "technicalSupportLinks", "enableBuyerNote", "videoUrl", "seoTitle", "seoDesc",
          "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23,
          $24, $25, $26, $27, $28, $29, $30,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        productId, validated.name, slug, sku, sanitizeRichHtml(validated.description), validated.visible ? 'ACTIVE' : 'DRAFT', validated.visible, validated.showInPos,
        primaryCat || null, primaryCat || null, validated.primaryRibbon || null, brandName || null,
        priceInPaise, priceInPaise, strikethroughInPaise, strikethroughInPaise, costInPaise,
        validated.showPricePerUnit, validated.baseUnit, validated.baseUnitMeasurement, validated.totalUnits || null, validated.totalUnitsMeasurement, validated.taxGroup,
        JSON.stringify(validated.featureHighlights || []),
        JSON.stringify(validated.applications || []),
        JSON.stringify(validated.technicalSupportLinks || []),
        validated.enableBuyerNote !== false,
        validated.videoUrl || null,
        validated.seoTitle || null,
        validated.seoDesc || null
      ]);

      // 3. Insert Category Join Table (supports multiple or 0 categories)
      const allCats = Array.from(new Set([primaryCat, ...(validated.categoryIds || [])]))
        .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim() !== ''));
      for (const catId of allCats) {
        await client.query(`
          INSERT INTO "ProductCategory" ("productId", "categoryId")
          VALUES ($1, $2)
          ON CONFLICT ("productId", "categoryId") DO NOTHING
        `, [productId, catId]);
      }

      // 4. Insert Tag Assignments
      if (validated.tagIds && validated.tagIds.length > 0) {
        for (const tagId of validated.tagIds) {
          await client.query(`
            INSERT INTO "ProductTagAssignment" ("productId", "tagId")
            VALUES ($1, $2)
            ON CONFLICT ("productId", "tagId") DO NOTHING
          `, [productId, tagId]);
        }
      }

      // 5. Insert Media (max 10)
      if (validated.images && validated.images.length > 0) {
        const mediaList = validated.images.slice(0, 10);
        for (let idx = 0; idx < mediaList.length; idx++) {
          const img = mediaList[idx];
          const mediaId = generateId("med_");
          await client.query(`
            INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [mediaId, productId, img.url, img.altText || validated.name, img.isPrimary ?? (idx === 0), idx]);
        }
      }

      // 6. Insert Product Options & Choices
      if (validated.options && validated.options.length > 0) {
        for (let oIdx = 0; oIdx < validated.options.length; oIdx++) {
          const opt = validated.options[oIdx];
          const optId = opt.id || generateId("opt_");
          await client.query(`
            INSERT INTO "ProductOption" ("id", "productId", "globalOptionId", "name", "fieldType", "sortOrder", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [optId, productId, opt.globalOptionId || null, opt.name, opt.fieldType || 'TEXT_CHOICES', oIdx]);

          if (opt.choices && opt.choices.length > 0) {
            for (let cIdx = 0; cIdx < opt.choices.length; cIdx++) {
              const choice = opt.choices[cIdx];
              const choiceId = choice.id || generateId("ch_");
              await client.query(`
                INSERT INTO "ProductOptionChoice" ("id", "optionId", "name", "colorHex", "sortOrder", "createdAt")
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
              `, [choiceId, optId, choice.name, choice.colorHex || null, cIdx]);
            }
          }
        }
      }

      // 7. Insert Generated / Custom Variants
      if (validated.variants && validated.variants.length > 0) {
        for (let vIdx = 0; vIdx < validated.variants.length; vIdx++) {
          const v = validated.variants[vIdx];
          const varId = v.id || generateId("var_");
          const vPrice = Math.round(Number(v.price || validated.price) * 100);
          const vStrikethrough = v.strikethroughPrice ? Math.round(Number(v.strikethroughPrice) * 100) : strikethroughInPaise;
          const vCost = v.cost ? Math.round(Number(v.cost) * 100) : costInPaise;
          const vSku = v.sku?.trim() ? v.sku.trim() : `${sku || productId.slice(-6)}-${vIdx + 1}`;

          await client.query(`
            INSERT INTO "ProductVariant" (
              "id", "productId", "sku", "barcode", "price", "strikethroughPrice", "cost",
              "trackQuantity", "stockQuantity", "inventoryStatus", "preOrderEnabled", "preOrderLimit",
              "totalUnits", "totalUnitsMeasurement", "packageLength", "packageWidth", "packageHeight", "packageUnit",
              "mediaUrl", "attributes", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            varId, productId, vSku, v.barcode || null, vPrice, vStrikethrough, vCost,
            Boolean(v.trackQuantity), Number(v.stockQuantity ?? 100), v.inventoryStatus || 'IN_STOCK',
            Boolean(v.preOrderEnabled), v.preOrderLimit ? Number(v.preOrderLimit) : null,
            v.totalUnits ? Number(v.totalUnits) : null, v.totalUnitsMeasurement || 'g',
            v.packageLength ? Number(v.packageLength) : null, v.packageWidth ? Number(v.packageWidth) : null,
            v.packageHeight ? Number(v.packageHeight) : null, v.packageUnit || 'cm',
            v.mediaUrl || null, JSON.stringify(v.attributes || {})
          ]);
        }
      }

      // 8. Insert Assigned Info Sections
      if (validated.infoSectionIds && validated.infoSectionIds.length > 0) {
        for (let sIdx = 0; sIdx < validated.infoSectionIds.length; sIdx++) {
          const secId = validated.infoSectionIds[sIdx];
          await client.query(`
            INSERT INTO "ProductAssignedInfoSection" ("productId", "sectionId", "sortOrder")
            VALUES ($1, $2, $3)
            ON CONFLICT ("productId", "sectionId") DO UPDATE SET "sortOrder" = $3
          `, [productId, secId, sIdx]);
        }
      }
    });

    safeRevalidate("/admin/products");
    safeRevalidate("/admin/categories");
    safeRevalidate("/products");
    safeRevalidate("/");
    return { success: true, id: productId };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to create product");
  }
}

/**
 * UPDATE PRODUCT (Atomic PostgreSQL Transaction)
 */
export async function updateProduct(productId: string, input: ProductFormValues): Promise<
  { success: true; id: string; error?: never } | { success: false; error: string; id?: never }
> {
  try {
    await requireAdmin();
    const validated = productFormSchema.parse(input);
    const slug = await generateUniqueSlug(validated.slug?.trim() || validated.name, productId);

    const priceInPaise = Math.round(validated.price * 100);
    const strikethroughInPaise = validated.strikethroughPrice ? Math.round(validated.strikethroughPrice * 100) : null;
    const costInPaise = validated.costPrice ? Math.round(validated.costPrice * 100) : null;

    await transaction(async (client) => {
      // 1. Ensure Brand in Brand table
      const brandName = validated.brand?.trim() || "";
      if (brandName) {
        const brandSlug = brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `brand-${Date.now()}`;
        const brandId = "brand_" + brandSlug.replace(/-/g, "_");
        await client.query(`
          INSERT INTO "Brand" ("id", "name", "slug", "status", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("slug") DO UPDATE SET "name" = $2
        `, [brandId, brandName, brandSlug]);
      }

      const primaryCat = validated.primaryCategoryId || validated.categoryIds[0] || validated.categoryId || null;

      // 1. Update Core Product
      await client.query(`
        UPDATE "Product" SET
          "name" = $1, "slug" = $2, "description" = $3, "status" = $4, "visible" = $5, "showInPos" = $6,
          "categoryId" = $7, "primaryCategoryId" = $8, "primaryRibbon" = $9, "brand" = $10,
          "basePrice" = $11, "price" = $12, "compareAtPrice" = $13, "strikethroughPrice" = $14, "costPrice" = $15,
          "showPricePerUnit" = $16, "baseUnit" = $17, "baseUnitMeasurement" = $18, "totalUnits" = $19, "totalUnitsMeasurement" = $20, "taxGroup" = $21,
          "featureHighlights" = $22, "applications" = $23, "technicalSupportLinks" = $24, "enableBuyerNote" = $25, "videoUrl" = $26, "seoTitle" = $27, "seoDesc" = $28,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $29
      `, [
        validated.name, slug, sanitizeRichHtml(validated.description), validated.visible ? 'ACTIVE' : 'DRAFT', validated.visible, validated.showInPos,
        primaryCat || null, primaryCat || null, validated.primaryRibbon || null, brandName || null,
        priceInPaise, priceInPaise, strikethroughInPaise, strikethroughInPaise, costInPaise,
        validated.showPricePerUnit, validated.baseUnit, validated.baseUnitMeasurement, validated.totalUnits || null, validated.totalUnitsMeasurement, validated.taxGroup,
        JSON.stringify(validated.featureHighlights || []),
        JSON.stringify(validated.applications || []),
        JSON.stringify(validated.technicalSupportLinks || []),
        validated.enableBuyerNote !== false,
        validated.videoUrl || null,
        validated.seoTitle || null,
        validated.seoDesc || null,
        productId
      ]);

      // 2. Categories (supports multiple or 0 categories)
      await client.query(`DELETE FROM "ProductCategory" WHERE "productId" = $1`, [productId]);
      const allCats = Array.from(new Set([primaryCat, ...(validated.categoryIds || [])]))
        .filter((c): c is string => Boolean(c && typeof c === 'string' && c.trim() !== ''));
      for (const catId of allCats) {
        await client.query(`
          INSERT INTO "ProductCategory" ("productId", "categoryId")
          VALUES ($1, $2)
          ON CONFLICT ("productId", "categoryId") DO NOTHING
        `, [productId, catId]);
      }

      // 3. Tags
      await client.query(`DELETE FROM "ProductTagAssignment" WHERE "productId" = $1`, [productId]);
      if (validated.tagIds && validated.tagIds.length > 0) {
        for (const tagId of validated.tagIds) {
          await client.query(`
            INSERT INTO "ProductTagAssignment" ("productId", "tagId")
            VALUES ($1, $2)
            ON CONFLICT ("productId", "tagId") DO NOTHING
          `, [productId, tagId]);
        }
      }

      // 4. Media
      await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [productId]);
      if (validated.images && validated.images.length > 0) {
        const mediaList = validated.images.slice(0, 10);
        for (let idx = 0; idx < mediaList.length; idx++) {
          const img = mediaList[idx];
          const mediaId = generateId("med_");
          await client.query(`
            INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "isPrimary", "order", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [mediaId, productId, img.url, img.altText || validated.name, img.isPrimary ?? (idx === 0), idx]);
        }
      }

      // 5. Options & Choices
      await client.query(`DELETE FROM "ProductOption" WHERE "productId" = $1`, [productId]);
      if (validated.options && validated.options.length > 0) {
        for (let oIdx = 0; oIdx < validated.options.length; oIdx++) {
          const opt = validated.options[oIdx];
          const optId = opt.id || generateId("opt_");
          await client.query(`
            INSERT INTO "ProductOption" ("id", "productId", "globalOptionId", "name", "fieldType", "sortOrder", "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
          `, [optId, productId, opt.globalOptionId || null, opt.name, opt.fieldType || 'TEXT_CHOICES', oIdx]);

          if (opt.choices && opt.choices.length > 0) {
            for (let cIdx = 0; cIdx < opt.choices.length; cIdx++) {
              const choice = opt.choices[cIdx];
              const choiceId = choice.id || generateId("ch_");
              await client.query(`
                INSERT INTO "ProductOptionChoice" ("id", "optionId", "name", "colorHex", "sortOrder", "createdAt")
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
              `, [choiceId, optId, choice.name, choice.colorHex || null, cIdx]);
            }
          }
        }
      }

      // 6. Variants
      if (validated.variants && validated.variants.length > 0) {
        await client.query(`DELETE FROM "ProductVariant" WHERE "productId" = $1`, [productId]);
        for (let vIdx = 0; vIdx < validated.variants.length; vIdx++) {
          const v = validated.variants[vIdx];
          const varId = v.id || generateId("var_");
          const vPrice = Math.round(Number(v.price || validated.price) * 100);
          const vStrikethrough = v.strikethroughPrice ? Math.round(Number(v.strikethroughPrice) * 100) : strikethroughInPaise;
          const vCost = v.cost ? Math.round(Number(v.cost) * 100) : costInPaise;
          const vSku = v.sku?.trim() ? v.sku.trim() : `VAR-${productId.slice(-6)}-${vIdx + 1}`;

          await client.query(`
            INSERT INTO "ProductVariant" (
              "id", "productId", "sku", "barcode", "price", "strikethroughPrice", "cost",
              "trackQuantity", "stockQuantity", "inventoryStatus", "preOrderEnabled", "preOrderLimit",
              "totalUnits", "totalUnitsMeasurement", "packageLength", "packageWidth", "packageHeight", "packageUnit",
              "mediaUrl", "attributes", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `, [
            varId, productId, vSku, v.barcode || null, vPrice, vStrikethrough, vCost,
            Boolean(v.trackQuantity), Number(v.stockQuantity ?? 100), v.inventoryStatus || 'IN_STOCK',
            Boolean(v.preOrderEnabled), v.preOrderLimit ? Number(v.preOrderLimit) : null,
            v.totalUnits ? Number(v.totalUnits) : null, v.totalUnitsMeasurement || 'g',
            v.packageLength ? Number(v.packageLength) : null, v.packageWidth ? Number(v.packageWidth) : null,
            v.packageHeight ? Number(v.packageHeight) : null, v.packageUnit || 'cm',
            v.mediaUrl || null, JSON.stringify(v.attributes || {})
          ]);
        }
      }

      // 7. Info Sections
      await client.query(`DELETE FROM "ProductAssignedInfoSection" WHERE "productId" = $1`, [productId]);
      if (validated.infoSectionIds && validated.infoSectionIds.length > 0) {
        for (let sIdx = 0; sIdx < validated.infoSectionIds.length; sIdx++) {
          const secId = validated.infoSectionIds[sIdx];
          await client.query(`
            INSERT INTO "ProductAssignedInfoSection" ("productId", "sectionId", "sortOrder")
            VALUES ($1, $2, $3)
            ON CONFLICT ("productId", "sectionId") DO UPDATE SET "sortOrder" = $3
          `, [productId, secId, sIdx]);
        }
      }
    });

    safeRevalidate("/admin/products");
    safeRevalidate("/admin/categories");
    safeRevalidate(`/admin/products/${productId}`);
    safeRevalidate(`/admin/products/${productId}/variants`);
    safeRevalidate("/products");
    return { success: true, id: productId };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to update product");
  }
}

/**
 * GET PRODUCT FOR EDITING (Full Wix Model)
 */
export async function getProductForEdit(productId: string) {
  try {
    await requireAdmin();
    const prodRes = await query(`SELECT * FROM "Product" WHERE "id" = $1 LIMIT 1`, [productId]);
    if (prodRes.rows.length === 0) return null;
    const p = prodRes.rows[0];

    const [categoriesRes, tagsRes, imagesRes, optionsRes, choicesRes, variantsRes, sectionsRes] = await Promise.all([
      query(`SELECT "categoryId" FROM "ProductCategory" WHERE "productId" = $1`, [productId]),
      query(`SELECT "tagId" FROM "ProductTagAssignment" WHERE "productId" = $1`, [productId]),
      query(`SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY "order" ASC LIMIT 10`, [productId]),
      query(`SELECT * FROM "ProductOption" WHERE "productId" = $1 ORDER BY "sortOrder" ASC`, [productId]),
      query(`
        SELECT c.*, o."productId" 
        FROM "ProductOptionChoice" c
        JOIN "ProductOption" o ON c."optionId" = o."id"
        WHERE o."productId" = $1
        ORDER BY c."sortOrder" ASC
      `, [productId]),
      query(`SELECT * FROM "ProductVariant" WHERE "productId" = $1 ORDER BY "id" ASC`, [productId]),
      query(`SELECT "sectionId" FROM "ProductAssignedInfoSection" WHERE "productId" = $1 ORDER BY "sortOrder" ASC`, [productId])
    ]);

    const choicesByOption = new Map<string, any[]>();
    choicesRes.rows.forEach(c => {
      const list = choicesByOption.get(c.optionId) || [];
      list.push({ id: c.id, name: c.name, colorHex: c.colorHex || "", sortOrder: c.sortOrder });
      choicesByOption.set(c.optionId, list);
    });

    const options = optionsRes.rows.map(o => ({
      id: o.id,
      globalOptionId: o.globalOptionId,
      name: o.name,
      fieldType: o.fieldType || "TEXT_CHOICES",
      sortOrder: o.sortOrder,
      choices: choicesByOption.get(o.id) || []
    }));

    const categoryIds = categoriesRes.rows.map(r => r.categoryId);
    const tagIds = tagsRes.rows.map(r => r.tagId);
    const infoSectionIds = sectionsRes.rows.map(r => r.sectionId);

    const price = (p.price || p.basePrice || 0) / 100;
    const strikethroughPrice = (p.strikethroughPrice || p.compareAtPrice) ? (p.strikethroughPrice || p.compareAtPrice) / 100 : null;
    const costPrice = p.costPrice ? p.costPrice / 100 : null;

    const variants = variantsRes.rows.map(v => ({
      id: v.id,
      sku: v.sku,
      barcode: v.barcode || "",
      price: (v.price || 0) / 100,
      strikethroughPrice: v.strikethroughPrice ? v.strikethroughPrice / 100 : null,
      cost: v.cost ? v.cost / 100 : null,
      trackQuantity: Boolean(v.trackQuantity),
      stockQuantity: Number(v.stockQuantity ?? 100),
      inventoryStatus: v.inventoryStatus || 'IN_STOCK',
      preOrderEnabled: Boolean(v.preOrderEnabled),
      preOrderLimit: v.preOrderLimit,
      totalUnits: v.totalUnits,
      totalUnitsMeasurement: v.totalUnitsMeasurement || 'g',
      packageLength: v.packageLength,
      packageWidth: v.packageWidth,
      packageHeight: v.packageHeight,
      packageUnit: v.packageUnit || 'cm',
      mediaUrl: v.mediaUrl || "",
      attributes: typeof v.attributes === "string" ? JSON.parse(v.attributes) : (v.attributes || {}),
      displayName: Object.values(typeof v.attributes === "string" ? JSON.parse(v.attributes) : (v.attributes || {})).join(" | ") || v.sku || ""
    }));

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description || "",
      visible: Boolean(p.visible ?? (p.status !== "DRAFT")),
      showInPos: Boolean(p.showInPos ?? true),
      status: p.status || "ACTIVE",
      categoryId: p.primaryCategoryId || (categoryIds[0] || p.categoryId || ""),
      categoryIds: categoryIds.length > 0 ? categoryIds : (p.categoryId ? [p.categoryId] : []),
      primaryCategoryId: p.primaryCategoryId || categoryIds[0] || "",
      primaryRibbon: p.primaryRibbon || "",
      brand: p.brand || "",
      tagIds,
      price,
      strikethroughPrice,
      costPrice,
      showPricePerUnit: Boolean(p.showPricePerUnit),
      baseUnit: Number(p.baseUnit ?? 100),
      baseUnitMeasurement: p.baseUnitMeasurement || "g",
      totalUnits: p.totalUnits ? Number(p.totalUnits) : null,
      totalUnitsMeasurement: p.totalUnitsMeasurement || "g",
      taxGroup: p.taxGroup || "Products (default rate)",
      featureHighlights: typeof p.featureHighlights === "string" ? JSON.parse(p.featureHighlights) : (Array.isArray(p.featureHighlights) ? p.featureHighlights : []),
      applications: typeof p.applications === "string" ? JSON.parse(p.applications) : (Array.isArray(p.applications) ? p.applications : []),
      technicalSupportLinks: typeof p.technicalSupportLinks === "string" ? JSON.parse(p.technicalSupportLinks) : (Array.isArray(p.technicalSupportLinks) ? p.technicalSupportLinks : []),
      enableBuyerNote: p.enableBuyerNote !== false,
      videoUrl: p.videoUrl || "",
      seoTitle: p.seoTitle || "",
      seoDesc: p.seoDesc || "",
      images: imagesRes.rows.map((img, idx) => ({
        id: img.id,
        url: img.url,
        altText: img.alt || "",
        isPrimary: Boolean(img.isPrimary ?? (idx === 0)),
        sortOrder: img.order || idx
      })),
      options,
      variants,
      infoSectionIds
    };
  } catch (error) {
    console.error("Failed to load product for edit:", error);
    return null;
  }
}

/**
 * GET ADMIN PRODUCTS LIST WITH FILTERING & STATS
 */
export async function getAdminProductsList(params?: { search?: string; category?: string; status?: string }) {
  try {
    await requireAdmin();
    let whereClause = `WHERE (p."status" IS NULL OR p."status" != 'DELETED') AND p."deletedAt" IS NULL`;
    const queryParams: any[] = [];

    if (params?.search && params.search.trim()) {
      queryParams.push(`%${params.search.trim()}%`);
      whereClause += ` AND (p."name" ILIKE $${queryParams.length} OR p."sku" ILIKE $${queryParams.length} OR p."brand" ILIKE $${queryParams.length})`;
    }

    const res = await query(`
      SELECT 
        p."id",
        p."name",
        p."slug",
        p."sku",
        p."status",
        p."visible",
        p."price",
        p."basePrice",
        p."strikethroughPrice",
        p."compareAtPrice",
        p."primaryRibbon",
        p."brand",
        p."createdAt",
        (SELECT "url" FROM "ProductImage" WHERE "productId" = p."id" ORDER BY "isPrimary" DESC, "order" ASC LIMIT 1) as "imageUrl",
        (SELECT COUNT(*)::int FROM "ProductVariant" WHERE "productId" = p."id") as "variantCount",
        (SELECT MIN("price") FROM "ProductVariant" WHERE "productId" = p."id") as "minVariantPrice",
        (SELECT MAX("price") FROM "ProductVariant" WHERE "productId" = p."id") as "maxVariantPrice",
        (SELECT string_agg(t."name", ', ') FROM "ProductTagAssignment" pta JOIN "ProductTag" t ON pta."tagId" = t."id" WHERE pta."productId" = p."id") as "tags",
        (SELECT string_agg(c."name", ', ') FROM "ProductCategory" pc JOIN "Category" c ON pc."categoryId" = c."id" WHERE pc."productId" = p."id") as "categories",
        (SELECT string_agg(pc."categoryId", ',') FROM "ProductCategory" pc WHERE pc."productId" = p."id") as "categoryIds"
      FROM "Product" p
      ${whereClause}
      ORDER BY p."createdAt" DESC
    `, queryParams);

    return res.rows.map(row => {
      const variantCount = row.variantCount || 0;
      let displayPrice = "";
      if (variantCount > 0 && row.minVariantPrice) {
        if (row.minVariantPrice === row.maxVariantPrice) {
          displayPrice = `₹${(row.minVariantPrice / 100).toFixed(2)}`;
        } else {
          displayPrice = `From ₹${(row.minVariantPrice / 100).toFixed(2)}`;
        }
      } else {
        const rawPrice = row.price || row.basePrice || 0;
        displayPrice = `₹${(rawPrice / 100).toFixed(2)}`;
      }

      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        sku: row.sku || "",
        type: "Physical",
        imageUrl: row.imageUrl || "",
        variantCount,
        displayPrice,
        priceNumber: (row.price || row.basePrice || 0) / 100,
        inventoryStatus: "In stock",
        ribbon: row.primaryRibbon || "",
        brand: row.brand || "",
        tags: row.tags ? row.tags.split(", ") : [],
        categories: row.categories ? row.categories.split(", ") : [],
        categoryIds: row.categoryIds ? row.categoryIds.split(",") : [],
        visible: Boolean(row.visible ?? (row.status !== "DRAFT"))
      };
    });
  } catch (error) {
    console.error("Failed to load admin products list:", error);
    return [];
  }
}

/**
 * TOGGLE PRODUCT VISIBILITY
 */
export async function toggleProductVisibility(
  productId: string,
  currentVisible: boolean
): Promise<{ success: true; visible: boolean; error?: never } | { success: false; error: string; visible?: never }> {
  try {
    await requireAdmin();
    const nextVisible = !currentVisible;
    await query(`
      UPDATE "Product" 
      SET "visible" = $1, "status" = $2, "updatedAt" = CURRENT_TIMESTAMP 
      WHERE "id" = $3
    `, [nextVisible, nextVisible ? "ACTIVE" : "DRAFT", productId]);

    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true, visible: nextVisible };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to toggle visibility");
  }
}

/**
 * DUPLICATE PRODUCT
 */
export async function duplicateProduct(productId: string): Promise<
  { success: true; id: string; error?: never } | { success: false; error: string; id?: never }
> {
  try {
    await requireAdmin();
    const original = await getProductForEdit(productId);
    if (!original) return { success: false, error: "Product not found" };

    const newId = generateId("prd_");
    const newName = `${original.name} (Copy)`.slice(0, 80);

    const duplicateInput: ProductFormValues = {
      ...original,
      id: newId,
      name: newName,
      visible: false,
      status: "DRAFT"
    };

    const res = await createProduct(duplicateInput);
    if (res.success) {
      safeRevalidate("/admin/products");
      return { success: true, id: newId };
    }
    return res;
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to duplicate product");
  }
}

/**
 * DELETE PRODUCT (SOFT-DELETE / MOVE TO RECYCLE BIN)
 * Immediately hides product from public storefront and active admin list without destroying data.
 */
export async function deleteProduct(productId: string): Promise<
  { success: true; error?: never } | { success: false; error: string }
> {
  try {
    await requireAdmin();
    await query(
      `UPDATE "Product" 
       SET "status" = 'DELETED', "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "id" = $1`,
      [productId]
    );
    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to delete product");
  }
}

/**
 * BULK SET PRODUCT VISIBILITY
 * Sets visibility and corresponding status for multiple products at once.
 */
export async function bulkSetProductVisibility(
  productIds: string[],
  visible: boolean
): Promise<{ success: true; count: number; error?: never } | { success: false; error: string }> {
  try {
    await requireAdmin();
    if (!productIds || productIds.length === 0) {
      return { success: false, error: "No products selected" };
    }

    const res = await query(
      `UPDATE "Product" 
       SET "visible" = $1, "status" = $2, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "id" = ANY($3) 
         AND ("status" IS NULL OR "status" != 'DELETED') 
         AND "deletedAt" IS NULL`,
      [visible, visible ? "ACTIVE" : "DRAFT", productIds]
    );

    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true, count: res.rowCount ?? productIds.length };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to update products visibility");
  }
}

/**
 * BULK MOVE TO RECYCLE BIN (SOFT DELETE MULTIPLE PRODUCTS)
 */
export async function bulkMoveToRecycleBin(
  productIds: string[]
): Promise<{ success: true; count: number; error?: never } | { success: false; error: string }> {
  try {
    await requireAdmin();
    if (!productIds || productIds.length === 0) {
      return { success: false, error: "No products selected" };
    }

    const res = await query(
      `UPDATE "Product" 
       SET "status" = 'DELETED', "deletedAt" = CURRENT_TIMESTAMP, "updatedAt" = CURRENT_TIMESTAMP, "visible" = false 
       WHERE "id" = ANY($1) 
         AND ("status" IS NULL OR "status" != 'DELETED') 
         AND "deletedAt" IS NULL`,
      [productIds]
    );

    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true, count: res.rowCount ?? productIds.length };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to move products to recycle bin");
  }
}

/**
 * RESTORE PRODUCT FROM RECYCLE BIN
 * Re-activates the product so it immediately reappears on both storefront and active admin list.
 */
export async function restoreProduct(productId: string): Promise<
  { success: true; error?: never } | { success: false; error: string }
> {
  try {
    await requireAdmin();
    await query(
      `UPDATE "Product" 
       SET "status" = 'ACTIVE', "deletedAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "id" = $1`,
      [productId]
    );
    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to restore product");
  }
}

/**
 * RATE LIMITER FOR PERMANENT DELETION
 * Enforces a strict limit of 5 wrong password trials per minute for a particular user.
 */
interface DeleteRateLimitRecord {
  wrongTimestamps: number[];
}

const permanentDeleteRateLimitMap = new Map<string, DeleteRateLimitRecord>();
const MAX_PERMANENT_DELETE_TRIALS = 5;
const PERMANENT_DELETE_WINDOW_MS = 60 * 1000; // 1 minute window

function checkPermanentDeleteRateLimit(userKey: string): { allowed: boolean; secondsLeft?: number } {
  const now = Date.now();
  const record = permanentDeleteRateLimitMap.get(userKey);
  if (!record) return { allowed: true };

  // Retain only wrong attempts from within the sliding 1-minute window
  record.wrongTimestamps = record.wrongTimestamps.filter(
    (ts) => now - ts < PERMANENT_DELETE_WINDOW_MS
  );

  if (record.wrongTimestamps.length >= MAX_PERMANENT_DELETE_TRIALS) {
    const oldest = record.wrongTimestamps[0];
    const secondsLeft = Math.max(1, Math.ceil((oldest + PERMANENT_DELETE_WINDOW_MS - now) / 1000));
    return { allowed: false, secondsLeft };
  }

  return { allowed: true };
}

function recordPermanentDeleteWrongAttempt(userKey: string): { remaining: number; secondsLeft: number; locked: boolean } {
  const now = Date.now();
  let record = permanentDeleteRateLimitMap.get(userKey);
  if (!record) {
    record = { wrongTimestamps: [] };
    permanentDeleteRateLimitMap.set(userKey, record);
  }

  record.wrongTimestamps = record.wrongTimestamps.filter(
    (ts) => now - ts < PERMANENT_DELETE_WINDOW_MS
  );
  record.wrongTimestamps.push(now);

  const locked = record.wrongTimestamps.length >= MAX_PERMANENT_DELETE_TRIALS;
  const remaining = Math.max(0, MAX_PERMANENT_DELETE_TRIALS - record.wrongTimestamps.length);
  const oldest = record.wrongTimestamps[0];
  const secondsLeft = Math.max(1, Math.ceil((oldest + PERMANENT_DELETE_WINDOW_MS - now) / 1000));

  return { remaining, secondsLeft, locked };
}

function resetPermanentDeleteRateLimit(userKey: string): void {
  permanentDeleteRateLimitMap.delete(userKey);
}

/**
 * PERMANENTLY DELETE PRODUCT
 * Strictly requires the dedicated PERMANENT_DELETE_PASSWORD from .env.
 * Rate limited to maximum 5 wrong password attempts per minute per user.
 */
export async function permanentlyDeleteProduct(
  productId: string,
  securityPassword: string
): Promise<
  | { success: true; error?: never }
  | { success: false; error: string; locked?: boolean; retryAfter?: number; remaining?: number }
> {
  try {
    const adminUser = await requireAdmin();
    const userKey = adminUser.id || adminUser.email || "admin_user";

    // 1. Check if user is currently locked out by rate limit
    const rateCheck = checkPermanentDeleteRateLimit(userKey);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Too many incorrect attempts. Please wait ${rateCheck.secondsLeft}s before trying again.`,
        locked: true,
        retryAfter: rateCheck.secondsLeft,
      };
    }

    const configuredPassword = process.env.PERMANENT_DELETE_PASSWORD;
    if (!configuredPassword) {
      return {
        success: false,
        error: "Security password is not configured on the server. Deletion prevented for safety.",
      };
    }

    // 2. Validate security password
    if (!securityPassword || securityPassword.trim() !== configuredPassword.trim()) {
      const { secondsLeft, locked } = recordPermanentDeleteWrongAttempt(userKey);
      if (locked) {
        return {
          success: false,
          error: `Too many incorrect attempts. Please wait ${secondsLeft}s before trying again.`,
          locked: true,
          retryAfter: secondsLeft,
        };
      }
      return {
        success: false,
        error: "Incorrect password.",
        locked: false,
      };
    }

    // 3. Password correct -> Reset rate limit and permanently delete
    resetPermanentDeleteRateLimit(userKey);

    await transaction(async (client) => {
      // 1. Delete all relational foreign key dependencies
      await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [productId]);
      await client.query(`DELETE FROM "ProductCategory" WHERE "productId" = $1`, [productId]);
      await client.query(`DELETE FROM "ProductTagAssignment" WHERE "productId" = $1`, [productId]);
      await client.query(
        `DELETE FROM "ProductOptionChoice" WHERE "optionId" IN (SELECT id FROM "ProductOption" WHERE "productId" = $1)`,
        [productId]
      );
      await client.query(`DELETE FROM "ProductOption" WHERE "productId" = $1`, [productId]);
      await client.query(`DELETE FROM "ProductVariant" WHERE "productId" = $1`, [productId]);
      await client.query(`DELETE FROM "ProductAssignedInfoSection" WHERE "productId" = $1`, [productId]);
      await client.query(`DELETE FROM "Inventory" WHERE "productId" = $1`, [productId]);
      await client.query(`DELETE FROM "CartItem" WHERE "productId" = $1`, [productId]);
      await client.query(`DELETE FROM "WishlistItem" WHERE "productId" = $1`, [productId]);

      // 2. Permanently delete the core product row
      await client.query(`DELETE FROM "Product" WHERE "id" = $1`, [productId]);
    });

    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true };
  } catch (error: unknown) {
    return safeActionResponse(error, "Failed to permanently delete product");
  }
}

export interface RecycleBinProductItem {
  id: string;
  name: string;
  slug: string;
  sku: string;
  brand: string;
  priceNumber: number;
  imageUrl: string;
  deletedAt: string;
}

/**
 * GET RECYCLE BIN PRODUCTS
 * Returns all soft-deleted products currently in the Recycle Bin.
 */
export async function getRecycleBinProducts(): Promise<RecycleBinProductItem[]> {
  try {
    await requireAdmin();
    const res = await query(`
      SELECT 
        p."id",
        p."name",
        p."slug",
        p."sku",
        p."basePrice",
        p."price",
        p."brand",
        p."deletedAt",
        p."createdAt",
        COALESCE(
          (
            SELECT img."url" 
            FROM "ProductImage" img 
            WHERE img."productId" = p."id" 
            ORDER BY img."isPrimary" DESC, img."order" ASC 
            LIMIT 1
          ),
          'https://res.cloudinary.com/hecyltpu/image/upload/v1788819936/products/v86fzl3rk6h4o0psjucv.jpg'
        ) as "imageUrl"
      FROM "Product" p
      WHERE p."status" = 'DELETED' OR p."deletedAt" IS NOT NULL
      ORDER BY p."deletedAt" DESC NULLS LAST, p."updatedAt" DESC
    `);

    return res.rows.map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku || "",
      brand: row.brand || "Industrial Standard",
      priceNumber: (row.price || row.basePrice || 0) / 100,
      imageUrl: row.imageUrl,
      deletedAt: row.deletedAt ? new Date(row.deletedAt).toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Failed to load recycle bin products:", error);
    return [];
  }
}

/**
 * GET RECYCLE BIN PRODUCT COUNT
 */
export async function getRecycleBinCount(): Promise<number> {
  try {
    const res = await query(`
      SELECT COUNT(*)::int as count 
      FROM "Product" 
      WHERE "status" = 'DELETED' OR "deletedAt" IS NOT NULL
    `);
    return res.rows[0]?.count || 0;
  } catch {
    return 0;
  }
}
