-- Migration 005: User Actions Telemetry & Identity Tracking

ALTER TABLE "UserSession" 
ADD COLUMN IF NOT EXISTS "userName" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "userEmail" VARCHAR(150),
ADD COLUMN IF NOT EXISTS "userId" VARCHAR(64);

CREATE TABLE IF NOT EXISTS "UserActionLog" (
    "id" VARCHAR(64) PRIMARY KEY,
    "sessionId" VARCHAR(64) NOT NULL REFERENCES "UserSession"("sessionId") ON DELETE CASCADE,
    "actionType" VARCHAR(50) NOT NULL, -- ADD_TO_CART, REMOVE_FROM_CART, SIGN_IN, SIGN_OUT, APPLY_COUPON, etc.
    "details" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_useractionlog_session" ON "UserActionLog"("sessionId");
