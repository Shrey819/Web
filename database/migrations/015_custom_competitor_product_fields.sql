-- database/migrations/015_custom_competitor_product_fields.sql

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "featureHighlights" JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "applications" JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "technicalSupportLinks" JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS "enableBuyerNote" BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS "videoUrl" TEXT;
