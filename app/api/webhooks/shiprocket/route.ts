import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const awb = payload.awb || payload.awb_code;
    const orderId = payload.order_id || payload.channel_order_id;
    const currentStatus = String(payload.current_status || "").toUpperCase();
    const courierName = payload.courier_name;
    const etd = payload.etd;

    if (!awb && !orderId) {
      return NextResponse.json({ error: "Missing AWB or Order ID in webhook payload" }, { status: 400 });
    }

    console.log(`[Shiprocket Webhook] Received status update: ${currentStatus} for Order: ${orderId}, AWB: ${awb}`);

    // Map Shiprocket status to Internal OrderStatus & Shipment Status
    let dbOrderStatus: string | null = null;
    let dbShipmentStatus = "in_transit";

    if (currentStatus.includes("DELIVERED") && !currentStatus.includes("RTO")) {
      dbOrderStatus = "DELIVERED";
      dbShipmentStatus = "delivered";
    } else if (currentStatus.includes("PICKED UP") || currentStatus.includes("IN TRANSIT") || currentStatus.includes("OUT FOR DELIVERY") || currentStatus.includes("AWB")) {
      dbOrderStatus = "SHIPPED";
      dbShipmentStatus = "in_transit";
    } else if (currentStatus.includes("CANCELLED") || currentStatus.includes("CANCELED")) {
      dbOrderStatus = "CANCELLED";
      dbShipmentStatus = "cancelled";
    }

    await transaction(async (client) => {
      // 1. Update Shipment record
      await client.query(
        `UPDATE "Shipment"
         SET "currentStatus" = $1,
             "status" = $2,
             "courierName" = COALESCE($3, "courierName"),
             "etd" = COALESCE($4, "etd"),
             "trackingData" = $5,
             "updatedAt" = CURRENT_TIMESTAMP
         WHERE "awbCode" = $6 OR "trackingNumber" = $6 OR "orderId" = $7`,
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

      // 2. If delivered or mapped order status, update Order and Payment
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
    console.error("[Shiprocket Webhook] Error processing event:", error);
    return NextResponse.json({ error: error.message || "Webhook processing failed" }, { status: 500 });
  }
}
