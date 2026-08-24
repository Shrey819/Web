"use client";

import { useEffect, useState } from "react";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";
import {
  Package,
  FolderTree,
  AlertTriangle,
  Activity,
  ArrowRight,
  ShoppingCart,
  FileText,
  Sliders,
  Users,
  Settings,
  TrendingUp,
  Sparkles,
  FileSpreadsheet,
  Radio,
} from "lucide-react";
import Link from "next/link";

interface AdminOverviewClientProps {
  userName?: string;
  totalProducts: number;
  totalCategories: number;
  outOfStockProducts: number;
}

export function AdminOverviewClient({
  userName,
  totalProducts,
  totalCategories,
  outOfStockProducts,
}: AdminOverviewClientProps) {
  const { theme } = useAdminThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && theme === "light";

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div>
        <h1
          className={`type-section-title font-extrabold tracking-tight transition-colors duration-200 ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        >
          Dashboard Overview
        </h1>
        <p
          className={`type-body-large mt-1.5 transition-colors duration-200 ${
            isLight ? "text-slate-600" : "text-slate-400"
          }`}
        >
          Welcome back,{" "}
          <span
            className={`font-semibold ${
              isLight ? "text-slate-900" : "text-slate-200"
            }`}
          >
            {userName || "Admin"}
          </span>
          . Here is what&apos;s happening with the catalog today.
        </p>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MetricCard
          title="Total Products"
          value={totalProducts.toLocaleString()}
          icon={<Package className="w-5 h-5 text-sky-500" />}
          iconBg={
            isLight
              ? "bg-sky-50 border-sky-100 text-sky-600"
              : "bg-sky-500/10 border-sky-500/20 text-sky-400"
          }
          glowColor="bg-sky-500"
          trend="+12 added recently"
          isLight={isLight}
          href="/admin/products"
        />

        <MetricCard
          title="Categories"
          value={totalCategories.toLocaleString()}
          icon={<FolderTree className="w-5 h-5 text-emerald-500" />}
          iconBg={
            isLight
              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }
          glowColor="bg-emerald-500"
          trend="Active taxonomy groups"
          isLight={isLight}
          href="/admin/categories"
        />

        <MetricCard
          title="Out of Stock"
          value={outOfStockProducts.toLocaleString()}
          icon={
            <AlertTriangle
              className={`w-5 h-5 ${
                outOfStockProducts > 0 ? "text-amber-500" : "text-emerald-500"
              }`}
            />
          }
          iconBg={
            outOfStockProducts > 0
              ? isLight
                ? "bg-amber-50 border-amber-100 text-amber-600"
                : "bg-amber-500/10 border-amber-500/20 text-amber-400"
              : isLight
              ? "bg-emerald-50 border-emerald-100 text-emerald-600"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }
          glowColor={outOfStockProducts > 0 ? "bg-amber-500" : "bg-emerald-500"}
          trend={
            outOfStockProducts > 0
              ? "Requires restocking"
              : "All inventory available"
          }
          alert={outOfStockProducts > 0}
          isLight={isLight}
          href="/admin/products"
        />

        <MetricCard
          title="System Status"
          value="Healthy"
          icon={<Activity className="w-5 h-5 text-indigo-500" />}
          iconBg={
            isLight
              ? "bg-indigo-50 border-indigo-100 text-indigo-600"
              : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
          }
          glowColor="bg-indigo-500"
          trend="Postgres & APIs live"
          isLight={isLight}
          href="/admin/settings"
        />
      </div>

      {/* Getting Started & Quick Operations Hub */}
      <div
        className={`rounded-2xl p-6 sm:p-8 border transition-all duration-200 ${
          isLight
            ? "bg-white border-slate-200 shadow-xs"
            : "bg-slate-900 border-slate-800 shadow-xl"
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h2
                className={`text-xl font-bold tracking-tight ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
              >
                Catalog & Operations Hub
              </h2>
            </div>
            <p
              className={`mt-1.5 text-sm max-w-2xl ${
                isLight ? "text-slate-600" : "text-slate-400"
              }`}
            >
              Direct access to live database inventory, customer order dispatch, B2B quotation requests, telemetry, and storefront customization.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <QuickActionCard
            isLight={isLight}
            href="/admin/products"
            icon={<Package className="w-5 h-5 text-emerald-500" />}
            title="Products Inventory"
            description="Manage pricing, variants, specifications & stock"
          />
          <QuickActionCard
            isLight={isLight}
            href="/admin/categories"
            icon={<FolderTree className="w-5 h-5 text-amber-500" />}
            title="Categories & Taxonomy"
            description="Organize product groups, tags & hierarchy"
          />
          <QuickActionCard
            isLight={isLight}
            href="/admin/quotes"
            icon={<FileText className="w-5 h-5 text-sky-500" />}
            title="Bulk RFQ Requests"
            description="Review corporate quotation inquiries & BOM lines"
          />
          <QuickActionCard
            isLight={isLight}
            href="/admin/orders"
            icon={<ShoppingCart className="w-5 h-5 text-indigo-500" />}
            title="Customer Orders"
            description="Manage COD orders, freight tracking & shipments"
          />
          <QuickActionCard
            isLight={isLight}
            href="/admin/homepage"
            icon={<Sliders className="w-5 h-5 text-pink-500" />}
            title="Homepage Management"
            description="Edit promotional ticker, hero banners & showcases"
          />
          <QuickActionCard
            isLight={isLight}
            href="/admin/forms"
            icon={<FileSpreadsheet className="w-5 h-5 text-amber-500" />}
            title="Forms & Submissions"
            description="Inspect contact inquiries & export to Excel (.CSV)"
          />
          <QuickActionCard
            isLight={isLight}
            href="/admin/live-tracker"
            icon={<Radio className="w-5 h-5 text-teal-500" />}
            title="Live User Tracker"
            description="Real-time visitor telemetry, cart events & map"
          />
          <QuickActionCard
            isLight={isLight}
            href="/admin/settings"
            icon={<Settings className="w-5 h-5 text-slate-500" />}
            title="Platform Settings"
            description="Configure contacts, taxes, theme & database health"
          />
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  iconBg,
  glowColor,
  trend,
  alert,
  isLight,
  href,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg: string;
  glowColor: string;
  trend?: string;
  alert?: boolean;
  isLight: boolean;
  href?: string;
}) {
  const content = (
    <div
      className={`rounded-2xl p-6 relative overflow-hidden group border transition-all duration-200 ${
        isLight
          ? "bg-white border-slate-200 shadow-xs hover:shadow-md hover:border-slate-300"
          : "bg-slate-900 border-slate-800 shadow-xl hover:border-slate-700"
      }`}
    >
      <div
        className={`absolute top-0 right-0 w-28 h-28 blur-3xl rounded-full transition-opacity pointer-events-none ${glowColor} ${
          isLight ? "opacity-10 group-hover:opacity-25" : "opacity-20 group-hover:opacity-40"
        }`}
      />
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p
            className={`text-xs font-semibold uppercase tracking-wider mb-1 font-mono ${
              isLight ? "text-slate-500" : "text-slate-400"
            }`}
          >
            {title}
          </p>
          <p
            className={`text-3xl font-extrabold tracking-tight font-mono ${
              isLight ? "text-slate-900" : "text-white"
            }`}
          >
            {value}
          </p>
        </div>
        <div className={`p-3 rounded-xl border ${iconBg}`}>{icon}</div>
      </div>
      {trend && (
        <div
          className={`mt-4 text-xs font-medium relative z-10 flex items-center gap-1.5 ${
            alert
              ? isLight
                ? "text-amber-600 font-semibold"
                : "text-amber-400 font-semibold"
              : isLight
              ? "text-slate-500"
              : "text-slate-400"
          }`}
        >
          {alert && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
          <span>{trend}</span>
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}

function QuickActionCard({
  isLight,
  href,
  icon,
  title,
  description,
}: {
  isLight: boolean;
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className={`p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between group ${
        isLight
          ? "bg-slate-50/70 hover:bg-slate-100/90 border-slate-200 text-slate-800 hover:border-slate-300 shadow-2xs hover:shadow-xs"
          : "bg-slate-950/60 hover:bg-slate-800/60 border-slate-800 text-slate-200 hover:border-slate-700"
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <div
            className={`p-2 rounded-lg border ${
              isLight ? "bg-white border-slate-200 shadow-2xs" : "bg-slate-900 border-slate-800"
            }`}
          >
            {icon}
          </div>
          <ArrowRight
            className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${
              isLight
                ? "text-slate-400 group-hover:text-slate-800"
                : "text-slate-500 group-hover:text-slate-200"
            }`}
          />
        </div>
        <h3
          className={`font-bold text-sm mb-1 ${
            isLight ? "text-slate-900" : "text-white"
          }`}
        >
          {title}
        </h3>
        <p
          className={`text-xs line-clamp-2 ${
            isLight ? "text-slate-500" : "text-slate-400"
          }`}
        >
          {description}
        </p>
      </div>
    </Link>
  );
}
