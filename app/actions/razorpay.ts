"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "@/lib/settings";
import { createShiprocketAdhocOrder, calculateDeliveryDateRange, DeliveryRangeResult } from "@/lib/shiprocket";
import { saveAddressFromCheckoutAction } from "@/app/actions/address";
import { getRazorpayClient, verifyRazorpaySignature } from "@/lib/razorpay";
import crypto from "crypto";

const generateId = () => "ord_" + crypto.randomBytes(8).toString("hex");
const generateOrderItemId = () => "ori_" + crypto.randomBytes(8).toString("hex");
const generatePaymentId = () => "pay_" + crypto.randomBytes(8).toString("hex");

export interface CreateRazorpayOrderInput {
  amount: number; // in Rupees
  currency?: string;
  notes?: Record<string, string>;
}

export interface CreatePrepaidOrderItemInput {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  variantId?: string;
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
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * 1. Create a Razorpay Order on Razorpay's servers.
 * Converts amount to paise and returns the Razorpay order ID to the client.
 */
export async function createRazorpayOrderAction(input: CreateRazorpayOrderInput) {
  try {
    if (!input.amount || input.amount <= 0) {
      return { success: false, error: "Invalid order amount." };
    }

    const razorpay = getRazorpayClient();
    const amountInPaise = Math.round(input.amount * 100);
    const receipt = `rcpt_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: input.currency || "INR",
      receipt,
      notes: input.notes || {},
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
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Cannot place order: Cart is empty." };
    }

    if (!input.razorpay_order_id || !input.razorpay_payment_id || !input.razorpay_signature) {
      return { success: false, error: "Missing Razorpay payment verification parameters." };
    }

    // Step A: Cryptographically verify HMAC-SHA256 signature
    const isValidSignature = verifyRazorpaySignature(
      input.razorpay_order_id,
      input.razorpay_payment_id,
      input.razorpay_signature
    );

    if (!isValidSignature) {
      console.error("[Razorpay Security] Signature mismatch detected!", {
        order_id: input.razorpay_order_id,
        payment_id: input.razorpay_payment_id,
      });
      return {
        success: false,
        error: "Payment verification failed. Security signature mismatch.",
      };
    }

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);

    // Compute Subtotal, Tax (18% GST), Shipping, Total in Rupees (₹)
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const shippingCost = 0; // Free Standard Shipping
    const total = subtotal;

    const paymentMethodLabel = "Prepaid (Online Payment - Razorpay)";
    const paymentReference = input.razorpay_payment_id;

    // Verify valid userId against PostgreSQL "User" table to satisfy foreign key constraint
    let validUserId: string | null = null;
    if (input.userId) {
      const userRes = await query(`SELECT id FROM "User" WHERE id = $1 LIMIT 1`, [input.userId]);
      if (userRes.rows.length > 0) {
        validUserId = input.userId;
      }
    }

    if (!validUserId && input.email) {
      const emailRes = await query(`SELECT id FROM "User" WHERE email = $1 LIMIT 1`, [
        input.email.trim().toLowerCase(),
      ]);
      if (emailRes.rows.length > 0) {
        validUserId = emailRes.rows[0].id;
      }
    }

    // Calculate estimated delivery window (+2 days free time / range buffer)
    const deliveryRange = calculateDeliveryDateRange(null, input.zip);
    const initialCarrier =
      input.zip.startsWith("36") || input.zip.startsWith("38") || input.zip.startsWith("39")
        ? "Express Regional Logistics"
        : "Express Surface Freight";

    // Step B: Atomic PostgreSQL Transaction
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
          input.fullName,
          input.companyName || null,
          input.street,
          input.city,
          input.state,
          input.zip,
          input.country || "India",
          input.phone || null,
        ]
      );

      // 2. Insert Order Items & Deduct Inventory Stock
      for (const item of input.items) {
        let validProductId: string | null = null;
        if (
          item.productId &&
          typeof item.productId === "string" &&
          item.productId !== "undefined" &&
          item.productId !== "null"
        ) {
          const prodCheck = await client.query(`SELECT id FROM "Product" WHERE id = $1 LIMIT 1`, [
            item.productId,
          ]);
          if (prodCheck.rows.length > 0) {
            validProductId = item.productId;
          }
        }

        let validVariantId: string | null = null;
        if (
          item.variantId &&
          typeof item.variantId === "string" &&
          item.variantId !== "undefined" &&
          item.variantId !== "null"
        ) {
          const varCheck = await client.query(
            `SELECT id FROM "ProductVariant" WHERE id = $1 LIMIT 1`,
            [item.variantId]
          );
          if (varCheck.rows.length > 0) {
            validVariantId = item.variantId;
          }
        }

        const cleanName = (item.name || "Industrial Component")
          .replace(/\s*-\s*undefined/gi, "")
          .replace(/\s*\(undefined\)/gi, "")
          .trim();

        await client.query(
          `
          INSERT INTO "OrderItem" ("id", "orderId", "productId", "variantId", "name", "sku", "price", "quantity", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `,
          [
            generateOrderItemId(),
            orderId,
            validProductId,
            validVariantId,
            cleanName,
            item.sku || `SKU-${validProductId || "ITEM"}`,
            item.price,
            item.quantity,
          ]
        );

        // Deduct Inventory stock
        if (validProductId) {
          await client.query(
            `
            UPDATE "Inventory" 
            SET "quantity" = GREATEST(0, "quantity" - $1),
                "status" = CASE WHEN ("quantity" - $1) <= 0 THEN 'OUT_OF_STOCK'::"StockStatus" ELSE 'IN_STOCK'::"StockStatus" END,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "productId" = $2
          `,
            [item.quantity, validProductId]
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
          input.razorpay_order_id,
          input.razorpay_payment_id,
          input.razorpay_signature,
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
        validUserId || (input.phone ? `user_${input.phone.replace(/[^\d]/g, "").slice(-10)}` : undefined);
      if (targetUserId && input.saveAddress !== false) {
        await saveAddressFromCheckoutAction({
          userId: targetUserId,
          email: input.email,
          fullName: input.fullName,
          companyName: input.companyName,
          phone: input.phone,
          street: input.street,
          city: input.city,
          state: input.state,
          zip: input.zip,
          country: input.country || "India",
          type: input.addressType || "Home",
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

        const fullNameParts = (input.fullName || "Valued Customer").trim().split(" ");
        const firstName = fullNameParts[0] || "Valued";
        const lastName = fullNameParts.slice(1).join(" ") || "";
        const cleanPhone = (input.phone || "9876543210").replace(/[^\d]/g, "").slice(-10);

        const srPayload = {
          order_id: orderId,
          order_date: orderDate,
          pickup_location: settings.shiprocket_pickup_location || "Primary",
          billing_customer_name: firstName,
          billing_last_name: lastName,
          billing_address: input.street || "Main Street",
          billing_city: input.city || "City",
          billing_pincode: String(input.zip || "360001"),
          billing_state: input.state || "Gujarat",
          billing_country: input.country || "India",
          billing_email: input.email || "customer@omautomation.com",
          billing_phone: cleanPhone.length === 10 ? cleanPhone : "9876543210",
          shipping_is_billing: true,
          order_items: input.items.map((it) => ({
            name: it.name,
            sku: it.sku || `SKU-${it.productId}`,
            units: Number(it.quantity || 1),
            selling_price: Math.round(Number(it.price || 0)),
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
      tax,
      shippingCost,
      paymentMethodLabel,
      paymentReference,
      carrier: initialCarrier,
      deliveryRange,
    };
  } catch (error: any) {
    console.error("[Razorpay] verifyAndCreatePrepaidOrderAction failed:", error);
    return {
      success: false,
      error: error?.message || "Failed to process and finalize prepaid order.",
    };
  }
}
