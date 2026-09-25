import { NextResponse } from "next/server";
import { invalidateSession } from "@/lib/session";
import { requireValidOrigin } from "@/lib/csrf";

export async function POST(request: Request) {
  const originBlock = requireValidOrigin(request);
  if (originBlock) return originBlock;
  try {
    await invalidateSession();
    return NextResponse.json({ success: true, message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ success: false, error: "Failed to logout." }, { status: 500 });
  }
}
