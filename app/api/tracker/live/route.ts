import { NextResponse } from "next/server";
import { getActiveUserSessions } from "@/app/actions/tracker";
import { requireAdminApi } from "@/lib/auth-checks";

export async function GET() {
  const authCheck = await requireAdminApi();
  if (authCheck.errorResponse) return authCheck.errorResponse;

  try {
    const data = await getActiveUserSessions();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Live tracker endpoint error:", error);
    return NextResponse.json({ error: "Failed to fetch live user metrics" }, { status: 500 });
  }
}
