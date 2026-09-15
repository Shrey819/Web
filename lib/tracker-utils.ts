/**
 * Shared Tracker Types and Sanitization Utilities
 * Can be imported by both Server Components / Actions and Client Components.
 */

export interface UserAction {
  id: string;
  sessionId: string;
  actionType: string;
  details: string;
  createdAt: string;
}

export interface PageVisit {
  id: string;
  sessionId: string;
  pagePath: string;
  durationSeconds: number;
  visitedAt: string;
}

/**
 * Safe Active Session DTO:
 * Excludes raw IP addresses, exact coordinates, user IDs, and raw emails.
 */
export interface SafeActiveSessionDTO {
  sessionId: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  os: string;
  currentPage: string;
  currentPageStartedAt: string;
  lastActiveAt: string;
  secondsOnCurrentPage: number;
  totalSessionSeconds: number;
  userName: string;
  maskedEmail?: string;
  clientTimezone?: string;
  primarySource?: "IP" | "TIMEZONE";
  isVpn?: boolean;
  secondaryCountry?: string;
  visitHistory?: PageVisit[];
  actionLogs?: UserAction[];
}

export type ActiveSession = SafeActiveSessionDTO;

export const ALLOWED_ACTION_TYPES = new Set([
  "CLICK",
  "NAVIGATE",
  "PRODUCT_CLICK",
  "CATEGORY_CLICK",
  "CONTACT_CLICK",
  "MENU_OPEN",
  "SCROLL_DEPTH",
  "HOVER_CARD",
  "SEARCH",
  "SEARCH_QUERY",
  "ADD_TO_CART",
  "REMOVE_FROM_CART",
  "CART_OPEN",
  "APPLY_COUPON",
  "REMOVE_COUPON",
  "ADD_WISHLIST",
  "REMOVE_WISHLIST",
  "SIGN_IN",
  "SIGN_OUT",
]);

export const SENSITIVE_ROUTES = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api",
];

export function isSensitivePath(path: string): boolean {
  if (!path) return false;
  const clean = path.split("?")[0].toLowerCase().trim();
  return SENSITIVE_ROUTES.some((route) => clean === route || clean.startsWith(route + "/"));
}

export function sanitizePath(path: string): string {
  if (!path) return "/";
  let clean = path.split("?")[0].split("#")[0].trim();
  clean = clean.replace(/<[^>]*>/g, "").replace(/[^\x20-\x7E]/g, "");
  return clean.slice(0, 128) || "/";
}

export function anonymizeIp(ip: string): string {
  if (!ip) return "0.0.0.0";
  const clean = ip.trim();
  if (clean.includes(":")) {
    const blocks = clean.split(":");
    return blocks.slice(0, 3).join(":") + "::";
  }
  if (clean.includes(".")) {
    const parts = clean.split(".");
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`;
    }
  }
  return "0.0.0.0";
}

export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return "";
  const parts = email.split("@");
  const local = parts[0] || "";
  const domain = parts[1] || "";
  if (!domain) return "";
  const maskedLocal =
    local.length <= 2
      ? local[0] + "***"
      : local.slice(0, 2) + "***" + (local.length > 4 ? local.slice(-1) : "");
  return `${maskedLocal}@${domain}`;
}

export function sanitizeActionDetails(details: string): string {
  if (!details) return "";
  let clean = details.trim();
  clean = clean.replace(/\?[^ "')\]]+/g, "");
  clean = clean.replace(/<[^>]*>/g, "");
  clean = clean.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, (match) => maskEmail(match));
  return clean.slice(0, 255);
}
