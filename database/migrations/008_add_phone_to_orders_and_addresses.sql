-- Migration 008: Add shippingPhone to Order and phone to Address

ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippingPhone" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "phone" TEXT;
