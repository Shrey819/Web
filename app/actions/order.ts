"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "@/lib/settings";
import { calculateServerCheckout } from "@/lib/pricing";
import { createShiprocketAdhocOrder, calculateDeliveryDateRange, DeliveryRangeResult } from "@/lib/shiprocket";
import { saveAddressFromCheckoutAction } from "@/app/actions/address";
import { requireAdmin, requireCustomer, getOptionalAuthenticatedUser } from "@/lib/auth-checks";
import {
  getOrdersForCustomer,
  getOrderForCustomer,
  getOrderForAdmin,
  getAllOrdersForAdmin,
  cancelOrderForCustomer,
  updateOrderStatusForAdmin,
  updateOrderPaymentMethodForAdmin,
  updateOrderItemNoteForAdmin,
} from "@/lib/dal/order";
import crypto from "crypto";
import {
  createOrderInputSchema,
  orderStatusUpdateSchema,
  orderItemNoteUpdateSchema,
  cancelOrderInputSchema,
} from "@/lib/validations/order";
import { idSchema } from "@/lib/validations/common";
import { z } from "zod";

const generateId = () => "ord_" + crypto.randomBytes(8).toString("hex");
const generateOrderItemId = () => "ori_" + crypto.randomBytes(8).toString("hex");
const generatePaymentId = () => "pay_" + crypto.randomBytes(8).toString("hex");

export interface CreateOrderItemInput {
  productId: string;
  name?: string;
  sku?: string;
  price?: number;
  quantity: number;
  variantId?: string;
  buyerNote?: string;
}

export interface CreateOrderInput {
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
  paymentMethod: "cod" | "prepaid" | "po" | "card";
  paymentReference?: string;
  poNumber?: string;
  cardNumber?: string;
  addressType?: string;
  saveAddress?: boolean;
  items: CreateOrderItemInput[];
  couponCode?: string;
}

/**
 * CREATE ORDER (Atomic PostgreSQL Transaction with COD & Prepaid support)
 */
export async function createOrderAction(input: CreateOrderInput) {
  try {
    const parsed = createOrderInputSchema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid order input." };
    }
    const validatedInput = parsed.data;

    const settings = await getSystemSettings();
    if (settings.maintenance_mode) {
      return { success: false, error: "Store is currently in maintenance mode. Orders cannot be placed." };
    }
    if (validatedInput.paymentMethod === "cod" && !settings.cod_enabled) {
      return { success: false, error: "Cash on Delivery is currently disabled." };
    }

    // Authoritatively calculate order totals and verify items against database (Task #2 preserved)
    const pricing = await calculateServerCheckout(validatedInput.items, validatedInput.couponCode);

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const dbOrderId = generateId();

    // Server-verified amounts in Rupees (₹)
    const subtotal = pricing.subtotal;
    const tax = pricing.tax;
    const shippingCost = pricing.shippingCost;
    const total = pricing.total;

    const paymentMethodLabel = 
      validatedInput.paymentMethod === "cod" ? "Cash on Delivery (COD)" :
      validatedInput.paymentMethod === "prepaid" ? "Prepaid (Online Payment)" :
      validatedInput.paymentMethod === "po" ? `Net-30 Purchase Order (${validatedInput.poNumber || 'N/A'})` :
      "Corporate Credit Card";

    const paymentReference = 
      validatedInput.paymentReference ? validatedInput.paymentReference :
      validatedInput.paymentMethod === "prepaid" ? `PREPAID-${orderId}` :
      validatedInput.paymentMethod === "po" ? (validatedInput.poNumber || `PO-${orderId}`) :
      validatedInput.paymentMethod === "cod" ? `COD-${orderId}` :
      `CARD-${validatedInput.cardNumber?.slice(-4) || '4242'}`;

    // Authoritatively resolve customer identity from server session.
    // Client-supplied input.userId or input.email is NEVER trusted for account binding.
    let validUserId: string | null = null;
    const authUser = await getOptionalAuthenticatedUser();
    if (authUser) {
      validUserId = authUser.id;
    }

    // Calculate estimated delivery window (+2 days free time / range buffer)
    const deliveryRange = calculateDeliveryDateRange(null, validatedInput.zip);
    const initialCarrier = validatedInput.zip.startsWith("36") || validatedInput.zip.startsWith("38") || validatedInput.zip.startsWith("39")
      ? "Express Regional Logistics"
      : "Express Surface Freight";

    await transaction(async (client) => {
      // 1. Insert Core Order
      await client.query(`
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
      `, [
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
        validatedInput.phone || null
      ]);

      // 2. Insert Order Items (using authoritative database prices) & Deduct Inventory Stock
      for (const item of pricing.items) {
        await client.query(`
          INSERT INTO "OrderItem" ("id", "orderId", "productId", "variantId", "name", "sku", "price", "quantity", "buyerNote", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP)
        `, [
          generateOrderItemId(),
          orderId,
          item.productId,
          item.variantId,
          item.name,
          item.sku,
          item.unitPrice, // Authoritative price in Rupees
          item.quantity,
          item.buyerNote || null,
        ]);

        // Deduct Inventory stock if product ID is present
        if (item.productId) {
          await client.query(`
            UPDATE "Inventory" 
            SET "quantity" = GREATEST(0, "quantity" - $1),
                "status" = CASE WHEN ("quantity" - $1) <= 0 THEN 'OUT_OF_STOCK'::"StockStatus" ELSE 'IN_STOCK'::"StockStatus" END,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "productId" = $2
          `, [item.quantity, item.productId]);
        }
      }

      // 3. Insert Payment Record
      await client.query(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "originalMethod" TEXT`);
      await client.query(`
        INSERT INTO "Payment" ("id", "orderId", "method", "originalMethod", "status", "amount", "reference", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        generatePaymentId(),
        orderId,
        paymentMethodLabel,
        paymentMethodLabel,
        validatedInput.paymentMethod === "cod" ? "pending_cod" : validatedInput.paymentMethod === "prepaid" ? "paid" : "authorized",
        total,
        paymentReference
      ]);

      // 4. Insert Initial Shipment Status Record
      await client.query(`
        INSERT INTO "Shipment" ("id", "orderId", "carrier", "trackingNumber", "status", "etd", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, 'processing', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [generateId(), orderId, initialCarrier, `TRK-PENDING-${orderId}`, deliveryRange.fullLabel]);
    });

    // 5. Automatically save address to User profile so they never need to retype
    try {
      const targetUserId = validUserId || (validatedInput.phone ? `user_${validatedInput.phone.replace(/[^\d]/g, "").slice(-10)}` : undefined);
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

    // 6. Automatic Shiprocket Order Push (Create in "New" Status only, DO NOT assign shipping agent/AWB)
    let assignedCarrier = initialCarrier;
    try {
      const settings = await getSystemSettings();
      if (settings.shiprocket_enabled && settings.shiprocket_email) {
        const orderDate = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

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
          payment_method: (validatedInput.paymentMethod === "cod" ? "COD" : "Prepaid") as "Prepaid" | "COD",
          sub_total: Math.round(Number(total || 0)),
          length: settings.shiprocket_default_length || 10,
          breadth: settings.shiprocket_default_breadth || 10,
          height: settings.shiprocket_default_height || 10,
          weight: settings.shiprocket_default_weight || 0.5,
        };

        // Creates order in Shiprocket under "NEW" tab.
        // Explicitly DOES NOT assign AWB, courier partner, or shipping agent.
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
      console.warn("[Shiprocket] Auto-create order in New tab skipped/failed:", srErr.message);
    }

    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

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
      carrier: assignedCarrier,
      deliveryRange,
    };
  } catch (error) {
    console.error("Failed to place order:", error);
    const message = error instanceof Error ? error.message : "Failed to place order";
    return { success: false, error: message };
  }
}

/**
 * FETCH USER ORDERS (Strictly isolated to authenticated session user)
 * Client-supplied userId and userEmail are safely ignored to prevent IDOR/BOLA.
 */
export async function getUserOrdersAction(userId?: string, userEmail?: string, placedOrderIds?: string[]) {
  try {
    let sessionUser;
    try {
      sessionUser = await requireCustomer();
    } catch {
      // Unauthenticated caller returns empty list
      return { success: true, orders: [] };
    }

    const orders = await getOrdersForCustomer(sessionUser.id);
    return { success: true, orders };
  } catch (error) {
    console.error("Failed to query user orders:", error);
    return { success: false, orders: [] };
  }
}

/**
 * FETCH SINGLE ORDER BY ID (Strict IDOR / Ownership Protection)
 * - ADMIN: Can view any order (includes admin fulfillment tokens/links)
 * - CUSTOMER: Can ONLY view order if o."userId" = customer.id (filtered DTO)
 * - Unauthenticated / Wrong owner: Returns null (Safe 404, zero existence leakage)
 */
export async function getOrderByIdAction(orderId: string) {
  try {
    if (!orderId || typeof orderId !== "string" || orderId.length > 64) {
      return null;
    }

    let callerUser;
    try {
      callerUser = await requireCustomer();
    } catch {
      return null;
    }

    if (callerUser.role === "ADMIN") {
      return await getOrderForAdmin(orderId);
    }

    // Customer path: enforce ownership & safe DTO
    return await getOrderForCustomer(orderId, callerUser.id);
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    return null;
  }
}

/**
 * FETCH SINGLE ORDER BY ID (ADMIN DASHBOARD ONLY)
 */
export async function getOrderByIdAdmin(orderId: string) {
  await requireAdmin();
  return await getOrderForAdmin(orderId);
}

/**
 * CANCEL MY ORDER (CUSTOMER - Only if owned by caller and in PROCESSING status)
 */
export async function cancelMyOrderAction(orderId: string) {
  try {
    const user = await requireCustomer();
    const parsed = cancelOrderInputSchema.safeParse({ orderId });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid order ID." };
    }

    const res = await cancelOrderForCustomer(parsed.data.orderId, user.id);
    if (!res.success) {
      return res;
    }

    revalidatePath("/orders");
    revalidatePath(`/orders/${parsed.data.orderId}`);
    revalidatePath("/admin/orders");

    return { success: true };
  } catch (error: any) {
    console.error("Failed to cancel order:", error);
    return { success: false, error: error?.message || "Failed to cancel order" };
  }
}

/**
 * FETCH ALL ORDERS FOR ADMIN DASHBOARD
 */
export async function getAllOrdersAdminAction() {
  await requireAdmin();
  try {
    const orders = await getAllOrdersForAdmin();
    return { success: true, orders };
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    return { success: false, orders: [], error: String(error) };
  }
}

/**
 * UPDATE ORDER STATUS (ADMIN)
 */
export async function updateOrderStatusAction(orderId: string, status: string, carrier?: string, trackingNumber?: string) {
  await requireAdmin();
  try {
    const parsed = orderStatusUpdateSchema.safeParse({ orderId, status });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid order status value." };
    }

    const cleanCarrier = carrier ? String(carrier).trim().slice(0, 100) : undefined;
    const cleanTracking = trackingNumber ? String(trackingNumber).trim().slice(0, 100) : undefined;

    await updateOrderStatusForAdmin(parsed.data.orderId, parsed.data.status, cleanCarrier, cleanTracking);

    revalidatePath("/orders");
    revalidatePath(`/orders/${parsed.data.orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    const message = error instanceof Error ? error.message : "Failed to update order status";
    return { success: false, error: message };
  }
}

/**
 * UPDATE ORDER PAYMENT METHOD (ADMIN - Toggle between COD and Prepaid)
 */
export async function updateOrderPaymentMethodAction(
  orderId: string,
  newMethod: "cod" | "prepaid"
): Promise<{ success: boolean; paymentMethod?: string; paymentStatus?: string; error?: string }> {
  await requireAdmin();
  try {
    const parsedId = idSchema.safeParse(orderId);
    if (!parsedId.success) {
      return { success: false, error: "Invalid order ID." };
    }
    if (newMethod !== "cod" && newMethod !== "prepaid") {
      return { success: false, error: "Invalid payment method. Only 'cod' or 'prepaid' allowed." };
    }

    const res = await updateOrderPaymentMethodForAdmin(parsedId.data, newMethod);

    revalidatePath("/orders");
    revalidatePath(`/orders/${parsedId.data}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return res;
  } catch (error) {
    console.error("Failed to update order payment method:", error);
    const message = error instanceof Error ? error.message : "Failed to update payment method";
    return { success: false, error: message };
  }
}

/**
 * UPDATE ORDER ITEM BUYER NOTE DIRECTLY (ADMIN)
 */
export async function updateOrderItemNoteAction(orderItemId: string, buyerNote: string) {
  await requireAdmin();
  try {
    const parsed = orderItemNoteUpdateSchema.safeParse({ orderItemId, note: buyerNote });
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid order item note." };
    }

    const res = await updateOrderItemNoteForAdmin(parsed.data.orderItemId, parsed.data.note);
    if (!res.success) {
      return res;
    }

    revalidatePath("/admin/orders");
    revalidatePath("/orders");

    return res;
  } catch (error) {
    console.error("Failed to update order item buyer note:", error);
    const message = error instanceof Error ? error.message : "Failed to update buyer note";
    return { success: false, error: message };
  }
}
