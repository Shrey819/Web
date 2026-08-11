"use server";

import { query, transaction } from "@/lib/db";
import crypto from "crypto";

export interface UserAction {
  id: string;
  sessionId: string;
  actionType: string;
  details: string;
  createdAt: string;
}

export interface ActiveSession {
  sessionId: string;
  ipAddress: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  deviceType: "Desktop" | "Mobile" | "Tablet";
  browser: string;
  os: string;
  currentPage: string;
  currentPageStartedAt: string;
  lastActiveAt: string;
  secondsOnCurrentPage: number;
  totalSessionSeconds: number;
  userName?: string;
  userEmail?: string;
  userId?: string;
  clientTimezone?: string;
  primarySource?: "IP" | "TIMEZONE";
  isVpn?: boolean;
  secondaryCountry?: string;
  visitHistory?: PageVisit[];
  actionLogs?: UserAction[];
}

export interface PageVisit {
  id: string;
  sessionId: string;
  pagePath: string;
  durationSeconds: number;
  visitedAt: string;
}

interface GeoCacheItem {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  source: "IP" | "TIMEZONE";
  timestamp: number;
}

const geoCache = new Map<string, GeoCacheItem>();

function generateId(prefix: string = "id_"): string {
  return prefix + crypto.randomBytes(12).toString("hex");
}

// Fallback Timezone-to-Country Mapping (2nd Priority)
function mapTimezoneToGeo(tz: string): { country: string; countryCode: string; city: string; lat: number; lng: number } {
  const cleanTz = (tz || "").trim().toLowerCase();
  if (cleanTz.includes("calcutta") || cleanTz.includes("kolkata") || cleanTz.includes("asia/kabul") || cleanTz.includes("ist")) {
    return { country: "India", countryCode: "IN", city: "Mumbai", lat: 19.076, lng: 72.8777 };
  }
  if (cleanTz.includes("new_york") || cleanTz.includes("chicago") || cleanTz.includes("los_angeles") || cleanTz.includes("america/")) {
    return { country: "United States", countryCode: "US", city: "New York", lat: 40.7128, lng: -74.006 };
  }
  if (cleanTz.includes("london") || cleanTz.includes("europe/london")) {
    return { country: "United Kingdom", countryCode: "GB", city: "London", lat: 51.5074, lng: -0.1278 };
  }
  if (cleanTz.includes("berlin") || cleanTz.includes("paris") || cleanTz.includes("rome") || cleanTz.includes("europe/")) {
    return { country: "Germany", countryCode: "DE", city: "Berlin", lat: 52.52, lng: 13.405 };
  }
  if (cleanTz.includes("tokyo") || cleanTz.includes("asia/tokyo")) {
    return { country: "Japan", countryCode: "JP", city: "Tokyo", lat: 35.6762, lng: 139.6503 };
  }
  if (cleanTz.includes("sydney") || cleanTz.includes("australia/")) {
    return { country: "Australia", countryCode: "AU", city: "Sydney", lat: -33.8688, lng: 151.2093 };
  }
  return { country: "India", countryCode: "IN", city: "Jaipur", lat: 26.9124, lng: 75.7873 };
}

/**
 * HYBRID LOCATION RESOLUTION (1st Priority IP, 2nd Priority Timezone)
 */
async function resolveHybridLocation(ip: string, clientTimezone?: string): Promise<{
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  primarySource: "IP" | "TIMEZONE";
  isVpn: boolean;
  secondaryCountry?: string;
}> {
  const cleanIp = (ip || "").trim();
  const isLocal =
    !cleanIp ||
    cleanIp === "::1" ||
    cleanIp === "127.0.0.1" ||
    cleanIp.startsWith("192.168.") ||
    cleanIp.startsWith("10.") ||
    cleanIp.startsWith("::ffff:127.0.0.1");

  const cacheKey = isLocal ? `local_${cleanIp}` : cleanIp;
  const cached = geoCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < 3600000) {
    const tzGeo = mapTimezoneToGeo(clientTimezone || "");
    const isVpn = cached.countryCode !== tzGeo.countryCode && !isLocal;
    return {
      ...cached,
      primarySource: cached.source,
      isVpn,
      secondaryCountry: isVpn ? tzGeo.country : undefined,
    };
  }

  // 1st PRIORITY: IP GEOLOCATION API
  try {
    const endpoint = isLocal ? "https://ipwho.is/" : `https://ipwho.is/${cleanIp}`;
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
        const ipGeo: GeoCacheItem = {
          ip: data.ip || (isLocal ? "103.21.124.5" : cleanIp),
          city: data.city || "Unknown City",
          region: data.region || "Unknown Region",
          country: data.country || "India",
          countryCode: data.country_code || "IN",
          lat: typeof data.latitude === "number" ? data.latitude : parseFloat(data.latitude) || 20.5937,
          lng: typeof data.longitude === "number" ? data.longitude : parseFloat(data.longitude) || 78.9629,
          source: "IP",
          timestamp: Date.now(),
        };
        geoCache.set(cacheKey, ipGeo);

        const tzGeo = mapTimezoneToGeo(clientTimezone || "");
        const isVpn = ipGeo.countryCode !== tzGeo.countryCode && !isLocal;

        return {
          ...ipGeo,
          primarySource: "IP",
          isVpn,
          secondaryCountry: isVpn ? tzGeo.country : undefined,
        };
      }
    }
  } catch (err) {
    console.error("1st Priority IP lookup failed/timed out, falling back to 2nd Priority Timezone:", err);
  }

  // 2nd PRIORITY FALLBACK: CLIENT TIMEZONE
  const tzGeo = mapTimezoneToGeo(clientTimezone || "");
  const fallbackResult = {
    ip: isLocal ? "103.21.124.5" : cleanIp,
    city: tzGeo.city,
    region: tzGeo.country,
    country: tzGeo.country,
    countryCode: tzGeo.countryCode,
    lat: tzGeo.lat,
    lng: tzGeo.lng,
    primarySource: "TIMEZONE" as const,
    isVpn: false,
  };

  geoCache.set(cacheKey, { ...fallbackResult, source: "TIMEZONE", timestamp: Date.now() });
  return fallbackResult;
}

export async function purgeExpiredSessions(): Promise<number> {
  try {
    const res = await query(
      `DELETE FROM "UserSession" WHERE "lastActiveAt" < NOW() - INTERVAL '30 minutes'`
    );
    return res.rowCount || 0;
  } catch (error) {
    console.error("Failed to purge expired sessions:", error);
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
    userId,
    clientTimezone,
    previousPage,
    previousPageDuration = 0,
  } = params;

  try {
    await purgeExpiredSessions();
    const geo = await resolveHybridLocation(ipAddress, clientTimezone);

    await transaction(async (client) => {
      const existing = await client.query(
        `SELECT * FROM "UserSession" WHERE "sessionId" = $1 LIMIT 1`,
        [sessionId]
      );

      if (existing.rows.length === 0) {
        await client.query(
          `INSERT INTO "UserSession" (
            "sessionId", "ipAddress", "city", "region", "country", "countryCode",
            "latitude", "longitude", "deviceType", "browser", "os", "currentPage",
            "userName", "userEmail", "userId", "clientTimezone", "primarySource", "isVpn", "secondaryCountry",
            "currentPageStartedAt", "lastActiveAt", "createdAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            sessionId,
            geo.ip,
            geo.city,
            geo.region,
            geo.country,
            geo.countryCode,
            geo.lat,
            geo.lng,
            deviceType,
            browser,
            os,
            currentPage,
            userName || null,
            userEmail || null,
            userId || null,
            clientTimezone || null,
            geo.primarySource,
            geo.isVpn,
            geo.secondaryCountry || null,
          ]
        );
      } else {
        const currentSession = existing.rows[0];
        const pageChanged = currentSession.currentPage !== currentPage;

        if (pageChanged) {
          if (currentSession.currentPage && previousPageDuration > 0) {
            await client.query(
              `INSERT INTO "PageVisitLog" ("id", "sessionId", "pagePath", "durationSeconds", "visitedAt")
               VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
              [generateId("pvl_"), sessionId, currentSession.currentPage, previousPageDuration]
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
              "userId" = COALESCE($5, "userId"),
              "clientTimezone" = COALESCE($6, "clientTimezone"),
              "ipAddress" = $7,
              "city" = $8,
              "region" = $9,
              "country" = $10,
              "countryCode" = $11,
              "latitude" = $12,
              "longitude" = $13,
              "primarySource" = $14,
              "isVpn" = $15,
              "secondaryCountry" = $16
             WHERE "sessionId" = $17`,
            [
              currentPage,
              deviceType,
              userName || null,
              userEmail || null,
              userId || null,
              clientTimezone || null,
              geo.ip,
              geo.city,
              geo.region,
              geo.country,
              geo.countryCode,
              geo.lat,
              geo.lng,
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
              "userId" = COALESCE($4, "userId"),
              "clientTimezone" = COALESCE($5, "clientTimezone"),
              "ipAddress" = $6,
              "city" = $7,
              "region" = $8,
              "country" = $9,
              "countryCode" = $10,
              "latitude" = $11,
              "longitude" = $12,
              "primarySource" = $13,
              "isVpn" = $14,
              "secondaryCountry" = $15
             WHERE "sessionId" = $16`,
            [
              deviceType,
              userName || null,
              userEmail || null,
              userId || null,
              clientTimezone || null,
              geo.ip,
              geo.city,
              geo.region,
              geo.country,
              geo.countryCode,
              geo.lat,
              geo.lng,
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

  try {
    const actionId = generateId("act_");
    await transaction(async (client) => {
      await client.query(
        `INSERT INTO "UserActionLog" ("id", "sessionId", "actionType", "details", "createdAt")
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [actionId, sessionId, actionType, details]
      );

      await client.query(
        `UPDATE "UserSession" 
         SET "lastActiveAt" = CURRENT_TIMESTAMP,
             "userName" = COALESCE($1, "userName"),
             "userEmail" = COALESCE($2, "userEmail")
         WHERE "sessionId" = $3`,
        [userName || null, userEmail || null, sessionId]
      );
    });

    return { success: true, actionId };
  } catch (error) {
    console.error("Failed to record user action:", error);
    return { success: false, error: String(error) };
  }
}

export async function getActiveUserSessions(): Promise<{
  sessions: ActiveSession[];
  totalActive: number;
  desktopCount: number;
  mobileCount: number;
  tabletCount: number;
  topPages: { path: string; count: number }[];
  recentActions: UserAction[];
}> {
  try {
    await purgeExpiredSessions();

    const res = await query(
      `SELECT 
        s.*,
        EXTRACT(EPOCH FROM (NOW() - s."currentPageStartedAt"))::INT as "secondsOnCurrentPage",
        EXTRACT(EPOCH FROM (NOW() - s."createdAt"))::INT as "totalSessionSeconds"
       FROM "UserSession" s
       WHERE s."lastActiveAt" >= NOW() - INTERVAL '30 minutes'
       ORDER BY s."lastActiveAt" DESC`
    );

    const sessionIds = res.rows.map((r) => r.sessionId);
    let historyMap: Record<string, PageVisit[]> = {};
    let actionsMap: Record<string, UserAction[]> = {};
    let recentActions: UserAction[] = [];

    if (sessionIds.length > 0) {
      const [historyRes, actionsRes] = await Promise.all([
        query(
          `SELECT * FROM "PageVisitLog" 
           WHERE "sessionId" = ANY($1::text[]) 
           ORDER BY "visitedAt" DESC 
           LIMIT 300`,
          [sessionIds]
        ),
        query(
          `SELECT * FROM "UserActionLog"
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

    const sessions: ActiveSession[] = res.rows.map((r) => ({
      sessionId: r.sessionId,
      ipAddress: r.ipAddress,
      city: r.city,
      region: r.region,
      country: r.country,
      countryCode: r.countryCode,
      latitude: parseFloat(r.latitude) || 0,
      longitude: parseFloat(r.longitude) || 0,
      deviceType: r.deviceType || "Desktop",
      browser: r.browser || "Unknown",
      os: r.os || "Unknown",
      currentPage: r.currentPage,
      currentPageStartedAt: new Date(r.currentPageStartedAt).toISOString(),
      lastActiveAt: new Date(r.lastActiveAt).toISOString(),
      secondsOnCurrentPage: Math.max(0, parseInt(r.secondsOnCurrentPage) || 0),
      totalSessionSeconds: Math.max(0, parseInt(r.totalSessionSeconds) || 0),
      userName: r.userName || undefined,
      userEmail: r.userEmail || undefined,
      userId: r.userId || undefined,
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
