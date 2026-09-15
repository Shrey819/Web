"use client";

import { useState } from "react";
import { ActiveSession } from "@/lib/tracker-utils";
import {
  Smartphone,
  Monitor,
  Globe,
  User,
  ShieldAlert,
  Navigation,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface WorldMapProps {
  sessions: ActiveSession[];
  onSelectSession?: (session: ActiveSession) => void;
}

const COUNTRY_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  IN: { lat: 20.5937, lng: 78.9629 },
  US: { lat: 37.0902, lng: -95.7129 },
  GB: { lat: 55.3781, lng: -3.4360 },
  CA: { lat: 56.1304, lng: -106.3468 },
  AU: { lat: -25.2744, lng: 133.7751 },
  DE: { lat: 51.1657, lng: 10.4515 },
  FR: { lat: 46.2276, lng: 2.2137 },
  IT: { lat: 41.8719, lng: 12.5674 },
  ES: { lat: 40.4637, lng: -3.7492 },
  NL: { lat: 52.1326, lng: 5.2913 },
  SE: { lat: 60.1282, lng: 18.6435 },
  NO: { lat: 60.4720, lng: 8.4689 },
  DK: { lat: 56.2639, lng: 9.5018 },
  FI: { lat: 61.9241, lng: 25.7482 },
  PL: { lat: 51.9194, lng: 19.1451 },
  CH: { lat: 46.8182, lng: 8.2275 },
  AT: { lat: 47.5162, lng: 14.5501 },
  BE: { lat: 50.5039, lng: 4.4699 },
  IE: { lat: 53.1424, lng: -7.6921 },
  NZ: { lat: -40.9006, lng: 174.8860 },
  SG: { lat: 1.3521, lng: 103.8198 },
  MY: { lat: 4.2105, lng: 101.9758 },
  JP: { lat: 36.2048, lng: 138.2529 },
  KR: { lat: 35.9078, lng: 127.7669 },
  CN: { lat: 35.8617, lng: 104.1954 },
  HK: { lat: 22.3193, lng: 114.1694 },
  TW: { lat: 23.6978, lng: 120.9605 },
  TH: { lat: 15.8700, lng: 100.9925 },
  VN: { lat: 14.0583, lng: 108.2772 },
  PH: { lat: 12.8797, lng: 121.7740 },
  ID: { lat: -0.7893, lng: 113.9213 },
  BR: { lat: -14.2350, lng: -51.9253 },
  MX: { lat: 23.6345, lng: -102.5528 },
  AR: { lat: -38.4161, lng: -63.6167 },
  CL: { lat: -35.6751, lng: -71.5430 },
  CO: { lat: 4.5709, lng: -74.2973 },
  ZA: { lat: -30.5595, lng: 22.9375 },
  EG: { lat: 26.8206, lng: 30.8025 },
  NG: { lat: 9.0820, lng: 8.6753 },
  KE: { lat: -0.0236, lng: 37.9062 },
  AE: { lat: 23.4241, lng: 53.8478 },
  SA: { lat: 23.8859, lng: 45.0792 },
  IL: { lat: 31.0461, lng: 34.8516 },
  TR: { lat: 38.9637, lng: 35.2433 },
  RU: { lat: 61.5240, lng: 105.3188 },
  UA: { lat: 48.3794, lng: 31.1656 },
  PK: { lat: 30.3753, lng: 69.3451 },
  BD: { lat: 23.6850, lng: 90.3563 },
  LK: { lat: 7.8731, lng: 80.7718 },
  NP: { lat: 28.3949, lng: 84.1240 },
};

function getSessionCoords(session: ActiveSession): { lat: number; lng: number } {
  const code = (session.countryCode || "IN").toUpperCase();
  const base = COUNTRY_CENTROIDS[code] || COUNTRY_CENTROIDS["IN"];

  let hash = 0;
  const sid = session.sessionId || "";
  for (let i = 0; i < sid.length; i++) {
    hash = (hash << 5) - hash + sid.charCodeAt(i);
    hash |= 0;
  }

  // Safe deterministic jitter ±2° lat, ±3° lng to prevent overlap
  const latOffset = ((Math.abs(hash) % 100) / 100 - 0.5) * 4;
  const lngOffset = (((Math.abs(hash >> 4)) % 100) / 100 - 0.5) * 6;

  return {
    lat: base.lat + latOffset,
    lng: base.lng + lngOffset,
  };
}

/**
 * Miller Cylindrical Projection (Exact for MapChart_Map.png)
 */
function latLngToPercentCoords(lat: number, lng: number) {
  const clampedLat = Math.max(-55.6, Math.min(83.6, lat));
  const clampedLng = Math.max(-180, Math.min(180, lng));

  const xPercent = ((clampedLng + 180) / 360) * 100;

  const latRad = (clampedLat * Math.PI) / 180;
  const millerY = 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * latRad));

  const topLatRad = (83.6 * Math.PI) / 180;
  const topY = 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * topLatRad));

  const botLatRad = (-55.6 * Math.PI) / 180;
  const botY = 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * botLatRad));

  const yPercent = ((topY - millerY) / (topY - botY)) * 100;

  return {
    x: Math.max(1, Math.min(99, xPercent)),
    y: Math.max(1, Math.min(99, yPercent)),
  };
}

export function WorldMap({ sessions, onSelectSession }: WorldMapProps) {
  const [hoveredSession, setHoveredSession] = useState<ActiveSession | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div
      className={`relative w-full bg-white border border-slate-200 shadow-2xs overflow-hidden text-slate-800 font-mono transition-all duration-300 ${
        isFullscreen
          ? "fixed inset-2 sm:inset-4 z-[99999] rounded-2xl p-3 sm:p-5 flex flex-col justify-between backdrop-blur-2xl ring-2 ring-blue-500/50 bg-white"
          : "rounded-2xl p-3 sm:p-4"
      }`}
    >
      {/* Map Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 mb-3 pb-2.5 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 shrink-0">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900 flex flex-wrap items-center gap-2">
              <span>World Vector Map</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {sessions.length} Active Now
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Miller Cylindrical Projection • Zero-PII Coarse Country Centroid Mapping
            </p>
          </div>
        </div>

        {/* Legend & Fullscreen Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2.5 text-[11px] bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-700">User</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-700">Guest</span>
            </div>
            <div className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-500" />
              <span className="text-slate-500">VPN</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 px-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors flex items-center gap-1 text-[11px] font-bold shadow-2xs cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Expand Map Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-amber-600" /> : <Maximize2 className="w-3.5 h-3.5 text-blue-600" />}
            <span>{isFullscreen ? "Exit" : "Full"}</span>
          </button>
        </div>
      </div>

      {/* MAP CANVAS WITH EXACT 6460/3403 PROPORTIONS */}
      <div className={`relative w-full max-w-4xl mx-auto bg-slate-900 rounded-xl border border-slate-800/80 overflow-hidden shadow-xl select-none ${isFullscreen ? "max-w-none" : ""}`}>
        <img
          src="/MapChart_Map.png"
          alt="World Map with Country Borders"
          className="w-full h-auto block pointer-events-none opacity-90 filter invert brightness-[0.7] contrast-[1.3] hue-rotate-180 select-none mx-auto"
        />

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Equator & Prime Meridian Reference Lines */}
        <div className="absolute left-0 right-0 top-[59.8%] h-[1px] border-b border-dashed border-sky-400/25 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-[50%] w-[1px] border-r border-dashed border-sky-400/25 pointer-events-none" />

        {/* ACTIVE USER BEACON PINS */}
        {sessions.map((session) => {
          const coords = getSessionCoords(session);
          const { x, y } = latLngToPercentCoords(coords.lat, coords.lng);
          const isHovered = hoveredSession?.sessionId === session.sessionId;
          const isLogged = session.userName && session.userName !== "Guest Visitor";

          return (
            <div
              key={session.sessionId}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-20 group"
              onMouseEnter={() => setHoveredSession(session)}
              onMouseLeave={() => setHoveredSession(null)}
              onClick={() => onSelectSession?.(session)}
            >
              {/* Outer Radar Pulse Ring */}
              <div
                className={`absolute inset-0 rounded-full animate-ping opacity-75 ${
                  isLogged ? "bg-emerald-400" : "bg-sky-400"
                }`}
                style={{ width: isHovered ? "32px" : "22px", height: isHovered ? "32px" : "22px", margin: "-5px" }}
              />

              {/* Glowing Beacon Pin */}
              <div
                className={`w-4 h-4 rounded-full border-2 border-white shadow-xl transition-all duration-200 ${
                  isHovered ? "scale-150 ring-4 ring-sky-400/50" : "scale-100"
                } ${isLogged ? "bg-emerald-500 shadow-emerald-500/60" : "bg-sky-500 shadow-sky-500/60"}`}
              />

              {/* Floating Quick Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 rounded-xl bg-slate-950 text-[10px] text-white font-bold whitespace-nowrap border border-slate-700 pointer-events-none z-30 shadow-2xl flex items-center gap-1.5">
                <Navigation className="w-3 h-3 text-sky-400" />
                <span>{session.userName} ({session.city}, {session.country})</span>
              </div>
            </div>
          );
        })}

        {/* DETAILED INSPECTION TOOLTIP CARD */}
        {hoveredSession && (() => {
          const coords = getSessionCoords(hoveredSession);
          const { x, y } = latLngToPercentCoords(coords.lat, coords.lng);
          const isLogged = hoveredSession.userName && hoveredSession.userName !== "Guest Visitor";

          return (
            <div
              style={{
                left: `${Math.min(82, Math.max(18, x))}%`,
                top: `${Math.min(72, Math.max(25, y))}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-full mb-4 w-84 bg-slate-950/95 backdrop-blur-md p-4.5 rounded-2xl border border-sky-500/40 shadow-2xl z-40 text-xs text-slate-200 pointer-events-none animate-in fade-in zoom-in-95 duration-150"
            >
              {/* User Identity Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg border ${isLogged ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-sky-500/10 border-sky-500/20 text-sky-400"}`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-xs truncate max-w-[150px]">
                      {hoveredSession.userName}
                    </div>
                    {hoveredSession.maskedEmail && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {hoveredSession.maskedEmail}
                      </div>
                    )}
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full bg-slate-900 text-[10px] text-slate-300 font-bold flex items-center gap-1 border border-slate-800">
                  {hoveredSession.deviceType === "Mobile" ? <Smartphone className="w-3 h-3 text-amber-400" /> : <Monitor className="w-3 h-3 text-sky-400" />}
                  {hoveredSession.deviceType}
                </span>
              </div>

              {/* Hybrid Priority Telemetry */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Location Area:</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <span>{hoveredSession.countryCode === "IN" ? "🇮🇳" : hoveredSession.countryCode === "US" ? "🇺🇸" : "🌐"}</span>
                    {hoveredSession.city}, {hoveredSession.country}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Timezone:</span>
                  <span className="text-sky-400 font-bold">
                    {hoveredSession.clientTimezone || "Asia/Calcutta"}
                  </span>
                </div>

                {hoveredSession.isVpn && (
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span>VPN Active! IP: {hoveredSession.country} | Physical TZ: {hoveredSession.secondaryCountry || "India"}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-800">
                  <span>Active Page Route:</span>
                  <span className="text-sky-400 font-bold truncate max-w-[130px]">{hoveredSession.currentPage}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Page Dwell Time:</span>
                  <span className="text-emerald-400 font-bold">{hoveredSession.secondsOnCurrentPage}s</span>
                </div>
              </div>

              <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 text-center italic">
                Click beacon to open telemetry inspector drawer
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
