import { z } from "zod";
import { emailSchema, phoneSchema } from "./common";

/**
 * Allowlists and validates individual settings entries for the store
 */
export const booleanSettingKeys = new Set([
  "cod_enabled",
  "maintenance_mode",
  "shiprocket_enabled",
  "shiprocket_auto_sync",
]);

export const numericSettingKeys = new Set([
  "min_order_value",
  "tax_rate",
  "shiprocket_default_weight",
  "shiprocket_default_length",
  "shiprocket_default_breadth",
  "shiprocket_default_height",
]);

export const storeSettingsSchema = z
  .object({
    store_name: z.string().trim().max(100).optional(),
    support_email: emailSchema.optional().or(z.literal("")),
    support_phone: phoneSchema.optional().or(z.literal("")),
    sub_contact_1_name: z.string().trim().max(100).optional(),
    sub_contact_1_phone: phoneSchema.optional().or(z.literal("")),
    sub_contact_2_name: z.string().trim().max(100).optional(),
    sub_contact_2_phone: phoneSchema.optional().or(z.literal("")),
    sub_contact_3_name: z.string().trim().max(100).optional(),
    sub_contact_3_phone: phoneSchema.optional().or(z.literal("")),
    sub_email_1: emailSchema.optional().or(z.literal("")),
    sub_email_2: emailSchema.optional().or(z.literal("")),
    gst_number: z.string().trim().max(30).optional(),
    min_order_value: z
      .coerce
      .number()
      .min(0, "Minimum order value cannot be negative")
      .max(10000000, "Minimum order value exceeds limit")
      .optional(),
    tax_rate: z
      .coerce
      .number()
      .min(0, "Tax rate cannot be negative")
      .max(100, "Tax rate cannot exceed 100%")
      .optional(),
    cod_enabled: z.boolean().optional(),
    maintenance_mode: z.boolean().optional(),
    shiprocket_enabled: z.boolean().optional(),
    shiprocket_email: emailSchema.optional().or(z.literal("")),
    shiprocket_password: z.string().max(255).optional(),
    shiprocket_pickup_location: z.string().trim().max(100).optional(),
    shiprocket_pickup_pincode: z
      .string()
      .trim()
      .regex(/^[0-9]{6}$/, "Pickup pincode must be a 6-digit number")
      .optional()
      .or(z.literal("")),
    shiprocket_default_weight: z
      .coerce
      .number()
      .min(0)
      .max(1000)
      .optional(),
    shiprocket_default_length: z
      .coerce
      .number()
      .min(0)
      .max(500)
      .optional(),
    shiprocket_default_breadth: z
      .coerce
      .number()
      .min(0)
      .max(500)
      .optional(),
    shiprocket_default_height: z
      .coerce
      .number()
      .min(0)
      .max(500)
      .optional(),
    shiprocket_auto_sync: z.boolean().optional(),
  })
  .strict();
