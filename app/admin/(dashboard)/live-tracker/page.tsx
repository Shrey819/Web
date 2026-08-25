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
  MousePointer,
  Eye,
  Menu,
  Layers,
  ArrowDown,
  Compass,
  PhoneCall,
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
      setLoading(true);
      const res = await fetch("/api/tracker/live", {
        headers: {
          "ngrok-skip-browser-warning": "69420",
        },
      });
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
      // Small timeout for smooth feedback animation
      setTimeout(() => setLoading(false), 300);
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
      case "CART_OPEN":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200"><ShoppingCart className="w-3 h-3" /> Cart Opened</span>;
      case "CLICK":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200"><MousePointer className="w-3 h-3" /> User Click</span>;
      case "HOVER_CARD":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200"><Eye className="w-3 h-3" /> Inspect Card</span>;
      case "PRODUCT_CLICK":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200"><Layers className="w-3 h-3" /> View Product</span>;
      case "CATEGORY_CLICK":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200"><Compass className="w-3 h-3" /> Browse Category</span>;
      case "CONTACT_CLICK":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><PhoneCall className="w-3 h-3" /> Contact CTA</span>;
      case "MENU_OPEN":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"><Menu className="w-3 h-3" /> Menu Open</span>;
      case "SCROLL_DEPTH":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200"><ArrowDown className="w-3 h-3" /> Scroll</span>;
      case "NAVIGATE":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200"><Compass className="w-3 h-3" /> Page Navigate</span>;
      case "SEARCH":
      case "SEARCH_QUERY":
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200"><Search className="w-3 h-3" /> Search</span>;
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
    <div className="space-y-3.5 pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="type-label text-sky-700 dark:text-sky-400 bg-sky-50 dark:bg-sky-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold border border-sky-200 dark:border-sky-500/30">
              Hybrid Telemetry Engine (1st IP, 2nd Timezone)
            </span>
            <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              Auto-Purge (30m)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-mono font-extrabold text-slate-900 dark:text-white">
            Active User & Action Tracker
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            MapChart vector country map, hybrid IP/Timezone location, actions telemetry & 30-min auto-purge.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right text-[11px] font-mono text-slate-500 dark:text-slate-400 hidden sm:block" suppressHydrationWarning>
            <div>Last Polled: {mounted && lastRefreshed ? lastRefreshed.toLocaleTimeString() : "--:--:--"}</div>
            <div className="text-emerald-600 dark:text-emerald-400 font-bold">5s Auto-Refresh</div>
          </div>
          <button
            onClick={fetchLiveMetrics}
            disabled={loading}
            suppressHydrationWarning
            className={`p-2 px-3 rounded-xl font-mono text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              loading
                ? "bg-slate-700 text-slate-300 opacity-90"
                : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 active:scale-95 text-white"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-sky-400" : ""}`} />
            <span>{loading ? "Syncing..." : "Sync Live"}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 font-mono">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Online Now</span>
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            {totalActive}
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-500/30">
              Live
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Active user sessions</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Device Split</span>
            <Monitor className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="flex items-baseline justify-between pt-0.5">
            <div className="flex items-center gap-1 text-xs font-bold text-slate-900 dark:text-white">
              <Monitor className="w-3 h-3 text-sky-600 dark:text-sky-400" /> {desktopPercent}% Desk
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Smartphone className="w-3 h-3 text-amber-500 dark:text-amber-400" /> {mobilePercent}% Mob
            </div>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden flex">
            <div style={{ width: `${desktopPercent}%` }} className="bg-sky-500 h-full" />
            <div style={{ width: `${mobilePercent}%` }} className="bg-amber-400 h-full" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Logged vs Guest</span>
            <User className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-1 pt-0.5">
            <span className="text-emerald-600 dark:text-emerald-400 font-mono">{sessions.filter((s) => !!s.userName).length} Logged</span>
            <span className="text-slate-400 dark:text-slate-500 font-mono">/ {sessions.filter((s) => !s.userName).length} Guest</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">Identified accounts</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
            <span>Resolution</span>
            <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 pt-0.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" /> 1st IP / 2nd TZ
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            Zero-permission geolocation
          </p>
        </div>
      </div>

      {/* World Map Section with MapChart Image */}
      <WorldMap sessions={sessions} onSelectSession={(sess) => setSelectedSession(sess)} />

      {/* Live Recent Actions Telemetry Stream */}
      {recentActions.length > 0 && (
        <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-2xs space-y-2.5 font-mono">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Live Actions Telemetry Feed
            </h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Last {recentActions.length} actions</span>
          </div>

          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {recentActions.slice(0, 8).map((act) => (
              <div
                key={act.id}
                className="bg-slate-50 dark:bg-slate-950 rounded-xl p-2.5 border border-slate-200 dark:border-slate-800 shrink-0 w-64 space-y-1 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  {renderActionBadge(act.actionType)}
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {new Date(act.createdAt).toLocaleTimeString()}
                  </span>
                </div>
                <div className="text-[11px] text-slate-800 dark:text-slate-200 font-bold truncate">
                  {act.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Live Sessions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-mono font-bold text-base text-slate-900 dark:text-white">
              Active Sessions ({filteredSessions.length})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Click user row to inspect identity, logs & timeline.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search User, IP, Page..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 pl-8 pr-3 py-1.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-sky-500 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl font-mono text-xs">
              <button
                onClick={() => setFilterDevice("ALL")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterDevice === "ALL" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterDevice("Desktop")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterDevice === "Desktop" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setFilterDevice("Mobile")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  filterDevice === "Mobile" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
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
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">User Identity</th>
                <th className="py-3 px-4">1st IP / 2nd Timezone</th>
                <th className="py-3 px-4">Device / OS</th>
                <th className="py-3 px-4">Current Page</th>
                <th className="py-3 px-4">Time on Page</th>
                <th className="py-3 px-4">Actions Logged</th>
                <th className="py-3 px-4 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 font-mono">
                    No active user sessions found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredSessions.map((session) => (
                  <tr
                    key={session.sessionId}
                    onClick={() => setSelectedSession(session)}
                    className="hover:bg-sky-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        {session.userName ? (
                          <span className="text-sky-700 dark:text-sky-400 font-extrabold flex items-center gap-1">
                            <User className="w-3.5 h-3.5" /> {session.userName}
                          </span>
                        ) : (
                          <span className="text-slate-600 dark:text-slate-400 italic">Guest Visitor</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 pl-4 font-mono">
                        IP: {session.ipAddress}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>{session.countryCode === "US" ? "🇺🇸" : session.countryCode === "GB" ? "🇬🇧" : session.countryCode === "DE" ? "🇩🇪" : session.countryCode === "JP" ? "🇯🇵" : "🌐"}</span>
                        {session.city}, {session.country}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1">
                        <span>TZ: {session.clientTimezone || "Asia/Calcutta"}</span>
                        {session.isVpn && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold px-1 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30">
                            VPN Active
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                          session.deviceType === "Mobile"
                            ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/30"
                            : session.deviceType === "Tablet"
                            ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/30"
                            : "bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/30"
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

                    <td className="py-3.5 px-4 font-bold text-sky-700 dark:text-sky-400">
                      {session.currentPage}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Timer className="w-3.5 h-3.5" />
                      {session.secondsOnCurrentPage}s
                    </td>

                    <td className="py-3.5 px-4 font-bold text-purple-700 dark:text-purple-400">
                      {session.actionLogs?.length || 0} Actions
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button className="px-3 py-1 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-[11px] font-bold transition-colors inline-flex items-center gap-1 cursor-pointer">
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
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl p-6 overflow-y-auto space-y-6 flex flex-col justify-between font-mono border-l border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="type-label text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                    Live Session Inspection
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    User Telemetry Inspector
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* User Overview Box */}
              <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">User Identity:</span>
                  <span className="font-bold text-sky-700 dark:text-sky-400">{selectedSession.userName || "Guest Visitor"} ({selectedSession.userEmail || "Anonymous"})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">IP Address:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">1st Priority (IP Country):</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.city}, {selectedSession.country}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">2nd Priority (Timezone):</span>
                  <span className="font-bold text-sky-700 dark:text-sky-400">{selectedSession.clientTimezone || "Asia/Calcutta"}</span>
                </div>

                {selectedSession.isVpn && (
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>VPN Proxy Detected! IP: {selectedSession.country} | Physical TZ: {selectedSession.secondaryCountry || "India"}</span>
                  </div>
                )}

                <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span className="text-slate-500 dark:text-slate-400">Device Hardware:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedSession.deviceType} ({selectedSession.browser} / {selectedSession.os})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Total Session Time:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{Math.floor(selectedSession.totalSessionSeconds / 60)}m {selectedSession.totalSessionSeconds % 60}s</span>
                </div>
              </div>

              {/* Currently Viewing */}
              <div className="bg-sky-50 dark:bg-sky-950/40 rounded-2xl p-4 border border-sky-200 dark:border-sky-800 text-xs space-y-1">
                <div className="text-sky-800 dark:text-sky-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping" />
                  Currently Viewing Right Now:
                </div>
                <div className="text-base font-extrabold text-slate-900 dark:text-white pt-1">
                  {selectedSession.currentPage}
                </div>
                <div className="text-emerald-700 dark:text-emerald-400 font-bold">
                  Time on this page: {selectedSession.secondsOnCurrentPage} seconds
                </div>
              </div>

              {/* User Action Logs */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Actions Performed ({selectedSession.actionLogs?.length || 0})
                </h4>

                {(!selectedSession.actionLogs || selectedSession.actionLogs.length === 0) ? (
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-center">
                    No specific actions recorded yet during this session.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedSession.actionLogs.map((act) => (
                      <div key={act.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 space-y-1">
                        <div className="flex items-center justify-between">
                          {renderActionBadge(act.actionType)}
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">{new Date(act.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-slate-900 dark:text-white font-bold pt-1">{act.details}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Visited Pages Timeline */}
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Page Movement History ({selectedSession.visitHistory?.length || 0})
                </h4>

                {(!selectedSession.visitHistory || selectedSession.visitHistory.length === 0) ? (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 text-slate-400 dark:text-slate-500 text-center">
                    User is on their first page of this session.
                  </div>
                ) : (
                  <div className="relative border-l-2 border-slate-200 dark:border-slate-800 ml-3 space-y-4 pl-4 py-1">
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
                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-sky-500 border-2 border-white dark:border-slate-900 ring-2 ring-sky-200 dark:ring-sky-900" />
                          <div className="bg-white dark:bg-slate-900 rounded-xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
                            <div className="font-bold text-slate-900 dark:text-white text-sm flex items-center justify-between">
                              <span>{visit.pagePath}</span>
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
                                {formatDuration(visit.durationSeconds)}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500">
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

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setSelectedSession(null)}
                className="w-full py-3 rounded-full bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold cursor-pointer"
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
