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
 * DELETE CATEGORY
 */
export async function deleteCategory(id: string) {
  try {
    // Check if products exist in category
    const check = await query(`SELECT COUNT(*) FROM "Product" WHERE "categoryId" = $1`, [id]);
    const count = parseInt(check.rows[0]?.count || '0', 10);
    if (count > 0) {
      return { success: false, error: `Cannot delete category: ${count} product(s) associated with it.` };
    }

    await query(`DELETE FROM "Category" WHERE "id" = $1`, [id]);

    revalidatePath("/admin/categories");
    revalidatePath("/admin/products");
    revalidatePath("/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete category:", error);
    const message = error instanceof Error ? error.message : "Failed to delete category";
    return { success: false, error: message };
  }
}
