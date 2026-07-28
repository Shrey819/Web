-- database/migrations/002_professional_product_management.sql

-- 1. Product Code Sequence
CREATE SEQUENCE IF NOT EXISTS product_code_seq START WITH 10001;

-- 2. Extend Product Table Columns safely
ALTER TABLE "Product" 
  ADD COLUMN IF NOT EXISTS "productCode" TEXT,
  ADD COLUMN IF NOT EXISTS "barcode" TEXT,
  ADD COLUMN IF NOT EXISTS "mpn" TEXT,
  ADD COLUMN IF NOT EXISTS "upc" TEXT,
  ADD COLUMN IF NOT EXISTS "ean" TEXT,
  ADD COLUMN IF NOT EXISTS "gtin" TEXT,
  ADD COLUMN IF NOT EXISTS "manufacturer" TEXT,
  ADD COLUMN IF NOT EXISTS "salePrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "costPrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "wholesalePrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "dealerPrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "b2bQuoteRequired" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "priceOnRequest" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "publishedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "createdBy" TEXT,
  ADD COLUMN IF NOT EXISTS "updatedBy" TEXT,
  ADD COLUMN IF NOT EXISTS "isPhysical" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "weight" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "weightUnit" TEXT DEFAULT 'kg',
  ADD COLUMN IF NOT EXISTS "length" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "width" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "height" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "dimensionUnit" TEXT DEFAULT 'cm',
  ADD COLUMN IF NOT EXISTS "shippingClass" TEXT,
  ADD COLUMN IF NOT EXISTS "freeShipping" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isFragile" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "isDangerousGoods" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "countryOfOrigin" TEXT,
  ADD COLUMN IF NOT EXISTS "hsCode" TEXT,
  ADD COLUMN IF NOT EXISTS "canonicalUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "openGraphTitle" TEXT,
  ADD COLUMN IF NOT EXISTS "openGraphDesc" TEXT,
  ADD COLUMN IF NOT EXISTS "openGraphImage" TEXT,
  ADD COLUMN IF NOT EXISTS "noIndex" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "warrantyPeriod" TEXT,
  ADD COLUMN IF NOT EXISTS "warrantyType" TEXT,
  ADD COLUMN IF NOT EXISTS "isReturnable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "returnWindowDays" INTEGER DEFAULT 14,
  ADD COLUMN IF NOT EXISTS "installationAvailable" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "technicalSupportAvailable" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "calibrationRequired" BOOLEAN NOT NULL DEFAULT false;

-- 3. Unique Index on productCode where non-null
CREATE UNIQUE INDEX IF NOT EXISTS "Product_productCode_key" ON "Product"("productCode") WHERE "productCode" IS NOT NULL;

-- 4. Product Options for Variants
CREATE TABLE IF NOT EXISTS "ProductOption" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ProductOptionValue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "optionId" TEXT NOT NULL REFERENCES "ProductOption"("id") ON DELETE CASCADE,
    "value" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Product Price Tiers for B2B Volume Pricing
CREATE TABLE IF NOT EXISTS "ProductPriceTier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "minQuantity" INTEGER NOT NULL DEFAULT 1,
    "price" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Product Documents (Industrial Datasheets, CAD, Wiring Diagrams)
CREATE TABLE IF NOT EXISTS "ProductDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "title" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'datasheet', -- datasheet, manual, cad, wiring, certificate
    "fileUrl" TEXT NOT NULL,
    "version" TEXT,
    "fileSize" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Product Audit Log
CREATE TABLE IF NOT EXISTS "ProductAuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "changedBy" TEXT,
    "previousData" JSONB,
    "newData" JSONB,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
