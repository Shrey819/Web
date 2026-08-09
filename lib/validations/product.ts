import { z } from "zod";

export const productStatusEnum = z.enum([
  "DRAFT",
  "ACTIVE",
  "SCHEDULED",
  "ARCHIVED",
  "OUT_OF_STOCK",
  "DISCONTINUED"
]);

export const productMediaSchema = z.object({
  id: z.string().optional(),
  url: z.string().url("Must be a valid image URL"),
  altText: z.string().optional().default(""),
  caption: z.string().optional().default(""),
  isPrimary: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});

export const productDocumentSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Document title is required"),
  documentType: z.enum(["datasheet", "manual", "cad", "wiring", "certificate", "brochure"]).default("datasheet"),
  fileUrl: z.string().url("Must be a valid document URL"),
  version: z.string().optional().default("v1.0"),
  fileSize: z.string().optional().default(""),
  sortOrder: z.number().int().default(0),
});

export const productSpecificationSchema = z.object({
  id: z.string().optional(),
  groupName: z.string().min(1, "Group name is required"),
  name: z.string().min(1, "Spec name is required"),
  value: z.string().min(1, "Spec value is required"),
  unit: z.string().optional().default(""),
  sortOrder: z.number().int().default(0),
});

export const productVariantSchema = z.object({
  id: z.string().optional(),
  sku: z.string().min(1, "Variant SKU is required"),
  barcode: z.string().optional().default(""),
  price: z.number().min(0, "Price cannot be negative"),
  salePrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  stockQuantity: z.number().int().min(0).default(0),
  weight: z.number().min(0).optional().nullable(),
  status: z.string().default("active"),
  attributes: z.record(z.string(), z.string()).optional().default({}),
});

export const productFormSchema = z.object({
  id: z.string().optional(),
  productCode: z.string().optional(),
  name: z.string().min(2, "Product name must be at least 2 characters"),
  slug: z.string().optional().default(""),
  sku: z.string().optional().default(""),
  barcode: z.string().optional().default(""),
  mpn: z.string().optional().default(""),
  upc: z.string().optional().default(""),
  ean: z.string().optional().default(""),
  gtin: z.string().optional().default(""),
  manufacturer: z.string().optional().default(""),
  shortDescription: z.string().optional().default(""),
  description: z.string().optional().default(""),
  
  // Categorization
  categoryId: z.string().min(1, "Category is required"),
  categoryIds: z.array(z.string()).default([]),
  brandId: z.string().optional().default("default-brand"),
  
  // Status & Publishing
  status: productStatusEnum.default("DRAFT"),
  featured: z.boolean().default(false),
  bestSeller: z.boolean().default(false),
  newArrival: z.boolean().default(false),
  quoteOnly: z.boolean().default(false),
  b2bQuoteRequired: z.boolean().default(false),
  priceOnRequest: z.boolean().default(false),
  
  // Pricing (stored in paise / currency units)
  basePrice: z.number().min(0, "Base price must be 0 or greater"),
  salePrice: z.number().min(0).optional().nullable(),
  compareAtPrice: z.number().min(0).optional().nullable(),
  costPrice: z.number().min(0).optional().nullable(),
  wholesalePrice: z.number().min(0).optional().nullable(),
  dealerPrice: z.number().min(0).optional().nullable(),
  gstRate: z.number().min(0).max(100).default(18.0),
  priceIncTax: z.boolean().default(false),
  unit: z.enum(["PIECE", "PACK", "SET", "BOX", "LITRE"]).default("PIECE"),
  packSize: z.number().int().min(1).default(1),
  minOrderQuantity: z.number().int().min(1).default(1),
  
  // Inventory
  stockQuantity: z.number().int().min(0).default(100),
  lowStockThreshold: z.number().int().min(0).default(10),
  allowBackorders: z.boolean().default(false),
  trackInventory: z.boolean().default(true),
  warehouse: z.string().optional().default("Main Warehouse"),
  binLocation: z.string().optional().default(""),
  
  // Shipping & Physical
  isPhysical: z.boolean().default(true),
  weight: z.number().min(0).optional().nullable(),
  weightUnit: z.string().default("kg"),
  length: z.number().min(0).optional().nullable(),
  width: z.number().min(0).optional().nullable(),
  height: z.number().min(0).optional().nullable(),
  dimensionUnit: z.string().default("cm"),
  shippingClass: z.string().optional().default("Standard"),
  freeShipping: z.boolean().default(false),
  isFragile: z.boolean().default(false),
  isDangerousGoods: z.boolean().default(false),
  countryOfOrigin: z.string().optional().default("India"),
  hsCode: z.string().optional().default(""),
  
  // SEO
  seoTitle: z.string().optional().default(""),
  seoDesc: z.string().optional().default(""),
  canonicalUrl: z.string().optional().default(""),
  openGraphTitle: z.string().optional().default(""),
  openGraphDesc: z.string().optional().default(""),
  openGraphImage: z.string().optional().default(""),
  noIndex: z.boolean().default(false),
  
  // Warranty & Support
  warrantyPeriod: z.string().optional().default("12 Months"),
  warrantyType: z.string().optional().default("Manufacturer Standard"),
  isReturnable: z.boolean().default(true),
  returnWindowDays: z.number().int().min(0).default(14),
  installationAvailable: z.boolean().default(false),
  technicalSupportAvailable: z.boolean().default(true),
  calibrationRequired: z.boolean().default(false),
  
  // Relational Collections
  images: z.array(productMediaSchema).default([]),
  documents: z.array(productDocumentSchema).default([]),
  specifications: z.array(productSpecificationSchema).default([]),
  variants: z.array(productVariantSchema).default([]),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
