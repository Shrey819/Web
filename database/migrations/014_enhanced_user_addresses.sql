-- Migration 014: Enhanced User Addresses with Type & Contact Details
CREATE TABLE IF NOT EXISTS "Address" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "companyName" TEXT,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'India',
    "phone" TEXT,
    "email" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Home',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "phone" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "email" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'Home';
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "isDefault" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'India';
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "Address_userId_idx" ON "Address"("userId");
