"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth-checks";
import crypto from "crypto";
import { createQuoteInputSchema, quoteStatusUpdateSchema } from "@/lib/validations/forms";

const generateId = () => "rfq_" + crypto.randomBytes(8).toString("hex");
const generateQuoteItemId = () => "qti_" + crypto.randomBytes(8).toString("hex");

export interface CreateQuoteItemInput {
  productId?: string;
  name: string;
  sku?: string;
  quantity: number;
  notes?: string;
}

export interface CreateQuoteInput {
  company: string;
  name: string;
  email: string;
  phone: string;
  notes?: string;
  items: CreateQuoteItemInput[];
}

/**
 * CREATE QUOTE REQUEST (RFQs)
 */
export async function createQuoteAction(input: CreateQuoteInput) {
  try {
    const parsed = createQuoteInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid quote request data." };
    }
    const validatedInput = parsed.data;

    const quoteId = "RFQ-" + Math.floor(100000 + Math.random() * 900000);

    await transaction(async (client) => {
      // 1. Insert Quote Request Core
      await client.query(`
        INSERT INTO "QuoteRequest" ("id", "company", "name", "email", "phone", "status", "notes", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, 'pending', $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        quoteId,
        validatedInput.company,
        validatedInput.name,
        validatedInput.email,
        validatedInput.phone,
        validatedInput.notes || null
      ]);

      // 2. Insert Quote Items
      if (validatedInput.items && validatedInput.items.length > 0) {
        for (const item of validatedInput.items) {
          await client.query(`
            INSERT INTO "QuoteItem" ("id", "quoteId", "productId", "quantity", "notes")
            VALUES ($1, $2, $3, $4, $5)
          `, [
            generateQuoteItemId(),
            quoteId,
            item.productId || null,
            item.quantity || 1,
            item.notes || item.name || null
          ]);
        }
      }
    });

    revalidatePath("/admin/quotes");
    revalidatePath("/admin");
    return { success: true, quoteId };
  } catch (error) {
    console.error("Failed to create quote request:", error);
    const message = error instanceof Error ? error.message : "Failed to submit quote request";
    return { success: false, error: message };
  }
}

/**
 * FETCH ALL QUOTE REQUESTS FOR ADMIN
 */
export async function getAllQuotesAdminAction() {
  await requireAdmin();
  try {
    const res = await query(`
      SELECT 
        q."id", q."company", q."name", q."email", q."phone", q."status", q."notes", q."createdAt",
        COUNT(qi."id")::int as "itemCount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', qi."id", 
              'productId', qi."productId", 
              'quantity', qi."quantity", 
              'notes', qi."notes",
              'productName', p."name"
            )
          ) FILTER (WHERE qi."id" IS NOT NULL),
          '[]'::json
        ) as "items"
      FROM "QuoteRequest" q
      LEFT JOIN "QuoteItem" qi ON q."id" = qi."quoteId"
      LEFT JOIN "Product" p ON qi."productId" = p."id"
      GROUP BY q."id"
      ORDER BY q."createdAt" DESC
    `);

    return {
      success: true,
      quotes: res.rows.map((r: any) => ({
        id: r.id,
        company: r.company,
        name: r.name,
        email: r.email,
        phone: r.phone,
        status: r.status,
        notes: r.notes || "",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        itemCount: Number(r.itemCount || 0),
        items: Array.isArray(r.items) ? r.items : [],
      })),
    };
  } catch (error) {
    console.error("Failed to fetch admin quotes:", error);
    return { success: false, quotes: [], error: String(error) };
  }
}

/**
 * UPDATE QUOTE STATUS (ADMIN)
 */
export async function updateQuoteStatusAction(quoteId: string, status: string, notes?: string) {
  await requireAdmin();
  try {
    const parsed = quoteStatusUpdateSchema.safeParse({ quoteId, status });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid quote status." };
    }

    const cleanNotes = notes ? String(notes).trim().slice(0, 2000) : null;

    await query(`
      UPDATE "QuoteRequest" 
      SET "status" = $1, "notes" = COALESCE($2, "notes"), "updatedAt" = CURRENT_TIMESTAMP 
      WHERE "id" = $3
    `, [parsed.data.status, cleanNotes, parsed.data.quoteId]);

    revalidatePath("/admin/quotes");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update quote status:", error);
    const message = error instanceof Error ? error.message : "Failed to update quote status";
    return { success: false, error: message };
  }
}
