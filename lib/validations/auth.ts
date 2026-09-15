import { z } from "zod";
import { emailSchema, phoneSchema, idSchema } from "./common";

/**
 * Public Customer Registration Schema:
 * - Enforces password bounds: 8 to 128 characters to protect Argon2 hashing against DoS
 * - Strictly rejects any role or privileged field attempts
 */
export const userRegistrationSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),
    phone: phoneSchema.optional().or(z.literal("")),
  })
  .strict();

/**
 * Customer / User Login Schema:
 * - Max 128 chars on password to reject oversized payloads before Argon2 verification
 */
export const userLoginSchema = z
  .object({
    email: emailSchema,
    password: z
      .string()
      .min(1, "Password is required")
      .max(128, "Password cannot exceed 128 characters"),
  })
  .strict();

/**
 * Customer Profile Update Schema:
 * - Allows only customer-editable fields
 * - Strictly rejects privileged fields (role, id, emailVerified, passwordHash, etc.)
 */
export const userProfileUpdateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name cannot be empty")
      .max(100, "Name cannot exceed 100 characters")
      .optional(),
    phone: phoneSchema.optional().or(z.literal("")),
    companyName: z
      .string()
      .trim()
      .max(100, "Company name cannot exceed 100 characters")
      .optional()
      .or(z.literal("")),
  })
  .strict();

/**
 * Admin User Creation Schema:
 * - Strictly permits only CUSTOMER or ADMIN roles
 */
export const adminUserCreateSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Name is required")
      .max(100, "Name cannot exceed 100 characters"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128, "Password cannot exceed 128 characters"),
    role: z.enum(["CUSTOMER", "ADMIN"], {
      message: "Role must be either CUSTOMER or ADMIN",
    }),
  })
  .strict();

/**
 * Admin User Role Update Schema:
 * - Only CUSTOMER or ADMIN roles permitted
 */
export const adminUserRoleUpdateSchema = z
  .object({
    userId: idSchema,
    role: z.enum(["CUSTOMER", "ADMIN"], {
      message: "Role must be either CUSTOMER or ADMIN",
    }),
  })
  .strict();

/**
 * Google Auth Token Schema
 */
export const googleAuthInputSchema = z
  .object({
    idToken: z
      .string()
      .min(1, "ID token is required")
      .max(4096, "ID token is abnormally large"),
    returnUrl: z.string().max(500).optional(),
  })
  .strict();
