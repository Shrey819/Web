import "server-only";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { query, transaction } from "@/lib/db";
import { getPrivateSystemSettings } from "@/lib/settings";
import { revalidatePath } from "next/cache";

/**
 * Shiprocket Webhook Security Engine
 *
 * IMPORTANT ARCHITECTURAL & PROVIDER NOTE:
 * Shiprocket does NOT support HMAC-SHA256 signatures or signed timestamps for webhooks.
 * Instead, Shiprocket's webhook delivery mechanism sends a pre-shared security token configured
 * in the Shiprocket merchant dashboard (under Settings > API > Webhooks) via the `x-api-key` header.
 *
 * To ensure maximum security within the provider's constraints:
 * 1. Constant-time secret comparison via `crypto.timingSafeEqual`.
 * 2. Fail-closed: reject requests if no secret is configured on the server.
 * 3. Never accept tokens from URL query parameters.
 * 4. Strict body size enforcement (< 64KB).
 * 5. Strict schema allowlist: prevent attacker field injection (role, total, userId, etc.).
 * 6. Safe entity resolution and cross-shipment verification (prevent cross-order contamination).
 * 7. Status regression prevention (DELIVERED and CANCELLED statuses cannot be regressed).
 * 8. Payment authority isolation (NEVER mark prepaid/Razorpay orders as paid via logistics events).
 */

const MAX_BODY_BYTES = 64 * 1024; // 64 KB

/**
 * Constant-time string comparison to prevent timing attacks.
 */
function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Resolves the server-configured webhook secret.
 * Checks environment variable first, then private system settings.
 * Returns null if no secret is configured (allowing fail-closed behavior).
 */
export async function getExpectedShiprocketWebhookSecret(): Promise<string | null> {
  const envSecret = process.env.SHIPROCKET_WEBHOOK_SECRET?.trim();
  if (envSecret) return envSecret;

  try {
    const settings = await getPrivateSystemSettings();
    if (settings.shiprocket_webhook_secret?.trim()) {
      return settings.shiprocket_webhook_secret.trim();
    }
  } catch (err) {
    console.error("[Shiprocket Webhook] Error loading system settings for secret:", err);
  }

  return null;
}

/**
 * Extracts the webhook token from the canonical `x-api-key` HTTP header only.
 * Non-standard headers (x-shiprocket-secret, Authorization) and query-string tokens
 * are strictly rejected to provide one explicit authentication contract.
 */
function extractProvidedToken(req: NextRequest): string | null {
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey.trim()) return apiKey.trim();

  return null;
}

/**
 * Strict schema validation for incoming Shiprocket webhook payloads.
 * Unrecognized fields are allowed through passthrough() so Shiprocket additions
 * don't break parsing, but only explicitly allowlisted fields are ever accessed or written.
 */
export const ShiprocketWebhookPayloadSchema = z.object({
  awb: z.string().nullish(),
  awb_code: z.string().nullish(),
  order_id: z.union([z.string(), z.number()]).nullish(),
  channel_order_id: z.union([z.string(), z.number()]).nullish(),
  shipment_id: z.union([z.string(), z.number()]).nullish(),
  current_status: z.string().nullish(),
  shipment_status: z.string().nullish(),
  current_status_id: z.union([z.string(), z.number()]).nullish(),
  courier_name: z.string().max(255).nullish(),
  etd: z.string().max(255).nullish(),
  edd: z.string().max(255).nullish(),
  scans: z.array(z.any()).nullish(),
  activities: z.array(z.any()).nullish(),
  test: z.boolean().nullish(),
  event: z.string().nullish(),
}).passthrough();

export type ShiprocketWebhookPayload = z.infer<typeof ShiprocketWebhookPayloadSchema>;

/**
 * Verifies webhook authentication and headers.
 */
export async function verifyShiprocketWebhook(req: NextRequest): Promise<{
  authorized: boolean;
  status: number;
  error?: string;
}> {
  // 1. Only POST allowed
  if (req.method !== "POST") {
    return { authorized: false, status: 405, error: "Method Not Allowed: only POST is supported" };
  }

  // 2. Content-Type check
  const contentType = req.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { authorized: false, status: 415, error: "Unsupported Media Type: Content-Type must be application/json" };
  }

  // 3. Content-Length header limit check
  const contentLengthHeader = req.headers.get("content-length");
  if (contentLengthHeader) {
    const length = parseInt(contentLengthHeader, 10);
    if (!isNaN(length) && length > MAX_BODY_BYTES) {
      return { authorized: false, status: 413, error: "Payload Too Large: body exceeds 64KB limit" };
    }
  }

  // 4. Resolve server expected secret (Fail-closed)
  const expectedSecret = await getExpectedShiprocketWebhookSecret();
  if (!expectedSecret || expectedSecret.trim() === "") {
    console.error("[Shiprocket Webhook] Authentication rejected: SHIPROCKET_WEBHOOK_SECRET is not configured on server.");
    return {
      authorized: false,
      status: 401,
      error: "Webhook authentication failed: server secret not configured (fail closed)",
    };
  }

  // 5. Extract provided token from canonical x-api-key header
  const providedToken = extractProvidedToken(req);
  if (!providedToken) {
    return { authorized: false, status: 401, error: "Unauthorized: Missing webhook authentication token in x-api-key header" };
  }

  // 6. Timing-safe constant-time comparison
  const isValid = constantTimeCompare(providedToken, expectedSecret);
  if (!isValid) {
    console.warn("[Shiprocket Webhook] Unauthorized attempt with invalid token.");
    return { authorized: false, status: 401, error: "Unauthorized: Invalid webhook secret" };
  }

  return { authorized: true, status: 200 };
}

/**
 * Centralized, hardened Shiprocket webhook request handler.
 * Used by both /api/webhooks/shiprocket and /api/fulfillment/events.
 */
export async function handleShiprocketWebhook(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Verify authentication & request validity
    const authResult = await verifyShiprocketWebhook(req);
    if (!authResult.authorized) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        {
          status: authResult.status,
          headers: authResult.status === 405 ? { Allow: "POST" } : undefined,
        }
      );
    }

    // 2. Read and enforce body byte limit
    const rawBody = await req.text();
    if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
      return NextResponse.json(
        { success: false, error: "Payload Too Large: body exceeds 64KB limit" },
        { status: 413 }
      );
    }

    // 3. Safe JSON parse
    let parsedJson: any;
    try {
      parsedJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Bad Request: Malformed JSON payload" },
        { status: 400 }
      );
    }

    // 4. Schema validation
    const parseResult = ShiprocketWebhookPayloadSchema.safeParse(parsedJson);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: "Bad Request: Invalid payload structure", details: parseResult.error.issues },
        { status: 400 }
      );
    }

    const payload = parseResult.data;

    // 5. Support test pings from Shiprocket dashboard
    if (payload.test === true || payload.event === "test" || Object.keys(parsedJson).length === 0) {
      return NextResponse.json({
        success: true,
        message: "Shiprocket webhook endpoint active and authenticated",
        status: "ok",
      });
    }

    // 6. Extract strictly allowlisted fields
    const awb = String(payload.awb || payload.awb_code || "").trim();
    const orderId = String(payload.order_id || payload.channel_order_id || "").trim();
    const shipmentId = String(payload.shipment_id || "").trim();
    const rawStatus = String(payload.current_status || payload.shipment_status || "").trim();
    const currentStatus = rawStatus.toUpperCase();
    const courierName = payload.courier_name ? String(payload.courier_name).trim().slice(0, 255) : null;
    const etd = (payload.etd || payload.edd) ? String(payload.etd || payload.edd).trim().slice(0, 100) : null;
    const scans = Array.isArray(payload.scans) ? payload.scans : (Array.isArray(payload.activities) ? payload.activities : []);

    if (!awb && !orderId && !shipmentId) {
      return NextResponse.json(
        { success: false, error: "Missing required logistics identifiers: awb, shipment_id, or order_id" },
        { status: 400 }
      );
    }

    // 7. Entity Resolution & Safe Relationship Lookup
    // Find matching shipment record if it exists
    let existingShipment: any = null;
    if (awb) {
      const res = await query(
        `SELECT "id", "orderId" FROM "Shipment" WHERE "awbCode" = $1 OR "trackingNumber" = $1 LIMIT 1`,
        [awb]
      );
      if (res.rows.length > 0) existingShipment = res.rows[0];
    }

    if (!existingShipment && shipmentId) {
      const res = await query(
        `SELECT "id", "orderId" FROM "Shipment" WHERE "shiprocketShipmentId" = $1 LIMIT 1`,
        [shipmentId]
      );
      if (res.rows.length > 0) existingShipment = res.rows[0];
    }

    if (!existingShipment && orderId) {
      const res = await query(
        `SELECT "id", "orderId" FROM "Shipment" WHERE "orderId" = $1 LIMIT 1`,
        [orderId]
      );
      if (res.rows.length > 0) existingShipment = res.rows[0];
    }

    // Cross-Shipment Mismatch Check:
    // If the shipment was resolved via AWB or shipmentId, and orderId was also supplied,
    // verify that the shipment actually belongs to that order.
    if (existingShipment && orderId && existingShipment.orderId !== orderId) {
      console.warn(
        `[Shiprocket Webhook] Security Alert: Cross-Shipment Mismatch detected! Shipment ${existingShipment.id} belongs to order ${existingShipment.orderId}, but payload claims order ${orderId}. Rejecting cross-contamination.`
      );
      return NextResponse.json(
        { success: false, error: "Conflict: AWB/Shipment does not match the specified order ID" },
        { status: 409 }
      );
    }

    // Determine target Order ID authoritatively
    const targetOrderId = existingShipment?.orderId || (orderId ? orderId : null);
    let existingOrder: any = null;

    if (targetOrderId) {
      const orderRes = await query(
        `SELECT "id", "status", "total" FROM "Order" WHERE "id" = $1 LIMIT 1`,
        [targetOrderId]
      );
      if (orderRes.rows.length > 0) {
        existingOrder = orderRes.rows[0];
      }
    }

    // If neither shipment nor order exists in our system, return safe idempotent response
    if (!existingShipment && !existingOrder) {
      console.log(`[Shiprocket Webhook] No matching shipment or order found for AWB: ${awb || "N/A"}, Order: ${orderId || "N/A"}. Safe return.`);
      return NextResponse.json({
        success: true,
        message: "No matching order or shipment found; event acknowledged without modification.",
      });
    }

    // 8. Status Normalization & Mapping
    let dbOrderStatus: "SHIPPED" | "DELIVERED" | "CANCELLED" | null = null;
    let dbShipmentStatus = "in_transit";

    if (currentStatus.includes("DELIVERED") && !currentStatus.includes("RTO") && !currentStatus.includes("UNDELIVERED")) {
      dbOrderStatus = "DELIVERED";
      dbShipmentStatus = "delivered";
    } else if (currentStatus.includes("CANCELLED") || currentStatus.includes("CANCELED")) {
      dbOrderStatus = "CANCELLED";
      dbShipmentStatus = "cancelled";
    } else if (currentStatus.includes("RTO")) {
      dbShipmentStatus = "rto";
    } else if (
      currentStatus.includes("PICKED UP") ||
      currentStatus.includes("IN TRANSIT") ||
      currentStatus.includes("OUT FOR DELIVERY") ||
      currentStatus.includes("AWB") ||
      currentStatus.includes("SHIPPED")
    ) {
      dbOrderStatus = "SHIPPED";
      dbShipmentStatus = "in_transit";
    }

    // 9. Status Regression Prevention Guard
    let shouldUpdateOrderStatus = false;
    if (existingOrder && dbOrderStatus) {
      const currentOrderStatus = String(existingOrder.status);

      if (currentOrderStatus === "DELIVERED") {
        // Prevent regression from DELIVERED to SHIPPED, CANCELLED, or PROCESSING
        if (dbOrderStatus !== "DELIVERED") {
          console.warn(
            `[Shiprocket Webhook] Status regression blocked: Order ${existingOrder.id} is already DELIVERED; ignoring incoming ${dbOrderStatus}.`
          );
          shouldUpdateOrderStatus = false;
        } else {
          shouldUpdateOrderStatus = false; // already delivered, no order update needed
        }
      } else if (currentOrderStatus === "CANCELLED") {
        // Prevent reviving cancelled orders via shipping events
        console.warn(
          `[Shiprocket Webhook] Status regression blocked: Order ${existingOrder.id} is CANCELLED; ignoring incoming ${dbOrderStatus}.`
        );
        shouldUpdateOrderStatus = false;
      } else if (currentOrderStatus === "SHIPPED" && dbOrderStatus === "SHIPPED") {
        // Already shipped, shipment tracking updates but order status remains unchanged
        shouldUpdateOrderStatus = false;
      } else {
        shouldUpdateOrderStatus = true;
      }
    }

    // 10. Payment Authority Isolation Guard
    // Fulfillment webhooks must NEVER mark prepaid (Razorpay, credit card, UPI) orders as 'paid'.
    // Only Cash on Delivery (COD) orders may be marked as 'paid' upon verified physical delivery.
    let shouldMarkCodPaid = false;
    let codPaymentId: string | null = null;

    if (dbOrderStatus === "DELIVERED" && existingOrder) {
      const paymentRes = await query(
        `SELECT "id", "method", "reference", "status" FROM "Payment" WHERE "orderId" = $1`,
        [existingOrder.id]
      );

      for (const payment of paymentRes.rows) {
        const method = String(payment.method || "").toLowerCase();
        const reference = String(payment.reference || "").toUpperCase();
        const isCod = method === "cod" || reference.startsWith("COD-");

        if (isCod) {
          if (payment.status !== "paid") {
            shouldMarkCodPaid = true;
            codPaymentId = payment.id;
          }
        } else {
          console.log(
            `[Shiprocket Webhook] Payment ${payment.id} for Order ${existingOrder.id} is prepaid (${payment.method}). Preserving payment status: ${payment.status}`
          );
        }
      }
    }

    // 11. Transactional Database Update
    const sanitizedTrackingData = {
      courier_name: courierName,
      current_status: rawStatus,
      etd: etd,
      scans: scans,
      processed_at: new Date().toISOString(),
    };

    await transaction(async (client) => {
      // A. Update or create Shipment
      if (existingShipment) {
        await client.query(
          `UPDATE "Shipment"
           SET "currentStatus" = COALESCE(NULLIF($1, ''), "currentStatus"),
               "status" = COALESCE($2, "status"),
               "courierName" = COALESCE($3, "courierName"),
               "etd" = COALESCE($4, "etd"),
               "awbCode" = COALESCE(NULLIF($5, ''), "awbCode"),
               "trackingNumber" = COALESCE(NULLIF($5, ''), "trackingNumber"),
               "trackingData" = $6,
               "updatedAt" = CURRENT_TIMESTAMP
           WHERE "id" = $7`,
          [
            rawStatus || null,
            dbShipmentStatus,
            courierName || null,
            etd || null,
            awb || null,
            JSON.stringify(sanitizedTrackingData),
            existingShipment.id,
          ]
        );
      } else if (existingOrder) {
        // Create initial shipment record linked to existing order
        await client.query(
          `INSERT INTO "Shipment" (
             "id", "orderId", "status", "currentStatus", "courierName", "etd",
             "awbCode", "trackingNumber", "trackingData", "updatedAt"
           ) VALUES (
             $1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP
           )`,
          [
            `ship_${crypto.randomUUID().slice(0, 16)}`,
            existingOrder.id,
            dbShipmentStatus,
            rawStatus || null,
            courierName || null,
            etd || null,
            awb || null,
            awb || null,
            JSON.stringify(sanitizedTrackingData),
          ]
        );
      }

      // B. Update Order status if allowed
      if (shouldUpdateOrderStatus && dbOrderStatus && existingOrder) {
        await client.query(
          `UPDATE "Order" SET "status" = $1::"OrderStatus", "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
          [dbOrderStatus, existingOrder.id]
        );
      }

      // C. Update COD payment if delivery verified
      if (shouldMarkCodPaid && codPaymentId) {
        await client.query(
          `UPDATE "Payment" SET "status" = 'paid', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
          [codPaymentId]
        );
      }
    });

    // 12. Path Revalidations
    if (targetOrderId) {
      revalidatePath(`/orders/${targetOrderId}`);
    }
    revalidatePath("/orders");
    revalidatePath("/admin/orders");

    return NextResponse.json({
      success: true,
      message: "Shiprocket webhook processed successfully",
      orderId: targetOrderId,
      status: dbShipmentStatus,
    });
  } catch (error: any) {
    console.error("[Shiprocket Webhook] Internal processing error:", error?.message || error);
    return NextResponse.json(
      { success: false, error: "Internal server error processing webhook" },
      { status: 500 }
    );
  }
}
