import { NextRequest, NextResponse } from "next/server";
import { handleShiprocketWebhook } from "@/lib/shiprocket-webhook";

/**
 * Public Logistics Webhook Endpoint.
 * Word-neutral URL designed specifically for fulfillment providers (e.g. Shiprocket)
 * that reject brand-specific or vendor terms in webhook endpoint URLs.
 *
 * Enforces canonical x-api-key authentication, 64KB body limit, JSON content-type,
 * strict schema validation, status regression protection, and payment isolation.
 */
export async function POST(req: NextRequest) {
  return handleShiprocketWebhook(req);
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Logistics Webhook Listener",
    message: "Endpoint active and reachable",
  });
}

export async function PUT() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Method Not Allowed" },
    { status: 405, headers: { Allow: "POST" } }
  );
}
