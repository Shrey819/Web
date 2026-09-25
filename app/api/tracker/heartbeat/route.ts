import { NextRequest, NextResponse } from "next/server";
import { recordUserHeartbeat } from "@/app/actions/tracker";
import { anonymizeIp, sanitizePath, isSensitivePath } from "@/lib/tracker-utils";
import { requireValidOrigin } from "@/lib/csrf";

const MAX_PAYLOAD_BYTES = 10240; // 10KB limit

export async function POST(req: NextRequest) {
  const originBlock = requireValidOrigin(req);
  if (originBlock) return originBlock;

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

    const {
      sessionId,
      currentPage,
      deviceType,
      browser,
      os,
      pageDurationSeconds,
      previousPage,
      previousPageDuration,
      clientTimezone,
      userName,
      userEmail,
    } = body;

    // 2. Validate essential types
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 64) {
      return NextResponse.json({ error: "Invalid session identifier" }, { status: 400 });
    }
    if (!currentPage || typeof currentPage !== "string" || currentPage.length > 255) {
      return NextResponse.json({ error: "Invalid page parameter" }, { status: 400 });
    }

    // 3. Sensitive route check
    const cleanCurrentPage = sanitizePath(currentPage);
    if (isSensitivePath(cleanCurrentPage)) {
      return NextResponse.json({ success: true, ignored: true });
    }

    // 4. Extract and sanitize client IP address
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";
    const sanitizedIp = anonymizeIp(rawIp);

    const result = await recordUserHeartbeat({
      sessionId: sessionId.trim(),
      ipAddress: sanitizedIp,
      currentPage: cleanCurrentPage,
      deviceType: typeof deviceType === "string" && ["Desktop", "Mobile", "Tablet"].includes(deviceType) ? (deviceType as any) : "Desktop",
      browser: typeof browser === "string" ? browser.slice(0, 50) : undefined,
      os: typeof os === "string" ? os.slice(0, 50) : undefined,
      pageDurationSeconds: typeof pageDurationSeconds === "number" ? Math.max(0, Math.floor(pageDurationSeconds)) : 0,
      previousPage: typeof previousPage === "string" ? sanitizePath(previousPage) : undefined,
      previousPageDuration: typeof previousPageDuration === "number" ? Math.max(0, Math.floor(previousPageDuration)) : 0,
      clientTimezone: typeof clientTimezone === "string" ? clientTimezone.slice(0, 100) : undefined,
      userName: typeof userName === "string" ? userName.slice(0, 100) : undefined,
      userEmail: typeof userEmail === "string" ? userEmail.slice(0, 150) : undefined,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tracker heartbeat endpoint error:", error);
    return NextResponse.json({ error: "Internal tracking server error" }, { status: 500 });
  }
}
