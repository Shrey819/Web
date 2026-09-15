import { z } from "zod";
import { idSchema, emailSchema, phoneSchema, quantitySchema } from "./common";

/**
 * Public Inquiry / Contact form schema
 */
export const inquiryFormSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name cannot exceed 100 characters"),
    email: emailSchema,
    category: z.string().trim().max(100).optional().or(z.literal("")),
    message: z
      .string()
      .trim()
      .min(5, "Message must be at least 5 characters")
      .max(5000, "Message cannot exceed 5,000 characters"),
  })
  .strict();

/**
 * Promotional newsletter subscription schema
 */
export const newsletterSchema = z
  .object({
    email: emailSchema,
  })
  .strict();

/**
 * Admin Form submission status update schema
 */
export const formSubmissionStatusUpdateSchema = z
  .object({
    id: idSchema,
    status: z.enum(["unread", "read", "contacted", "archived"]),
  })
  .strict();

/**
 * Quote / RFQ item schema
 */
export const quoteItemSchema = z
  .object({
    productId: idSchema.optional().nullable(),
    name: z
      .string()
      .trim()
      .min(1, "Item name is required")
      .max(200, "Item name is too long"),
    sku: z.string().trim().max(100).optional().nullable(),
    quantity: quantitySchema,
    notes: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();

/**
 * Quote / RFQ request schema
 */
export const createQuoteInputSchema = z
  .object({
    company: z
      .string()
      .trim()
      .min(1, "Company name is required")
      .max(100, "Company name cannot exceed 100 characters"),
    name: z
      .string()
      .trim()
      .min(1, "Contact name is required")
      .max(100, "Contact name cannot exceed 100 characters"),
    email: emailSchema,
    phone: phoneSchema,
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
    items: z
      .array(quoteItemSchema)
      .min(1, "At least one item is required for a quote")
      .max(50, "Maximum 50 items allowed per quote request"),
  })
  .strict();

/**
 * Quote status update schema
 */
export const quoteStatusUpdateSchema = z
  .object({
    quoteId: idSchema,
    status: z.enum(["pending", "reviewed", "quoted", "rejected", "accepted"]),
  })
  .strict();
