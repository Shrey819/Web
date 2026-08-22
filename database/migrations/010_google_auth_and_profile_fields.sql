-- Migration 010: Google Authentication & Profile Fields
-- Adds google_sub for Google OAuth identity and ensures image/avatar fields are indexed

ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "google_sub" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "avatar" TEXT;

-- Create unique index on google_sub for fast lookups and preventing duplicate Google accounts
CREATE UNIQUE INDEX IF NOT EXISTS "User_google_sub_key" ON "User"("google_sub");

-- Index on User email if not already present
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");

-- Ensure Account table has index for provider lookup
CREATE INDEX IF NOT EXISTS "idx_account_provider_lookup" ON "Account"("provider", "providerAccountId");
