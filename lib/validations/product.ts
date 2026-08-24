import { z } from "zod";

const toNullableNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return null;
  const num = Number(val);
  return isNaN(num) ? null : num;
}, z.number().nullish());

const toRequiredNumber = z.preprocess((val) => {
  if (val === "" || val === null || val === undefined) return 0;
  const num = Number(val);
  return isNaN(num) ? 0 : num;
}, z.number().default(0));

const toInventoryStatus = z.preprocess((val) => {
  if (typeof val === "string") {
    const clean = val.toUpperCase().replace(/\s+/g, "_");
    if (clean === "OUT_OF_STOCK") return "OUT_OF_STOCK";
    return "IN_STOCK";
  }
  return "IN_STOCK";
}, z.enum(["IN_STOCK", "OUT_OF_STOCK"]).default("IN_STOCK"));

export const productMediaSchema = z.object({
  id: z.string().nullish(),
  url: z.string().min(1, "Media URL is required"),
  altText: z.string().nullish().default(""),
  isPrimary: z.boolean().nullish().default(false),
  sortOrder: z.number().int().nullish().default(0),
});

export const productOptionChoiceSchema = z.object({
  id: z.string().nullish(),
  name: z.string().min(1, "Choice name is required").max(50, "Choice name cannot exceed 50 characters"),
  colorHex: z.string().nullish().default(""),
  sortOrder: z.number().int().nullish().default(0),
});

export const productOptionSchema = z.object({
  id: z.string().nullish(),
  globalOptionId: z.string().nullish(),
  name: z.string().min(1, "Option name is required"),
  fieldType: z.preprocess((v) => {
    if (!v || v === "DROPDOWN" || v === "RADIO" || v === "TEXT") return "TEXT_CHOICES";
    if (v === "COLOR" || v === "SWATCH") return "SWATCH_CHOICES";
    return v;
  }, z.enum(["TEXT_CHOICES", "SWATCH_CHOICES"]).nullish().default("TEXT_CHOICES")),
  sortOrder: z.number().int().nullish().default(0),
  choices: z.array(productOptionChoiceSchema).nullish().default([]),
});

export const productVariantSchema = z.object({
  id: z.string().nullish(),
  sku: z.string().nullish().default(""),
  barcode: z.string().nullish().default(""),
  price: toRequiredNumber,
  strikethroughPrice: toNullableNumber,
  cost: toNullableNumber,
  trackQuantity: z.boolean().nullish().default(false),
  stockQuantity: toNullableNumber.transform((v) => (v != null ? Math.round(v) : 100)),
  inventoryStatus: toInventoryStatus,
  preOrderEnabled: z.boolean().nullish().default(false),
  preOrderLimit: toNullableNumber.transform((v) => (v != null ? Math.round(v) : null)),
  totalUnits: toNullableNumber,
  totalUnitsMeasurement: z.string().nullish().default("g"),
  packageLength: toNullableNumber,
  packageWidth: toNullableNumber,
  packageHeight: toNullableNumber,
  packageUnit: z.string().nullish().default("cm"),
  mediaUrl: z.string().nullish().default(""),
  attributes: z.record(z.string(), z.string()).nullish().default({}),
  displayName: z.string().nullish().default(""),
});

export const productFormSchema = z.object({
  id: z.string().nullish(),
  name: z.string().min(1, "Product name is required").max(80, "Product name cannot exceed 80 characters"),
  slug: z.string().nullish().default(""),
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
  price: toRequiredNumber,
  strikethroughPrice: toNullableNumber,
  costPrice: toNullableNumber,
  showPricePerUnit: z.boolean().default(false),
  baseUnit: toRequiredNumber.default(100),
  baseUnitMeasurement: z.string().default("g"),
  totalUnits: toNullableNumber,
  totalUnitsMeasurement: z.string().default("g"),
  taxGroup: z.string().nullish().default(""),

  // Media (Limit of 10)
  images: z.array(productMediaSchema).max(10, "Maximum 10 images/videos allowed").default([]),

  // Options & Variants
  options: z.array(productOptionSchema).max(6, "Maximum 6 options allowed").default([]),
  variants: z.array(productVariantSchema).max(1000, "Maximum 1,000 variants allowed").default([]),

  // Additional Info Sections
  infoSectionIds: z.array(z.string()).default([]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductVariantFormValues = z.infer<typeof productVariantSchema>;
