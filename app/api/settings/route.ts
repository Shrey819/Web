import { NextResponse } from "next/server";
import { getSystemSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const settings = await getSystemSettings();
    return NextResponse.json(settings, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    );
  }
}
