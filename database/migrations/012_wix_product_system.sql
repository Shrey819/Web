-- database/migrations/012_wix_product_system.sql

-- 1. Product Ribbons
CREATE TABLE IF NOT EXISTS "ProductRibbon" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "color" TEXT DEFAULT '#2563eb',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed default ribbons if table is empty
INSERT INTO "ProductRibbon" ("id", "name", "color")
VALUES 
  ('ribbon_bestseller', 'Best Seller', '#f59e0b'),
  ('ribbon_newarrival', 'New Arrival', '#10b981'),
  ('ribbon_sale', 'Sale', '#ef4444')
ON CONFLICT ("name") DO NOTHING;

-- 2. Product Tags
CREATE TABLE IF NOT EXISTS "ProductTag" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed sample tags
INSERT INTO "ProductTag" ("id", "name")
VALUES 
  ('tag_1', 'tag.name'),
  ('tag_2', 'tag_here'),
  ('tag_3', 'tag_me'),
  ('tag_4', 'me_tag'),
  ('tag_5', 'play_tag'),
  ('tag_6', 'more_tag'),
  ('tag_7', 'zero_tag')
ON CONFLICT ("name") DO NOTHING;

CREATE TABLE IF NOT EXISTS "ProductTagAssignment" (
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "tagId" TEXT NOT NULL REFERENCES "ProductTag"("id") ON DELETE CASCADE,
    PRIMARY KEY ("productId", "tagId")
);

-- 3. Global Option Names & Field Types
CREATE TABLE IF NOT EXISTS "GlobalOption" (
    "id" TEXT PRIMARY KEY,
    "name" TEXT UNIQUE NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT_CHOICES', -- 'TEXT_CHOICES' | 'SWATCH_CHOICES'
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO "GlobalOption" ("id", "name", "fieldType")
VALUES 
  ('gopt_color', 'Color', 'SWATCH_CHOICES'),
  ('gopt_fragrance', 'Fragrance', 'SWATCH_CHOICES'),
  ('gopt_size', 'Size', 'TEXT_CHOICES'),
  ('gopt_model', 'Model', 'TEXT_CHOICES')
ON CONFLICT ("name") DO NOTHING;

-- 4. Global / Reusable Info Sections
CREATE TABLE IF NOT EXISTS "GlobalInfoSection" (
    "id" TEXT PRIMARY KEY,
    "internalName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL DEFAULT '',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed standard default info sections
INSERT INTO "GlobalInfoSection" ("id", "internalName", "title", "content", "sortOrder")
VALUES 
  ('sec_demo', 'Hello Options', 'Demo', '<ul><li>opc1</li><li>opc2</li><li>opc3</li><li>opc4</li></ul>', 0),
  ('sec_prodinfo', 'Product Info', 'Product Info', '<p>I''m a great place to add more information about your product, such as <strong>sizing, material, care</strong>, and <strong>cleaning instructions</strong>. This is also a great space to highlight what makes this product special and how your customers can benefit from this item.</p>', 1),
  ('sec_return', 'Return & Refund Policy', 'Return & Refund Policy', '<p>I''m a great place to let your customers know what to do in case they are dissatisfied with their purchase. Having a straightforward refund or exchange policy is a great way to build trust and reassure your customers that they can buy with confidence.</p>', 2),
  ('sec_shipping', 'Shipping Info', 'Shipping Info', '<p>I''m a great place to add more information about your shipping methods, packaging, and cost. Providing clear information about your shipping policy is a great way to build trust and reassure your customers that they can buy with confidence.</p>', 3)
ON CONFLICT ("id") DO NOTHING;

CREATE TABLE IF NOT EXISTS "ProductAssignedInfoSection" (
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "sectionId" TEXT NOT NULL REFERENCES "GlobalInfoSection"("id") ON DELETE CASCADE,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY ("productId", "sectionId")
);

-- 5. Extend Product Table with missing Wix-standard attributes
ALTER TABLE "Product"
  ALTER COLUMN "brandId" DROP NOT NULL;

ALTER TABLE "Product"
  ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "price" INTEGER,
  ADD COLUMN IF NOT EXISTS "strikethroughPrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "primaryCategoryId" TEXT REFERENCES "Category"("id"),
  ADD COLUMN IF NOT EXISTS "primaryRibbon" TEXT,
  ADD COLUMN IF NOT EXISTS "showInPos" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS "showPricePerUnit" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "baseUnit" NUMERIC DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "baseUnitMeasurement" TEXT DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS "totalUnits" NUMERIC,
  ADD COLUMN IF NOT EXISTS "totalUnitsMeasurement" TEXT DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS "taxGroup" TEXT DEFAULT 'Products (default rate)',
  ADD COLUMN IF NOT EXISTS "brand" TEXT;

-- 6. Ensure ProductOption & ProductOptionChoice tables
CREATE TABLE IF NOT EXISTS "ProductOption" (
    "id" TEXT PRIMARY KEY,
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "globalOptionId" TEXT,
    "name" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'TEXT_CHOICES',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "ProductOptionChoice" (
    "id" TEXT PRIMARY KEY,
    "optionId" TEXT NOT NULL REFERENCES "ProductOption"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "colorHex" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "ProductOption"
  ADD COLUMN IF NOT EXISTS "globalOptionId" TEXT,
  ADD COLUMN IF NOT EXISTS "fieldType" TEXT DEFAULT 'TEXT_CHOICES',
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;

ALTER TABLE "ProductOptionChoice"
  ADD COLUMN IF NOT EXISTS "colorHex" TEXT,
  ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER DEFAULT 0;

-- 7. Ensure ProductVariant columns for full matrix capabilities
ALTER TABLE "ProductVariant"
  ADD COLUMN IF NOT EXISTS "strikethroughPrice" INTEGER,
  ADD COLUMN IF NOT EXISTS "cost" INTEGER,
  ADD COLUMN IF NOT EXISTS "trackQuantity" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "stockQuantity" INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS "inventoryStatus" TEXT DEFAULT 'IN_STOCK',
  ADD COLUMN IF NOT EXISTS "preOrderEnabled" BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS "preOrderLimit" INTEGER,
  ADD COLUMN IF NOT EXISTS "totalUnits" NUMERIC,
  ADD COLUMN IF NOT EXISTS "totalUnitsMeasurement" TEXT DEFAULT 'g',
  ADD COLUMN IF NOT EXISTS "packageLength" NUMERIC,
  ADD COLUMN IF NOT EXISTS "packageWidth" NUMERIC,
  ADD COLUMN IF NOT EXISTS "packageHeight" NUMERIC,
  ADD COLUMN IF NOT EXISTS "packageUnit" TEXT DEFAULT 'cm',
  ADD COLUMN IF NOT EXISTS "mediaUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "attributes" JSONB DEFAULT '{}'::jsonb;
