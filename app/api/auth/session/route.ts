import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { auth } from "@/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    let user = await getCurrentUser();
    if (!user) {
      const session = await auth();
      if (session?.user?.id) {
        const res = await query(
          `SELECT 
             id, 
             name, 
             email, 
             role, 
             image, 
             avatar, 
             google_sub, 
             given_name, 
             family_name, 
             locale, 
             "emailVerified"
           FROM "User"
           WHERE id = $1
           LIMIT 1`,
          [session.user.id]
        );
        if (res.rows.length > 0) {
          const row = res.rows[0];
          user = {
            id: row.id,
            name: row.name || "User",
            email: row.email,
            role: row.role || "CUSTOMER",
            image: row.image || row.avatar || null,
            avatar: row.avatar || row.image || null,
            googleSub: row.google_sub || null,
            givenName: row.given_name || null,
            familyName: row.family_name || null,
            locale: row.locale || null,
            emailVerified: row.emailVerified,
          };
        }
      }
    }

    if (!user) {
      return NextResponse.json({ authenticated: false, user: null });
    }
    return NextResponse.json({ authenticated: true, user });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ authenticated: false, user: null });
  }
}

