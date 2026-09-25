"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-checks";
import { safeActionResponse } from "@/lib/safe-error";
import crypto from "crypto";

const generateId = () => "sub_" + crypto.randomBytes(8).toString("hex");

/**
 * Ensure FormSubmission table exists in PostgreSQL
 */
async function ensureTableExists() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS "FormSubmission" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "name" TEXT,
        "email" TEXT NOT NULL,
        "category" TEXT,
        "message" TEXT,
        "status" TEXT NOT NULL DEFAULT 'unread',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error("Error creating FormSubmission table:", error);
  }
}

export interface FormSubmissionRecord {
  id: string;
  type: "inquiry" | "promotional";
  name: string | null;
  email: string;
  category: string | null;
  message: string | null;
  status: string;
  createdAt: string;
}

import { inquiryFormSchema, newsletterSchema } from "@/lib/validations/forms";
import { idSchema } from "@/lib/validations/common";

/**
 * SUBMIT INQUIRY FORM (Form 1: "Drop us an email")
 */
export async function submitInquiryFormAction(data: {
  name: string;
  email: string;
  category?: string;
  message: string;
}): Promise<{ success: true; id: string; error?: never } | { success: false; error: string; id?: never }> {
  try {
    const parsed = inquiryFormSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid inquiry data." };
    }

    await ensureTableExists();

    const id = generateId();

    await query(
      `
      INSERT INTO "FormSubmission" ("id", "type", "name", "email", "category", "message", "status", "createdAt", "updatedAt")
      VALUES ($1, 'inquiry', $2, $3, $4, $5, 'unread', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
      [
        id,
        parsed.data.name,
        parsed.data.email,
        parsed.data.category || "General Inquiry",
        parsed.data.message,
      ]
    );

    revalidatePath("/admin/forms");
    return { success: true, id };
  } catch (error) {
    return safeActionResponse(error, "Failed to submit inquiry message.");
  }
}

/**
 * SUBMIT PROMOTIONAL NEWSLETTER (Form 2: "Sign up to our Newsletter")
 */
export async function submitPromotionalNewsletterAction(
  email: string
): Promise<{ success: true; id: string; error?: never } | { success: false; error: string; id?: never }> {
  try {
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Please enter a valid email address." };
    }

    await ensureTableExists();

    const cleanEmail = parsed.data.email;
    const id = generateId();

    await query(
      `
      INSERT INTO "FormSubmission" ("id", "type", "name", "email", "category", "message", "status", "createdAt", "updatedAt")
      VALUES ($1, 'promotional', 'Subscriber', $2, 'Newsletter Subscription', 'Signed up for promotional offers & updates', 'unread', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `,
      [id, cleanEmail]
    );

    revalidatePath("/admin/forms");
    return { success: true, id };
  } catch (error) {
    return safeActionResponse(error, "Failed to subscribe to newsletter.");
  }
}

/**
 * FETCH FORM SUBMISSIONS FOR ADMIN (Filtered by type)
 */
export async function getFormSubmissionsAction(
  type: "inquiry" | "promotional" = "inquiry"
): Promise<{ success: boolean; submissions: FormSubmissionRecord[] }> {
  await requireAdmin();
  try {
    await ensureTableExists();

    const res = await query(
      `
      SELECT id, type, name, email, category, message, status, "createdAt"
      FROM "FormSubmission"
      WHERE type = $1
      ORDER BY "createdAt" DESC
    `,
      [type]
    );

    const submissions = res.rows.map((r: any) => ({
      id: r.id,
      type: r.type,
      name: r.name,
      email: r.email,
      category: r.category,
      message: r.message,
      status: r.status || "unread",
      createdAt: r.createdAt
        ? new Date(r.createdAt).toISOString()
        : new Date().toISOString(),
    }));

    return { success: true, submissions };
  } catch (error: any) {
    console.error("Failed to fetch form submissions:", error);
    return { success: false, submissions: [] };
  }
}

/**
 * UPDATE FORM SUBMISSION CELL / FIELD
 */
export async function updateFormSubmissionAction(
  id: string,
  field: "name" | "email" | "category" | "message" | "status",
  value: string
): Promise<{ success: true; error?: never } | { success: false; error: string }> {
  await requireAdmin();
  try {
    await ensureTableExists();

    const allowedFields = ["name", "email", "category", "message", "status"];
    if (!allowedFields.includes(field)) {
      return { success: false, error: "Invalid field name." };
    }

    await query(
      `
      UPDATE "FormSubmission"
      SET "${field}" = $1, "updatedAt" = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
      [value, id]
    );

    revalidatePath("/admin/forms");
    return { success: true };
  } catch (error) {
    return safeActionResponse(error, "Failed to update record.");
  }
}

/**
 * DELETE FORM SUBMISSION ROW
 */
export async function deleteFormSubmissionAction(
  id: string
): Promise<{ success: true; error?: never } | { success: false; error: string }> {
  await requireAdmin();
  try {
    await ensureTableExists();

    await query(`DELETE FROM "FormSubmission" WHERE id = $1`, [id]);

    revalidatePath("/admin/forms");
    return { success: true };
  } catch (error) {
    return safeActionResponse(error, "Failed to delete record.");
  }
}
