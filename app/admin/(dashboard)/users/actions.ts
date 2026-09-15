"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import argon2 from "argon2";
import { requireAdmin } from "@/lib/auth-checks";
import { adminUserCreateSchema, adminUserRoleUpdateSchema } from "@/lib/validations/auth";
import { idSchema } from "@/lib/validations/common";

export async function updateUserRoleAction(userId: string, newRole: string) {
  const admin = await requireAdmin();

  const parsed = adminUserRoleUpdateSchema.safeParse({ userId, role: newRole });
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid role specified. Only ADMIN and CUSTOMER are allowed." };
  }

  try {
    const targetUserRes = await query(`SELECT id, role FROM "User" WHERE id = $1 LIMIT 1`, [parsed.data.userId]);
    if (targetUserRes.rows.length === 0) {
      return { success: false, error: "User not found" };
    }
    const currentRole = targetUserRes.rows[0].role;

    // Last Admin Protection: Prevent demoting the last remaining administrator
    if (currentRole === "ADMIN" && parsed.data.role === "CUSTOMER") {
      const countRes = await query(`SELECT COUNT(*)::int as count FROM "User" WHERE role = 'ADMIN'`);
      const adminCount = countRes.rows[0]?.count || 0;
      if (adminCount <= 1) {
        return { success: false, error: "Cannot remove the last administrator." };
      }
    }

    await query(
      `UPDATE "User" SET "role" = $1::"Role", "updatedAt" = CURRENT_TIMESTAMP WHERE id = $2`,
      [parsed.data.role, parsed.data.userId]
    );
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update user role:", error);
    return { success: false, error: error.message || "Failed to update role" };
  }
}

export async function createUserAction(prevState: any, formData: FormData) {
  await requireAdmin();

  const name = formData.get("name");
  const email = formData.get("email");
  const password = formData.get("password");
  const rawRole = (formData.get("role") || "CUSTOMER").toString().toUpperCase();

  const parsed = adminUserCreateSchema.safeParse({
    name,
    email,
    password,
    role: rawRole,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid user creation data." };
  }

  const { name: validName, email: validEmail, password: validPassword, role: validRole } = parsed.data;

  try {
    const existing = await query(`SELECT id FROM "User" WHERE LOWER(email) = LOWER($1)`, [validEmail]);
    if (existing.rows.length > 0) {
      return { success: false, error: "A user with this email address already exists" };
    }

    const hashedPassword = await argon2.hash(validPassword);
    const id = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    await query(
      `INSERT INTO "User" (id, name, email, password, role, "createdAt", "updatedAt") 
       VALUES ($1, $2, $3, $4, $5::"Role", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [id, validName, validEmail, hashedPassword, validRole]
    );

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create user:", error);
    return { success: false, error: error.message || "Failed to create user" };
  }
}

export async function deleteUserAction(userId: string) {
  const admin = await requireAdmin();

  const parsedId = idSchema.safeParse(userId);
  if (!parsedId.success) {
    return { success: false, error: "Invalid user ID" };
  }

  if (admin.id === parsedId.data) {
    return { success: false, error: "You cannot delete your own admin account" };
  }

  try {
    const targetUserRes = await query(`SELECT id, role FROM "User" WHERE id = $1 LIMIT 1`, [parsedId.data]);
    if (targetUserRes.rows.length === 0) {
      return { success: false, error: "User not found" };
    }

    // Last Admin Protection: Prevent deleting the last remaining administrator
    if (targetUserRes.rows[0].role === "ADMIN") {
      const countRes = await query(`SELECT COUNT(*)::int as count FROM "User" WHERE role = 'ADMIN'`);
      const adminCount = countRes.rows[0]?.count || 0;
      if (adminCount <= 1) {
        return { success: false, error: "Cannot delete the last administrator." };
      }
    }

    await query(`DELETE FROM "User" WHERE id = $1`, [parsedId.data]);
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete user:", error);
    return { success: false, error: error.message || "Failed to delete user" };
  }
}

export async function getUserDetailsAction(userId: string, userEmail: string | null) {
  await requireAdmin();

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
