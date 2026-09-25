import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { query } from "@/lib/db";
import { z } from "zod";

const MAX_WEBHOOK_BODY_SIZE = 65536; // 64 KB

const razorpayWebhookEventSchema = z.object({
  event: z.string().max(100),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string().max(100).optional(),
        order_id: z.string().max(100).optional(),
        error_description: z.string().max(500).optional(),
      }).passthrough().optional(),
    }).passthrough().optional(),
    order: z.object({
      entity: z.object({
        id: z.string().max(100).optional(),
      }).passthrough().optional(),
    }).passthrough().optional(),
  }).passthrough().optional(),
}).passthrough();

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return NextResponse.json(
        { success: false, error: "Content-Type must be application/json." },
        { status: 415 }
      );
    }

    const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
    if (contentLength > MAX_WEBHOOK_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Payload exceeds 64KB limit." },
        { status: 413 }
      );
    }

    const signature = req.headers.get("x-razorpay-signature");
    if (!signature || signature.length > 128) {
      return NextResponse.json(
        { success: false, error: "Missing or invalid x-razorpay-signature header." },
        { status: 400 }
      );
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_WEBHOOK_BODY_SIZE) {
      return NextResponse.json(
        { success: false, error: "Payload exceeds 64KB limit." },
        { status: 413 }
      );
    }

    // Step A: Cryptographically verify webhook signature
    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid webhook signature rejected.");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    // Step B: Safe JSON parsing
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { success: false, error: "Malformed JSON payload." },
        { status: 400 }
      );
    }

    // Step C: Schema validation
    const parsed = razorpayWebhookEventSchema.safeParse(rawJson);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook payload structure." },
        { status: 400 }
      );
    }

    const eventData = parsed.data;
    const eventType = eventData.event;
    console.log(`[Razorpay Webhook] Received valid event: ${eventType}`);

    if (eventType === "payment.captured" || eventType === "order.paid") {
      const paymentEntity = eventData?.payload?.payment?.entity;
      const orderEntity = eventData?.payload?.order?.entity;

      const razorpayPaymentId = paymentEntity?.id;
      const razorpayOrderId = orderEntity?.id || paymentEntity?.order_id;

      if (razorpayOrderId || razorpayPaymentId) {
        // Update any matching payment records to 'paid'
        await query(
          `
          UPDATE "Payment"
          SET "status" = 'paid',
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE ("razorpayOrderId" = $1 OR "razorpayPaymentId" = $2 OR "reference" = $2)
            AND "status" != 'paid'
        `,
          [razorpayOrderId || "", razorpayPaymentId || ""]
        );
      }
    } else if (eventType === "payment.failed") {
      const paymentEntity = eventData?.payload?.payment?.entity;
      console.warn("[Razorpay Webhook] Payment failed event:", {
        paymentId: paymentEntity?.id,
        orderId: paymentEntity?.order_id,
        reason: paymentEntity?.error_description,
      });
    }

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error("[Razorpay Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
