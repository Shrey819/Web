import { NextRequest, NextResponse } from "next/server";
import { recordUserHeartbeat } from "@/app/actions/tracker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
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
      userId,
    } = body;

    if (!sessionId || !currentPage) {
      return NextResponse.json({ error: "Missing required tracking parameters" }, { status: 400 });
    }

    // Extract client IP address
    const forwardedFor = req.headers.get("x-forwarded-for");
    const realIp = req.headers.get("x-real-ip");
    const rawIp = forwardedFor ? forwardedFor.split(",")[0].trim() : realIp || "127.0.0.1";

    const result = await recordUserHeartbeat({
      sessionId,
      ipAddress: rawIp,
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
      userId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Tracker heartbeat endpoint error:", error);
    return NextResponse.json({ error: "Internal tracking server error" }, { status: 500 });
  }
}
