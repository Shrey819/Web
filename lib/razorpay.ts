import Razorpay from "razorpay";
import crypto from "crypto";

/**
 * Get or initialize Razorpay SDK instance.
 * Reads RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET from process.env.
 */
export function getRazorpayClient(): Razorpay {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error("Razorpay credentials are not configured in environment variables (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET).");
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

/**
 * Verify Razorpay payment signature for checkout completion.
 *
 * Signature is computed as:
 * HMAC_SHA256(order_id + "|" + payment_id, key_secret)
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    console.error("[Razorpay] Missing RAZORPAY_KEY_SECRET during signature verification.");
    return false;
  }

  try {
    const payload = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Secure timing-safe comparison to prevent timing attacks
    const generatedBuf = Buffer.from(generatedSignature, "utf8");
    const receivedBuf = Buffer.from(signature, "utf8");

    if (generatedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(generatedBuf, receivedBuf);
  } catch (err) {
    console.error("[Razorpay] Signature verification failed with exception:", err);
    return false;
  }
}

/**
 * Verify Razorpay Webhook signature against raw request body.
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[Razorpay] Missing RAZORPAY_WEBHOOK_SECRET during webhook verification.");
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf8");
    const receivedBuf = Buffer.from(signature, "utf8");

    if (expectedBuf.length !== receivedBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expectedBuf, receivedBuf);
  } catch (err) {
    console.error("[Razorpay] Webhook signature verification error:", err);
    return false;
  }
}
