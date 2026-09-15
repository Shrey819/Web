import "server-only";
import { auth } from "@/auth";
import { getCurrentUser } from "@/lib/session";
import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { sanitizeCallbackUrl } from "@/lib/utils";

export { sanitizeCallbackUrl };

export class AuthError extends Error {
  statusCode: 401 | 403;

  constructor(statusCode: 401 | 403, message: string) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string | null;
  role: "ADMIN" | "CUSTOMER";
}

/**
 * Authoritatively validates a user ID and role directly from PostgreSQL.
 * Strict Two-Role Model: Only "ADMIN" or "CUSTOMER" are valid roles.
 * Eliminates stale JWT claims and forged tokens.
 */
export async function verifyUserRole(
  userId: string,
  requiredRole: "ADMIN" | "CUSTOMER" = "ADMIN"
): Promise<AuthenticatedUser> {
  if (!userId || userId.trim() === "") {
    throw new AuthError(401, "Authentication required. Please sign in.");
  }

  const res = await query(
    `SELECT id, email, name, role FROM "User" WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (res.rows.length === 0) {
    throw new AuthError(401, "Account not found or has been deactivated.");
  }

  const dbUser = res.rows[0];

  // Strict Two-Role Model: Exactly ADMIN or CUSTOMER.
  // Positive check: Only explicit "ADMIN" qualifies for administrative privileges.
  // Any legacy, unknown, malformed, or null role fails closed.
  const isDbAdmin = dbUser.role === "ADMIN";
  const normalizedRole: "ADMIN" | "CUSTOMER" = isDbAdmin ? "ADMIN" : "CUSTOMER";

  // Strict role check: If ADMIN is required, only explicit ADMIN is allowed
  if (requiredRole === "ADMIN" && !isDbAdmin) {
    throw new AuthError(403, "Access denied. Administrator privileges required.");
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    role: normalizedRole,
  };
}

/**
 * Centralized Server-Side Admin Authorization Guard.
 *
 * Security Guarantees:
 * 1. Strict Two-Role Model: Only "ADMIN" is authorized. "CUSTOMER", missing role,
 *    or unrecognized roles fail closed (401 unauthenticated or 403 forbidden).
 * 2. Database Verified: Queries PostgreSQL using the session user ID to eliminate
 *    stale JWT role vulnerabilities. If a user's role is revoked, subsequent requests
 *    immediately fail closed.
 * 3. Never trusts client-supplied headers, request bodies, cookies, or localStorage.
 */
export async function requireAdmin(explicitUserId?: string): Promise<AuthenticatedUser> {
  let userId: string | undefined = explicitUserId;

  // Step 1: Extract authenticated session if explicitUserId is not provided
  if (!userId) {
    try {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {
      // Non-request context or unauthenticated
    }
  }

  // Fallback to storefront session (om_session) if Auth.js session is absent
  if (!userId) {
    try {
      const storefrontUser = await getCurrentUser();
      if (storefrontUser?.id) {
        userId = storefrontUser.id;
      }
    } catch {
      // Non-request context or unauthenticated
    }
  }

  // Non-HTTP automated test execution hook
  if (!userId && (globalThis as any).__TEST_SESSION_USER_ID__) {
    userId = (globalThis as any).__TEST_SESSION_USER_ID__;
  }

  if (!userId) {
    throw new AuthError(401, "Authentication required. Please sign in to an administrative account.");
  }

  return verifyUserRole(userId, "ADMIN");
}

/**
 * Route-handler helper for Next.js Route Handlers (API routes).
 * Returns { user: AuthenticatedUser } or { errorResponse: NextResponse } with HTTP 401 or 403.
 */
export async function requireAdminApi(explicitUserId?: string): Promise<
  | { user: AuthenticatedUser; errorResponse?: never }
  | { user?: never; errorResponse: NextResponse }
> {
  try {
    const user = await requireAdmin(explicitUserId);
    return { user };
  } catch (err: any) {
    const status = err instanceof AuthError ? err.statusCode : 401;
    return {
      errorResponse: NextResponse.json(
        { error: err?.message || "Unauthorized" },
        { status }
      ),
    };
  }
}

/**
 * Verifies that the caller is an authenticated user (CUSTOMER or ADMIN).
 * Used for storefront user-scoped operations (own profile, addresses, own orders).
 */
export async function requireUser(explicitUserId?: string): Promise<AuthenticatedUser> {
  let userId: string | undefined = explicitUserId;

  if (!userId) {
    try {
      const session = await auth();
      if (session?.user?.id) {
        userId = session.user.id;
      }
    } catch {}
  }

  if (!userId) {
    try {
      const storefrontUser = await getCurrentUser();
      if (storefrontUser?.id) {
        userId = storefrontUser.id;
      }
    } catch {}
  }

  // Non-HTTP automated test execution hook
  if (!userId && (globalThis as any).__TEST_SESSION_USER_ID__) {
    userId = (globalThis as any).__TEST_SESSION_USER_ID__;
  }

  if (!userId) {
    throw new AuthError(401, "Authentication required. Please sign in.");
  }

  return verifyUserRole(userId, "CUSTOMER");
}

export const requireCustomer = requireUser;

/**
 * Returns the currently authenticated user if present and valid in DB,
 * or null if unauthenticated / guest. Does not throw AuthError.
 */
export async function getOptionalAuthenticatedUser(
  explicitUserId?: string
): Promise<AuthenticatedUser | null> {
  try {
    let userId: string | undefined = explicitUserId;

    if (!userId) {
      try {
        const session = await auth();
        if (session?.user?.id) {
          userId = session.user.id;
        }
      } catch {}
    }

    if (!userId) {
      try {
        const storefrontUser = await getCurrentUser();
        if (storefrontUser?.id) {
          userId = storefrontUser.id;
        }
      } catch {}
    }

    if (!userId && (globalThis as any).__TEST_SESSION_USER_ID__) {
      userId = (globalThis as any).__TEST_SESSION_USER_ID__;
    }

    if (!userId) return null;

    return await verifyUserRole(userId, "CUSTOMER");
  } catch {
    return null;
  }
}

