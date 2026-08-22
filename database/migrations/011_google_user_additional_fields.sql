-- Migration 011: Add given_name, family_name, and locale to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "given_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "family_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "locale" VARCHAR(50);
