"use server";

import { query, transaction } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const generateId = (prefix = "id_") => prefix + crypto.randomBytes(8).toString("hex");

export interface RibbonItem {
  id: string;
  name: string;
  color?: string;
  productCount?: number;
}

export interface TagItem {
  id: string;
  name: string;
  productCount?: number;
}

export interface GlobalOptionItem {
  id: string;
  name: string;
  fieldType: "TEXT_CHOICES" | "SWATCH_CHOICES";
  productCount?: number;
}

export interface GlobalInfoSectionItem {
  id: string;
  internalName: string;
  title: string;
  content: string;
  sortOrder?: number;
  productCount?: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug?: string;
  status?: string;
  productCount?: number;
}

/**
 * =========================================================================
 * 1. GLOBAL RIBBONS MANAGEMENT
 * =========================================================================
 */
export async function getGlobalRibbons(): Promise<{ success: boolean; ribbons: RibbonItem[]; error?: string }> {
  try {
    const res = await query(`
      SELECT 
        r."id", 
        r."name", 
        r."color",
        (SELECT COUNT(DISTINCT "id") FROM "Product" WHERE "primaryRibbon" = r."name")::int as "productCount"
      FROM "ProductRibbon" r
      ORDER BY r."name" ASC
    `);
    return { success: true, ribbons: res.rows as RibbonItem[] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load ribbons";
    return { success: false, error: message, ribbons: [] };
  }
}

export async function createRibbon(name: string, color = "#2563eb") {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Ribbon name cannot be empty" };
    const id = generateId("rib_");
    await query(`
      INSERT INTO "ProductRibbon" ("id", "name", "color", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO UPDATE SET "color" = $3, "updatedAt" = CURRENT_TIMESTAMP
    `, [id, trimmed, color]);
    revalidatePath("/admin/products");
    return { success: true, id, name: trimmed };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create ribbon";
    return { success: false, error: message };
  }
}

export async function renameRibbon(id: string, newName: string, color?: string) {
  try {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: "Ribbon name cannot be empty" };
    
    await transaction(async (client) => {
      const oldRes = await client.query(`SELECT "name" FROM "ProductRibbon" WHERE "id" = $1`, [id]);
      const oldName = oldRes.rows[0]?.name;

      if (color) {
        await client.query(`
          UPDATE "ProductRibbon" SET "name" = $1, "color" = $2, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $3
        `, [trimmed, color, id]);
      } else {
        await client.query(`
          UPDATE "ProductRibbon" SET "name" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2
        `, [trimmed, id]);
      }

      if (oldName && oldName !== trimmed) {
        await client.query(`
          UPDATE "Product" SET "primaryRibbon" = $1 WHERE "primaryRibbon" = $2
        `, [trimmed, oldName]);
      }
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to rename ribbon";
    return { success: false, error: message };
  }
}

export async function deleteRibbon(id: string) {
  try {
    await transaction(async (client) => {
      const oldRes = await client.query(`SELECT "name" FROM "ProductRibbon" WHERE "id" = $1`, [id]);
      const oldName = oldRes.rows[0]?.name;

      await client.query(`DELETE FROM "ProductRibbon" WHERE "id" = $1`, [id]);

      if (oldName) {
        await client.query(`
          UPDATE "Product" SET "primaryRibbon" = NULL WHERE "primaryRibbon" = $1
        `, [oldName]);
      }
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete ribbon";
    return { success: false, error: message };
  }
}

/**
 * =========================================================================
 * 2. GLOBAL PRODUCT TAGS MANAGEMENT
 * =========================================================================
 */
export async function getGlobalTags(): Promise<{ success: boolean; tags: TagItem[]; error?: string }> {
  try {
    const res = await query(`
      SELECT 
        t."id", 
        t."name",
        (SELECT COUNT(DISTINCT "productId") FROM "ProductTagAssignment" WHERE "tagId" = t."id")::int as "productCount"
      FROM "ProductTag" t
      ORDER BY t."name" ASC
    `);
    return { success: true, tags: res.rows as TagItem[] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load tags";
    return { success: false, error: message, tags: [] };
  }
}

export async function createTag(name: string) {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Tag name cannot be empty" };
    const existing = await query(`SELECT "id", "name" FROM "ProductTag" WHERE LOWER("name") = LOWER($1) LIMIT 1`, [trimmed]);
    if (existing.rows.length > 0) {
      const row = existing.rows[0] as any;
      return { success: true, id: row.id, name: row.name };
    }
    const id = generateId("tag_");
    await query(`
      INSERT INTO "ProductTag" ("id", "name", "createdAt")
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO NOTHING
    `, [id, trimmed]);
    revalidatePath("/admin/products");
    return { success: true, id, name: trimmed };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create tag";
    return { success: false, error: message };
  }
}

export async function renameTag(id: string, newName: string) {
  try {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: "Tag name cannot be empty" };
    await query(`UPDATE "ProductTag" SET "name" = $1 WHERE "id" = $2`, [trimmed, id]);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to rename tag";
    return { success: false, error: message };
  }
}

export async function deleteTag(id: string) {
  try {
    await query(`DELETE FROM "ProductTag" WHERE "id" = $1`, [id]);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete tag";
    return { success: false, error: message };
  }
}

/**
 * =========================================================================
 * 2.5 BRAND MANAGEMENT
 * =========================================================================
 */
export interface BrandItem {
  id: string;
  name: string;
  slug?: string;
  productCount?: number;
}

export async function getGlobalBrands(): Promise<{ success: boolean; brands: BrandItem[]; error?: string }> {
  try {
    const res = await query(`
      SELECT 
        b."id", 
        b."name", 
        b."slug",
        (SELECT COUNT(DISTINCT "id") FROM "Product" WHERE LOWER("brand") = LOWER(b."name"))::int as "productCount"
      FROM "Brand" b
      ORDER BY b."name" ASC
    `);

    const brandsMap = new Map<string, BrandItem>();
    (res.rows as BrandItem[]).forEach((b) => brandsMap.set(b.name.toLowerCase().trim(), b));

    const distinctProds = await query(`
      SELECT DISTINCT TRIM("brand") as "name" 
      FROM "Product" 
      WHERE "brand" IS NOT NULL AND TRIM("brand") != ''
    `);

    for (const row of distinctProds.rows as any[]) {
      const name = String(row.name).trim();
      const key = name.toLowerCase();
      if (!brandsMap.has(key)) {
        const genId = "brand_" + key.replace(/[^a-z0-9]/g, "_");
        brandsMap.set(key, {
          id: genId,
          name: name,
          slug: key.replace(/[^a-z0-9]+/g, "-"),
          productCount: 1,
        });
      }
    }

    const result = Array.from(brandsMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    return { success: true, brands: result };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load brands";
    return { success: false, error: message, brands: [] };
  }
}

export async function createBrand(name: string): Promise<{ success: boolean; id?: string; name?: string; error?: string }> {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Brand name cannot be empty" };
    if (trimmed.length > 50) return { success: false, error: "Brand name cannot exceed 50 characters" };
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `brand-${Date.now()}`;
    const id = "brand_" + Date.now();

    await query(`
      INSERT INTO "Brand" ("id", "name", "slug", "status", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("slug") DO UPDATE SET "name" = $2
    `, [id, trimmed, slug]);

    revalidatePath("/admin/products");
    return { success: true, id, name: trimmed };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create brand";
    return { success: false, error: message };
  }
}

export async function renameBrand(
  id: string,
  newName: string,
  oldName?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: "Brand name cannot be empty" };
    if (trimmed.length > 50) return { success: false, error: "Brand name cannot exceed 50 characters" };
    const newSlug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    await query(`
      UPDATE "Brand" 
      SET "name" = $1, "slug" = $2, "updatedAt" = CURRENT_TIMESTAMP 
      WHERE "id" = $3
    `, [trimmed, newSlug, id]);

    if (oldName && oldName.trim()) {
      await query(`
        UPDATE "Product" 
        SET "brand" = $1 
        WHERE LOWER("brand") = LOWER($2)
      `, [trimmed, oldName.trim()]);
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to rename brand";
    return { success: false, error: message };
  }
}

export async function deleteBrand(id: string, name?: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (name) {
      await query(`DELETE FROM "Brand" WHERE "id" = $1 OR LOWER("name") = LOWER($2)`, [id, name.trim()]);
    } else {
      await query(`DELETE FROM "Brand" WHERE "id" = $1`, [id]);
    }
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete brand";
    return { success: false, error: message };
  }
}

/**
 * =========================================================================
 * 3. GLOBAL OPTION NAMES MANAGEMENT
 * =========================================================================
 */
export async function getGlobalOptions(): Promise<{ success: boolean; options: GlobalOptionItem[]; error?: string }> {
  try {
    const res = await query(`
      SELECT 
        o."id", 
        o."name", 
        o."fieldType",
        (SELECT COUNT(DISTINCT "productId") FROM "ProductOption" WHERE "name" = o."name")::int as "productCount"
      FROM "GlobalOption" o
      ORDER BY o."name" ASC
    `);
    return { success: true, options: res.rows as GlobalOptionItem[] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load global options";
    return { success: false, error: message, options: [] };
  }
}

export async function createGlobalOption(name: string, fieldType: "TEXT_CHOICES" | "SWATCH_CHOICES") {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Option name cannot be empty" };
    const id = generateId("gopt_");
    await query(`
      INSERT INTO "GlobalOption" ("id", "name", "fieldType", "createdAt")
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO UPDATE SET "fieldType" = $3
    `, [id, trimmed, fieldType]);
    return { success: true, id, name: trimmed, fieldType };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create option";
    return { success: false, error: message };
  }
}

export async function renameGlobalOption(id: string, newName: string, fieldType?: "TEXT_CHOICES" | "SWATCH_CHOICES") {
  try {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, error: "Option name cannot be empty" };

    await transaction(async (client) => {
      const oldRes = await client.query(`SELECT "name" FROM "GlobalOption" WHERE "id" = $1`, [id]);
      const oldName = oldRes.rows[0]?.name;

      if (fieldType) {
        await client.query(`
          UPDATE "GlobalOption" SET "name" = $1, "fieldType" = $2 WHERE "id" = $3
        `, [trimmed, fieldType, id]);
      } else {
        await client.query(`
          UPDATE "GlobalOption" SET "name" = $1 WHERE "id" = $2
        `, [trimmed, id]);
      }

      if (oldName && oldName !== trimmed) {
        await client.query(`
          UPDATE "ProductOption" SET "name" = $1 WHERE "name" = $2
        `, [trimmed, oldName]);
      }
    });

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to rename option";
    return { success: false, error: message };
  }
}

export async function deleteGlobalOption(id: string) {
  try {
    await query(`DELETE FROM "GlobalOption" WHERE "id" = $1`, [id]);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete global option";
    return { success: false, error: message };
  }
}

/**
 * =========================================================================
 * 4. GLOBAL / REUSABLE INFO SECTIONS MANAGEMENT
 * =========================================================================
 */
export async function getGlobalInfoSections(): Promise<{ success: boolean; sections: GlobalInfoSectionItem[]; error?: string }> {
  try {
    const res = await query(`
      SELECT 
        s."id", 
        s."internalName", 
        s."title", 
        s."content", 
        s."sortOrder",
        (SELECT COUNT(DISTINCT "productId") FROM "ProductAssignedInfoSection" WHERE "sectionId" = s."id")::int as "productCount"
      FROM "GlobalInfoSection" s
      ORDER BY s."sortOrder" ASC, s."title" ASC
    `);
    return { success: true, sections: res.rows as GlobalInfoSectionItem[] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load info sections";
    return { success: false, error: message, sections: [] };
  }
}

export async function getLastUsedInfoSectionIds(): Promise<string[]> {
  try {
    const res = await query(`
      SELECT pai."sectionId"
      FROM "ProductAssignedInfoSection" pai
      JOIN "Product" p ON p."id" = pai."productId"
      WHERE p."updatedAt" = (
        SELECT MAX(p2."updatedAt") 
        FROM "Product" p2 
        JOIN "ProductAssignedInfoSection" pai2 ON pai2."productId" = p2."id"
      )
      ORDER BY pai."sortOrder" ASC
    `);
    return (res.rows as any[]).map((r) => r.sectionId);
  } catch {
    return [];
  }
}

export async function getLastUsedCategoryIds(): Promise<{ categoryIds: string[]; primaryCategoryId?: string }> {
  try {
    const latestProdRes = await query(`
      SELECT p."id", p."categoryId", p."primaryCategoryId"
      FROM "Product" p
      ORDER BY p."updatedAt" DESC
      LIMIT 1
    `);
    if (latestProdRes.rows.length === 0) {
      return { categoryIds: [] };
    }
    const latestProduct = latestProdRes.rows[0] as any;
    const catRes = await query(`
      SELECT "categoryId" 
      FROM "ProductCategory" 
      WHERE "productId" = $1
    `, [latestProduct.id]);
    
    const categoryIds = (catRes.rows as any[]).map((r) => r.categoryId);
    const primaryCategoryId = latestProduct.primaryCategoryId || latestProduct.categoryId || categoryIds[0] || "";
    
    const finalCategoryIds = categoryIds.length > 0 
      ? categoryIds 
      : (primaryCategoryId ? [primaryCategoryId] : []);

    return { categoryIds: finalCategoryIds, primaryCategoryId };
  } catch (error) {
    console.error("Error fetching last used category ids:", error);
    return { categoryIds: [] };
  }
}

export async function createInfoSection(internalName: string, title: string, content: string) {
  try {
    const trimmedTitle = title.trim();
    const trimmedInternal = (internalName || title).trim();
    if (!trimmedTitle) return { success: false, error: "Section title is required" };
    const id = generateId("sec_");
    await query(`
      INSERT INTO "GlobalInfoSection" ("id", "internalName", "title", "content", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [id, trimmedInternal, trimmedTitle, content || ""]);
    revalidatePath("/admin/products");
    return { success: true, id };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create info section";
    return { success: false, error: message };
  }
}

export async function updateInfoSection(id: string, internalName: string, title: string, content: string) {
  try {
    const trimmedTitle = title.trim();
    const trimmedInternal = (internalName || title).trim();
    if (!trimmedTitle) return { success: false, error: "Section title is required" };
    await query(`
      UPDATE "GlobalInfoSection" 
      SET "internalName" = $1, "title" = $2, "content" = $3, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $4
    `, [trimmedInternal, trimmedTitle, content || "", id]);
    revalidatePath("/admin/products");
    revalidatePath("/product");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update info section";
    return { success: false, error: message };
  }
}

export async function deleteInfoSection(id: string) {
  try {
    await query(`DELETE FROM "GlobalInfoSection" WHERE "id" = $1`, [id]);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete info section";
    return { success: false, error: message };
  }
}

/**
 * =========================================================================
 * 5. CATEGORY ASSIGNMENT & CREATION
 * =========================================================================
 */
export async function getAdminCategories(): Promise<{ success: boolean; categories: CategoryItem[]; error?: string }> {
  try {
    const res = await query(`
      SELECT 
        c."id", 
        c."name", 
        c."slug", 
        c."status",
        (SELECT COUNT(DISTINCT "productId") FROM "ProductCategory" WHERE "categoryId" = c."id")::int as "productCount"
      FROM "Category" c
      ORDER BY c."sortOrder" ASC, c."name" ASC
    `);
    return { success: true, categories: res.rows as CategoryItem[] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load categories";
    return { success: false, error: message, categories: [] };
  }
}

export async function createInlineCategory(name: string) {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Category name is required" };
    const id = "cat_" + Date.now();
    let slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (!slug) slug = "cat-" + Date.now();

    await query(`
      INSERT INTO "Category" ("id", "name", "slug", "status", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("slug") DO UPDATE SET "name" = $2
    `, [id, trimmed, slug]);

    revalidatePath("/admin/products");
    return { success: true, id, name: trimmed, slug };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create category";
    return { success: false, error: message };
  }
}

/**
 * =========================================================================
 * 6. VARIANT MATRIX HELPERS & BULK EDIT ACTIONS
 * =========================================================================
 */
export async function getVariantsForProduct(productId: string) {
  try {
    const res = await query(`
      SELECT * FROM "ProductVariant" WHERE "productId" = $1 ORDER BY "id" ASC
    `, [productId]);
    return { success: true, variants: res.rows };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load variants";
    return { success: false, error: message, variants: [] };
  }
}

export async function saveProductVariants(productId: string, variants: any[]) {
  try {
    await transaction(async (client) => {
      await client.query(`DELETE FROM "ProductVariant" WHERE "productId" = $1`, [productId]);
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i];
        const vId = v.id || generateId("var_");
        const price = Math.round(Number(v.price || 0) * 100);
        const strikethroughPrice = v.strikethroughPrice ? Math.round(Number(v.strikethroughPrice) * 100) : null;
        const cost = v.cost ? Math.round(Number(v.cost) * 100) : null;
        const sku = v.sku?.trim() ? v.sku.trim() : `VAR-${productId.slice(-6)}-${i + 1}`;

        await client.query(`
          INSERT INTO "ProductVariant" (
            "id", "productId", "sku", "barcode", "price", "strikethroughPrice", "cost",
            "trackQuantity", "stockQuantity", "inventoryStatus", "preOrderEnabled", "preOrderLimit",
            "totalUnits", "totalUnitsMeasurement", "packageLength", "packageWidth", "packageHeight", "packageUnit",
            "mediaUrl", "attributes", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `, [
          vId, productId, sku, v.barcode || null, price, strikethroughPrice, cost,
          Boolean(v.trackQuantity), Number(v.stockQuantity ?? 100), v.inventoryStatus || 'IN_STOCK',
          Boolean(v.preOrderEnabled), v.preOrderLimit ? Number(v.preOrderLimit) : null,
          v.totalUnits ? Number(v.totalUnits) : null, v.totalUnitsMeasurement || 'g',
          v.packageLength ? Number(v.packageLength) : null, v.packageWidth ? Number(v.packageWidth) : null,
          v.packageHeight ? Number(v.packageHeight) : null, v.packageUnit || 'cm',
          v.mediaUrl || null, JSON.stringify(v.attributes || {})
        ]);
      }
    });

    revalidatePath(`/admin/products/${productId}`);
    revalidatePath(`/admin/products/${productId}/variants`);
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save variants";
    return { success: false, error: message };
  }
}

/**
 * =========================================================================
 * 7. PRODUCT OPTION PRESETS (SAVE CHANGES & APPLY SETTING)
 * =========================================================================
 */
export interface OptionPresetItem {
  id: string;
  name: string;
  options: any[];
  includeVariants: boolean;
  variants?: any[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getOptionPresets(): Promise<{ success: boolean; presets: OptionPresetItem[]; error?: string }> {
  try {
    const res = await query(`
      SELECT "id", "name", "options", "includeVariants", "variants", "createdAt", "updatedAt"
      FROM "ProductOptionPreset"
      ORDER BY "updatedAt" DESC
    `);
    return { success: true, presets: res.rows as unknown as OptionPresetItem[] };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to load option presets";
    return { success: false, error: message, presets: [] };
  }
}

export async function saveOptionPreset(
  name: string,
  options: any[],
  includeVariants: boolean,
  variants?: any[]
) {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Preset name cannot be empty" };
    const id = generateId("optset_");

    await query(`
      INSERT INTO "ProductOptionPreset" ("id", "name", "options", "includeVariants", "variants", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("name") DO UPDATE SET 
        "options" = $3, 
        "includeVariants" = $4, 
        "variants" = $5, 
        "updatedAt" = CURRENT_TIMESTAMP
    `, [
      id,
      trimmed,
      JSON.stringify(options || []),
      Boolean(includeVariants),
      includeVariants && variants ? JSON.stringify(variants) : null,
    ]);

    return { success: true, id, name: trimmed };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save option preset";
    return { success: false, error: message };
  }
}

export async function updateOptionPreset(
  id: string,
  name: string,
  options: any[],
  includeVariants: boolean = false,
  variants?: any[]
) {
  try {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, error: "Preset name cannot be empty" };

    await query(`
      UPDATE "ProductOptionPreset" 
      SET 
        "name" = $1, 
        "options" = $2, 
        "includeVariants" = $3, 
        "variants" = $4, 
        "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $5
    `, [
      trimmed,
      JSON.stringify(options || []),
      Boolean(includeVariants),
      includeVariants && variants ? JSON.stringify(variants) : null,
      id,
    ]);

    return { success: true, id, name: trimmed };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update option preset";
    return { success: false, error: message };
  }
}

export async function deleteOptionPreset(id: string) {
  try {
    await query(`DELETE FROM "ProductOptionPreset" WHERE "id" = $1`, [id]);
    return { success: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete option preset";
    return { success: false, error: message };
  }
}

