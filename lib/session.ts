import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { UserSession } from "@/types";
import { redirect } from "next/navigation";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "om_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

const generateSessionId = () => "ses_" + crypto.randomBytes(8).toString("hex");

/**
 * Creates a server-side session in PostgreSQL and sets the HttpOnly cookie
 */
export async function createSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomBytes(32).toString("hex");
  const sessionId = generateSessionId();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  // Store in PostgreSQL Session table
  await query(
    `INSERT INTO "Session" ("id", "sessionToken", "userId", "expires")
     VALUES ($1, $2, $3, $4)`,
    [sessionId, sessionToken, userId, expiresAt]
  );

  // Set secure HTTP-only cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
    expires: expiresAt,
  });

  return sessionToken;
}

/**
 * Retrieves the currently authenticated user from PostgreSQL via the session cookie
 */
export async function getCurrentUser(): Promise<UserSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
      return null;
    }

    const res = await query(
      `SELECT 
         u.id, 
         u.name, 
         u.email, 
         u.role, 
         u.image, 
         u.avatar, 
         u.google_sub, 
         u.given_name, 
         u.family_name, 
         u.locale, 
         u."emailVerified",
         s.expires
       FROM "Session" s
       JOIN "User" u ON s."userId" = u.id
       WHERE s."sessionToken" = $1 AND s.expires > CURRENT_TIMESTAMP
       LIMIT 1`,
      [token]
    );

    if (res.rows.length === 0) {
      return null;
    }

    const row = res.rows[0];
    return {
      id: row.id,
      name: row.name || "Customer User",
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
  } catch (error) {
    console.error("Error retrieving current user:", error);
    return null;
  }
}

/**
 * Invalidates the current session in PostgreSQL and deletes the cookie
 */
export async function invalidateSession(): Promise<void> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
      await query(`DELETE FROM "Session" WHERE "sessionToken" = $1`, [token]);
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error("Error invalidating session:", error);
  }
}

/**
 * Route protection helper: redirects unauthenticated users to login with a returnUrl
 */
export async function requireUser(returnUrl?: string): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    const destination = returnUrl 
      ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` 
      : "/login";
    redirect(destination);
  }
  return user;
}
