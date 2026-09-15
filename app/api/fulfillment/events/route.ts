import { NextRequest, NextResponse } from "next/server";
import { handleShiprocketWebhook } from "@/lib/shiprocket-webhook";

/**
 * Alternate Fulfillment / Logistics Webhook Endpoint.
 * Hardened to delegate directly to handleShiprocketWebhook to eliminate any route bypass.
 * Reject non-POST methods and enforce full authentication and regression protection.
 */
export async function POST(req: NextRequest) {
  return handleShiprocketWebhook(req);
}

export async function GET() {
  return NextResponse.json(
    { error: "Method Not Allowed: Webhook listener requires authenticated POST" },
    { status: 405, headers: { Allow: "POST" } }
  );
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
