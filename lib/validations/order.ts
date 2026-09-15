import { z } from "zod";
import { idSchema, emailSchema, phoneSchema, quantitySchema } from "./common";

/**
 * Validates individual item in order/cart submissions
 */
export const orderItemInputSchema = z
  .object({
    productId: idSchema,
    name: z.string().max(200).optional(),
    sku: z.string().max(100).optional(),
    price: z.number().optional(), // Non-authoritative, derived server-side
    quantity: quantitySchema,
    variantId: z.string().max(64).optional().nullable(),
    buyerNote: z.string().max(1000).optional().nullable(),
  })
  .strict();

/**
 * Validates shipping address during checkout
 */
export const orderAddressInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(100, "Full name cannot exceed 100 characters"),
  companyName: z.string().trim().max(100).optional().or(z.literal("")),
  email: emailSchema,
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
  country: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .default("India"),
});

/**
 * Authoritative checkout order creation schema
 */
export const createOrderInputSchema = orderAddressInputSchema
  .extend({
    items: z
      .array(orderItemInputSchema)
      .min(1, "Cannot place order: Cart is empty")
      .max(100, "Cannot place order: Cart exceeds maximum limit of 100 items"),
    paymentMethod: z.enum(["cod", "prepaid", "po", "card"], {
      message: "Invalid payment method",
    }),
    paymentReference: z.string().trim().max(100).optional(),
    poNumber: z.string().trim().max(50).optional(),
    cardNumber: z.string().trim().max(30).optional(),
    addressType: z.string().trim().max(30).optional(),
    saveAddress: z.boolean().optional().default(false),
    couponCode: z.string().trim().max(50).optional().or(z.literal("")),
    userId: z.string().optional(), // Ignored/stripped for security, derived from session
  })
  .strict();

/**
 * Pre-order creation schema for Razorpay
 */
export const createRazorpayOrderInputSchema = z
  .object({
    items: z
      .array(orderItemInputSchema)
      .min(1, "Cart cannot be empty")
      .max(100, "Cart exceeds maximum 100 items limit"),
    couponCode: z.string().trim().max(50).optional().or(z.literal("")),
    amount: z.number().optional(), // Ignored, derived from server pricing
    currency: z.string().trim().max(10).optional(),
    notes: z.record(z.string(), z.string().max(255)).optional(),
  })
  .strict();

/**
 * Complete prepaid order verification and creation schema
 */
export const createPrepaidOrderInputSchema = orderAddressInputSchema
  .extend({
    items: z
      .array(orderItemInputSchema)
      .min(1, "Cannot place order: Cart is empty")
      .max(100, "Cannot place order: Cart exceeds maximum limit of 100 items"),
    addressType: z.string().trim().max(30).optional(),
    saveAddress: z.boolean().optional().default(false),
    couponCode: z.string().trim().max(50).optional().or(z.literal("")),
    userId: z.string().optional(), // Ignored/stripped, derived from session
    razorpay_order_id: z
      .string()
      .trim()
      .min(1, "Razorpay Order ID is required")
      .max(100)
      .regex(/^order_[a-zA-Z0-9]+$/, "Invalid Razorpay order ID format"),
    razorpay_payment_id: z
      .string()
      .trim()
      .min(1, "Razorpay Payment ID is required")
      .max(100)
      .regex(/^pay_[a-zA-Z0-9]+$/, "Invalid Razorpay payment ID format"),
    razorpay_signature: z
      .string()
      .trim()
      .length(64, "Razorpay signature must be a 64-character hex string")
      .regex(/^[0-9a-fA-F]{64}$/, "Razorpay signature must be hexadecimal"),
  })
  .strict();

/**
 * Order status update schema
 */
export const orderStatusUpdateSchema = z
  .object({
    orderId: idSchema,
    status: z.enum(
      [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
      ],
      { message: "Invalid order status value" }
    ),
  })
  .strict();

/**
 * Order payment method update schema
 */
export const orderPaymentMethodUpdateSchema = z
  .object({
    orderId: idSchema,
    paymentMethod: z
      .string()
      .trim()
      .min(1, "Payment method is required")
      .max(50, "Payment method is too long"),
  })
  .strict();

/**
 * Order item note update schema
 */
export const orderItemNoteUpdateSchema = z
  .object({
    orderItemId: idSchema,
    note: z
      .string()
      .trim()
      .max(1000, "Order item note cannot exceed 1,000 characters"),
  })
  .strict();

/**
 * Cancel order input schema
 */
export const cancelOrderInputSchema = z
  .object({
    orderId: idSchema,
    reason: z
      .string()
      .trim()
      .max(500, "Cancellation reason cannot exceed 500 characters")
      .optional(),
  })
  .strict();
