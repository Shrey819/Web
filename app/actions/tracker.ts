"use server";

import { query, transaction } from "@/lib/db";
import { requireAdmin } from "@/lib/auth-checks";
import crypto from "crypto";
import {
  type UserAction,
  type PageVisit,
  type SafeActiveSessionDTO,
  type ActiveSession,
  ALLOWED_ACTION_TYPES,
  isSensitivePath,
  sanitizePath,
  anonymizeIp,
  maskEmail,
  sanitizeActionDetails,
} from "@/lib/tracker-utils";

interface CoarseLocation {
  city: string;
  region: string;
  country: string;
  countryCode: string;
  primarySource: "IP" | "TIMEZONE";
  isVpn: boolean;
  secondaryCountry?: string;
}

const geoCache = new Map<string, { data: CoarseLocation; timestamp: number }>();

function generateId(prefix: string = "id_"): string {
  return prefix + crypto.randomBytes(12).toString("hex");
}

function mapTimezoneToGeo(tz: string): { country: string; countryCode: string; city: string } {
  const cleanTz = (tz || "").trim().toLowerCase();
  if (cleanTz.includes("calcutta") || cleanTz.includes("kolkata") || cleanTz.includes("asia/kabul") || cleanTz.includes("ist")) {
    return { country: "India", countryCode: "IN", city: "Mumbai" };
  }
  if (cleanTz.includes("new_york") || cleanTz.includes("chicago") || cleanTz.includes("los_angeles") || cleanTz.includes("america/")) {
    return { country: "United States", countryCode: "US", city: "New York" };
  }
  if (cleanTz.includes("london") || cleanTz.includes("europe/london")) {
    return { country: "United Kingdom", countryCode: "GB", city: "London" };
  }
  if (cleanTz.includes("berlin") || cleanTz.includes("paris") || cleanTz.includes("rome") || cleanTz.includes("europe/")) {
    return { country: "Germany", countryCode: "DE", city: "Berlin" };
  }
  if (cleanTz.includes("tokyo") || cleanTz.includes("asia/tokyo")) {
    return { country: "Japan", countryCode: "JP", city: "Tokyo" };
  }
  if (cleanTz.includes("sydney") || cleanTz.includes("australia/")) {
    return { country: "Australia", countryCode: "AU", city: "Sydney" };
  }
  return { country: "India", countryCode: "IN", city: "Jaipur" };
}

/**
 * HYBRID COARSE LOCATION RESOLUTION (1st Priority Subnet IP, 2nd Priority Timezone)
 * NEVER returns exact latitude/longitude or raw host IP.
 */
async function resolveHybridLocation(ip: string, clientTimezone?: string): Promise<CoarseLocation> {
  const maskedIp = anonymizeIp(ip);
  const isLocal =
    !ip ||
    ip === "::1" ||
    ip === "127.0.0.1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("::ffff:127.0.0.1");

  const cacheKey = isLocal ? "local_subnet" : maskedIp;
  const cached = geoCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 3600000) {
    const tzGeo = mapTimezoneToGeo(clientTimezone || "");
    const isVpn = cached.data.countryCode !== tzGeo.countryCode && !isLocal;
    return {
      ...cached.data,
      isVpn,
      secondaryCountry: isVpn ? tzGeo.country : undefined,
    };
  }

  // 1st PRIORITY: IP GEOLOCATION API (using coarse/truncated IP)
  try {
    const endpoint = isLocal ? "https://ipwho.is/" : `https://ipwho.is/${maskedIp}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.success) {
        const tzGeo = mapTimezoneToGeo(clientTimezone || "");
        const countryCode = data.country_code || "IN";
        const isVpn = countryCode !== tzGeo.countryCode && !isLocal;

        const coarseData: CoarseLocation = {
          city: data.city || "Unknown City",
          region: data.region || "Unknown Region",
          country: data.country || "India",
          countryCode,
          primarySource: "IP",
          isVpn,
          secondaryCountry: isVpn ? tzGeo.country : undefined,
        };

        geoCache.set(cacheKey, { data: coarseData, timestamp: Date.now() });
        return coarseData;
      }
    }
  } catch (err) {
    console.error("1st Priority IP lookup failed/timed out, falling back to 2nd Priority Timezone:", err);
  }

  // 2nd PRIORITY FALLBACK: CLIENT TIMEZONE
  const tzGeo = mapTimezoneToGeo(clientTimezone || "");
  const fallbackResult: CoarseLocation = {
    city: tzGeo.city,
    region: tzGeo.country,
    country: tzGeo.country,
    countryCode: tzGeo.countryCode,
    primarySource: "TIMEZONE",
    isVpn: false,
  };

  geoCache.set(cacheKey, { data: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

/**
 * Purge sessions inactive for 15 minutes, and prune logs older than 7 days.
 */
export async function purgeExpiredSessions(): Promise<number> {
  try {
    const sessionRes = await query(
      `DELETE FROM "UserSession" WHERE "lastActiveAt" < NOW() - INTERVAL '15 minutes'`
    );
    await query(
      `DELETE FROM "UserActionLog" WHERE "createdAt" < NOW() - INTERVAL '7 days'`
    );
    await query(
      `DELETE FROM "PageVisitLog" WHERE "visitedAt" < NOW() - INTERVAL '7 days'`
    );
    return sessionRes.rowCount || 0;
  } catch (error) {
    console.error("Failed to purge expired sessions and prune logs:", error);
    return 0;
  }
}

export async function recordUserHeartbeat(params: {
  sessionId: string;
  ipAddress: string;
  currentPage: string;
  deviceType?: "Desktop" | "Mobile" | "Tablet";
  browser?: string;
  os?: string;
  userName?: string;
  userEmail?: string;
  userId?: string;
  clientTimezone?: string;
  pageDurationSeconds?: number;
  previousPage?: string;
  previousPageDuration?: number;
}) {
  const {
    sessionId,
    ipAddress,
    currentPage,
    deviceType = "Desktop",
    browser = "Unknown Browser",
    os = "Unknown OS",
    userName,
    userEmail,
    clientTimezone,
    previousPage,
    previousPageDuration = 0,
  } = params;

  // 1. Exclude sensitive routes from tracking
  const cleanCurrentPage = sanitizePath(currentPage);
  if (isSensitivePath(cleanCurrentPage)) {
    return { success: true, ignored: true };
  }

  // 2. Anonymize IP to subnet and mask email
  const maskedIp = anonymizeIp(ipAddress);
  const maskedUserEmail = userEmail ? maskEmail(userEmail) : null;

  try {
    await purgeExpiredSessions();
    const geo = await resolveHybridLocation(ipAddress, clientTimezone);

    await transaction(async (client) => {
      const existing = await client.query(
        `SELECT "sessionId", "currentPage" FROM "UserSession" WHERE "sessionId" = $1 LIMIT 1`,
        [sessionId]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO "UserSession" (
            "sessionId", "ipAddress", "city", "region", "country", "countryCode",
            "latitude", "longitude", "deviceType", "browser", "os", "currentPage",
            "userName", "userEmail", "userId", "clientTimezone", "primarySource", "isVpn", "secondaryCountry",
            "currentPageStartedAt", "lastActiveAt", "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8, $9, $10, $11, $12, NULL, $13, $14, $15, $16, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            sessionId,
            maskedIp,
            geo.city,
            geo.region,
            geo.country,
            geo.countryCode,
            deviceType,
            browser.slice(0, 50),
            os.slice(0, 50),
            cleanCurrentPage,
            userName ? userName.slice(0, 100) : null,
            maskedUserEmail,
            clientTimezone ? clientTimezone.slice(0, 100) : null,
            geo.primarySource,
            geo.isVpn,
            geo.secondaryCountry || null,
          ]
        );
      } else {
        const currentSession = existing.rows[0];
        const pageChanged = currentSession.currentPage !== cleanCurrentPage;

        if (pageChanged) {
          if (currentSession.currentPage && previousPageDuration > 0 && !isSensitivePath(currentSession.currentPage)) {
            await client.query(
              `INSERT INTO "PageVisitLog" ("id", "sessionId", "pagePath", "durationSeconds", "visitedAt")
               VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
              [generateId("pvl_"), sessionId, sanitizePath(currentSession.currentPage), previousPageDuration]
            );
          }

          await client.query(
            `UPDATE "UserSession" SET
              "currentPage" = $1,
              "currentPageStartedAt" = CURRENT_TIMESTAMP,
              "lastActiveAt" = CURRENT_TIMESTAMP,
              "deviceType" = $2,
              "userName" = COALESCE($3, "userName"),
              "userEmail" = COALESCE($4, "userEmail"),
              "clientTimezone" = COALESCE($5, "clientTimezone"),
              "ipAddress" = $6,
              "city" = $7,
              "region" = $8,
              "country" = $9,
              "countryCode" = $10,
              "latitude" = NULL,
              "longitude" = NULL,
              "primarySource" = $11,
              "isVpn" = $12,
              "secondaryCountry" = $13
             WHERE "sessionId" = $14`,
            [
              cleanCurrentPage,
              deviceType,
              userName ? userName.slice(0, 100) : null,
              maskedUserEmail,
              clientTimezone ? clientTimezone.slice(0, 100) : null,
              maskedIp,
              geo.city,
              geo.region,
              geo.country,
              geo.countryCode,
              geo.primarySource,
              geo.isVpn,
              geo.secondaryCountry || null,
              sessionId,
            ]
          );
        } else {
          await client.query(
            `UPDATE "UserSession" SET 
              "lastActiveAt" = CURRENT_TIMESTAMP, 
              "deviceType" = $1,
              "userName" = COALESCE($2, "userName"),
              "userEmail" = COALESCE($3, "userEmail"),
              "clientTimezone" = COALESCE($4, "clientTimezone"),
              "ipAddress" = $5,
              "city" = $6,
              "region" = $7,
              "country" = $8,
              "countryCode" = $9,
              "latitude" = NULL,
              "longitude" = NULL,
              "primarySource" = $10,
              "isVpn" = $11,
              "secondaryCountry" = $12
             WHERE "sessionId" = $13`,
            [
              deviceType,
              userName ? userName.slice(0, 100) : null,
              maskedUserEmail,
              clientTimezone ? clientTimezone.slice(0, 100) : null,
              maskedIp,
              geo.city,
              geo.region,
              geo.country,
              geo.countryCode,
              geo.primarySource,
              geo.isVpn,
              geo.secondaryCountry || null,
              sessionId,
            ]
          );
        }
      }
    });

    return { success: true };
  } catch (error) {
    console.error("Error recording user heartbeat:", error);
    return { success: false, error: String(error) };
  }
}

export async function recordUserAction(params: {
  sessionId: string;
  actionType: string;
  details: string;
  userName?: string;
  userEmail?: string;
}) {
  const { sessionId, actionType, details, userName, userEmail } = params;

  // Validate actionType against whitelist
  if (!ALLOWED_ACTION_TYPES.has(actionType)) {
    return { success: false, error: "Invalid or unsupported action type" };
  }

  // Sanitize details and mask email
  const sanitizedDetails = sanitizeActionDetails(details);
  const maskedUserEmail = userEmail ? maskEmail(userEmail) : null;

  try {
    const actionId = generateId("act_");
    await transaction(async (client) => {
      await client.query(
        `INSERT INTO "UserActionLog" ("id", "sessionId", "actionType", "details", "createdAt")
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [actionId, sessionId, actionType, sanitizedDetails]
      );

      await client.query(
        `UPDATE "UserSession" 
         SET "lastActiveAt" = CURRENT_TIMESTAMP,
             "userName" = COALESCE($1, "userName"),
             "userEmail" = COALESCE($2, "userEmail")
         WHERE "sessionId" = $3`,
        [userName ? userName.slice(0, 100) : null, maskedUserEmail, sessionId]
      );
    });

    return { success: true, actionId };
  } catch (error) {
    console.error("Failed to record user action:", error);
    return { success: false, error: String(error) };
  }
}

export async function getActiveUserSessions(): Promise<{
  sessions: SafeActiveSessionDTO[];
  totalActive: number;
  desktopCount: number;
  mobileCount: number;
  tabletCount: number;
  topPages: { path: string; count: number }[];
  recentActions: UserAction[];
}> {
  await requireAdmin();
  try {
    await purgeExpiredSessions();

    const res = await query(
      `SELECT 
        s."sessionId", s."ipAddress", s."city", s."region", s."country", s."countryCode",
        s."deviceType", s."browser", s."os", s."currentPage", s."userName", s."userEmail",
        s."clientTimezone", s."primarySource", s."isVpn", s."secondaryCountry",
        s."currentPageStartedAt", s."lastActiveAt", s."createdAt",
        EXTRACT(EPOCH FROM (NOW() - s."currentPageStartedAt"))::INT as "secondsOnCurrentPage",
        EXTRACT(EPOCH FROM (NOW() - s."createdAt"))::INT as "totalSessionSeconds"
       FROM "UserSession" s
       WHERE s."lastActiveAt" >= NOW() - INTERVAL '15 minutes'
       ORDER BY s."lastActiveAt" DESC`
    );

    const sessionIds = res.rows.map((r) => r.sessionId);
    let historyMap: Record<string, PageVisit[]> = {};
    let actionsMap: Record<string, UserAction[]> = {};
    let recentActions: UserAction[] = [];

    if (sessionIds.length > 0) {
      const [historyRes, actionsRes] = await Promise.all([
        query(
          `SELECT "id", "sessionId", "pagePath", "durationSeconds", "visitedAt" FROM "PageVisitLog" 
           WHERE "sessionId" = ANY($1::text[]) 
           ORDER BY "visitedAt" DESC 
           LIMIT 300`,
          [sessionIds]
        ),
        query(
          `SELECT "id", "sessionId", "actionType", "details", "createdAt" FROM "UserActionLog" 
           WHERE "sessionId" = ANY($1::text[]) 
           ORDER BY "createdAt" DESC 
           LIMIT 300`,
          [sessionIds]
        ),
      ]);

      historyRes.rows.forEach((h) => {
        if (!historyMap[h.sessionId]) historyMap[h.sessionId] = [];
        historyMap[h.sessionId].push({
          id: h.id,
          sessionId: h.sessionId,
          pagePath: h.pagePath,
          durationSeconds: h.durationSeconds,
          visitedAt: h.visitedAt,
        });
      });

      actionsRes.rows.forEach((a) => {
        const item: UserAction = {
          id: a.id,
          sessionId: a.sessionId,
          actionType: a.actionType,
          details: a.details,
          createdAt: a.createdAt,
        };
        if (!actionsMap[a.sessionId]) actionsMap[a.sessionId] = [];
        actionsMap[a.sessionId].push(item);
        recentActions.push(item);
      });
    }

    // Map rows into SafeActiveSessionDTO (NEVER return raw IP or exact coordinates)
    const sessions: SafeActiveSessionDTO[] = res.rows.map((r) => ({
      sessionId: r.sessionId,
      city: r.city || "Unknown City",
      region: r.region || "Unknown Region",
      country: r.country || "India",
      countryCode: r.countryCode || "IN",
      deviceType: r.deviceType || "Desktop",
      browser: r.browser || "Unknown",
      os: r.os || "Unknown",
      currentPage: r.currentPage,
      currentPageStartedAt: new Date(r.currentPageStartedAt).toISOString(),
      lastActiveAt: new Date(r.lastActiveAt).toISOString(),
      secondsOnCurrentPage: Math.max(0, parseInt(r.secondsOnCurrentPage) || 0),
      totalSessionSeconds: Math.max(0, parseInt(r.totalSessionSeconds) || 0),
      userName: r.userName || "Guest Visitor",
      maskedEmail: r.userEmail ? maskEmail(r.userEmail) : undefined,
      clientTimezone: r.clientTimezone || undefined,
      primarySource: r.primarySource || "IP",
      isVpn: !!r.isVpn,
      secondaryCountry: r.secondaryCountry || undefined,
      visitHistory: historyMap[r.sessionId] || [],
      actionLogs: actionsMap[r.sessionId] || [],
    }));

    let desktopCount = 0;
    let mobileCount = 0;
    let tabletCount = 0;
    const pageCounts: Record<string, number> = {};

    sessions.forEach((s) => {
      if (s.deviceType === "Mobile") mobileCount++;
      else if (s.deviceType === "Tablet") tabletCount++;
      else desktopCount++;

      pageCounts[s.currentPage] = (pageCounts[s.currentPage] || 0) + 1;
    });

    const topPages = Object.entries(pageCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count);

    return {
      sessions,
      totalActive: sessions.length,
      desktopCount,
      mobileCount,
      tabletCount,
      topPages,
      recentActions,
    };
  } catch (error) {
    console.error("Failed to fetch active user sessions:", error);
    return {
      sessions: [],
      totalActive: 0,
      desktopCount: 0,
      mobileCount: 0,
      tabletCount: 0,
      topPages: [],
      recentActions: [],
    };
  }
}
