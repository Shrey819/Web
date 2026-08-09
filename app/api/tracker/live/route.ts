import { NextResponse } from "next/server";
import { getActiveUserSessions } from "@/app/actions/tracker";

export async function GET() {
  try {
    const data = await getActiveUserSessions();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Live tracker endpoint error:", error);
    return NextResponse.json({ error: "Failed to fetch live user metrics" }, { status: 500 });
  }
}
