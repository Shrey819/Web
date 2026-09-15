import { z } from "zod";

/**
 * Allowlists permitted parameter keys for Cloudinary signature generation.
 * Strictly prevents arbitrary parameter injection (e.g. callback URLs, unauthorized transformations).
 */
export const cloudinarySignParamsSchema = z
  .object({
    timestamp: z.coerce.number().int().positive("Timestamp must be a positive integer"),
    folder: z
      .string()
      .trim()
      .max(100, "Folder name is too long")
      .regex(/^[a-zA-Z0-9_\-/]+$/, "Invalid folder name format")
      .optional(),
    upload_preset: z
      .string()
      .trim()
      .max(100)
      .regex(/^[a-zA-Z0-9_\-]+$/, "Invalid upload preset format")
      .optional(),
    public_id: z
      .string()
      .trim()
      .max(100)
      .regex(/^[a-zA-Z0-9_\-/]+$/, "Invalid public ID format")
      .optional(),
    transformation: z.string().trim().max(200).optional(),
    source: z.string().trim().max(50).optional(),
    type: z.string().trim().max(50).optional(),
  })
  .strict();

export const cloudinarySignRequestSchema = z
  .object({
    paramsToSign: cloudinarySignParamsSchema,
  })
  .strict();
