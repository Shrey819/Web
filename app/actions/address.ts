"use server";

import { query, transaction } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export interface AddressItem {
  id: string;
  userId: string;
  fullName: string;
  companyName?: string | null;
  email?: string | null;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  type: "Home" | "Office" | "Work" | "Other" | string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AddressInput {
  userId?: string;
  fullName: string;
  companyName?: string;
  email?: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  type?: "Home" | "Office" | "Work" | "Other" | string;
  isDefault?: boolean;
}

/**
 * Get all saved addresses for a user
 */
export async function getUserAddressesAction(userId?: string | null, userEmail?: string | null) {
  try {
    if (!userId && !userEmail) {
      return { success: true, addresses: [] };
    }

    const res = await query(
      `SELECT * FROM "Address" 
       WHERE "userId" = $1 OR ("email" = $2 AND $2 IS NOT NULL AND $2 != '')
       ORDER BY "isDefault" DESC, "updatedAt" DESC, "createdAt" DESC`,
      [userId || "", userEmail || ""]
    );

    const addresses: AddressItem[] = res.rows.map((r: any) => ({
      id: r.id,
      userId: r.userId,
      fullName: r.fullName,
      companyName: r.companyName || "",
      email: r.email || "",
      phone: r.phone || "",
      street: r.street,
      city: r.city,
      state: r.state,
      zip: r.zip,
      country: r.country || "India",
      type: r.type || "Home",
      isDefault: Boolean(r.isDefault),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
    }));

    return { success: true, addresses };
  } catch (error: any) {
    console.error("Failed to fetch user addresses:", error);
    return { success: false, error: error.message || "Failed to load addresses", addresses: [] };
  }
}

/**
 * Create a new address
 */
export async function createAddressAction(data: AddressInput) {
  try {
    if (!data.fullName || !data.street || !data.city || !data.state || !data.zip || !data.phone) {
      return { success: false, error: "Please fill in all required address fields." };
    }

    const id = `addr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    const userId = data.userId || `user_${data.phone.replace(/[^\d]/g, "").slice(-10)}`;
    const isDefault = Boolean(data.isDefault);

    if (isDefault && data.userId) {
      await query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [data.userId]);
    }

    const res = await query(
      `INSERT INTO "Address" (
        "id", "userId", "fullName", "companyName", "email", "phone",
        "street", "city", "state", "zip", "country", "type", "isDefault", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        id,
        userId,
        data.fullName.trim(),
        data.companyName?.trim() || null,
        data.email?.trim() || null,
        data.phone.trim(),
        data.street.trim(),
        data.city.trim(),
        data.state.trim(),
        data.zip.trim(),
        data.country?.trim() || "India",
        data.type || "Home",
        isDefault,
      ]
    );

    revalidatePath("/profile");
    revalidatePath("/checkout");

    return { success: true, address: res.rows[0] };
  } catch (error: any) {
    console.error("Failed to create address:", error);
    return { success: false, error: error.message || "Failed to save address" };
  }
}

/**
 * Update an existing address
 */
export async function updateAddressAction(id: string, data: AddressInput) {
  try {
    if (!data.fullName || !data.street || !data.city || !data.state || !data.zip || !data.phone) {
      return { success: false, error: "Please fill in all required address fields." };
    }

    const isDefault = Boolean(data.isDefault);

    if (isDefault && data.userId) {
      await query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [data.userId]);
    }

    const res = await query(
      `UPDATE "Address" SET
        "fullName" = $1,
        "companyName" = $2,
        "email" = $3,
        "phone" = $4,
        "street" = $5,
        "city" = $6,
        "state" = $7,
        "zip" = $8,
        "country" = $9,
        "type" = $10,
        "isDefault" = $11,
        "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $12
       RETURNING *`,
      [
        data.fullName.trim(),
        data.companyName?.trim() || null,
        data.email?.trim() || null,
        data.phone.trim(),
        data.street.trim(),
        data.city.trim(),
        data.state.trim(),
        data.zip.trim(),
        data.country?.trim() || "India",
        data.type || "Home",
        isDefault,
        id,
      ]
    );

    revalidatePath("/profile");
    revalidatePath("/checkout");

    return { success: true, address: res.rows[0] };
  } catch (error: any) {
    console.error("Failed to update address:", error);
    return { success: false, error: error.message || "Failed to update address" };
  }
}

/**
 * Delete an address
 */
export async function deleteAddressAction(id: string) {
  try {
    await query(`DELETE FROM "Address" WHERE "id" = $1`, [id]);
    revalidatePath("/profile");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete address:", error);
    return { success: false, error: error.message || "Failed to delete address" };
  }
}

/**
 * Set an address as default
 */
export async function setDefaultAddressAction(id: string, userId: string) {
  try {
    await transaction(async (client) => {
      await client.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
      await client.query(`UPDATE "Address" SET "isDefault" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`, [id]);
    });

    revalidatePath("/profile");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to set default address:", error);
    return { success: false, error: error.message || "Failed to update default address" };
  }
}

/**
 * Automatically save or update address during Checkout
 */
export async function saveAddressFromCheckoutAction(data: {
  userId?: string;
  fullName: string;
  companyName?: string;
  email?: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
  type?: string;
  saveAsDefault?: boolean;
}) {
  try {
    const userId = data.userId || (data.phone ? `user_${data.phone.replace(/[^\d]/g, "").slice(-10)}` : undefined);
    if (!userId) return { success: false, error: "No user identifier" };

    // Check if an address with same street and zip exists for this user
    const existing = await query(
      `SELECT "id" FROM "Address" 
       WHERE "userId" = $1 AND LOWER(TRIM("street")) = LOWER(TRIM($2)) AND TRIM("zip") = TRIM($3)
       LIMIT 1`,
      [userId, data.street, data.zip]
    );

    if (existing.rows.length > 0) {
      // Update existing address
      const res = await query(
        `UPDATE "Address" SET
          "fullName" = $1,
          "companyName" = $2,
          "email" = $3,
          "phone" = $4,
          "city" = $5,
          "state" = $6,
          "country" = $7,
          "type" = COALESCE($8, "type"),
          "isDefault" = CASE WHEN $9 = true THEN true ELSE "isDefault" END,
          "updatedAt" = CURRENT_TIMESTAMP
         WHERE "id" = $10
         RETURNING *`,
        [
          data.fullName.trim(),
          data.companyName?.trim() || null,
          data.email?.trim() || null,
          data.phone.trim(),
          data.city.trim(),
          data.state.trim(),
          data.country?.trim() || "India",
          data.type || "Home",
          Boolean(data.saveAsDefault),
          existing.rows[0].id,
        ]
      );
      return { success: true, address: res.rows[0] };
    } else {
      // Insert new address
      const id = `addr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
      if (data.saveAsDefault) {
        await query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
      }
      const res = await query(
        `INSERT INTO "Address" (
          "id", "userId", "fullName", "companyName", "email", "phone",
          "street", "city", "state", "zip", "country", "type", "isDefault", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          id,
          userId,
          data.fullName.trim(),
          data.companyName?.trim() || null,
          data.email?.trim() || null,
          data.phone.trim(),
          data.street.trim(),
          data.city.trim(),
          data.state.trim(),
          data.zip.trim(),
          data.country?.trim() || "India",
          data.type || "Home",
          Boolean(data.saveAsDefault),
        ]
      );
      return { success: true, address: res.rows[0] };
    }
  } catch (error: any) {
    console.error("Failed to save address from checkout:", error);
    return { success: false, error: error.message };
  }
}
