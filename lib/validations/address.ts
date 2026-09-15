import { z } from "zod";
import { idSchema, emailSchema, phoneSchema } from "./common";

/**
 * Customer address creation schema
 */
export const addressCreateSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, "Full name is required")
      .max(100, "Full name cannot exceed 100 characters"),
    companyName: z.string().trim().max(100).optional().nullable(),
    email: emailSchema.optional().nullable().or(z.literal("")),
    phone: phoneSchema,
    street: z
      .string()
      .trim()
      .min(1, "Street address is required")
      .max(255, "Street address cannot exceed 255 characters"),
    city: z
      .string()
      .trim()
      .min(1, "City is required")
      .max(100, "City cannot exceed 100 characters"),
    state: z
      .string()
      .trim()
      .min(1, "State is required")
      .max(100, "State cannot exceed 100 characters"),
    zip: z
      .string()
      .trim()
      .min(3, "Postal code is too short")
      .max(12, "Postal code cannot exceed 12 characters")
      .regex(/^[a-zA-Z0-9\s-]+$/, "Postal code contains invalid characters"),
    country: z.string().trim().max(100).optional().nullable().default("India"),
    type: z.string().trim().max(30).optional().nullable().default("HOME"),
    isDefault: z.boolean().optional().default(false),
  })
  .strict();

/**
 * Customer address update schema
 */
export const addressUpdateSchema = addressCreateSchema
  .partial()
  .extend({
    id: idSchema,
  })
  .strict();
