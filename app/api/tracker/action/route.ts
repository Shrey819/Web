import { NextRequest, NextResponse } from "next/server";
import { recordUserAction } from "@/app/actions/tracker";
import { ALLOWED_ACTION_TYPES, sanitizeActionDetails } from "@/lib/tracker-utils";

const MAX_PAYLOAD_BYTES = 10240; // 10KB limit

export async function POST(req: NextRequest) {
  try {
    // 1. Enforce payload size limit
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const rawBody = await req.text();
    if (rawBody.length > MAX_PAYLOAD_BYTES) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400 });
    }

    const { sessionId, actionType, details, userName, userEmail } = body;

    // 2. Validate input parameters
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 64) {
      return NextResponse.json({ error: "Invalid session identifier" }, { status: 400 });
    }
    if (!actionType || typeof actionType !== "string") {
      return NextResponse.json({ error: "Missing required action parameters" }, { status: 400 });
    }

    // 3. Whitelist validation
    const cleanActionType = actionType.trim().toUpperCase();
    if (!ALLOWED_ACTION_TYPES.has(cleanActionType)) {
      return NextResponse.json({ error: "Unsupported action type" }, { status: 400 });
    }

    // 4. Sanitize details
    const sanitizedDetails = typeof details === "string" ? sanitizeActionDetails(details) : "";

    const result = await recordUserAction({
      sessionId: sessionId.trim(),
      actionType: cleanActionType,
      details: sanitizedDetails,
      userName: typeof userName === "string" ? userName.slice(0, 100) : undefined,
      userEmail: typeof userEmail === "string" ? userEmail.slice(0, 150) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Action telemetry API error:", error);
    return NextResponse.json({ error: "Failed to record user action" }, { status: 500 });
  }
}
