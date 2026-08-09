import { NextRequest, NextResponse } from "next/server";
import { recordUserAction } from "@/app/actions/tracker";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, actionType, details, userName, userEmail } = body;

    if (!sessionId || !actionType) {
      return NextResponse.json({ error: "Missing required action parameters" }, { status: 400 });
    }

    const result = await recordUserAction({
      sessionId,
      actionType,
      details,
      userName,
      userEmail,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Action telemetry API error:", error);
    return NextResponse.json({ error: "Failed to record user action" }, { status: 500 });
  }
}
