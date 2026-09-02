"use server";

import { query, transaction } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  checkCourierServiceability,
  createShiprocketAdhocOrder,
  assignShiprocketAWB,
  generateShiprocketPickup,
  generateShiprocketLabel,
  generateShiprocketInvoice,
  generateShiprocketManifest,
  trackShiprocketAWB,
  trackShiprocketByOrderId,
  testShiprocketConnection,
  CourierServiceabilityResponse,
  TrackingResult,
  calculateDeliveryDateRange,
  DeliveryRangeResult,
  getShiprocketPickupLocations,
  ShiprocketPickupLocation,
  cancelShiprocketOrder,
} from "@/lib/shiprocket";
import { getSystemSettings } from "@/lib/settings";
import { getSuggestedStateForPincode } from "@/lib/indiaLocations";

/**
 * Public Pincode Serviceability & Delivery Estimation Check (Checkout & Product Page)
 */
export async function checkPincodeServiceabilityAction(
  deliveryPincode: string,
  weight = 0.5,
  isCod = false
): Promise<{
  success: boolean;
  serviceable: boolean;
  estimatedDays?: string;
  deliveryRange?: DeliveryRangeResult;
  couriers?: CourierServiceabilityResponse[];
  recommendedCourier?: string;
  rate?: number;
  message?: string;
}> {
  const pin = deliveryPincode.trim();
  if (!/^\d{6}$/.test(pin)) {
    return {
      success: false,
      serviceable: false,
      message: "Please enter a valid 6-digit Indian PIN code.",
    };
  }

  const settings = await getSystemSettings();

  // If Shiprocket is not configured or disabled, fallback to smart standard delivery estimation
  if (!settings.shiprocket_enabled || !settings.shiprocket_email) {
    const range = calculateDeliveryDateRange(null, pin);

    return {
      success: true,
      serviceable: true,
      estimatedDays: range.formattedDaysRange,
      deliveryRange: range,
      recommendedCourier: "Express Surface Logistics",
      rate: 50,
      message: `Estimated Delivery: ${range.formattedDateRange} (${range.formattedDaysRange}) via Express Surface Logistics`,
    };
  }

  try {
    const result = await checkCourierServiceability({
      pickup_postcode: settings.shiprocket_pickup_pincode,
      delivery_postcode: pin,
      weight,
      cod: isCod,
    });

    const isServiceable = result.available_courier_companies.length > 0;
    const range = calculateDeliveryDateRange(result.recommended_etd, pin);
    const courierName = result.recommended_courier_name || "Express Courier Partner";

    return {
      success: true,
      serviceable: isServiceable,
      estimatedDays: range.formattedDaysRange,
      deliveryRange: range,
      couriers: result.available_courier_companies,
      recommendedCourier: courierName,
      rate: result.recommended_rate,
      message: isServiceable
        ? `Estimated Delivery: ${range.formattedDateRange} (${range.formattedDaysRange}) via ${courierName}`
        : "Sorry, this PIN code is currently not serviceable for automated courier dispatch.",
    };
  } catch (error: any) {
    console.warn("[Shiprocket] checkPincodeServiceabilityAction fallback on error:", error.message);
    const range = calculateDeliveryDateRange(null, pin);
    return {
      success: true,
      serviceable: true,
      estimatedDays: range.formattedDaysRange,
      deliveryRange: range,
      recommendedCourier: "Express Freight Dispatch",
      rate: 100,
      message: `Estimated Delivery: ${range.formattedDateRange} (${range.formattedDaysRange}) via Express Freight`,
    };
  }
}

/**
 * Admin: Get all registered pickup locations from Shiprocket
 */
export async function adminGetShiprocketPickupLocationsAction() {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized", pickupLocations: [] };
  try {
    const locations = await getShiprocketPickupLocations();
    const primary = locations.find((l) => l.is_primary_location) || locations[0];
    return {
      success: true,
      pickupLocations: locations,
      primaryLocation: primary,
    };
  } catch (e: any) {
    console.error("Failed to fetch Shiprocket pickup locations:", e);
    return { success: false, error: e.message, pickupLocations: [] };
  }
}

/**
 * Admin: Get Live Shiprocket Courier Quotes for an Order
 */
export async function adminGetShiprocketRatesForOrderAction(
  orderId: string,
  customDimensions?: {
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
    deliveryPincode?: string;
    pickupPincode?: string;
    pickupLocation?: string;
  }
) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const orderRes = await query(
      `SELECT o.*, p."method" as "paymentMethod" FROM "Order" o 
       LEFT JOIN "Payment" p ON o."id" = p."orderId" 
       WHERE o."id" = $1 LIMIT 1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return { success: false, error: "Order not found" };
    }

    const order = orderRes.rows[0];
    const settings = await getSystemSettings();

    const isCod = (order.paymentMethod || "").toLowerCase().includes("cod");
    const weight = customDimensions?.weight ?? settings.shiprocket_default_weight ?? 0.5;
    const deliveryPin = customDimensions?.deliveryPincode?.trim() || order.shippingZip?.trim() || "360003";

    // Dynamic pickup pincode resolution: Use specified pickup pincode, or fetch primary registered pickup location from Shiprocket
    let pickupPin = customDimensions?.pickupPincode?.trim();
    if (!pickupPin) {
      const pickupLocations = await getShiprocketPickupLocations();
      const primaryLoc = pickupLocations.find((l) => l.is_primary_location) || pickupLocations[0];
      pickupPin = primaryLoc?.pin_code || settings.shiprocket_pickup_pincode || "360003";
    }

    const res = await checkCourierServiceability({
      pickup_postcode: pickupPin,
      delivery_postcode: deliveryPin,
      weight,
      cod: isCod,
      declared_value: Number(order.total || 0),
    });

    const firstCourier = res.available_courier_companies[0];
    const rawCity = firstCourier?.city;
    const rawState = firstCourier?.state;
    const resolvedState = rawState || getSuggestedStateForPincode(deliveryPin) || order.shippingState || "India";
    const resolvedCity = rawCity || order.shippingCity || "Destination";

    return {
      success: true,
      couriers: res.available_courier_companies,
      recommendedId: res.recommended_courier_company_id,
      recommendedName: res.recommended_courier_name,
      recommendedRate: res.recommended_rate,
      recommendedEtd: res.recommended_etd,
      deliveryPincode: deliveryPin,
      deliveryCity: resolvedCity,
      deliveryState: resolvedState,
      pickupPincode: pickupPin,
      shiprocketError: res.available_courier_companies.length === 0 ? (res.error || res.message || "Pincode is not serviceable by any courier partner.") : undefined,
    };
  } catch (error: any) {
    console.error("Failed to query Shiprocket rates:", error);
    return { 
      success: false, 
      error: error.message || "Failed to calculate courier rates",
      shiprocketError: error.message || "Failed to calculate courier rates",
      couriers: [],
      deliveryPincode: customDimensions?.deliveryPincode || "360003",
    };
  }
}

/**
 * Admin: 1-Click Ship with Shiprocket
 * Creates Adhoc Order, assigns AWB, and updates DB Order & Shipment records.
 */
export async function adminCreateShiprocketShipmentAction(
  orderId: string,
  options?: {
    courierId?: number;
    weight?: number;
    length?: number;
    breadth?: number;
    height?: number;
    pickupLocation?: string;
    pickupPincode?: string;
    autoAssignAwb?: boolean;
    deliveryPincode?: string;
  }
) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const orderRes = await query(
      `SELECT o.*, p."method" as "paymentMethod", p."status" as "paymentStatus",
              s."id" as "shipmentId", s."shiprocketOrderId", s."shiprocketShipmentId", s."awbCode"
       FROM "Order" o
       LEFT JOIN "Payment" p ON o."id" = p."orderId"
       LEFT JOIN "Shipment" s ON o."id" = s."orderId"
       WHERE o."id" = $1 LIMIT 1`,
      [orderId]
    );

    if (orderRes.rows.length === 0) {
      return { success: false, error: "Order not found" };
    }

    const order = orderRes.rows[0];
    const itemsRes = await query(
      `SELECT * FROM "OrderItem" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
      [orderId]
    );

    const items = itemsRes.rows;
    if (items.length === 0) {
      return { success: false, error: "Order has no line items" };
    }

    const settings = await getSystemSettings();
    const isCod = (order.paymentMethod || "").toLowerCase().includes("cod");

    const orderDate = new Date(order.createdAt || Date.now())
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const fullNameParts = (order.shippingFullName || "Valued Customer").trim().split(" ");
    const firstName = fullNameParts[0] || "Valued";
    const lastName = fullNameParts.slice(1).join(" ") || "";

    const cleanPhone = (order.shippingPhone || "9876543210").replace(/[^\d]/g, "").slice(-10);

    // 1. If not yet assigned AWB, create or re-create order in Shiprocket with current payment mode
    let srOrderId = order.shiprocketOrderId;
    let srShipmentId = order.shiprocketShipmentId;
    let awbCode = order.awbCode;
    let courierName = "";

    // If order has no AWB assigned yet, ensure Shiprocket receives the exact latest payment mode & warehouse
    if (!awbCode) {
      if (srOrderId) {
        try {
          await cancelShiprocketOrder(srOrderId);
        } catch (e) {
          console.warn("[Shiprocket] Could not cancel prior order before recreate:", e);
        }
      }

      let selectedPickupLoc = options?.pickupLocation;
      if (!selectedPickupLoc) {
        const pickupLocations = await getShiprocketPickupLocations();
        const primaryLoc = pickupLocations.find((l) => l.is_primary_location) || pickupLocations[0];
        selectedPickupLoc = primaryLoc?.pickup_location || settings.shiprocket_pickup_location || "warehouse";
      }

      const channelOrderId = srOrderId ? `${order.id}-R${Date.now().toString().slice(-4)}` : order.id;

      const shiprocketPayload = {
        order_id: channelOrderId,
        order_date: orderDate,
        pickup_location: selectedPickupLoc,
        billing_customer_name: firstName,
        billing_last_name: lastName,
        billing_address: order.shippingStreet || "Main Street",
        billing_city: order.shippingCity || "City",
        billing_pincode: String(options?.deliveryPincode || order.shippingZip || "360001"),
        billing_state: order.shippingState || "Gujarat",
        billing_country: order.shippingCountry || "India",
        billing_email: order.shippingCompany ? `${order.id.toLowerCase()}@client.com` : "customer@omautomation.com",
        billing_phone: cleanPhone.length === 10 ? cleanPhone : "9876543210",
        shipping_is_billing: true,
        order_items: items.map((it: any) => ({
          name: it.name,
          sku: it.sku || `SKU-${it.id}`,
          units: Number(it.quantity || 1),
          selling_price: Math.round(Number(it.price || 0)), // Rupee amount (e.g. 300, 500, 480)
          discount: 0,
          tax: 18,
          hsn: 8479, // Standard Machinery & Automation HSN
        })),
        payment_method: (isCod ? "COD" : "Prepaid") as "Prepaid" | "COD",
        sub_total: Math.round(Number(order.total || 0)), // Rupee total (e.g. 3030)
        length: options?.length || settings.shiprocket_default_length || 10,
        breadth: options?.breadth || settings.shiprocket_default_breadth || 10,
        height: options?.height || settings.shiprocket_default_height || 10,
        weight: options?.weight || settings.shiprocket_default_weight || 0.5,
      };

      const srRes = await createShiprocketAdhocOrder(shiprocketPayload);
      srOrderId = String(srRes.order_id);
      srShipmentId = String(srRes.shipment_id);

      if (srRes.awb_code) {
        awbCode = srRes.awb_code;
        courierName = srRes.courier_name || "";
      }
    }

    // 2. Assign AWB if requested or courier specified
    if ((options?.autoAssignAwb !== false || options?.courierId) && srShipmentId && !awbCode) {
      const awbRes = await assignShiprocketAWB({
        shipment_id: srShipmentId,
        courier_id: options?.courierId,
      });
      awbCode = awbRes.awb_code;
      courierName = awbRes.courier_name;
    }

    // 3. Update Database Order & Shipment
    await transaction(async (client) => {
      // Update Order Status to SHIPPED
      await client.query(
        `UPDATE "Order" SET "status" = 'SHIPPED', "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1`,
        [orderId]
      );

      // Upsert Shipment record
      await client.query(
        `UPDATE "Shipment" 
         SET "shiprocketOrderId" = $1,
             "shiprocketShipmentId" = $2,
             "awbCode" = COALESCE($3, "awbCode"),
             "trackingNumber" = COALESCE($3, "trackingNumber"),
             "carrier" = COALESCE($4, "carrier"),
             "courierName" = COALESCE($4, "courierName"),
             "status" = 'in_transit',
             "shippedAt" = COALESCE("shippedAt", CURRENT_TIMESTAMP),
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "orderId" = $5`,
        [srOrderId, srShipmentId, awbCode || null, courierName || "Shiprocket Freight", orderId]
      );
    });

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");

    return {
      success: true,
      shiprocketOrderId: srOrderId,
      shiprocketShipmentId: srShipmentId,
      awbCode,
      courierName,
    };
  } catch (error: any) {
    console.error("Failed to create Shiprocket shipment:", error);
    return {
      success: false,
      error: error.message || "Failed to create shipment in Shiprocket",
    };
  }
}

/**
 * Admin: Assign AWB to an Existing Shiprocket Shipment
 */
export async function adminAssignAWBAction(orderId: string, courierId?: number) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const shipRes = await query(
      `SELECT "shiprocketShipmentId" FROM "Shipment" WHERE "orderId" = $1 LIMIT 1`,
      [orderId]
    );

    const shipmentId = shipRes.rows[0]?.shiprocketShipmentId;
    if (!shipmentId) {
      return { success: false, error: "No Shiprocket shipment found for this order. Please push the order to Shiprocket first." };
    }

    const res = await assignShiprocketAWB({ shipment_id: shipmentId, courier_id: courierId });

    await query(
      `UPDATE "Shipment" 
       SET "awbCode" = $1, "trackingNumber" = $1, "courierName" = $2, "carrier" = $2, "status" = 'in_transit', "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "orderId" = $3`,
      [res.awb_code, res.courier_name, orderId]
    );

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");

    return { success: true, awbCode: res.awb_code, courierName: res.courier_name };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to assign AWB" };
  }
}

/**
 * Admin: Request Courier Pickup
 */
export async function adminRequestPickupAction(orderId: string) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const shipRes = await query(
      `SELECT "shiprocketShipmentId" FROM "Shipment" WHERE "orderId" = $1 LIMIT 1`,
      [orderId]
    );

    const shipmentId = shipRes.rows[0]?.shiprocketShipmentId;
    if (!shipmentId) {
      return { success: false, error: "No Shiprocket shipment found for this order." };
    }

    const res = await generateShiprocketPickup(shipmentId);

    await query(
      `UPDATE "Shipment" 
       SET "pickupTokenNumber" = $1, "pickupScheduledDate" = $2, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "orderId" = $3`,
      [res.pickup_token_number || "SCHEDULED", res.pickup_scheduled_date ? new Date(res.pickup_scheduled_date) : new Date(), orderId]
    );

    revalidatePath("/admin/orders");
    return { success: true, pickupToken: res.pickup_token_number, pickupDate: res.pickup_scheduled_date };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to schedule pickup" };
  }
}

/**
 * Admin: Generate Printable Shipping Label (PDF)
 */
export async function adminGenerateLabelAction(orderId: string) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const shipRes = await query(
      `SELECT "shiprocketShipmentId", "labelUrl" FROM "Shipment" WHERE "orderId" = $1 LIMIT 1`,
      [orderId]
    );

    const existingLabel = shipRes.rows[0]?.labelUrl;
    if (existingLabel) {
      return { success: true, labelUrl: existingLabel };
    }

    const shipmentId = shipRes.rows[0]?.shiprocketShipmentId;
    if (!shipmentId) {
      return { success: false, error: "No Shiprocket shipment found for this order." };
    }

    const res = await generateShiprocketLabel(shipmentId);

    await query(
      `UPDATE "Shipment" SET "labelUrl" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $2`,
      [res.label_url, orderId]
    );

    revalidatePath("/admin/orders");
    return { success: true, labelUrl: res.label_url };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate shipping label" };
  }
}

/**
 * Admin / Customer: Generate Tax Invoice (PDF)
 */
export async function adminGenerateInvoiceAction(orderId: string) {
  try {
    const shipRes = await query(
      `SELECT "shiprocketOrderId", "invoiceUrl" FROM "Shipment" WHERE "orderId" = $1 LIMIT 1`,
      [orderId]
    );

    const existingInvoice = shipRes.rows[0]?.invoiceUrl;
    if (existingInvoice) {
      return { success: true, invoiceUrl: existingInvoice };
    }

    const srOrderId = shipRes.rows[0]?.shiprocketOrderId;
    if (!srOrderId) {
      return { success: false, error: "No Shiprocket order found for this order ID." };
    }

    const res = await generateShiprocketInvoice([srOrderId]);

    await query(
      `UPDATE "Shipment" SET "invoiceUrl" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $2`,
      [res.invoice_url, orderId]
    );

    revalidatePath("/orders");
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/admin/orders");

    return { success: true, invoiceUrl: res.invoice_url };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate invoice" };
  }
}

/**
 * Admin: Generate Manifest (PDF)
 */
export async function adminGenerateManifestAction(orderId: string) {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  try {
    const shipRes = await query(
      `SELECT "shiprocketShipmentId", "manifestUrl" FROM "Shipment" WHERE "orderId" = $1 LIMIT 1`,
      [orderId]
    );

    const existingManifest = shipRes.rows[0]?.manifestUrl;
    if (existingManifest) {
      return { success: true, manifestUrl: existingManifest };
    }

    const shipmentId = shipRes.rows[0]?.shiprocketShipmentId;
    if (!shipmentId) {
      return { success: false, error: "No Shiprocket shipment found." };
    }

    const res = await generateShiprocketManifest([shipmentId]);

    await query(
      `UPDATE "Shipment" SET "manifestUrl" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $2`,
      [res.manifest_url, orderId]
    );

    revalidatePath("/admin/orders");
    return { success: true, manifestUrl: res.manifest_url };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate manifest" };
  }
}

/**
 * Real-Time Courier Tracking (Admin & Public)
 */
export async function getLiveOrderTrackingAction(orderIdOrAwb: string): Promise<{
  success: boolean;
  tracking?: TrackingResult;
  currentStatus?: string;
  courierName?: string;
  awbCode?: string;
  error?: string;
}> {
  try {
    // 1. Check if order exists in DB to retrieve AWB
    const res = await query(
      `SELECT s.* FROM "Shipment" s 
       WHERE s."orderId" = $1 OR s."awbCode" = $1 OR s."trackingNumber" = $1 
       LIMIT 1`,
      [orderIdOrAwb]
    );

    let awbCode = res.rows[0]?.awbCode || res.rows[0]?.trackingNumber;
    let srOrderId = res.rows[0]?.shiprocketOrderId;

    // If param itself looks like an AWB code (numeric / alphanumeric > 8 chars)
    if (!awbCode && orderIdOrAwb.length >= 8) {
      awbCode = orderIdOrAwb;
    }

    let tracking: TrackingResult | null = null;

    if (awbCode && !awbCode.startsWith("TRK-PENDING")) {
      try {
        tracking = await trackShiprocketAWB(awbCode);
      } catch (e) {
        console.warn("[Shiprocket] Tracking by AWB failed, attempting by order ID:", e);
      }
    }

    if (!tracking && srOrderId) {
      try {
        tracking = await trackShiprocketByOrderId(srOrderId);
      } catch (e) {
        console.warn("[Shiprocket] Tracking by Order ID failed:", e);
      }
    }

    if (!tracking) {
      return {
        success: false,
        error: "Live tracking updates are not yet available from the courier. Please check back shortly after package pickup.",
      };
    }

    const currentTrack = tracking.shipment_track?.[0];
    const currentStatus = currentTrack?.current_status || "IN TRANSIT";

    // Update database cache if shipment row found
    if (res.rows.length > 0) {
      await query(
        `UPDATE "Shipment" 
         SET "trackingData" = $1, "currentStatus" = $2, "updatedAt" = CURRENT_TIMESTAMP 
         WHERE "orderId" = $3`,
        [JSON.stringify(tracking), currentStatus, res.rows[0].orderId]
      );
    }

    return {
      success: true,
      tracking,
      currentStatus,
      courierName: currentTrack?.courier_name || res.rows[0]?.courierName || "Express Courier",
      awbCode: currentTrack?.awb_code || awbCode,
    };
  } catch (error: any) {
    console.error("Failed to fetch live tracking:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch live tracking information.",
    };
  }
}

/**
 * Test Shiprocket Connection Action (For Admin Settings UI)
 */
export async function testShiprocketAuthAction() {
  const session = await auth();
  if (!session) return { success: false, error: "Unauthorized" };

  return testShiprocketConnection();
}
