import { NextResponse } from "next/server";

/**
 * Custom Error subclass for safe, user-facing error messages that are
 * intentionally displayed to users (e.g. business validation failures).
 */
export class SafeActionError extends Error {
  readonly isSafe = true;

  constructor(message: string) {
    super(message);
    this.name = "SafeActionError";
    Object.setPrototypeOf(this, SafeActionError.prototype);
  }
}

/**
 * Patterns that indicate internal system details, database internals,
 * infrastructure errors, or sensitive secrets that must never be exposed to clients.
 */
const SENSITIVE_PATTERNS: RegExp[] = [
  // Database tables, relations, columns, constraints
  /relation\s+["']?[a-zA-Z0-9_]+["']?/i,
  /column\s+["']?[a-zA-Z0-9_]+["']?/i,
  /syntax\s+error\s+at\s+or\s+near/i,
  /violates\s+foreign\s+key/i,
  /violates\s+unique\s+constraint/i,
  /duplicate\s+key\s+value/i,
  /null\s+value\s+in\s+column/i,
  /check\s+constraint/i,
  /pg_[a-zA-Z0-9_]+/i,
  /psql/i,
  /\bneon\b/i,
  /neon\.tech/i,
  /postgresql:\/\//i,
  /DATABASE_URL/i,

  // SQL queries
  /\bSELECT\b\s+.*\bFROM\b/i,
  /\bINSERT\b\s+\bINTO\b/i,
  /\bUPDATE\b\s+.*\bSET\b/i,
  /\bDELETE\b\s+\bFROM\b/i,

  // Low-level network / socket errors
  /ECONNREFUSED/i,
  /ETIMEDOUT/i,
  /ENOTFOUND/i,
  /EAI_AGAIN/i,
  /socket\s+hang\s+up/i,
  /connection\s+reset/i,
  /poolClient/i,

  // File system paths and stack frames
  /[a-zA-Z]:\\[^\s]+/i, // Windows paths e.g. D:\Website\app\...
  /\/Users\/[^\s]+/i,   // Mac / Linux user paths
  /\/home\/[^\s]+/i,
  /\/var\/[^\s]+/i,
  /node_modules/i,
  /\bat\s+[a-zA-Z0-9_.]+\s+\(/i, // Stack trace frames "at Object.<anonymous> ("
  /TypeError:/i,
  /ReferenceError:/i,
  /RangeError:/i,

  // Sensitive credentials / tokens
  /api[_-]?secret/i,
  /api[_-]?key/i,
  /secret[_-]?key/i,
  /Bearer\s+[a-zA-Z0-9._-]+/i,
  /argon2/i,
  /password/i,
];

/**
 * Checks whether an error is an internal database error (e.g. Postgres pg driver)
 * or a low-level OS/network system error.
 */
export function isDatabaseOrSystemError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const err = error as Record<string, unknown>;

  // Postgres pg driver error attributes
  if (
    typeof err.routine === "string" ||
    typeof err.schema === "string" ||
    typeof err.table === "string" ||
    typeof err.detail === "string"
  ) {
    return true;
  }

  // Known Postgres SQLSTATE 5-character alphanumeric codes or system error codes
  if (typeof err.code === "string") {
    // 5-character SQLSTATE (e.g. '23505', '42P01', '08006', '42601')
    if (/^[0-9A-Z]{5}$/.test(err.code)) return true;
    // Node.js syscall error codes (e.g. 'ECONNREFUSED', 'ENOENT', 'ETIMEDOUT')
    if (/^E[A-Z_]+$/.test(err.code)) return true;
  }

  return false;
}

/**
 * Checks whether an error message string contains sensitive information.
 */
export function isSensitiveErrorMessage(message: string): boolean {
  if (!message || typeof message !== "string") return false;
  return SENSITIVE_PATTERNS.some((pattern) => pattern.test(message));
}

/**
 * Sanitizes an error to produce a safe user-facing message.
 * - SafeActionError instances (or objects with isSafe: true) are always returned intact.
 * - Database errors (Postgres pg driver codes, tables, schemas, details) are masked with fallbackMessage.
 * - Any message matching sensitive patterns (SQL, paths, stack traces, secrets) is replaced with fallbackMessage.
 * - Clean user-facing business validation messages are preserved.
 */
export function sanitizeErrorMessage(
  error: unknown,
  fallbackMessage = "An unexpected error occurred. Please try again."
): string {
  if (
    error instanceof SafeActionError ||
    (error && typeof error === "object" && (error as Record<string, unknown>).isSafe === true)
  ) {
    return (error as Error).message || fallbackMessage;
  }

  // Check for Postgres or low-level Node OS errors
  if (isDatabaseOrSystemError(error)) {
    return fallbackMessage;
  }

  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "";

  if (!rawMessage || isSensitiveErrorMessage(rawMessage)) {
    return fallbackMessage;
  }

  return rawMessage;
}

/**
 * Standardizes Server Action failure responses, logging the full diagnostic
 * error server-side while returning a sanitized client-safe error object.
 */
export function safeActionResponse(
  error: unknown,
  fallbackMessage: string,
  extraContext?: string
): { success: false; error: string } {
  const logPrefix = extraContext ? `[Action Error - ${extraContext}]` : "[Action Error]";
  console.error(`${logPrefix} ${fallbackMessage}:`, error);

  return {
    success: false,
    error: sanitizeErrorMessage(error, fallbackMessage),
  };
}

/**
 * Standardizes API Route failure responses, logging the full diagnostic error
 * server-side while returning a sanitized NextResponse.
 */
export function safeApiResponse(
  error: unknown,
  fallbackMessage: string,
  status = 500,
  extraContext?: string
): NextResponse {
  const logPrefix = extraContext ? `[API Error - ${extraContext}]` : "[API Error]";
  console.error(`${logPrefix} ${fallbackMessage}:`, error);

  return NextResponse.json(
    { error: sanitizeErrorMessage(error, fallbackMessage) },
    { status }
  );
}
