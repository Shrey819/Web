"use server";

import { query } from "@/lib/db";
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
      WHERE p."categoryId" = $1 OR pc."categoryId" = $1 OR p."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1) OR pc."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1)
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
    // 1. Get count of products affected
    const count = await getCategoryProductCount(categoryIdToDelete);

    if (count > 0) {
      if (!targetCategoryId) {
        return { 
          success: false, 
          hasProducts: true,
          productCount: count,
          error: `Category has ${count} associated product(s). Please choose a category to reassign them to.` 
        };
      }

      // Reassign products in ProductCategory join table
      await query(`
        INSERT INTO "ProductCategory" ("productId", "categoryId")
        SELECT "productId", $1 FROM "ProductCategory" WHERE "categoryId" = $2
        ON CONFLICT DO NOTHING
      `, [targetCategoryId, categoryIdToDelete]);

      await query(`
        DELETE FROM "ProductCategory" WHERE "categoryId" = $1
      `, [categoryIdToDelete]);

      // Reassign legacy primary categoryId in Product table
      await query(`
        UPDATE "Product" 
        SET "categoryId" = $1 
        WHERE "categoryId" = $2
      `, [targetCategoryId, categoryIdToDelete]);
    }

    // 2. Delete the category safely
    await query(`DELETE FROM "Category" WHERE "id" = $1 OR "slug" = $1`, [categoryIdToDelete]);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/products");
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
      WHERE p."categoryId" = $1 OR pc."categoryId" = $1 OR p."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1 OR id = $1) OR pc."categoryId" IN (SELECT id FROM "Category" WHERE slug = $1 OR id = $1)
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


