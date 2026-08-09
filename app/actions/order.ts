"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const generateId = () => "ord_" + crypto.randomBytes(8).toString("hex");
const generateOrderItemId = () => "ori_" + crypto.randomBytes(8).toString("hex");
const generatePaymentId = () => "pay_" + crypto.randomBytes(8).toString("hex");

export interface CreateOrderItemInput {
  productId: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  variantId?: string;
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
  paymentMethod: "cod" | "po" | "card";
  poNumber?: string;
  cardNumber?: string;
  items: CreateOrderItemInput[];
}

/**
 * CREATE ORDER (Atomic PostgreSQL Transaction with COD & Net-30 PO support)
 */
export async function createOrderAction(input: CreateOrderInput) {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Cannot place order: Cart is empty." };
    }

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const dbOrderId = generateId();

    // Compute Subtotal, Tax (18% GST), Shipping, Total in paise / currency units
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const shippingCost = subtotal > 500000 ? 0 : 5000; // Free shipping over ₹5,000
    const total = subtotal + tax + shippingCost;

    const paymentMethodLabel = 
      input.paymentMethod === "cod" ? "Cash on Delivery (COD)" :
      input.paymentMethod === "po" ? `Net-30 Purchase Order (${input.poNumber || 'N/A'})` :
      "Corporate Credit Card";

    const paymentReference = 
      input.paymentMethod === "po" ? (input.poNumber || `PO-${orderId}`) :
      input.paymentMethod === "cod" ? `COD-${orderId}` :
      `CARD-${input.cardNumber?.slice(-4) || '4242'}`;

    // Verify valid userId against PostgreSQL "User" table to satisfy foreign key constraint
    let validUserId: string | null = null;
    if (input.userId) {
      const userRes = await query(`SELECT id FROM "User" WHERE id = $1 LIMIT 1`, [input.userId]);
      if (userRes.rows.length > 0) {
        validUserId = input.userId;
      }
    }

    if (!validUserId && input.email) {
      const emailRes = await query(`SELECT id FROM "User" WHERE email = $1 LIMIT 1`, [input.email.trim().toLowerCase()]);
      if (emailRes.rows.length > 0) {
        validUserId = emailRes.rows[0].id;
      }
    }

    await transaction(async (client) => {
      // 1. Insert Core Order
      await client.query(`
        INSERT INTO "Order" (
          "id", "userId", "status", "subtotal", "tax", "shippingCost", "total",
          "shippingFullName", "shippingCompany", "shippingStreet", "shippingCity",
          "shippingState", "shippingZip", "shippingCountry",
          "createdAt", "updatedAt"
        )
        VALUES (
          $1, $2, 'PROCESSING', $3, $4, $5, $6,
          $7, $8, $9, $10,
          $11, $12, $13,
          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `, [
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
        input.country || "India"
      ]);

      // 2. Insert Order Items & Deduct Inventory Stock
      for (const item of input.items) {
        await client.query(`
          INSERT INTO "OrderItem" ("id", "orderId", "productId", "variantId", "name", "sku", "price", "quantity", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `, [
          generateOrderItemId(),
          orderId,
          item.productId || null,
          item.variantId || null,
          item.name,
          item.sku || `SKU-${item.productId}`,
          item.price,
          item.quantity
        ]);

        // Deduct Inventory stock if product ID is valid
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
      await client.query(`
        INSERT INTO "Payment" ("id", "orderId", "method", "status", "amount", "reference", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [
        generatePaymentId(),
        orderId,
        paymentMethodLabel,
        input.paymentMethod === "cod" ? "pending_cod" : "authorized",
        total,
        paymentReference
      ]);

      // 4. Insert Initial Shipment Status Record
      await client.query(`
        INSERT INTO "Shipment" ("id", "orderId", "carrier", "trackingNumber", "status", "createdAt", "updatedAt")
        VALUES ($1, $2, 'Express Freight Dispatch', $3, 'processing', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [generateId(), orderId, `TRK-PENDING-${orderId}`]);
    });

    revalidatePath("/orders");
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return {
      success: true,
      orderId,
      total,
      subtotal,
      tax,
      shippingCost,
      paymentMethodLabel,
      paymentReference
    };
  } catch (error) {
    console.error("Failed to place order:", error);
    const message = error instanceof Error ? error.message : "Failed to place order";
    return { success: false, error: message };
  }
}

/**
 * FETCH USER ORDERS (Strictly isolated to logged-in user or session placed orders)
 */
export async function getUserOrdersAction(userId?: string, userEmail?: string, placedOrderIds?: string[]) {
  try {
    const hasUserId = Boolean(userId && userId.trim() !== "");
    const hasEmail = Boolean(userEmail && userEmail.trim() !== "");
    const hasOrderIds = Boolean(placedOrderIds && placedOrderIds.length > 0);

    // If no user identity and no placed order IDs in session, return empty orders (never show all DB orders to regular users!)
    if (!hasUserId && !hasEmail && !hasOrderIds) {
      return { success: true, orders: [] };
    }

    let sql = `
      SELECT 
        o."id",
        o."status"::text as status,
        o."subtotal",
        o."tax",
        o."shippingCost",
        o."total",
        o."shippingFullName",
        o."shippingCompany",
        o."createdAt",
        p."method" as "paymentMethod",
        p."reference" as "paymentReference",
        s."carrier",
        s."trackingNumber",
        COUNT(oi."id")::int as "itemCount"
      FROM "Order" o
      LEFT JOIN "Payment" p ON o."id" = p."orderId"
      LEFT JOIN "Shipment" s ON o."id" = s."orderId"
      LEFT JOIN "OrderItem" oi ON o."id" = oi."orderId"
    `;

    const whereClauses: string[] = [];
    const params: any[] = [];

    if (hasUserId) {
      params.push(userId);
      whereClauses.push(`o."userId" = $${params.length}`);
    }

    if (hasEmail) {
      params.push(userEmail);
      whereClauses.push(`o."shippingCompany" ILIKE $${params.length}`);
    }

    if (hasOrderIds) {
      params.push(placedOrderIds);
      whereClauses.push(`o."id" = ANY($${params.length})`);
    }

    if (whereClauses.length > 0) {
      sql += ` WHERE (${whereClauses.join(" OR ")})`;
    }

    sql += ` GROUP BY o."id", p."id", s."id" ORDER BY o."createdAt" DESC`;

    const res = await query(sql, params);
    return {
      success: true,
      orders: res.rows.map((r: any) => ({
        id: r.id,
        date: new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
        status: r.status,
        subtotal: Number(r.subtotal || 0),
        tax: Number(r.tax || 0),
        shippingCost: Number(r.shippingCost || 0),
        total: Number(r.total || 0),
        itemCount: Number(r.itemCount || 0),
        paymentMethod: r.paymentMethod || "Cash on Delivery",
        paymentReference: r.paymentReference || "N/A",
        carrier: r.carrier || "Standard Freight",
        trackingNumber: r.trackingNumber || `TRK-${r.id}`,
      })),
    };
  } catch (error) {
    console.error("Failed to query user orders:", error);
    return { success: false, orders: [] };
  }
}

/**
 * FETCH SINGLE ORDER BY ID
 */
export async function getOrderByIdAction(orderId: string) {
  try {
    const orderRes = await query(`
      SELECT 
        o.*,
        p."method" as "paymentMethod",
        p."reference" as "paymentReference",
        p."status" as "paymentStatus",
        s."carrier",
        s."trackingNumber",
        s."status" as "shipmentStatus"
      FROM "Order" o
      LEFT JOIN "Payment" p ON o."id" = p."orderId"
      LEFT JOIN "Shipment" s ON o."id" = s."orderId"
      WHERE o."id" = $1
      LIMIT 1
    `, [orderId]);

    if (orderRes.rows.length === 0) return null;

    const order = orderRes.rows[0];

    const itemsRes = await query(`
      SELECT * FROM "OrderItem" WHERE "orderId" = $1 ORDER BY "createdAt" ASC
    `, [orderId]);

    return {
      id: order.id,
      status: order.status,
      subtotal: Number(order.subtotal),
      tax: Number(order.tax),
      shippingCost: Number(order.shippingCost),
      total: Number(order.total),
      shippingFullName: order.shippingFullName,
      shippingCompany: order.shippingCompany,
      shippingStreet: order.shippingStreet,
      shippingCity: order.shippingCity,
      shippingState: order.shippingState,
      shippingZip: order.shippingZip,
      shippingCountry: order.shippingCountry,
      paymentMethod: order.paymentMethod || "Cash on Delivery",
      paymentReference: order.paymentReference || "N/A",
      paymentStatus: order.paymentStatus || "pending",
      carrier: order.carrier || "Express Freight",
      trackingNumber: order.trackingNumber || `TRK-${order.id}`,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      items: itemsRes.rows.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.name,
        sku: item.sku,
        price: Number(item.price),
        quantity: item.quantity,
      })),
    };
  } catch (error) {
    console.error("Failed to fetch order details:", error);
    return null;
  }
}

/**
 * FETCH ALL ORDERS FOR ADMIN DASHBOARD
 */
export async function getAllOrdersAdminAction() {
  try {
    const res = await query(`
      SELECT 
        o."id",
        o."status"::text as status,
        o."subtotal",
        o."tax",
        o."shippingCost",
        o."total",
        o."shippingFullName",
        o."shippingCompany",
        o."shippingStreet",
        o."shippingCity",
        o."shippingState",
        o."shippingZip",
        o."shippingCountry",
        o."createdAt",
        p."method" as "paymentMethod",
        p."reference" as "paymentReference",
        p."status" as "paymentStatus",
        s."carrier",
        s."trackingNumber",
        COUNT(oi."id")::int as "itemCount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi."id",
              'name', oi."name",
              'sku', oi."sku",
              'price', oi."price",
              'quantity', oi."quantity"
            )
          ) FILTER (WHERE oi."id" IS NOT NULL),
          '[]'::json
        ) as "items"
      FROM "Order" o
      LEFT JOIN "Payment" p ON o."id" = p."orderId"
      LEFT JOIN "Shipment" s ON o."id" = s."orderId"
      LEFT JOIN "OrderItem" oi ON o."id" = oi."orderId"
      GROUP BY o."id", p."id", s."id"
      ORDER BY o."createdAt" DESC
    `);

    return {
      success: true,
      orders: res.rows.map((r: any) => ({
        id: r.id,
        status: r.status,
        subtotal: Number(r.subtotal || 0),
        tax: Number(r.tax || 0),
        shippingCost: Number(r.shippingCost || 0),
        total: Number(r.total || 0),
        shippingFullName: r.shippingFullName,
        shippingCompany: r.shippingCompany,
        shippingStreet: r.shippingStreet,
        shippingCity: r.shippingCity,
        shippingState: r.shippingState,
        shippingZip: r.shippingZip,
        shippingCountry: r.shippingCountry,
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        paymentMethod: r.paymentMethod || "Cash on Delivery",
        paymentReference: r.paymentReference || "N/A",
        paymentStatus: r.paymentStatus || "pending",
        carrier: r.carrier || "Express Freight",
        trackingNumber: r.trackingNumber || `TRK-${r.id}`,
        itemCount: Number(r.itemCount || 0),
        items: Array.isArray(r.items) ? r.items.map((i: any) => ({
          ...i,
          price: Number(i.price || 0),
          quantity: Number(i.quantity || 1)
        })) : [],
      })),
    };
  } catch (error) {
    console.error("Failed to fetch admin orders:", error);
    return { success: false, orders: [], error: String(error) };
  }
}

/**
 * UPDATE ORDER STATUS (ADMIN)
 */
export async function updateOrderStatusAction(orderId: string, status: string, carrier?: string, trackingNumber?: string) {
  try {
    await transaction(async (client) => {
      // 1. Update Order Status
      await client.query(`
        UPDATE "Order" 
        SET "status" = $1::"OrderStatus", "updatedAt" = CURRENT_TIMESTAMP
        WHERE "id" = $2
      `, [status, orderId]);

      // 2. Update Payment status if delivered
      if (status === "DELIVERED") {
        await client.query(`
          UPDATE "Payment" SET "status" = 'paid', "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $1
        `, [orderId]);
      }

      // 3. Update Shipment info
      if (carrier || trackingNumber) {
        await client.query(`
          UPDATE "Shipment" 
          SET "carrier" = COALESCE($1, "carrier"),
              "trackingNumber" = COALESCE($2, "trackingNumber"),
              "status" = CASE WHEN $3 = 'DELIVERED' THEN 'delivered' ELSE 'in_transit' END,
              "shippedAt" = CASE WHEN "shippedAt" IS NULL THEN CURRENT_TIMESTAMP ELSE "shippedAt" END,
              "updatedAt" = CURRENT_TIMESTAMP
          WHERE "orderId" = $4
        `, [carrier || null, trackingNumber || null, status, orderId]);
      }
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update order status:", error);
    const message = error instanceof Error ? error.message : "Failed to update order status";
    return { success: false, error: message };
  }
}
