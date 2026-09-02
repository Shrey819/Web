import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSystemSettings } from "@/lib/settings";

export async function GET(req: NextRequest) {
  return NextResponse.json({
    status: "active",
    service: "Omni Logistics & Shipment Webhook Listener",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);

    // Shiprocket "Test Webhook" ping support
    if (!payload || Object.keys(payload).length === 0 || payload.test === true || payload.event === "test") {
      return NextResponse.json({
        success: true,
        message: "Webhook listener active and reachable",
        status: "ok",
      });
    }

    // Optional x-api-key authentication check
    const apiKeyHeader = req.headers.get("x-api-key") || req.headers.get("authorization");
    const settings = await getSystemSettings();
    const expectedToken = (settings as any).shiprocket_webhook_secret || process.env.SHIPROCKET_WEBHOOK_SECRET;

    if (expectedToken && expectedToken.trim() !== "") {
      const cleanHeader = (apiKeyHeader || "").replace(/^Bearer\s+/i, "").trim();
      if (cleanHeader && cleanHeader !== expectedToken.trim()) {
        console.warn("[Webhook] Warning: x-api-key did not match configured secret, but logging event payload.");
      }
    }

    const awb = payload.awb || payload.awb_code;
    const orderId = payload.order_id || payload.channel_order_id;
    const currentStatus = String(payload.current_status || payload.shipment_status || "").toUpperCase();
    const courierName = payload.courier_name;
    const etd = payload.etd || payload.edd;
    const activities = payload.scans || payload.activities || [];

    console.log(`[Logistics Webhook] Status: ${currentStatus || "UPDATED"} | Order: ${orderId || "N/A"} | AWB: ${awb || "N/A"}`);

    // Map Shiprocket status to Internal OrderStatus & Shipment Status
    let dbOrderStatus: string | null = null;
    let dbShipmentStatus = "in_transit";

    if (currentStatus.includes("DELIVERED") && !currentStatus.includes("RTO")) {
      dbOrderStatus = "DELIVERED";
      dbShipmentStatus = "delivered";
    } else if (
      currentStatus.includes("PICKED UP") ||
      currentStatus.includes("IN TRANSIT") ||
      currentStatus.includes("OUT FOR DELIVERY") ||
      currentStatus.includes("AWB") ||
      currentStatus.includes("SHIPPED")
    ) {
      dbOrderStatus = "SHIPPED";
      dbShipmentStatus = "in_transit";
    } else if (currentStatus.includes("CANCELLED") || currentStatus.includes("CANCELED")) {
      dbOrderStatus = "CANCELLED";
      dbShipmentStatus = "cancelled";
    }

    await transaction(async (client) => {
      // 1. Update Shipment record
      if (awb || orderId) {
        await client.query(
          `UPDATE "Shipment"
           SET "currentStatus" = COALESCE(NULLIF($1, ''), "currentStatus"),
               "status" = $2,
               "courierName" = COALESCE($3, "courierName"),
               "etd" = COALESCE($4, "etd"),
               "trackingData" = $5,
               "updatedAt" = CURRENT_TIMESTAMP
           WHERE ("awbCode" = $6 AND $6 != '__NONE__') 
              OR ("trackingNumber" = $6 AND $6 != '__NONE__') 
              OR ("orderId" = $7 AND $7 != '__NONE__')`,
          [
            currentStatus,
            dbShipmentStatus,
            courierName || null,
            etd || null,
            JSON.stringify(payload),
            awb || "__NONE__",
            orderId || "__NONE__",
          ]
        );
      }

      // 2. Update Order and Payment status if delivered/shipped
      if (dbOrderStatus && orderId) {
        await client.query(
          `UPDATE "Order" SET "status" = $1::"OrderStatus", "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2`,
          [dbOrderStatus, orderId]
        );

        if (dbOrderStatus === "DELIVERED") {
          await client.query(
            `UPDATE "Payment" SET "status" = 'paid', "updatedAt" = CURRENT_TIMESTAMP WHERE "orderId" = $1`,
            [orderId]
          );
        }
      }
    });

    if (orderId) {
      revalidatePath(`/orders/${orderId}`);
    }
    revalidatePath("/orders");
    revalidatePath("/admin/orders");

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error("[Logistics Webhook] Error processing event:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
