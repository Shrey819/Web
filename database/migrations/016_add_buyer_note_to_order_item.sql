-- Add buyerNote to OrderItem
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "buyerNote" TEXT;
