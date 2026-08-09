"use server";

import { query } from "@/lib/db";
import * as argon2 from "argon2";
import crypto from "crypto";

const generateUserId = () => "usr_" + crypto.randomBytes(8).toString("hex");

export async function registerUserAction(formData: {
  fullName: string;
  companyName?: string;
  email: string;
  password: string;
}) {
  try {
    const email = formData.email.trim().toLowerCase();
    if (!email || !formData.password || !formData.fullName) {
      return { success: false, error: "Name, email, and password are required." };
    }

    // 1. Check existing user
    const existing = await query(`SELECT id FROM "User" WHERE email = $1 LIMIT 1`, [email]);
    if (existing.rows.length > 0) {
      return { success: false, error: "An account with this email address already exists. Please sign in." };
    }

    // 2. Hash password & generate ID
    const hashedPassword = await argon2.hash(formData.password);
    const userId = generateUserId();
    const displayName = formData.companyName 
      ? `${formData.fullName} (${formData.companyName})` 
      : formData.fullName;

    // 3. Save User to PostgreSQL
    await query(`
      INSERT INTO "User" ("id", "name", "email", "password", "role", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, 'CUSTOMER', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [userId, displayName, email, hashedPassword]);

    return {
      success: true,
      user: {
        id: userId,
        name: displayName,
        email: email,
        role: "CUSTOMER",
        companyName: formData.companyName || "",
      },
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
}) {
  try {
    const email = formData.email.trim().toLowerCase();

    // Demo bypass
    if (email === "admin@demo.com" && formData.password === "demo123") {
      return {
        success: true,
        user: {
          id: "demo-admin-id",
          name: "Demo Admin",
          email: "admin@demo.com",
          role: "SUPER_ADMIN",
          companyName: "OM Automation Corporate",
        },
      };
    }

    const res = await query(`SELECT id, email, name, role, password FROM "User" WHERE email = $1 LIMIT 1`, [email]);
    if (res.rows.length === 0) {
      return { success: false, error: "No account found with this email. Please register." };
    }

    const user = res.rows[0];
    if (!user.password) {
      return { success: false, error: "Invalid account credentials." };
    }

    const isValid = await argon2.verify(user.password, formData.password);
    if (!isValid) {
      return { success: false, error: "Incorrect password. Please try again." };
    }

    return {
      success: true,
      user: {
        id: user.id,
        name: user.name || "Customer User",
        email: user.email,
        role: user.role || "CUSTOMER",
        companyName: "",
      },
    };
  } catch (error) {
    console.error("Login authentication error:", error);
    return { success: false, error: "Authentication failed." };
  }
}
