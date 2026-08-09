"use client";

import { useState } from "react";
import Image from "next/image";
import { ActiveSession } from "@/app/actions/tracker";
import { Smartphone, Monitor, Globe, User, ShieldAlert, Navigation } from "lucide-react";

interface WorldMapProps {
  sessions: ActiveSession[];
  onSelectSession?: (session: ActiveSession) => void;
}

/**
 * Miller Cylindrical Projection (Exact for MapChart_Map.png)
 * MapChart PNG parameters:
 * Width: 6460px, Height: 3403px (Aspect Ratio ~1.898)
 * Top Latitude: +83.6°N, Bottom Latitude: -55.6°S
 * Left Longitude: -180°W, Right Longitude: +180°E
 */
function latLngToPercentCoords(lat: number, lng: number) {
  // Clamp latitude to MapChart boundaries [-55.6, 83.6]
  const clampedLat = Math.max(-55.6, Math.min(83.6, lat));
  const clampedLng = Math.max(-180, Math.min(180, lng));

  // Longitude X % (Linear -180 to 180)
  const xPercent = ((clampedLng + 180) / 360) * 100;

  // Latitude Y % (Miller Cylindrical Projection Formula)
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

  return (
    <div className="relative w-full bg-slate-950 rounded-3xl p-6 border border-slate-800 shadow-2xl overflow-hidden text-slate-100 font-mono">
      {/* Ambient Radial Backdrop */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/20 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Map Header */}
      <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <Globe className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              High-Precision MapChart Vector Map
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                {sessions.length} Active Now
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Miller Cylindrical Projection • 100% Exact Lat/Lng Beacon Placement.
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs bg-slate-900/90 px-3.5 py-2 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-slate-300">Logged User</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="text-slate-300">Guest Visitor</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">VPN / Proxy</span>
          </div>
        </div>
      </div>

      {/* MAP CANVAS WITH MAX-W 1720px AND 1.898/1 ASPECT RATIO */}
      <div className="relative w-full max-w-[1720px] aspect-[1.898/1] mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-inner">
        {/* MapChart Map Base Image with Dark High-Tech Filter */}
        <Image
          src="/MapChart_Map.png"
          alt="World Map with Country Borders"
          fill
          priority
          className="object-cover w-full h-full pointer-events-none opacity-85 filter invert brightness-[0.7] contrast-[1.3] hue-rotate-180"
        />

        {/* Grid Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

        {/* Equator (0° Latitude) & Prime Meridian (0° Longitude) Reference Lines */}
        <div className="absolute left-0 right-0 top-[59.8%] h-[1px] border-b border-dashed border-sky-400/25 pointer-events-none" />
        <div className="absolute top-0 bottom-0 left-[50%] w-[1px] border-r border-dashed border-sky-400/25 pointer-events-none" />

        {/* ACTIVE USER BEACON PINS */}
        {sessions.map((session) => {
          const { x, y } = latLngToPercentCoords(session.latitude, session.longitude);
          const isHovered = hoveredSession?.sessionId === session.sessionId;
          const isLogged = !!session.userName;

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
                <span>{session.userName || "Guest"} ({session.city}, {session.country})</span>
              </div>
            </div>
          );
        })}

        {/* DETAILED INSPECTION TOOLTIP CARD */}
        {hoveredSession && (() => {
          const { x, y } = latLngToPercentCoords(hoveredSession.latitude, hoveredSession.longitude);
          const isLogged = !!hoveredSession.userName;

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
                      {hoveredSession.userName || "Guest Visitor"}
                    </div>
                    {hoveredSession.userEmail && (
                      <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                        {hoveredSession.userEmail}
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
                  <span>1st Priority (IP Location):</span>
                  <span className="text-white font-bold flex items-center gap-1">
                    <span>{hoveredSession.countryCode === "IN" ? "🇮🇳" : hoveredSession.countryCode === "US" ? "🇺🇸" : "🌐"}</span>
                    {hoveredSession.city}, {hoveredSession.country}
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>Exact Coordinates:</span>
                  <span className="text-emerald-400 font-bold">
                    {hoveredSession.latitude.toFixed(4)}°N, {hoveredSession.longitude.toFixed(4)}°E
                  </span>
                </div>

                <div className="flex justify-between items-center text-slate-400">
                  <span>2nd Priority (Timezone):</span>
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
                Click beacon to open full telemetry inspector drawer
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
