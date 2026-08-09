-- Migration 006: Hybrid Location (1st Priority IP, 2nd Priority Timezone)

ALTER TABLE "UserSession"
ADD COLUMN IF NOT EXISTS "clientTimezone" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "primarySource" VARCHAR(20) DEFAULT 'IP',
ADD COLUMN IF NOT EXISTS "isVpn" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "secondaryCountry" VARCHAR(100);
