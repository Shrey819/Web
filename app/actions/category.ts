"use server";

import { query, transaction } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const generateId = () => "cat_" + crypto.randomBytes(6).toString("hex");

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "") || "category-" + Date.now();
}

/**
 * CREATE CATEGORY
 */
export async function createCategory(name: string, description?: string) {
  try {
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Category name must be at least 2 characters." };
    }

    const slug = generateSlug(name);
    const id = generateId();

    await query(`
      INSERT INTO "Category" ("id", "name", "slug", "description", "status", "sortOrder", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'active', 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT ("slug") DO UPDATE SET "name" = EXCLUDED."name", "description" = EXCLUDED."description"
    `, [id, name.trim(), slug, description?.trim() || null]);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to create category:", error);
    const message = error instanceof Error ? error.message : "Failed to create category";
    return { success: false, error: message };
  }
}

/**
 * UPDATE CATEGORY
 */
export async function updateCategory(id: string, name: string, description?: string) {
  try {
    if (!name || name.trim().length < 2) {
      return { success: false, error: "Category name must be at least 2 characters." };
    }

    const slug = generateSlug(name);

    await query(`
      UPDATE "Category" 
      SET "name" = $1, "slug" = $2, "description" = $3, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $4
    `, [name.trim(), slug, description?.trim() || null, id]);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to update category:", error);
    const message = error instanceof Error ? error.message : "Failed to update category";
    return { success: false, error: message };
  }
}

/**
 * TOGGLE CATEGORY VISIBILITY (HIDE / SHOW)
 */
export async function toggleCategoryVisibility(id: string, isHidden: boolean) {
  try {
    const newStatus = isHidden ? "hidden" : "active";
    await query(`
      UPDATE "Category"
      SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE "id" = $2 OR "slug" = $2
    `, [newStatus, id]);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/category/[slug]", "page");
    revalidatePath("/", "layout");
    return { success: true, newStatus };
  } catch (error) {
    console.error("Failed to toggle category visibility:", error);
    const message = error instanceof Error ? error.message : "Failed to update category visibility";
    return { success: false, error: message };
  }
}

/**
 * GET CATEGORY PRODUCT COUNT
 */
export async function getCategoryProductCount(categoryId: string): Promise<number> {
  try {
    const res = await query(`
      SELECT COUNT(DISTINCT p.id)::int as count
      FROM "Product" p
      LEFT JOIN "ProductCategory" pc ON p.id = pc."productId"
      WHERE p."categoryId" = $1 
         OR p."primaryCategoryId" = $1
         OR pc."categoryId" = $1 
         OR p."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1)
         OR p."primaryCategoryId" IN (SELECT id FROM "Category" WHERE slug = $1)
         OR pc."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1)
    `, [categoryId]);
    return Number(res.rows[0]?.count || 0);
  } catch (error) {
    console.error("Failed to get category product count:", error);
    return 0;
  }
}

/**
 * DELETE CATEGORY WITH REASSIGNMENT (Safe delete - NO products deleted)
 */
export async function deleteCategoryWithReassignment(categoryIdToDelete: string, targetCategoryId?: string) {
  try {
    // 1. Resolve category to delete
    const delRes = await query(`
      SELECT id, slug, name 
      FROM "Category" 
      WHERE id = $1 OR slug = $1 
      LIMIT 1
    `, [categoryIdToDelete]);

    if (delRes.rows.length === 0) {
      return { success: false, error: "Category to delete not found." };
    }

    const delId = delRes.rows[0].id;
    const delSlug = delRes.rows[0].slug;

    // 2. Resolve target category if provided
    let targetId: string | null = null;
    let targetSlug: string | null = null;

    if (targetCategoryId) {
      const targetRes = await query(`
        SELECT id, slug, name 
        FROM "Category" 
        WHERE id = $1 OR slug = $1 
        LIMIT 1
      `, [targetCategoryId]);

      if (targetRes.rows.length === 0) {
        return { success: false, error: "Target category for reassignment not found." };
      }

      targetId = targetRes.rows[0].id;
      targetSlug = targetRes.rows[0].slug;

      if (targetId === delId) {
        return { success: false, error: "Cannot reassign products to the same category being deleted." };
      }
    }

    // 3. Count products affected
    const count = await getCategoryProductCount(delId);

    if (count > 0 && !targetId) {
      return { 
        success: false, 
        hasProducts: true,
        productCount: count,
        error: `Category has ${count} associated product(s). Please choose a category to reassign them to.` 
      };
    }

    // 4. Perform atomic reassignment and deletion inside transaction
    await transaction(async (client) => {
      if (targetId) {
        // A. Add target category to ProductCategory for all affected products
        await client.query(`
          INSERT INTO "ProductCategory" ("productId", "categoryId")
          SELECT "productId", $1 
          FROM "ProductCategory" 
          WHERE "categoryId" = $2 OR "categoryId" = $3
          ON CONFLICT DO NOTHING
        `, [targetId, delId, delSlug]);

        await client.query(`
          INSERT INTO "ProductCategory" ("productId", "categoryId")
          SELECT "id", $1 
          FROM "Product" 
          WHERE "categoryId" = $2 OR "categoryId" = $3 
             OR "primaryCategoryId" = $2 OR "primaryCategoryId" = $3
          ON CONFLICT DO NOTHING
        `, [targetId, delId, delSlug]);

        // Remove old associations from ProductCategory
        await client.query(`
          DELETE FROM "ProductCategory" 
          WHERE "categoryId" = $1 OR "categoryId" = $2
        `, [delId, delSlug]);

        // B. Reassign legacy categoryId in Product table
        await client.query(`
          UPDATE "Product" 
          SET "categoryId" = $1 
          WHERE "categoryId" = $2 OR "categoryId" = $3
        `, [targetId, delId, delSlug]);

        // C. Reassign modern primaryCategoryId in Product table (CRITICAL FIX FOR FOREIGN KEY CONSTRAINT!)
        await client.query(`
          UPDATE "Product" 
          SET "primaryCategoryId" = $1 
          WHERE "primaryCategoryId" = $2 OR "primaryCategoryId" = $3
        `, [targetId, delId, delSlug]);

        // D. Reassign any child categories that had this category as parentId
        await client.query(`
          UPDATE "Category"
          SET "parentId" = $1
          WHERE "parentId" = $2 OR "parentId" = $3
        `, [targetId, delId, delSlug]);
      } else {
        // No target category (when count === 0 or forced)
        await client.query(`
          DELETE FROM "ProductCategory" 
          WHERE "categoryId" = $1 OR "categoryId" = $2
        `, [delId, delSlug]);

        await client.query(`
          UPDATE "Product" 
          SET "categoryId" = NULL 
          WHERE "categoryId" = $1 OR "categoryId" = $2
        `, [delId, delSlug]);

        await client.query(`
          UPDATE "Product" 
          SET "primaryCategoryId" = NULL 
          WHERE "primaryCategoryId" = $1 OR "primaryCategoryId" = $2
        `, [delId, delSlug]);

        await client.query(`
          UPDATE "Category" 
          SET "parentId" = NULL 
          WHERE "parentId" = $1 OR "parentId" = $2
        `, [delId, delSlug]);
      }

      // E. Delete the category itself safely
      await client.query(`
        DELETE FROM "Category" 
        WHERE "id" = $1 OR "slug" = $2
      `, [delId, delSlug]);
    });

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/category/[slug]", "page");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category with reassignment:", error);
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return { success: false, error: message };
  }
}

/**
 * DELETE CATEGORY (Legacy / Simple check)
 */
export async function deleteCategory(id: string) {
  const count = await getCategoryProductCount(id);
  if (count > 0) {
    return { 
      success: false, 
      hasProducts: true,
      productCount: count,
      error: `Cannot delete directly: ${count} product(s) associated with this category.` 
    };
  }
  return deleteCategoryWithReassignment(id);
}

export interface CategoryProduct {
  id: string;
  name: string;
  slug: string;
  sku: string;
  basePrice: number;
  status: string;
  stockStatus: string;
  createdAt: string;
  brand: string;
  primaryImage: string;
}

/**
 * FETCH PRODUCTS FOR A SPECIFIC CATEGORY (multi-category aware)
 */
export async function getCategoryProducts(categoryIdOrSlug: string): Promise<{ success: boolean; products: CategoryProduct[]; categoryName?: string }> {
  try {
    const catRes = await query(`
      SELECT id, name, slug FROM "Category" 
      WHERE id = $1 OR slug = $1 
      LIMIT 1
    `, [categoryIdOrSlug]);

    const catName = catRes.rows[0]?.name;
    const catId = catRes.rows[0]?.id || categoryIdOrSlug;

    const sql = `
      SELECT DISTINCT
        p."id",
        p."name",
        p."slug",
        p."sku",
        p."basePrice",
        p."status",
        p."createdAt",
        COALESCE(b."name", 'Industrial Brand') as "brand",
        COALESCE(i."status"::text, 'IN_STOCK') as "stockStatus",
        COALESCE(
          (
            SELECT img."url" 
            FROM "ProductImage" img 
            WHERE img."productId" = p."id" 
            ORDER BY img."isPrimary" DESC, img."order" ASC 
            LIMIT 1
          ),
          'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'
        ) as "primaryImage"
      FROM "Product" p
      LEFT JOIN "ProductCategory" pc ON p.id = pc."productId"
      LEFT JOIN "Brand" b ON p."brandId" = b."id"
      LEFT JOIN "Inventory" i ON p."id" = i."productId"
      WHERE p."categoryId" = $1 
         OR p."primaryCategoryId" = $1 
         OR pc."categoryId" = $1 
         OR p."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1 OR id = $1) 
         OR p."primaryCategoryId" IN (SELECT id FROM "Category" WHERE slug = $1 OR id = $1) 
         OR pc."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1 OR id = $1)
      ORDER BY p."createdAt" DESC
    `;

    const res = await query(sql, [catId]);

    if (res.rows.length > 0) {
      return {
        success: true,
        categoryName: catName,
        products: res.rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          slug: r.slug,
          sku: r.sku,
          basePrice: Number(r.basePrice || 0),
          status: r.status,
          stockStatus: r.stockStatus,
          createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
          brand: r.brand,
          primaryImage: r.primaryImage,
        })),
      };
    }
  } catch (error) {
    console.warn("DB query for category products failed, using mock fallback:", error);
  }

  // Fallback to mock catalog
  const { PRODUCTS } = await import("@/data/products");
  const categoryIdLower = categoryIdOrSlug.toLowerCase();
  const mockMatches = PRODUCTS.filter(
    (p) =>
      p.categoryId === categoryIdOrSlug ||
      p.categoryId?.toLowerCase() === categoryIdLower ||
      p.subcategoryId?.toLowerCase() === categoryIdLower
  );

  return {
    success: true,
    products: mockMatches.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku,
      basePrice: p.basePrice,
      status: "ACTIVE",
      stockStatus: p.stockStatus === "out-of-stock" ? "OUT_OF_STOCK" : "IN_STOCK",
      createdAt: p.createdAt || new Date().toISOString(),
      brand: p.brand,
      primaryImage: p.images[0]?.url || "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80",
    })),
  };
}


