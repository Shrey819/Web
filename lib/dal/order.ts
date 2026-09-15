import "server-only";
import { query, transaction } from "@/lib/db";
import {
  CustomerOrderSummaryDTO,
  CustomerOrderDetailDTO,
  AdminOrderDetailDTO,
  AdminOrderSummaryDTO,
  OrderItemDTO,
} from "@/lib/dal/types";

const ORDER_COLUMNS = `
  o."id", o."userId", o."status"::text as "status", o."subtotal", o."tax",
  o."shippingCost", o."total", o."shippingFullName", o."shippingCompany",
  o."shippingStreet", o."shippingCity", o."shippingState", o."shippingZip",
  o."shippingCountry", o."shippingPhone", o."createdAt", o."updatedAt"
`;

const PAYMENT_COLUMNS = `
  p."method" as "paymentMethod",
  p."reference" as "paymentReference",
  p."status" as "paymentStatus",
  COALESCE(p."originalMethod", p."method", CASE WHEN p."reference" LIKE 'COD-%' THEN 'Cash on Delivery (COD)' ELSE 'Prepaid (Online Payment)' END) as "originalPaymentMethod"
`;

const SHIPMENT_COLUMNS = `
  s."carrier", s."trackingNumber", s."status" as "shipmentStatus",
  s."shiprocketOrderId", s."shiprocketShipmentId", s."awbCode",
  s."courierName", s."labelUrl", s."invoiceUrl", s."manifestUrl",
  s."pickupTokenNumber", s."pickupScheduledDate", s."etd",
  s."currentStatus" as "shipmentCurrentStatus", s."trackingData"
`;

const ORDER_ITEM_COLUMNS = `
  oi."id", oi."orderId", oi."productId", oi."variantId", oi."name",
  oi."sku", oi."price", oi."quantity", oi."buyerNote", oi."createdAt"
`;

/**
 * Internal helper to query items for an order with explicit columns
 */
async function fetchOrderItems(orderId: string): Promise<OrderItemDTO[]> {
  const itemsRes = await query(
    `SELECT 
      ${ORDER_ITEM_COLUMNS},
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
    ORDER BY oi."createdAt" ASC`,
    [orderId]
  );

  return itemsRes.rows.map((r: any) => ({
    id: r.id,
    productId: r.productId,
    variantId: r.variantId,
    name: r.name,
    sku: r.sku,
    price: Number(r.price),
    quantity: Number(r.quantity),
    attributes: r.attributes || [],
    buyerNote: r.buyerNote || null,
  }));
}

/**
 * Fetch orders summary list for authenticated customer (scoped strictly by userId)
 */
export async function getOrdersForCustomer(userId: string): Promise<CustomerOrderSummaryDTO[]> {
  if (!userId) return [];

  const res = await query(
    `SELECT 
      o."id",
      o."status"::text as status,
      o."subtotal",
      o."tax",
      o."shippingCost",
      o."total",
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
    WHERE o."userId" = $1
    GROUP BY o."id", p."id", s."id"
    ORDER BY o."createdAt" DESC`,
    [userId]
  );

  return res.rows.map((r: any) => ({
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
  }));
}

/**
 * Fetch full order detail for customer (scoped strictly to WHERE id = $1 AND userId = $2).
 * Excludes internal fulfillment tokens, label URLs, and manifest links.
 */
export async function getOrderForCustomer(
  orderId: string,
  userId: string
): Promise<CustomerOrderDetailDTO | null> {
  if (!orderId || !userId) return null;

  const orderRes = await query(
    `SELECT 
      ${ORDER_COLUMNS},
      ${PAYMENT_COLUMNS},
      ${SHIPMENT_COLUMNS}
    FROM "Order" o
    LEFT JOIN "Payment" p ON o."id" = p."orderId"
    LEFT JOIN "Shipment" s ON o."id" = s."orderId"
    WHERE o."id" = $1 AND o."userId" = $2
    LIMIT 1`,
    [orderId, userId]
  );

  if (orderRes.rows.length === 0) return null;
  const order = orderRes.rows[0];
  const items = await fetchOrderItems(orderId);

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
    awbCode: order.awbCode || null,
    invoiceUrl: order.invoiceUrl || null,
    etd: order.etd || null,
    shipmentCurrentStatus: order.shipmentCurrentStatus || null,
    trackingData: order.trackingData || null,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
    items,
  };
}

/**
 * Fetch full order detail for admin (unscoped customer ownership, includes fulfillment URLs).
 * Caller MUST have already verified administrative authorization (requireAdmin).
 */
export async function getOrderForAdmin(orderId: string): Promise<AdminOrderDetailDTO | null> {
  if (!orderId) return null;

  const orderRes = await query(
    `SELECT 
      ${ORDER_COLUMNS},
      ${PAYMENT_COLUMNS},
      ${SHIPMENT_COLUMNS}
    FROM "Order" o
    LEFT JOIN "Payment" p ON o."id" = p."orderId"
    LEFT JOIN "Shipment" s ON o."id" = s."orderId"
    WHERE o."id" = $1
    LIMIT 1`,
    [orderId]
  );

  if (orderRes.rows.length === 0) return null;
  const order = orderRes.rows[0];
  const items = await fetchOrderItems(orderId);

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
    originalPaymentMethod: order.originalPaymentMethod || order.paymentMethod,
    paymentReference: order.paymentReference || "N/A",
    paymentStatus: order.paymentStatus || "pending",
    carrier: order.courierName || order.carrier || "Express Freight",
    trackingNumber: order.awbCode || order.trackingNumber || `TRK-${order.id}`,
    etd: order.etd,
    shipmentCurrentStatus: order.shipmentCurrentStatus,
    trackingData: order.trackingData,
    shiprocketOrderId: order.shiprocketOrderId,
    shiprocketShipmentId: order.shiprocketShipmentId,
    awbCode: order.awbCode,
    courierName: order.courierName,
    labelUrl: order.labelUrl,
    invoiceUrl: order.invoiceUrl,
    manifestUrl: order.manifestUrl,
    pickupTokenNumber: order.pickupTokenNumber,
    pickupScheduledDate: order.pickupScheduledDate ? new Date(order.pickupScheduledDate).toISOString() : null,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString(),
    items,
  };
}

/**
 * Fetch all orders for administrator dashboard with items and fulfillment data
 */
export async function getAllOrdersForAdmin(): Promise<AdminOrderSummaryDTO[]> {
  await query(`ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "originalMethod" TEXT`);

  const res = await query(`
    SELECT 
      ${ORDER_COLUMNS},
      ${PAYMENT_COLUMNS},
      ${SHIPMENT_COLUMNS},
      COUNT(oi."id")::int as "itemCount",
      COALESCE(
        json_agg(
          json_build_object(
            'id', oi."id",
            'productId', oi."productId",
            'name', oi."name",
            'sku', oi."sku",
            'price', oi."price",
            'quantity', oi."quantity",
            'variantId', oi."variantId",
            'buyerNote', oi."buyerNote",
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

  return res.rows.map((r: any) => ({
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
    date: new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    items: Array.isArray(r.items)
      ? r.items.map((i: any) => ({
          ...i,
          price: Number(i.price || 0),
          quantity: Number(i.quantity || 1),
        }))
      : [],
  }));
}

/**
 * Cancel an order for customer (strictly enforces ownership and PROCESSING status)
 */
export async function cancelOrderForCustomer(
  orderId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const res = await query(
    `SELECT "id", "status" FROM "Order" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
    [orderId, userId]
  );

  if (res.rows.length === 0) {
    return { success: false, error: "Order not found." };
  }

  const order = res.rows[0];
  if (order.status !== "PROCESSING") {
    return { success: false, error: `Order cannot be cancelled in status: ${order.status}` };
  }

  await query(
    `UPDATE "Order" SET "status" = 'CANCELLED'::"OrderStatus", "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1 AND "userId" = $2`,
    [orderId, userId]
  );

  return { success: true };
}

/**
 * Update order status (Admin) inside an atomic transaction
 */
export async function updateOrderStatusForAdmin(
  orderId: string,
  status: string,
  carrier?: string,
  trackingNumber?: string
): Promise<{ success: boolean; error?: string }> {
  await transaction(async (client) => {
    await client.query(
      `UPDATE "Order" SET "status" = $1::"OrderStatus", "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
      [status, orderId]
    );

    if (status === "DELIVERED") {
      await client.query(
        `UPDATE "Payment" SET "status" = 'paid', "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $1`,
        [orderId]
      );
    }

    if (carrier || trackingNumber) {
      await client.query(
        `UPDATE "Shipment" 
         SET "carrier" = COALESCE($1, "carrier"),
             "trackingNumber" = COALESCE($2, "trackingNumber"),
             "status" = CASE WHEN $3 = 'DELIVERED' THEN 'delivered' ELSE 'in_transit' END,
             "shippedAt" = CASE WHEN "shippedAt" IS NULL THEN CURRENT_TIMESTAMP ELSE "shippedAt" END,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "orderId" = $4`,
        [carrier || null, trackingNumber || null, status, orderId]
      );
    }
  });

  return { success: true };
}

export type UpdateOrderPaymentMethodResult = {
  success: boolean;
  paymentMethod?: string;
  paymentStatus?: string;
  error?: string;
};

/**
 * Update payment method between COD and Prepaid (Admin)
 */
export async function updateOrderPaymentMethodForAdmin(
  orderId: string,
  newMethod: "cod" | "prepaid"
): Promise<UpdateOrderPaymentMethodResult> {
  const isCod = newMethod === "cod";
  const paymentMethodLabel = isCod ? "Cash on Delivery (COD)" : "Prepaid (Online Payment)";
  const paymentStatus = isCod ? "pending_cod" : "paid";
  const paymentReference = isCod ? `COD-${orderId}` : `PREPAID-${orderId}`;

  await query(
    `UPDATE "Payment"
     SET "method" = $1,
         "status" = $2,
         "reference" = CASE 
           WHEN "reference" IS NULL OR "reference" LIKE 'COD-%' OR "reference" LIKE 'PREPAID-%' OR "reference" LIKE 'CARD-%' OR "reference" LIKE 'PO-%' 
           THEN $3 
           ELSE "reference" 
         END,
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE "orderId" = $4`,
    [paymentMethodLabel, paymentStatus, paymentReference, orderId]
  );

  return {
    success: true,
    paymentMethod: paymentMethodLabel,
    paymentStatus,
  };
}

/**
 * Update buyer note on an order item (Admin)
 */
export async function updateOrderItemNoteForAdmin(
  orderItemId: string,
  buyerNote: string
): Promise<{ success: boolean; item?: OrderItemDTO; error?: string }> {
  const cleanNote = buyerNote.trim();
  const res = await query(
    `UPDATE "OrderItem" SET "buyerNote" = $1 WHERE "id" = $2 
     RETURNING ${ORDER_ITEM_COLUMNS}`,
    [cleanNote || null, orderItemId]
  );

  if (res.rows.length === 0) {
    return { success: false, error: "Order item record not found." };
  }

  const r = res.rows[0];
  return {
    success: true,
    item: {
      id: r.id,
      productId: r.productId,
      variantId: r.variantId,
      name: r.name,
      sku: r.sku,
      price: Number(r.price),
      quantity: Number(r.quantity),
      attributes: [],
      buyerNote: r.buyerNote,
    },
  };
}
