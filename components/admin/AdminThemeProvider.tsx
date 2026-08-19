"use client";

import { useEffect, useState } from "react";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";
import Link from "next/link";
import {
  Package,
  LayoutDashboard,
  FolderTree,
  Users,
  LogOut,
  Settings,
  ShoppingCart,
  FileText,
  Activity,
  Sliders,
  FileSpreadsheet,
  Moon,
  Sun,
} from "lucide-react";

interface AdminThemeProviderProps {
  userEmail?: string | null;
  userName?: string | null;
  logoutAction: () => Promise<void>;
  children: React.ReactNode;
}

export function AdminThemeProvider({
  userEmail,
  userName,
  logoutAction,
  children,
}: AdminThemeProviderProps) {
  const { theme, toggleTheme } = useAdminThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && theme === "light";

  return (
    <div
      className={`min-h-screen flex font-sans transition-colors duration-300 ${
        isLight
          ? "bg-slate-100 text-slate-900"
          : "bg-slate-950 text-slate-300"
      }`}
    >
      {/* Admin Sidebar */}
      <aside
        className={`w-64 border-r flex flex-col fixed inset-y-0 z-50 transition-colors duration-300 ${
          isLight
            ? "bg-white border-slate-200 text-slate-700"
            : "bg-slate-900 border-slate-800 text-slate-300"
        }`}
      >
        {/* Brand Header */}
        <div
          className={`p-6 border-b flex items-center justify-between gap-3 ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center font-bold text-slate-950 font-mono shadow-lg shadow-amber-500/20">
              OM
            </div>
            <span
              className={`font-bold tracking-wide type-label font-mono ${
                isLight ? "text-slate-900" : "text-white"
              }`}
            >
              OM AUTOMATION
            </span>
          </div>

          {/* Quick Theme Toggle Icon */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className={`p-1.5 rounded-lg border transition-all ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300"
                  : "bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700"
              }`}
              title={`Switch to ${isLight ? "Dark" : "Light"} Mode`}
            >
              {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          <div
            className={`text-xs font-semibold uppercase tracking-wider mb-4 mt-2 px-3 ${
              isLight ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Catalog Management
          </div>

          <Link
            href="/admin"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-sky-500" />
            Overview
          </Link>

          <Link
            href="/admin/homepage"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Sliders className="w-4 h-4 text-pink-500" />
            Homepage UI
          </Link>

          <Link
            href="/admin/products"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Package className="w-4 h-4 text-emerald-500" />
            Products
          </Link>

          <Link
            href="/admin/categories"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FolderTree className="w-4 h-4 text-amber-500" />
            Categories
          </Link>

          <div
            className={`text-xs font-semibold uppercase tracking-wider mb-4 mt-8 px-3 ${
              isLight ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Sales & Fulfillment
          </div>

          <Link
            href="/admin/orders"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-emerald-500" />
            Orders (COD & PO)
          </Link>

          <Link
            href="/admin/quotes"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileText className="w-4 h-4 text-sky-500" />
            Quote Requests (RFQs)
          </Link>

          <Link
            href="/admin/forms"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-500" />
            Forms & Submissions
          </Link>

          <div
            className={`text-xs font-semibold uppercase tracking-wider mb-4 mt-8 px-3 ${
              isLight ? "text-slate-400" : "text-slate-500"
            }`}
          >
            Telemetry & System
          </div>

          <Link
            href="/admin/live-tracker"
            className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Live User Tracker</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </Link>

          <Link
            href="/admin/users"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Users className="w-4 h-4 text-indigo-500" />
            Users
          </Link>

          <Link
            href="/admin/settings"
            className={`flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isLight
                ? "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                : "text-slate-300 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500" />
            Settings & Appearance
          </Link>
        </nav>

        {/* Admin User Footer */}
        <div
          className={`p-4 border-t ${
            isLight ? "border-slate-200" : "border-slate-800"
          }`}
        >
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shadow">
              {userEmail?.[0]?.toUpperCase() || "A"}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                {userName || "Admin User"}
              </p>
              <p className="text-xs text-slate-400 truncate">{userEmail}</p>
            </div>
          </div>

          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 transition-colors border border-rose-500/0 hover:border-rose-500/20"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Container */}
      <main className="flex-1 ml-64 min-h-screen relative">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
