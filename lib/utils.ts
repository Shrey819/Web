import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, "")
    .replace(/ +/g, "-");
}

export function calculateDiscount(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function formatDisplayPhone(raw?: string | null): string {
  if (!raw) return "";
  let cleaned = raw.trim();

  // Strip repeated +91 / country code e.g. "+91 +91 8530478239" or "+91+91"
  while (/^\+?91[\s-]*\+?91/i.test(cleaned)) {
    cleaned = cleaned.replace(/^\+?91[\s-]*\+?91[\s-]*/i, "+91 ");
  }

  // If it already starts with +, clean internal extra spacing
  if (cleaned.startsWith("+")) {
    const parts = cleaned.split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0]} ${parts.slice(1).join(" ")}`;
    }
    if (cleaned.startsWith("+91") && cleaned.length === 13) {
      return `+91 ${cleaned.slice(3)}`;
    }
    return cleaned;
  }

  // If 10 digits without + prefix, format as +91 XXXXXXXXXX
  const digits = cleaned.replace(/\D/g, "");
  if (digits.length === 10) {
    return `+91 ${digits}`;
  }
  if (digits.length === 12 && digits.startsWith("91")) {
    return `+91 ${digits.slice(2)}`;
  }

  return cleaned ? `+91 ${cleaned}` : "";
}

/**
 * Strictly sanitizes a redirect callback URL to prevent open redirect vulnerabilities.
 * Allows ONLY relative paths on the same origin (starting with a single /).
 * Rejects absolute URLs, scheme prefixes (http:, javascript:, data:), protocol-relative (//),
 * backslashes (\), and encoded bypass tricks.
 */
export function sanitizeCallbackUrl(rawUrl?: string | null, fallback = "/profile"): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return fallback;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return fallback;
  }

  // Must start with exactly one forward slash, followed by a non-slash, non-backslash character
  if (!trimmed.startsWith("/") || trimmed.startsWith("//") || trimmed.startsWith("/\\")) {
    return fallback;
  }

  // Disallow any backslashes anywhere in the path to avoid browser normalizations (e.g. /\evil.com or /foo\bar)
  if (trimmed.includes("\\")) {
    return fallback;
  }

  // Disallow scheme indicators like 'javascript:', 'data:', 'https:', etc. before query/fragment
  // Also check if decoded URL contains scheme indicators
  try {
    const decoded = decodeURIComponent(trimmed);
    if (decoded.startsWith("//") || decoded.startsWith("/\\") || decoded.includes("\\")) {
      return fallback;
    }
    // Check if there is a colon before any '?' or '#'
    const pathPart = decoded.split(/[?#]/)[0];
    if (pathPart.includes(":")) {
      return fallback;
    }
  } catch {
    // Malformed URI encoding
    return fallback;
  }

  return trimmed;
}

/**
 * Validates a person's full name:
 * - Must be at least 2 characters and at most 70 characters
 * - Only alphabetic characters (A-Z, a-z), spaces, dots, hyphens, and apostrophes are permitted
 * - Numbers and special characters (@, #, $, %, etc.) are strictly disallowed
 * - Must start with a letter and contain at least 2 letters
 */
export function validatePersonName(name?: string | null): { isValid: boolean; error?: string } {
  if (!name || typeof name !== "string") {
    return { isValid: false, error: "Full name is required." };
  }

  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Full name is required." };
  }

  if (trimmed.length < 2) {
    return { isValid: false, error: "Full name must be at least 2 characters." };
  }

  if (trimmed.length > 70) {
    return { isValid: false, error: "Full name cannot exceed 70 characters." };
  }

  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: "Full name can only contain letters and spaces. Special characters and numbers are not allowed.",
    };
  }

  if (!/^[a-zA-Z]/.test(trimmed)) {
    return { isValid: false, error: "Full name must start with a letter." };
  }

  if (trimmed.replace(/[^a-zA-Z]/g, "").length < 2) {
    return { isValid: false, error: "Full name must contain at least 2 letters." };
  }

  return { isValid: true };
}

/**
 * Validates an email address:
 * - Must not contain spaces or forbidden characters (#, $, %, etc.)
 * - Must contain exactly one '@'
 * - Must have a valid domain and TLD extension (.com, .in, etc.)
 */
export function validateEmailAddress(email?: string | null): { isValid: boolean; error?: string } {
  if (!email || typeof email !== "string") {
    return { isValid: false, error: "Corporate email is required." };
  }

  const trimmed = email.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: "Corporate email is required." };
  }

  if (trimmed.length > 254) {
    return { isValid: false, error: "Email cannot exceed 254 characters." };
  }

  if (/\s/.test(trimmed)) {
    return { isValid: false, error: "Email address cannot contain spaces." };
  }

  if (/[#$!%^&*()=+[\]{}|;:"'<>?\\/]/i.test(trimmed)) {
    return { isValid: false, error: "Email address contains invalid special characters." };
  }

  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount === 0) {
    return { isValid: false, error: "Email address must include an '@' symbol." };
  }
  if (atCount > 1) {
    return { isValid: false, error: "Email address cannot contain more than one '@' symbol." };
  }

  const [localPart, domainPart] = trimmed.split("@");
  if (!localPart || localPart.length === 0) {
    return { isValid: false, error: "Email must include a username before '@'." };
  }
  if (!domainPart || domainPart.length === 0) {
    return { isValid: false, error: "Email must include a domain after '@' (e.g. company.com)." };
  }

  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    return { isValid: false, error: "Invalid placement of dots in email address." };
  }

  if (!domainPart.includes(".") || domainPart.startsWith(".") || domainPart.endsWith(".") || domainPart.includes("..")) {
    return { isValid: false, error: "Please enter a valid domain (e.g. company.com)." };
  }

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: "Please enter a valid email address (e.g. rahul@company.com)." };
  }

  return { isValid: true };
}

/**
 * Transforms high-resolution images (Cloudinary, Unsplash, etc.) into low-pixel,
 * highly compressed lightweight thumbnails for mega menus, mobile drawers, and cards.
 * Prevents loading multi-megabyte original images, saving 95%+ bandwidth and loading instantly.
 */
export function getOptimizedThumbnail(
  url?: string | null,
  width: number = 180,
  height: number = width
): string {
  if (!url || typeof url !== "string") return "";

  // Cloudinary image transformation
  if (url.includes("res.cloudinary.com") && url.includes("/image/upload/")) {
    if (url.includes("/image/upload/w_") || url.includes("/image/upload/c_")) {
      return url.replace(
        /\/image\/upload\/(w_[^/]+|c_[^/]+)\//,
        `/image/upload/w_${width},h_${height},c_fill,q_auto:eco,f_auto/`
      );
    }
    return url.replace(
      "/image/upload/",
      `/image/upload/w_${width},h_${height},c_fill,q_auto:eco,f_auto/`
    );
  }

  // Unsplash image transformation
  if (url.includes("images.unsplash.com")) {
    try {
      const parsed = new URL(url);
      parsed.searchParams.set("w", String(width));
      parsed.searchParams.set("h", String(height));
      parsed.searchParams.set("q", "80");
      parsed.searchParams.set("auto", "format");
      parsed.searchParams.set("fit", "crop");
      return parsed.toString();
    } catch {
      return url;
    }
  }

  return url;
}



