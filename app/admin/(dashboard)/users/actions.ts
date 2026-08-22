"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import argon2 from "argon2";
import { auth } from "@/auth";

export async function updateUserRoleAction(userId: string, newRole: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const validRoles = ["SUPER_ADMIN", "ADMIN", "CATALOG_MANAGER", "CUSTOMER"];
  if (!validRoles.includes(newRole)) {
    return { success: false, error: "Invalid role specified" };
  }

  try {
    await query(
      `UPDATE "User" SET "role" = $1::"Role", "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
      [newRole, userId]
    );
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update user role:", error);
    return { success: false, error: error.message || "Failed to update role" };
  }
}

export async function createUserAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = (formData.get("role") as string) || "CUSTOMER";

  if (!name || !email || !password) {
    return { success: false, error: "Name, email, and password are required" };
  }

  try {
    const existing = await query(`SELECT id FROM "User" WHERE LOWER(email) = LOWER($1)`, [email]);
    if (existing.rows.length > 0) {
      return { success: false, error: "A user with this email address already exists" };
    }

    const hashedPassword = await argon2.hash(password);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await query(
      `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5::"Role", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, name, email, hashedPassword, role]
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return { success: false, error: error.message || "Failed to create user" };
  }
}

export async function deleteUserAction(userId: string) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  if (session.user?.id === userId) {
    return { success: false, error: "You cannot delete your own admin account" };
  }

  try {
    await query(`DELETE FROM "User" WHERE id = $1`, [userId]);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return { success: false, error: error.message || "Failed to delete user" };
  }
}

export async function getUserDetailsAction(userId: string, userEmail: string | null) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // 1. Fetch User Data
    const userRes = await query(
      `SELECT id, name, email, role, "image", "avatar", "google_sub", "given_name", "family_name", "locale", (password IS NOT NULL) as "hasPassword", "createdAt", "updatedAt", "emailVerified" 
       FROM "User" WHERE id = $1`,
      [userId]
    );

    if (userRes.rows.length === 0) {
      return { success: false, error: "User not found" };
    }
    const user = userRes.rows[0];

    // Fetch linked Accounts (e.g. Google OAuth)
    const accountRes = await query(
      `SELECT id, provider, "providerAccountId", type 
       FROM "Account" WHERE "userId" = $1`,
      [userId]
    );

    // 2. Fetch Addresses
    const addressRes = await query(
      `SELECT id, "fullName", "companyName", street, city, state, zip, country, "isDefault", "createdAt" 
       FROM "Address" WHERE "userId" = $1 ORDER BY "isDefault" DESC, "createdAt" DESC`,
      [userId]
    );

    // 3. Fetch Orders
    const emailParam = userEmail || user.email;
    const orderRes = await query(
      `SELECT id, status, subtotal, tax, "shippingCost", total, "shippingFullName", "shippingCompany", "shippingStreet", "shippingCity", "shippingState", "shippingZip", "shippingCountry", "createdAt" 
       FROM "Order" 
       WHERE "userId" = $1 OR ($2::text IS NOT NULL AND LOWER("shippingFullName") ILIKE $3)
       ORDER BY "createdAt" DESC LIMIT 10`,
      [userId, emailParam, `%${user.name || "N/A"}%`]
    );

    // Calculate total spend
    const totalSpend = orderRes.rows.reduce((acc: number, o: any) => acc + (Number(o.total) || 0), 0);

    return {
      success: true,
      user: {
        ...user,
        createdAt: user.createdAt ? new Date(user.createdAt).toISOString() : null,
        updatedAt: user.updatedAt ? new Date(user.updatedAt).toISOString() : null,
        emailVerified: user.emailVerified ? new Date(user.emailVerified).toISOString() : null,
      },
      addresses: addressRes.rows.map((a: any) => ({
        ...a,
        createdAt: a.createdAt ? new Date(a.createdAt).toISOString() : null,
      })),
      orders: orderRes.rows.map((o: any) => ({
        ...o,
        createdAt: o.createdAt ? new Date(o.createdAt).toISOString() : null,
      })),
      accounts: accountRes.rows,
      totalSpend,
    };
  } catch (error: any) {
    console.error("Failed to fetch user details:", error);
    return { success: false, error: error.message || "Failed to load user details" };
  }
}
