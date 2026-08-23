"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { productFormSchema, type ProductFormValues } from "@/lib/validations/product";

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
export async function createProduct(input: ProductFormValues) {
  try {
    const validated = productFormSchema.parse(input);
    const productId = validated.id || generateId("prd_");
    const slug = await generateUniqueSlug(validated.slug?.trim() || validated.name);
    const sku = generateDefaultSku(productId);

    const priceInPaise = Math.round(validated.price * 100);
    const strikethroughInPaise = validated.strikethroughPrice ? Math.round(validated.strikethroughPrice * 100) : null;
    const costInPaise = validated.costPrice ? Math.round(validated.costPrice * 100) : null;

    await transaction(async (client) => {
      // 1. Ensure Brand
      const brandName = validated.brand?.trim() || "";
      const primaryCat = validated.primaryCategoryId || validated.categoryIds[0] || validated.categoryId;

      // 2. Insert Core Product
      await client.query(`
        INSERT INTO "Product" (
          "id", "name", "slug", "sku", "description", "status", "visible", "showInPos",
          "categoryId", "primaryCategoryId", "primaryRibbon", "brand",
          "basePrice", "price", "compareAtPrice", "strikethroughPrice", "costPrice",
          "showPricePerUnit", "baseUnit", "baseUnitMeasurement", "totalUnits", "totalUnitsMeasurement", "taxGroup",
          "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11, $12,
          $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
        productId, validated.name, slug, sku, validated.description || "", validated.visible ? 'ACTIVE' : 'DRAFT', validated.visible, validated.showInPos,
        primaryCat, primaryCat, validated.primaryRibbon || null, brandName || null,
        priceInPaise, priceInPaise, strikethroughInPaise, strikethroughInPaise, costInPaise,
        validated.showPricePerUnit, validated.baseUnit, validated.baseUnitMeasurement, validated.totalUnits || null, validated.totalUnitsMeasurement, validated.taxGroup
      ]);

      // 3. Insert Category Join Table
      const allCats = Array.from(new Set([primaryCat, ...validated.categoryIds])).filter(Boolean);
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
    safeRevalidate("/products");
    safeRevalidate("/");
    return { success: true, id: productId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product";
    console.error("Failed to create product:", error);
    return { success: false, error: message };
  }
}

/**
 * UPDATE PRODUCT (Atomic PostgreSQL Transaction)
 */
export async function updateProduct(productId: string, input: ProductFormValues) {
  try {
    const validated = productFormSchema.parse(input);
    const slug = await generateUniqueSlug(validated.slug?.trim() || validated.name, productId);

    const priceInPaise = Math.round(validated.price * 100);
    const strikethroughInPaise = validated.strikethroughPrice ? Math.round(validated.strikethroughPrice * 100) : null;
    const costInPaise = validated.costPrice ? Math.round(validated.costPrice * 100) : null;

    await transaction(async (client) => {
      const brandName = validated.brand?.trim() || "";
      const primaryCat = validated.primaryCategoryId || validated.categoryIds[0] || validated.categoryId;

      // 1. Update Core Product
      await client.query(`
        UPDATE "Product" SET
          "name" = $1, "slug" = $2, "description" = $3, "status" = $4, "visible" = $5, "showInPos" = $6,
          "categoryId" = $7, "primaryCategoryId" = $8, "primaryRibbon" = $9, "brand" = $10,
          "basePrice" = $11, "price" = $12, "compareAtPrice" = $13, "strikethroughPrice" = $14, "costPrice" = $15,
          "showPricePerUnit" = $16, "baseUnit" = $17, "baseUnitMeasurement" = $18, "totalUnits" = $19, "totalUnitsMeasurement" = $20, "taxGroup" = $21,
          "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $22
      `, [
        validated.name, slug, validated.description || "", validated.visible ? 'ACTIVE' : 'DRAFT', validated.visible, validated.showInPos,
        primaryCat, primaryCat, validated.primaryRibbon || null, brandName || null,
        priceInPaise, priceInPaise, strikethroughInPaise, strikethroughInPaise, costInPaise,
        validated.showPricePerUnit, validated.baseUnit, validated.baseUnitMeasurement, validated.totalUnits || null, validated.totalUnitsMeasurement, validated.taxGroup,
        productId
      ]);

      // 2. Categories
      await client.query(`DELETE FROM "ProductCategory" WHERE "productId" = $1`, [productId]);
      const allCats = Array.from(new Set([primaryCat, ...validated.categoryIds])).filter(Boolean);
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
    safeRevalidate(`/admin/products/${productId}`);
    safeRevalidate(`/admin/products/${productId}/variants`);
    safeRevalidate("/products");
    return { success: true, id: productId };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product";
    console.error("Failed to update product:", error);
    return { success: false, error: message };
  }
}

/**
 * GET PRODUCT FOR EDITING (Full Wix Model)
 */
export async function getProductForEdit(productId: string) {
  try {
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
    let whereClause = `WHERE 1=1`;
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
        (SELECT string_agg(t."name", ', ') FROM "ProductTagAssignment" pta JOIN "ProductTag" t ON pta."tagId" = t."id" WHERE pta."productId" = p."id") as "tags"
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
export async function toggleProductVisibility(productId: string, currentVisible: boolean) {
  try {
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
    const message = error instanceof Error ? error.message : "Failed to toggle visibility";
    return { success: false, error: message };
  }
}

/**
 * DUPLICATE PRODUCT
 */
export async function duplicateProduct(productId: string) {
  try {
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
    const message = error instanceof Error ? error.message : "Failed to duplicate product";
    return { success: false, error: message };
  }
}

/**
 * DELETE PRODUCT
 */
export async function deleteProduct(productId: string) {
  try {
    await query(`DELETE FROM "Product" WHERE "id" = $1`, [productId]);
    safeRevalidate("/admin/products");
    safeRevalidate("/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete product";
    return { success: false, error: message };
  }
}
