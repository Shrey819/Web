-- database/migrations/003_multi_category_support.sql

-- 1. Create ProductCategory join table for multi-category support
CREATE TABLE IF NOT EXISTS "ProductCategory" (
    "productId" TEXT NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "categoryId" TEXT NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("productId", "categoryId")
);

-- 2. Populate ProductCategory table from existing Product.categoryId
INSERT INTO "ProductCategory" ("productId", "categoryId")
SELECT "id", "categoryId"
FROM "Product"
WHERE "categoryId" IS NOT NULL AND "categoryId" != ''
ON CONFLICT ("productId", "categoryId") DO NOTHING;

-- 3. Make categoryId in Product table nullable for safe migration
ALTER TABLE "Product" ALTER COLUMN "categoryId" DROP NOT NULL;
