/**
 * Client-safe and server-safe URL validation and sanitization.
 * Zero external dependencies — safe to use anywhere in Next.js (client or server).
 */

/**
 * Validate that a URL uses an approved safe scheme (http, https, mailto, or relative path).
 * Strictly rejects javascript:, data:, vbscript:, and control characters.
 */
export function isSafeUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") {
    return false;
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return false;
  }
  // Reject control characters
  if (/[\x00-\x1F\x7F]/.test(trimmed)) {
    return false;
  }
  // Reject dangerous pseudo-protocols
  if (/^(?:javascript|data|vbscript):/i.test(trimmed)) {
    return false;
  }
  // Allow safe root-relative URLs (e.g. /products, /catalog/part-1)
  if (trimmed.startsWith("/") && !trimmed.startsWith("//") && !trimmed.startsWith("/\\")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Return a safe URL string or fallback value (defaulting to empty string).
 */
export function sanitizeUrl(url?: string | null, fallback: string = ""): string {
  if (isSafeUrl(url)) {
    return (url as string).trim();
  }
  return fallback;
}
