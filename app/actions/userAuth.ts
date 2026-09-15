"use server";

import { query } from "@/lib/db";
import { createSession, invalidateSession, getCurrentUser } from "@/lib/session";
import { requireCustomer } from "@/lib/auth-checks";
import { getCustomerProfile, updateCustomerProfile } from "@/lib/dal/user";
import { UserSession } from "@/types";
import * as argon2 from "argon2";
import crypto from "crypto";

import { userLoginSchema, userProfileUpdateSchema } from "@/lib/validations/auth";
import { emailSchema } from "@/lib/validations/common";
import { z } from "zod";

const generateUserId = () => "usr_" + crypto.randomBytes(8).toString("hex");

const registerInputSchema = z.object({
  fullName: z.string().trim().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  companyName: z.string().trim().max(100).optional(),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(128, "Password cannot exceed 128 characters"),
}).strict();

export async function registerUserAction(formData: {
  fullName: string;
  companyName?: string;
  email: string;
  password: string;
}): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  try {
    const parsed = registerInputSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid registration data." };
    }

    const { fullName, companyName, email, password } = parsed.data;

    // 1. Check existing user
    const existing = await query(`SELECT id FROM "User" WHERE email = $1 LIMIT 1`, [email]);
    if (existing.rows.length > 0) {
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    // 2. Hash password & generate ID (Bounded password prevents Argon2 DoS)
    const hashedPassword = await argon2.hash(password);
    const userId = generateUserId();
    const displayName = companyName 
      ? `${fullName} (${companyName})` 
      : fullName;

    // 3. Save User to PostgreSQL with hardcoded CUSTOMER role (prevents role injection)
    await query(`
      INSERT INTO "User" ("id", "name", "email", "password", "role", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, displayName, email, hashedPassword]);

    // 4. Create server-side session with HttpOnly cookie
    await createSession(userId);

    const user: UserSession = {
      id: userId,
      name: displayName,
      email: email,
      role: "CUSTOMER",
      companyName: companyName || "",
      image: null,
      avatar: null,
      googleSub: null,
      emailVerified: null,
    };

    return {
      success: true,
      user,
    };
  } catch (error) {
    console.error("Failed to register user:", error);
    const msg = error instanceof Error ? error.message : "Registration failed";
    return { success: false, error: msg };
  }
}

export async function loginUserAction(formData: {
  email: string;
  password: string;
}): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  try {
    const parsed = userLoginSchema.safeParse(formData);
    if (!parsed.success) {
      // Generic error prevents account enumeration and leaking schema format
      return { success: false, error: "Invalid email or password." };
    }

    const { email, password } = parsed.data;

    const res = await query(
      `SELECT id, email, name, role, password, image, avatar, google_sub, "emailVerified" 
       FROM "User" 
       WHERE email = $1 
       LIMIT 1`,
      [email]
    );
    if (res.rows.length === 0) {
      // Generic error prevents account enumeration
      return { success: false, error: "Invalid email or password." };
    }

    const user = res.rows[0];
    if (!user.password) {
      // Generic error prevents account enumeration
      return { success: false, error: "Invalid email or password." };
    }

    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      return { success: false, error: "Invalid email or password." };
    }

    // Create server-side session with HttpOnly cookie
    await createSession(user.id);

    const sessionUser: UserSession = {
      id: user.id,
      name: user.name || "Customer User",
      email: user.email,
      role: user.role || "CUSTOMER",
      companyName: "",
      image: user.image || user.avatar || null,
      avatar: user.avatar || user.image || null,
      googleSub: user.google_sub || null,
      emailVerified: user.emailVerified,
    };

    return {
      success: true,
      user: sessionUser,
    };
  } catch (error) {
    console.error("Login authentication error:", error);
    return { success: false, error: "Invalid email or password." };
  }
}

export async function logoutUserAction(): Promise<{ success: boolean }> {
  try {
    await invalidateSession();
    return { success: true };
  } catch (error) {
    console.error("Logout user action failed:", error);
    return { success: false };
  }
}

export async function getCurrentUserAction(): Promise<UserSession | null> {
  return await getCurrentUser();
}

/**
 * Get profile data for the authenticated customer.
 */
export async function getMyProfileAction() {
  try {
    const user = await requireCustomer();
    const profile = await getCustomerProfile(user.id);

    if (!profile) {
      return { success: false, error: "Profile not found." };
    }

    return { success: true, profile };
  } catch (error: any) {
    console.error("Failed to fetch profile:", error);
    return { success: false, error: error?.message || "Failed to load profile." };
  }
}

/**
 * Update authenticated customer's own profile.
 * Strict Allowlist: only `name` and `companyName` can be updated.
 * System fields (role, email, password, etc.) are strictly immutable here.
 */
export async function updateMyProfileAction(data: { name?: string; companyName?: string }) {
  try {
    const user = await requireCustomer();
    const parsed = userProfileUpdateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid profile update data." };
    }

    const profile = await updateCustomerProfile(user.id, parsed.data);

    if (!profile) {
      return { success: false, error: "Profile not found." };
    }

    return { success: true, profile };
  } catch (error: any) {
    console.error("Failed to update profile:", error);
    return { success: false, error: error?.message || "Failed to update profile." };
  }
}
