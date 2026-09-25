import { z } from "zod";

/**
 * Common string ID schema (handles UUIDs, CUIDs, custom prefixed IDs like ord_xxx, usr_xxx).
 * Bounded to 64 characters to prevent abuse.
 */
export const idSchema = z
  .string()
  .trim()
  .min(1, "Identifier cannot be empty")
  .max(64, "Identifier exceeds maximum length")
  .regex(/^[a-zA-Z0-9_\-]+$/, "Identifier contains invalid characters");

/**
 * Strict UUID schema for endpoints strictly expecting UUIDs.
 */
export const uuidSchema = z.string().trim().uuid("Invalid UUID format");

/**
 * Strict person name schema (used for customer fullName, recipient name, user name):
 * - Minimum 2, maximum 70 characters
 * - Only alphabetic characters (A-Z, a-z), spaces, dots, hyphens, and apostrophes allowed
 * - Strictly disallows numbers and special characters (!, @, #, $, %, ^, &, *, +, =, <, >, ?, /, \, _, ~, etc.)
 * - Must start with a letter and contain at least 2 letters
 */
export const personNameSchema = z
  .string({ message: "Full name is required" })
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(70, "Full name cannot exceed 70 characters")
  .regex(
    /^[a-zA-Z\s.'-]+$/,
    "Full name can only contain letters and spaces. Special characters and numbers are not allowed."
  )
  .refine((val) => /^[a-zA-Z]/.test(val), {
    message: "Full name must start with a letter",
  })
  .refine((val) => val.replace(/[^a-zA-Z]/g, "").length >= 2, {
    message: "Full name must contain at least 2 letters",
  });

/**
 * Normalized email schema:
 * - Trims whitespace
 * - Converts to lowercase
 * - Enforces standard email format
 * - Bounds maximum length to 255 chars
 */
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(255, "Email address is too long")
  .email("Invalid email address format");

/**
 * Phone number schema:
 * - Allows international formats with leading +
 * - Length between 7 and 20 chars
 * - Contains only numbers, spaces, hyphens, parentheses, and leading plus
 */
export const phoneSchema = z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long")
  .regex(/^\+?[0-9\s\-()]{7,20}$/, "Invalid phone number format");

/**
 * Quantity schema:
 * - Strictly an integer
 * - Minimum 1
 * - Maximum 1000 (preserves project quantity boundary from Task #2)
 */
export const quantitySchema = z
  .number({ message: "Quantity must be a number" })
  .int("Quantity must be a whole number")
  .min(1, "Quantity must be at least 1")
  .max(1000, "Quantity cannot exceed 1,000");

/**
 * Coerced quantity for forms/query parameters
 */
export const coercedQuantitySchema = z.preprocess((val) => {
  if (typeof val === "string" && val.trim() !== "") {
    const parsed = Number(val);
    return isNaN(parsed) ? val : parsed;
  }
  return val;
}, quantitySchema);

/**
 * Authoritative money schema (in paise):
 * - Non-negative integer
 * - Max 100,000,000 paise (₹1,000,000)
 */
export const moneyPaiseSchema = z
  .number({ message: "Amount must be a number" })
  .int("Amount in paise must be a whole number")
  .min(0, "Amount cannot be negative")
  .max(100000000, "Amount exceeds maximum permitted value");

/**
 * Bounded pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Search query schema
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .max(100, "Search query too long");

/**
 * Escapes PostgreSQL LIKE/ILIKE special pattern characters (% and _)
 * to treat input as literal text when interpolating into parameterized LIKE statements.
 */
export function escapeLikePattern(str: string): string {
  return str.replace(/([%_\\])/g, "\\$1");
}
