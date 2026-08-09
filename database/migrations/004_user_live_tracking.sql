-- Migration 004: User Live Tracking & Session Log Schema

CREATE TABLE IF NOT EXISTS "UserSession" (
    "sessionId" VARCHAR(64) PRIMARY KEY,
    "ipAddress" VARCHAR(45),
    "city" VARCHAR(100),
    "region" VARCHAR(100),
    "country" VARCHAR(100),
    "countryCode" VARCHAR(10),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "deviceType" VARCHAR(20) NOT NULL DEFAULT 'Desktop',
    "browser" VARCHAR(50),
    "os" VARCHAR(50),
    "currentPage" VARCHAR(255) NOT NULL,
    "currentPageStartedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "PageVisitLog" (
    "id" VARCHAR(64) PRIMARY KEY,
    "sessionId" VARCHAR(64) NOT NULL REFERENCES "UserSession"("sessionId") ON DELETE CASCADE,
    "pagePath" VARCHAR(255) NOT NULL,
    "durationSeconds" INT NOT NULL DEFAULT 0,
    "visitedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_usersession_lastactive" ON "UserSession"("lastActiveAt");
CREATE INDEX IF NOT EXISTS "idx_pagevisitlog_session" ON "PageVisitLog"("sessionId");
