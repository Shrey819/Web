import { NextResponse } from "next/server";

export const SESSION_COOKIE_NAME = "om_session";

export interface OriginCheckResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates that an incoming state-changing request (POST, PUT, DELETE, PATCH)
 * originates from the same site and is not a Cross-Site Request Forgery (CSRF).
 *
 * Security checks applied:
 * 1. Sec-Fetch-Site: Rejects requests explicitly tagged by modern browsers as 'cross-site'.
 * 2. Origin Header: Ensures the Origin matches the request Host, NEXT_PUBLIC_SITE_URL, or allowed dev origins.
 * 3. Referer Header Fallback: Validates the Referer origin if Origin header was omitted.
 * 4. Authenticated Request Boundary: Rejects authenticated browser mutations that omit Origin/Referer.
 */
export function verifyRequestOrigin(request: Request): OriginCheckResult {
  const method = request.method.toUpperCase();
  // Safe HTTP read methods are exempt from CSRF origin checks
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") {
    return { valid: true };
  }

  // 1. Check Fetch Metadata (Sec-Fetch-Site)
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return { valid: false, reason: "Cross-site request blocked by Sec-Fetch-Site" };
  }

  // 2. Resolve Allowed Hosts
  const rawHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const host = rawHost.split(",")[0].trim().toLowerCase();

  const allowedHosts = new Set<string>();
  if (host) {
    allowedHosts.add(host);
    // Also add port-stripped version if port was included
    if (host.includes(":")) {
      allowedHosts.add(host.split(":")[0]);
    }
  }

  // Add configured site URL host
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    try {
      const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL);
      allowedHosts.add(siteUrl.host.toLowerCase());
      if (siteUrl.hostname) {
        allowedHosts.add(siteUrl.hostname.toLowerCase());
      }
    } catch {}
  }

  // In non-production, permit local development and tunneling hosts
  const isDev = process.env.NODE_ENV !== "production";
  if (isDev) {
    allowedHosts.add("localhost:3000");
    allowedHosts.add("localhost");
    allowedHosts.add("127.0.0.1:3000");
    allowedHosts.add("127.0.0.1");
  }

  const isHostAllowed = (testHost: string): boolean => {
    const cleanTest = testHost.toLowerCase();
    if (allowedHosts.has(cleanTest)) return true;
    if (cleanTest.includes(":") && allowedHosts.has(cleanTest.split(":")[0])) return true;
    if (isDev) {
      if (
        cleanTest.endsWith(".ngrok-free.app") ||
        cleanTest.endsWith(".ngrok-free.dev") ||
        cleanTest.endsWith(".ngrok.app") ||
        cleanTest.endsWith(".ngrok.io") ||
        cleanTest.startsWith("localhost") ||
        cleanTest.startsWith("127.0.0.1")
      ) {
        return true;
      }
    }
    return false;
  };

  // 3. Inspect Origin Header
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    try {
      const originUrl = new URL(originHeader);
      if (!isHostAllowed(originUrl.host)) {
        return {
          valid: false,
          reason: `Origin '${originHeader}' does not match allowed host '${host || "unknown"}'`,
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, reason: "Malformed Origin header" };
    }
  }

  // 4. Inspect Referer Header Fallback
  const refererHeader = request.headers.get("referer");
  if (refererHeader) {
    try {
      const refererUrl = new URL(refererHeader);
      if (!isHostAllowed(refererUrl.host)) {
        return {
          valid: false,
          reason: `Referer '${refererHeader}' does not match allowed host '${host || "unknown"}'`,
        };
      }
      return { valid: true };
    } catch {
      return { valid: false, reason: "Malformed Referer header" };
    }
  }

  // 5. Handle Absence of Origin and Referer
  // If Sec-Fetch-Site explicitly indicates same-origin/same-site/none, allow
  if (secFetchSite === "same-origin" || secFetchSite === "same-site" || secFetchSite === "none") {
    return { valid: true };
  }

  // If request contains session cookies (authenticated browser context) but completely
  // lacks Origin, Referer, and safe Sec-Fetch-Site, reject to prevent blind cross-site submission
  const cookieHeader = request.headers.get("cookie");
  if (
    cookieHeader &&
    (cookieHeader.includes(SESSION_COOKIE_NAME) ||
      cookieHeader.includes("next-auth.session-token") ||
      cookieHeader.includes("__Secure-next-auth.session-token"))
  ) {
    return {
      valid: false,
      reason: "Authenticated mutation requires Origin or Referer header verification",
    };
  }

  return { valid: true };
}

/**
 * Guard function for API Route Handlers.
 * Returns a 403 Forbidden NextResponse if origin verification fails, or null if valid.
 */
export function requireValidOrigin(request: Request): NextResponse | null {
  const check = verifyRequestOrigin(request);
  if (!check.valid) {
    return NextResponse.json(
      {
        error: "Forbidden: Cross-site request rejected.",
        reason: check.reason,
      },
      { status: 403 }
    );
  }
  return null;
}
