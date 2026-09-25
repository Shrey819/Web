"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "@/lib/settings";
import { calculateServerCheckout } from "@/lib/pricing";
import { createShiprocketAdhocOrder, calculateDeliveryDateRange, DeliveryRangeResult } from "@/lib/shiprocket";
import { saveAddressFromCheckoutAction } from "@/app/actions/address";
import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/razorpay";
import { requireCustomer } from "@/lib/auth-checks";
import crypto from "crypto";
import {
  createRazorpayOrderInputSchema,
  createPrepaidOrderInputSchema,
} from "@/lib/validations/order";
import { safeActionResponse } from "@/lib/safe-error";

const generateId = () => "ord_" + crypto.randomBytes(8).toString("hex");
const generateOrderItemId = () => "ori_" + crypto.randomBytes(8).toString("hex");
const generatePaymentId = () => "pay_" + crypto.randomBytes(8).toString("hex");

export interface CreatePrepaidOrderItemInput {
  productId: string;
  name?: string;
  sku?: string;
  price?: number;
  quantity: number;
  variantId?: string;
  buyerNote?: string;
}

export interface CreateRazorpayOrderInput {
  items: CreatePrepaidOrderItemInput[];
  couponCode?: string;
  amount?: number; // Ignored for security, derived server-side
  currency?: string;
  notes?: Record<string, string>;
}

export interface CreatePrepaidOrderInput {
  userId?: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  addressType?: string;
  saveAddress?: boolean;
  items: CreatePrepaidOrderItemInput[];
  couponCode?: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * 1. Create a Razorpay Order on Razorpay's servers.
 * Converts amount to paise and returns the Razorpay order ID to the client.
 * Server strictly reconstructs authoritative pricing from PostgreSQL.
 */
export async function createRazorpayOrderAction(input: CreateRazorpayOrderInput) {
  try {
    const parsed = createRazorpayOrderInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Cannot initialize payment: Invalid request." };
    }
    const validatedInput = parsed.data;

    // Authoritatively calculate order totals and verify items against database
    const pricing = await calculateServerCheckout(validatedInput.items, validatedInput.couponCode);

    const razorpay = getRazorpayClient();
    const amountInPaise = pricing.totalInPaise;
    const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: validatedInput.currency || "INR",
      receipt,
      notes: {
        ...(validatedInput.notes || {}),
        couponCode: pricing.couponCode || "",
        serverTotal: String(pricing.total),
      },
    });

    const publicRazorpayKeyId =
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || "";

    return {
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      keyId: publicRazorpayKeyId,
    };
  } catch (error: any) {
    console.error("[Razorpay] Failed to create order:", error);
    return {
      success: false,
      error: error?.message || "Failed to initialize payment gateway order.",
    };
  }
}

/**
 * 2. Verify Razorpay Payment Signature and Persist Prepaid Order atomically.
 */
export async function verifyAndCreatePrepaidOrderAction(input: CreatePrepaidOrderInput) {
  try {
    const parsed = createPrepaidOrderInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid prepaid order data." };
    }
    const validatedInput = parsed.data;

    // Step A: Cryptographically verify HMAC-SHA256 signature
    const isValidSignature = verifyRazorpaySignature(
      validatedInput.razorpay_order_id,
      validatedInput.razorpay_payment_id,
      validatedInput.razorpay_signature
    );

    if (!isValidSignature) {
      console.error("[Razorpay Security] Signature mismatch detected!", {
        order_id: validatedInput.razorpay_order_id,
        payment_id: validatedInput.razorpay_payment_id,
      });
      return {
        success: false,
        error: "Payment verification failed. Security signature mismatch.",
      };
    }

    // Step B: Calculate authoritative server pricing from PostgreSQL
    const pricing = await calculateServerCheckout(validatedInput.items, validatedInput.couponCode);

    // Step C: Verify with Razorpay API that the gateway order amount matches our server-calculated amount
    try {
      const razorpay = getRazorpayClient();
      const rzpOrder = await razorpay.orders.fetch(validatedInput.razorpay_order_id);
      if (rzpOrder && typeof rzpOrder.amount === "number") {
        if (rzpOrder.amount !== pricing.totalInPaise) {
          console.error("[Razorpay Security] Order amount mismatch!", {
            expectedPaise: pricing.totalInPaise,
            gatewayPaise: rzpOrder.amount,
            razorpayOrderId: validatedInput.razorpay_order_id,
          });
          return {
            success: false,
            error: `Payment verification failed: Gateway order amount (₹${rzpOrder.amount / 100}) does not match authoritative cart total (₹${pricing.total}).`,
          };
        }
      }
    } catch (fetchErr: any) {
      console.warn("[Razorpay] Remote order amount verification warning:", fetchErr?.message);
    }

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

    // Server-verified amounts in Rupees (₹)
    const subtotal = pricing.subtotal;
    const tax = pricing.tax;
    const shippingCost = pricing.shippingCost;
    const total = pricing.total;

    const paymentMethodLabel = "Prepaid (Online Payment - Razorpay)";
    const paymentReference = validatedInput.razorpay_payment_id;

    // Authoritatively resolve customer identity from server session.
    // Client-supplied input.userId or input.email is NEVER trusted for account binding.
    let validUserId: string | null = null;
    try {
      const sessionUser = await requireCustomer();
      validUserId = sessionUser.id;
    } catch {
      // Guest checkout - validUserId remains null
      validUserId = null;
    }

    // Calculate estimated delivery window (+2 days free time / range buffer)
    const deliveryRange = calculateDeliveryDateRange(null, validatedInput.zip);
    const initialCarrier =
      validatedInput.zip.startsWith("36") || validatedInput.zip.startsWith("38") || validatedInput.zip.startsWith("39")
        ? "Express Regional Logistics"
        : "Express Surface Freight";

    // Step D: Atomic PostgreSQL Transaction
    await transaction(async (client) => {
      // 1. Insert Core Order
      await client.query(
        `
        INSERT INTO "Order" (
          "id", "userId", "status", "subtotal", "tax", "shippingCost", "total",
          "shippingFullName", "shippingCompany", "shippingStreet", "shippingCity",
          "shippingState", "shippingZip", "shippingCountry", "shippingPhone",
          "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, 'PROCESSING', $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13, $14,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `,
        [
          orderId,
          validUserId,
          subtotal,
          tax,
          shippingCost,
          total,
          validatedInput.fullName,
          validatedInput.companyName || null,
          validatedInput.street,
          validatedInput.city,
          validatedInput.state,
          validatedInput.zip,
          validatedInput.country || "India",
          validatedInput.phone || null,
        ]
      );

      // 2. Insert Order Items (using authoritative database prices) & Deduct Inventory Stock
      for (const item of pricing.items) {
        await client.query(
          `
          INSERT INTO "OrderItem" ("id", "orderId", "productId", "variantId", "name", "sku", "price", "quantity", "buyerNote", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        `,
          [
            generateOrderItemId(),
            orderId,
            item.productId,
            item.variantId,
            item.name,
            item.sku,
            item.unitPrice, // Authoritative price in Rupees
            item.quantity,
            item.buyerNote || null,
          ]
        );

        // Deduct Inventory stock
        if (item.productId) {
          await client.query(
            `
            UPDATE "Inventory" 
            SET "quantity" = GREATEST(0, "quantity" - $1),
                "status" = CASE WHEN ("quantity" - $1) <= 0 THEN 'OUT_OF_STOCK'::"StockStatus" ELSE 'IN_STOCK'::"StockStatus" END,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "productId" = $2
          `,
            [item.quantity, item.productId]
          );
        }
      }

      // 3. Insert Payment Record
      await client.query(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "originalMethod" TEXT`);
      await client.query(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpayOrderId" TEXT`);
      await client.query(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpayPaymentId" TEXT`);
      await client.query(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "razorpaySignature" TEXT`);

      await client.query(
        `
        INSERT INTO "Payment" (
          "id", "orderId", "method", "originalMethod", "status", "amount", "reference",
          "razorpayOrderId", "razorpayPaymentId", "razorpaySignature", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, 'paid', $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
        [
          generatePaymentId(),
          orderId,
          paymentMethodLabel,
          paymentMethodLabel,
          total,
          paymentReference,
          validatedInput.razorpay_order_id,
          validatedInput.razorpay_payment_id,
          validatedInput.razorpay_signature,
        ]
      );

      // 4. Insert Initial Shipment Status Record
      await client.query(
        `
        INSERT INTO "Shipment" ("id", "orderId", "carrier", "trackingNumber", "status", "etd", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 'processing', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `,
        [generateId(), orderId, initialCarrier, `TRK-PENDING-${orderId}`, deliveryRange.fullLabel]
      );
    });

    // Step C: Auto-Save Address to User Profile
    try {
      const targetUserId =
        validUserId || (validatedInput.phone ? `user_${validatedInput.phone.replace(/[^\d]/g, "").slice(-10)}` : undefined);
      if (targetUserId && validatedInput.saveAddress !== false) {
        await saveAddressFromCheckoutAction({
          userId: targetUserId,
          email: validatedInput.email,
          fullName: validatedInput.fullName,
          companyName: validatedInput.companyName,
          phone: validatedInput.phone,
          street: validatedInput.street,
          city: validatedInput.city,
          state: validatedInput.state,
          zip: validatedInput.zip,
          country: validatedInput.country || "India",
          type: validatedInput.addressType || "Home",
          saveAsDefault: true,
        });
      }
    } catch (addrErr) {
      console.warn("[Address] Failed to auto-save address from checkout:", addrErr);
    }

    // Step D: Shiprocket Order Creation (in 'New' status)
    try {
      const settings = await getSystemSettings();
      if (settings.shiprocket_enabled && settings.shiprocket_email) {
        const orderDate = new Date().toISOString().slice(0, 19).replace("T", " ");

        const fullNameParts = (validatedInput.fullName || "Valued Customer").trim().split(" ");
        const firstName = fullNameParts[0] || "Valued";
        const lastName = fullNameParts.slice(1).join(" ") || "";
        const cleanPhone = (validatedInput.phone || "9876543210").replace(/[^\d]/g, "").slice(-10);

        const srPayload = {
          order_id: orderId,
          order_date: orderDate,
          pickup_location: settings.shiprocket_pickup_location || "Primary",
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: validatedInput.street || "Main Street",
          billing_city: validatedInput.city || "City",
          billing_pincode: String(validatedInput.zip || "360001"),
          billing_state: validatedInput.state || "Gujarat",
          billing_country: validatedInput.country || "India",
          billing_email: validatedInput.email || "customer@omautomation.com",
          billing_phone: cleanPhone.length === 10 ? cleanPhone : "9876543210",
          shipping_is_billing: true,
          order_items: pricing.items.map((it) => ({
            name: it.name,
            sku: it.sku || `SKU-${it.productId}`,
            units: Number(it.quantity || 1),
            selling_price: it.unitPrice,
            discount: 0,
            tax: 18,
          })),
          payment_method: "Prepaid" as const,
          sub_total: Math.round(Number(total || 0)),
          length: settings.shiprocket_default_length || 10,
          breadth: settings.shiprocket_default_breadth || 10,
          height: settings.shiprocket_default_height || 10,
          weight: settings.shiprocket_default_weight || 0.5,
        };

        const srRes = await createShiprocketAdhocOrder(srPayload);
        if (srRes && srRes.order_id) {
          const srOrderId = String(srRes.order_id);
          const srShipmentId = String(srRes.shipment_id);

          await query(
            `UPDATE "Shipment" 
             SET "shiprocketOrderId" = $1, 
                 "shiprocketShipmentId" = $2,
                 "updatedAt" = CURRENT_TIMESTAMP
             WHERE "orderId" = $3`,
            [srOrderId, srShipmentId, orderId]
          );
        }
      }
    } catch (srErr: any) {
      console.warn("[Shiprocket] Auto-create order in New tab skipped/failed:", srErr?.message);
    }

    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/checkout");
    revalidatePath("/profile");

    return {
      success: true,
      orderId,
      total,
      subtotal,
      discount: pricing.discount,
      tax,
      shippingCost,
      paymentMethodLabel,
      paymentReference,
      carrier: initialCarrier,
      deliveryRange,
    };
  } catch (error) {
    return safeActionResponse(error, "Failed to process and finalize prepaid order.", "RazorpayCheckout");
  }
}
