import { z } from "zod";

export const productMediaSchema = z.object({
  id: z.string().nullish(),
  url: z.string().min(1, "Media URL is required"),
  altText: z.string().nullish().default(""),
  isPrimary: z.boolean().nullish().default(false),
  sortOrder: z.number().int().nullish().default(0),
});

export const productOptionChoiceSchema = z.object({
  id: z.string().nullish(),
  name: z.string().min(1, "Choice name is required"),
  colorHex: z.string().nullish().default(""),
  sortOrder: z.number().int().nullish().default(0),
});

export const productOptionSchema = z.object({
  id: z.string().nullish(),
  globalOptionId: z.string().nullish(),
  name: z.string().min(1, "Option name is required"),
  fieldType: z.enum(["TEXT_CHOICES", "SWATCH_CHOICES"]).nullish().default("TEXT_CHOICES"),
  sortOrder: z.number().int().nullish().default(0),
  choices: z.array(productOptionChoiceSchema).nullish().default([]),
});

export const productVariantSchema = z.object({
  id: z.string().nullish(),
  sku: z.string().nullish().default(""),
  barcode: z.string().nullish().default(""),
  price: z.number().min(0, "Price must be 0 or greater").default(0),
  strikethroughPrice: z.number().min(0).nullish(),
  cost: z.number().min(0).nullish(),
  trackQuantity: z.boolean().nullish().default(false),
  stockQuantity: z.number().int().min(0).nullish().default(100),
  inventoryStatus: z.enum(["IN_STOCK", "OUT_OF_STOCK"]).nullish().default("IN_STOCK"),
  preOrderEnabled: z.boolean().nullish().default(false),
  preOrderLimit: z.number().int().nullish(),
  totalUnits: z.number().nullish(),
  totalUnitsMeasurement: z.string().nullish().default("g"),
  packageLength: z.number().nullish(),
  packageWidth: z.number().nullish(),
  packageHeight: z.number().nullish(),
  packageUnit: z.string().nullish().default("cm"),
  mediaUrl: z.string().nullish().default(""),
  attributes: z.record(z.string(), z.string()).nullish().default({}),
  displayName: z.string().nullish().default(""),
});

export const productFormSchema = z.object({
  id: z.string().nullish(),
  name: z.string().min(1, "Product name is required").max(80, "Product name cannot exceed 80 characters"),
  description: z.string().nullish().default(""),
  
  // Visibility
  visible: z.boolean().default(true),
  showInPos: z.boolean().default(true),
  status: z.string().default("ACTIVE"),

  // Categorization & Hierarchy
  categoryId: z.string().default(""),
  categoryIds: z.array(z.string()).default([]),
  primaryCategoryId: z.string().default(""),

  // Ribbons, Brand, Tags
  primaryRibbon: z.string().nullish().default(""),
  brand: z.string().max(50, "Brand cannot exceed 50 characters").nullish().default(""),
  tagIds: z.array(z.string()).default([]),

  // Pricing
  price: z.number().min(0, "Price must be 0 or greater").default(0),
  strikethroughPrice: z.number().min(0).nullish(),
  costPrice: z.number().min(0).nullish(),
  showPricePerUnit: z.boolean().default(false),
  baseUnit: z.number().min(0).default(100),
  baseUnitMeasurement: z.string().default("g"),
  totalUnits: z.number().nullish(),
  totalUnitsMeasurement: z.string().default("g"),
  taxGroup: z.string().nullish().default(""),

  // Media (Limit of 10)
  images: z.array(productMediaSchema).max(10, "Maximum 10 images/videos allowed").default([]),

  // Options & Variants
  options: z.array(productOptionSchema).max(6, "Maximum 6 options allowed").default([]),
  variants: z.array(productVariantSchema).default([]),

  // Additional Info Sections
  infoSectionIds: z.array(z.string()).default([]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductVariantFormValues = z.infer<typeof productVariantSchema>;
