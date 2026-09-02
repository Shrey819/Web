"use server";

import { transaction, query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "@/lib/settings";
import { createShiprocketAdhocOrder, calculateDeliveryDateRange, DeliveryRangeResult } from "@/lib/shiprocket";
import { saveAddressFromCheckoutAction } from "@/app/actions/address";
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
  paymentMethod: "cod" | "prepaid" | "po" | "card";
  paymentReference?: string;
  poNumber?: string;
  cardNumber?: string;
  addressType?: string;
  saveAddress?: boolean;
  items: CreateOrderItemInput[];
}

/**
 * CREATE ORDER (Atomic PostgreSQL Transaction with COD & Prepaid support)
 */
export async function createOrderAction(input: CreateOrderInput) {
  try {
    if (!input.items || input.items.length === 0) {
      return { success: false, error: "Cannot place order: Cart is empty." };
    }

    const orderId = "ORD-" + Math.floor(100000 + Math.random() * 900000);
    const dbOrderId = generateId();

    // Compute Subtotal, Tax (18% GST), Shipping, Total in Rupees (₹)
    const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const shippingCost = 0; // Free Standard Shipping
    const total = subtotal; // Total matches Cart & Checkout exactly (Inclusive of taxes/free shipping)

    const paymentMethodLabel = 
      input.paymentMethod === "cod" ? "Cash on Delivery (COD)" :
      input.paymentMethod === "prepaid" ? "Prepaid (Online Payment)" :
      input.paymentMethod === "po" ? `Net-30 Purchase Order (${input.poNumber || 'N/A'})` :
      "Corporate Credit Card";

    const paymentReference = 
      input.paymentReference ? input.paymentReference :
      input.paymentMethod === "prepaid" ? `PREPAID-${orderId}` :
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

    // Calculate estimated delivery window (+2 days free time / range buffer)
    const deliveryRange = calculateDeliveryDateRange(null, input.zip);
    const initialCarrier = input.zip.startsWith("36") || input.zip.startsWith("38") || input.zip.startsWith("39")
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
        input.fullName,
        input.companyName || null,
        input.street,
        input.city,
        input.state,
        input.zip,
        input.country || "India",
        input.phone || null
      ]);

      // 2. Insert Order Items & Deduct Inventory Stock
      for (const item of input.items) {
        // Validate productId against PostgreSQL "Product" table to avoid foreign key errors
        let validProductId: string | null = null;
        if (item.productId && typeof item.productId === "string" && item.productId !== "undefined" && item.productId !== "null") {
          const prodCheck = await client.query(`SELECT id FROM "Product" WHERE id = $1 LIMIT 1`, [item.productId]);
          if (prodCheck.rows.length > 0) {
            validProductId = item.productId;
          }
        }

        // Validate variantId against PostgreSQL "ProductVariant" table to avoid foreign key errors
        let validVariantId: string | null = null;
        if (item.variantId && typeof item.variantId === "string" && item.variantId !== "undefined" && item.variantId !== "null") {
          const varCheck = await client.query(`SELECT id FROM "ProductVariant" WHERE id = $1 LIMIT 1`, [item.variantId]);
          if (varCheck.rows.length > 0) {
            validVariantId = item.variantId;
          }
        }

        // Sanitize clean item name (strip any accidental " - undefined" or "(undefined)")
        const cleanName = (item.name || "Industrial Component")
          .replace(/\s*-\s*undefined/gi, "")
          .replace(/\s*\(undefined\)/gi, "")
          .trim();

        await client.query(`
          INSERT INTO "OrderItem" ("id", "orderId", "productId", "variantId", "name", "sku", "price", "quantity", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP)
        `, [
          generateOrderItemId(),
          orderId,
          validProductId,
          validVariantId,
          cleanName,
          item.sku || `SKU-${validProductId || 'ITEM'}`,
          item.price,
          item.quantity
        ]);

        // Deduct Inventory stock if product ID is valid
        if (validProductId) {
          await client.query(`
            UPDATE "Inventory" 
            SET "quantity" = GREATEST(0, "quantity" - $1),
                "status" = CASE WHEN ("quantity" - $1) <= 0 THEN 'OUT_OF_STOCK'::"StockStatus" ELSE 'IN_STOCK'::"StockStatus" END,
                "updatedAt" = CURRENT_TIMESTAMP
            WHERE "productId" = $2
          `, [item.quantity, validProductId]);
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
        input.paymentMethod === "cod" ? "pending_cod" : input.paymentMethod === "prepaid" ? "paid" : "authorized",
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
      const targetUserId = validUserId || (input.phone ? `user_${input.phone.replace(/[^\d]/g, "").slice(-10)}` : undefined);
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

    // 6. Automatic Shiprocket Order Push (Create in "New" Status only, DO NOT assign shipping agent/AWB)
    let assignedCarrier = initialCarrier;
    try {
      const settings = await getSystemSettings();
      if (settings.shiprocket_enabled && settings.shiprocket_email) {
        const orderDate = new Date()
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");

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
          payment_method: (input.paymentMethod === "cod" ? "COD" : "Prepaid") as "Prepaid" | "COD",
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
        s."courierName",
        s."trackingNumber",
        s."etd",
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
        carrier: r.courierName || r.carrier || "Express Regional Logistics",
        trackingNumber: r.trackingNumber || `TRK-${r.id}`,
        etd: r.etd || null,
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
        s."status" as "shipmentStatus",
        s."shiprocketOrderId",
        s."shiprocketShipmentId",
        s."awbCode",
        s."courierName",
        s."labelUrl",
        s."invoiceUrl",
        s."manifestUrl",
        s."pickupTokenNumber",
        s."pickupScheduledDate",
        s."etd",
        s."currentStatus" as "shipmentCurrentStatus",
        s."trackingData"
      FROM "Order" o
      LEFT JOIN "Payment" p ON o."id" = p."orderId"
      LEFT JOIN "Shipment" s ON o."id" = s."orderId"
      WHERE o."id" = $1
      LIMIT 1
    `, [orderId]);

    if (orderRes.rows.length === 0) return null;

    const order = orderRes.rows[0];

    const itemsRes = await query(`
      SELECT 
        oi.*,
        (
          SELECT COALESCE(
            json_agg(json_build_object('name', va."name", 'value', va."value")),
            '[]'::json
          )
          FROM "VariantAttribute" va
          WHERE va."variantId" = oi."variantId"
        ) as "attributes"
      FROM "OrderItem" oi 
      WHERE oi."orderId" = $1 
      ORDER BY oi."createdAt" ASC
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
      shippingPhone: order.shippingPhone || "+91 9876543210",
      paymentMethod: order.paymentMethod || "Cash on Delivery",
      paymentReference: order.paymentReference || "N/A",
      paymentStatus: order.paymentStatus || "pending",
      carrier: order.courierName || order.carrier || "Express Freight",
      trackingNumber: order.awbCode || order.trackingNumber || `TRK-${order.id}`,
      shiprocketOrderId: order.shiprocketOrderId,
      shiprocketShipmentId: order.shiprocketShipmentId,
      awbCode: order.awbCode,
      courierName: order.courierName,
      labelUrl: order.labelUrl,
      invoiceUrl: order.invoiceUrl,
      manifestUrl: order.manifestUrl,
      pickupTokenNumber: order.pickupTokenNumber,
      pickupScheduledDate: order.pickupScheduledDate ? new Date(order.pickupScheduledDate).toISOString() : null,
      etd: order.etd,
      shipmentCurrentStatus: order.shipmentCurrentStatus,
      trackingData: order.trackingData,
      createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
      items: itemsRes.rows.map((r: any) => ({
        id: r.id,
        productId: r.productId,
        variantId: r.variantId,
        name: r.name,
        sku: r.sku,
        price: Number(r.price),
        quantity: r.quantity,
        attributes: r.attributes || [],
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
    await query(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "originalMethod" TEXT`);
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
        o."shippingPhone",
        o."createdAt",
        p."method" as "paymentMethod",
        COALESCE(p."originalMethod", p."method", CASE WHEN p."reference" LIKE 'COD-%' THEN 'Cash on Delivery (COD)' ELSE 'Prepaid (Online Payment)' END) as "originalPaymentMethod",
        p."reference" as "paymentReference",
        p."status" as "paymentStatus",
        s."carrier",
        s."trackingNumber",
        s."shiprocketOrderId",
        s."shiprocketShipmentId",
        s."awbCode",
        s."courierName",
        s."labelUrl",
        s."invoiceUrl",
        s."manifestUrl",
        s."pickupTokenNumber",
        s."pickupScheduledDate",
        s."etd",
        s."currentStatus" as "shipmentCurrentStatus",
        s."trackingData",
        COUNT(oi."id")::int as "itemCount",
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi."id",
              'name', oi."name",
              'sku', oi."sku",
              'price', oi."price",
              'quantity', oi."quantity",
              'variantId', oi."variantId",
              'attributes', (
                SELECT COALESCE(
                  json_agg(json_build_object('name', va."name", 'value', va."value")),
                  '[]'::json
                )
                FROM "VariantAttribute" va
                WHERE va."variantId" = oi."variantId"
              )
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
        shippingPhone: r.shippingPhone || "+91 9876543210",
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
        paymentMethod: r.paymentMethod || "Prepaid (Online Payment)",
        originalPaymentMethod: r.originalPaymentMethod || r.paymentMethod || "Prepaid (Online Payment)",
        paymentReference: r.paymentReference || "N/A",
        paymentStatus: r.paymentStatus || "pending",
        carrier: r.courierName || r.carrier || "Express Freight",
        trackingNumber: r.awbCode || r.trackingNumber || `TRK-${r.id}`,
        shiprocketOrderId: r.shiprocketOrderId,
        shiprocketShipmentId: r.shiprocketShipmentId,
        awbCode: r.awbCode,
        courierName: r.courierName,
        labelUrl: r.labelUrl,
        invoiceUrl: r.invoiceUrl,
        manifestUrl: r.manifestUrl,
        pickupTokenNumber: r.pickupTokenNumber,
        pickupScheduledDate: r.pickupScheduledDate ? new Date(r.pickupScheduledDate).toISOString() : null,
        etd: r.etd,
        shipmentCurrentStatus: r.shipmentCurrentStatus,
        trackingData: r.trackingData,
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

/**
 * UPDATE ORDER PAYMENT METHOD (ADMIN - Toggle between COD and Prepaid)
 */
export async function updateOrderPaymentMethodAction(orderId: string, newMethod: "cod" | "prepaid") {
  try {
    const isCod = newMethod === "cod";
    const paymentMethodLabel = isCod ? "Cash on Delivery (COD)" : "Prepaid (Online Payment)";
    const paymentStatus = isCod ? "pending_cod" : "paid";
    const paymentReference = isCod ? `COD-${orderId}` : `PREPAID-${orderId}`;

    await query(`
      UPDATE "Payment"
      SET "method" = $1,
          "status" = $2,
          "reference" = CASE 
            WHEN "reference" IS NULL OR "reference" LIKE 'COD-%' OR "reference" LIKE 'PREPAID-%' OR "reference" LIKE 'CARD-%' OR "reference" LIKE 'PO-%' 
            THEN $3 
            ELSE "reference" 
          END,
          "updatedAt" = CURRENT_TIMESTAMP
      WHERE "orderId" = $4
    `, [paymentMethodLabel, paymentStatus, paymentReference, orderId]);

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return { 
      success: true, 
      paymentMethod: paymentMethodLabel,
      paymentStatus: paymentStatus 
    };
  } catch (error) {
    console.error("Failed to update order payment method:", error);
    const message = error instanceof Error ? error.message : "Failed to update payment method";
    return { success: false, error: message };
  }
}
