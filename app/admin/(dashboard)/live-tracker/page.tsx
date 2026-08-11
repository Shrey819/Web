"use client";

import { useState, useEffect } from "react";
import { WorldMap } from "@/components/admin/analytics/WorldMap";
import { ActiveSession, UserAction } from "@/app/actions/tracker";
import {
  Users,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  RefreshCw,
  Search,
  ChevronRight,
  Timer,
  CheckCircle2,
  ShoppingCart,
  Tag,
  Heart,
  LogIn,
  LogOut,
  User,
  Activity,
  Zap,
  ShieldAlert,
} from "lucide-react";

export default function LiveTrackerPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [recentActions, setRecentActions] = useState<UserAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDevice, setFilterDevice] = useState<"ALL" | "Desktop" | "Mobile" | "Tablet">("ALL");

  useEffect(() => {
    setMounted(true);
    setLastRefreshed(new Date());
  }, []);

  const fetchLiveMetrics = async () => {
    try {
      const res = await fetch("/api/tracker/live");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setRecentActions(data.recentActions || []);
        setLastRefreshed(new Date());

        if (selectedSession) {
          const updated = data.sessions.find((s: ActiveSession) => s.sessionId === selectedSession.sessionId);
          if (updated) setSelectedSession(updated);
        }
      }
    } catch (error) {
      console.error("Failed to refresh live metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveMetrics();
    const interval = setInterval(fetchLiveMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  const totalActive = sessions.length;
  const desktopCount = sessions.filter((s) => s.deviceType === "Desktop").length;
  const mobileCount = sessions.filter((s) => s.deviceType === "Mobile").length;

  const desktopPercent = totalActive > 0 ? Math.round((desktopCount / totalActive) * 100) : 0;
  const mobilePercent = totalActive > 0 ? Math.round((mobileCount / totalActive) * 100) : 0;

  const filteredSessions = sessions.filter((s) => {
    const matchesDevice = filterDevice === "ALL" || s.deviceType === filterDevice;
    const matchesSearch =
      (s.userName && s.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.ipAddress.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.currentPage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDevice && matchesSearch;
  });

  const renderActionBadge = (actionType: string) => {
    switch (actionType) {
      case "ADD_TO_CART":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><ShoppingCart className="w-3 h-3" /> Add to Cart</span>;
      case "REMOVE_FROM_CART":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200"><ShoppingCart className="w-3 h-3" /> Remove Cart</span>;
      case "APPLY_COUPON":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><Tag className="w-3 h-3" /> Apply Coupon</span>;
      case "REMOVE_COUPON":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><Tag className="w-3 h-3" /> Remove Coupon</span>;
      case "ADD_WISHLIST":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200"><Heart className="w-3 h-3" /> Save Wishlist</span>;
      case "REMOVE_WISHLIST":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><Heart className="w-3 h-3" /> Remove Wishlist</span>;
      case "SIGN_IN":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><LogIn className="w-3 h-3" /> Sign In</span>;
      case "SIGN_OUT":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200"><LogOut className="w-3 h-3" /> Sign Out</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"><Activity className="w-3 h-3" /> {actionType}</span>;
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="type-label text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
              Hybrid Telemetry Engine (1st IP, 2nd Timezone)
            </span>
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Auto-Purge Inactive (30 min)
            </span>
          </div>
          <h1 className="text-3xl font-mono font-extrabold text-slate-900">
            Active User & Action Tracker
          </h1>
          <p className="text-sm text-slate-500 font-mono mt-1">
            MapChart vector country map, hybrid IP/Timezone location, logged identity, actions telemetry, and 30-min auto-purge.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right text-xs font-mono text-slate-500 hidden sm:block" suppressHydrationWarning>
            <div>Last Polled: {mounted && lastRefreshed ? lastRefreshed.toLocaleTimeString() : "--:--:--"}</div>
            <div className="text-emerald-600 font-bold">5s Auto-Refresh Active</div>
          </div>
          <button
            onClick={fetchLiveMetrics}
            suppressHydrationWarning
            className="p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-mono text-xs flex items-center gap-2 shadow-md transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Sync Live Now</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Users Online Now</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-4xl font-extrabold text-slate-900 flex items-center gap-2">
            {totalActive}
            <span className="text-xs font-normal text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Live
            </span>
          </div>
          <p className="text-[11px] text-slate-500">Active user sessions</p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Device Split</span>
            <Monitor className="w-4 h-4 text-sky-600" />
          </div>
          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
              <Monitor className="w-4 h-4 text-sky-600" /> {desktopPercent}% Desktop
            </div>
            <div className="flex items-center gap-1.5 text-sm font-bold text-amber-600">
              <Smartphone className="w-4 h-4 text-amber-500" /> {mobilePercent}% Mobile
            </div>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
            <div style={{ width: `${desktopPercent}%` }} className="bg-sky-500 h-full" />
            <div style={{ width: `${mobilePercent}%` }} className="bg-amber-400 h-full" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span>Logged vs Guest</span>
            <User className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span className="text-emerald-600 font-mono">{sessions.filter((s) => !!s.userName).length} Logged</span>
            <span className="text-slate-400 font-mono">/ {sessions.filter((s) => !s.userName).length} Guests</span>
          </div>
          <p className="text-[11px] text-slate-500">Identified customer accounts</p>
        </div>

        <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 border border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Location Resolution</span>
            <Globe className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-lg font-extrabold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> 1st: IP / 2nd: Timezone
          </div>
          <p className="text-[11px] text-slate-400">
            Permission-free IP geolocation + Timezone fallback.
          </p>
        </div>
      </div>

      {/* World Map Section with MapChart Image */}
      <WorldMap sessions={sessions} onSelectSession={(sess) => setSelectedSession(sess)} />

      {/* Live Recent Actions Telemetry Stream */}
      {recentActions.length > 0 && (
        <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4 font-mono">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Live Actions Telemetry Feed
            </h3>
            <span className="text-xs text-slate-400">Showing last {recentActions.length} user actions</span>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recentActions.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800 shrink-0 w-72 space-y-1.5 shadow-md"
              >
                <div className="flex items-center justify-between">
                  {renderActionBadge(act.actionType)}
                  <span className="text-[10px] text-slate-500">
                    {new Date(act.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-xs text-slate-200 font-bold truncate">
                  {act.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Sessions Table */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-lg space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
          <div>
            <h3 className="font-mono font-bold text-lg text-slate-900">
              Active User Sessions ({filteredSessions.length})
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Click any user row to view their user identity, action logs, and page navigation timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search User Name, IP, Page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-mono rounded-2xl border border-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl font-mono text-xs">
              <button
                onClick={() => setFilterDevice("ALL")}
                className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                  filterDevice === "ALL" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDevice("Desktop")}
                className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                  filterDevice === "Desktop" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setFilterDevice("Mobile")}
                className={`px-3 py-1 rounded-xl font-bold transition-colors ${
                  filterDevice === "Mobile" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Mobile
              </button>
            </div>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">1st IP / 2nd Timezone</th>
                <th className="py-3 px-4">Device / OS</th>
                <th className="py-3 px-4">Current Page</th>
                <th className="py-3 px-4">Time on Page</th>
                <th className="py-3 px-4">Actions Logged</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-mono">
                    No active user sessions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr
                    key={session.sessionId}
                    onClick={() => setSelectedSession(session)}
                    className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {session.userName ? (
                          <span className="text-sky-700 font-extrabold flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {session.userName}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic">Guest Visitor</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 pl-4 font-mono">
                        IP: {session.ipAddress}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{session.countryCode === "US" ? "🇺🇸" : session.countryCode === "GB" ? "🇬🇧" : session.countryCode === "DE" ? "🇩🇪" : session.countryCode === "JP" ? "🇯🇵" : "🌐"}</span>
                        {session.city}, {session.country}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <span>TZ: {session.clientTimezone || "Asia/Calcutta"}</span>
                        {session.isVpn && (
                          <span className="text-amber-600 font-bold px-1 rounded bg-amber-50 border border-amber-200">
                            VPN Active
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          session.deviceType === "Mobile"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : session.deviceType === "Tablet"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-sky-50 text-sky-700 border-sky-200"
                        }`}
                      >
                        {session.deviceType === "Mobile" ? (
                          <Smartphone className="w-3 h-3" />
                        ) : session.deviceType === "Tablet" ? (
                          <Tablet className="w-3 h-3" />
                        ) : (
                          <Monitor className="w-3 h-3" />
                        )}
                        {session.deviceType} ({session.os})
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-sky-700">
                      {session.currentPage}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      {session.secondsOnCurrentPage}s
                    </td>

                    <td className="py-3.5 px-4 font-bold text-purple-700">
                      {session.actionLogs?.length || 0} Actions
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1 rounded-full bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1">
                        <span>Inspect Log</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Session Inspector Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between font-mono">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="type-label text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Live Session Inspection
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-1">
                    User Telemetry Inspector
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold"
                >
                  ✕
                </button>
              </div>

              {/* User Overview Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">User Identity:</span>
                  <span className="font-bold text-sky-700">{selectedSession.userName || "Guest Visitor"} ({selectedSession.userEmail || "Anonymous"})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="font-bold text-slate-900">{selectedSession.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">1st Priority (IP Country):</span>
                  <span className="font-bold text-slate-900">{selectedSession.city}, {selectedSession.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">2nd Priority (Timezone):</span>
                  <span className="font-bold text-sky-700">{selectedSession.clientTimezone || "Asia/Calcutta"}</span>
                </div>

                {selectedSession.isVpn && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>VPN Proxy Detected! IP: {selectedSession.country} | Physical TZ: {selectedSession.secondaryCountry || "India"}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-500">Device Hardware:</span>
                  <span className="font-bold text-slate-900">{selectedSession.deviceType} ({selectedSession.browser} / {selectedSession.os})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Session Time:</span>
                  <span className="font-bold text-emerald-600">{Math.floor(selectedSession.totalSessionSeconds / 60)}m {selectedSession.totalSessionSeconds % 60}s</span>
                </div>
              </div>

              {/* Currently Viewing */}
              <div className="bg-sky-50 rounded-2xl p-4 border border-sky-200 text-xs space-y-1">
                <div className="text-sky-800 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                  Currently Viewing Right Now:
                </div>
                <div className="text-base font-extrabold text-slate-900 pt-1">
                  {selectedSession.currentPage}
                </div>
                <div className="text-emerald-700 font-bold">
                  Time on this page: {selectedSession.secondsOnCurrentPage} seconds
                </div>
              </div>

              {/* User Action Logs */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Actions Performed ({selectedSession.actionLogs?.length || 0})
                </h4>

                {(!selectedSession.actionLogs || selectedSession.actionLogs.length === 0) ? (
                  <div className="p-3 rounded-2xl bg-slate-50 text-slate-400 text-center">
                    No specific actions recorded yet during this session.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSession.actionLogs.map((act) => (
                      <div key={act.id} className="p-3 rounded-2xl bg-slate-900 text-white border border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          {renderActionBadge(act.actionType)}
                          <span className="text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-slate-200 font-bold pt-1">{act.details}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visited Pages Timeline */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 uppercase tracking-wider">
                  Page Movement History ({selectedSession.visitHistory?.length || 0})
                </h4>

                {(!selectedSession.visitHistory || selectedSession.visitHistory.length === 0) ? (
                  <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center">
                    User is on their first page of this session.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-4 py-1">
                    {selectedSession.visitHistory.map((visit, idx) => {
                      const formatDuration = (sec: number) => {
                        if (!sec || sec <= 0) return "0s spent";
                        if (sec < 60) return `${sec}s spent`;
                        const mins = Math.floor(sec / 60);
                        const remainder = sec % 60;
                        return remainder > 0 ? `${mins}m ${remainder}s spent` : `${mins}m spent`;
                      };

                      return (
                        <div key={visit.id || idx} className="relative group">
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white ring-2 ring-sky-200" />
                          <div className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm space-y-1">
                            <div className="font-bold text-slate-900 text-sm flex items-center justify-between">
                              <span>{visit.pagePath}</span>
                              <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                {formatDuration(visit.durationSeconds)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Visited at: {new Date(visit.visitedAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-3 rounded-full bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
