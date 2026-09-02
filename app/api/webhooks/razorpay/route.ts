import { NextRequest, NextResponse } from "next/server";
import { verifyRazorpayWebhookSignature } from "@/lib/razorpay";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("x-razorpay-signature");

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing x-razorpay-signature header." },
        { status: 400 }
      );
    }

    const rawBody = await req.text();

    const isValid = verifyRazorpayWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error("[Razorpay Webhook] Invalid webhook signature rejected.");
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature." },
        { status: 400 }
      );
    }

    const eventData = JSON.parse(rawBody);
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
  } catch (error: any) {
    console.error("[Razorpay Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error." },
      { status: 500 }
    );
  }
}
