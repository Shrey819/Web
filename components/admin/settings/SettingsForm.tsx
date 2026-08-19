"use client";

import { useState } from "react";
import { saveSettingsAction, testDbConnectionAction } from "@/app/admin/(dashboard)/settings/actions";
import { useToastStore } from "@/store/useToastStore";
import { useAdminThemeStore } from "@/store/useAdminThemeStore";
import {
  Store,
  CreditCard,
  Database,
  ShieldCheck,
  Save,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Moon,
  Sun,
  Palette,
  Check,
  PhoneCall,
  Mail,
  UserCheck,
} from "lucide-react";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<
    "general" | "contacts" | "commerce" | "health" | "security" | "theme"
  >("general");
  const [loading, setLoading] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    success: boolean;
    latency?: number;
    timestamp?: string;
    error?: string;
  } | null>(null);
  const [testingDb, setTestingDb] = useState(false);

  const { addToast } = useToastStore();
  const { theme: currentTheme, setTheme: setAdminTheme } = useAdminThemeStore();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.append("admin_theme", currentTheme);

    const res = await saveSettingsAction(null, formData);
    setLoading(false);

    if (res.success) {
      addToast(
        "success",
        "Settings Saved",
        "System contacts and store configuration updated across the entire site."
      );
    } else {
      addToast("error", "Save Failed", res.error || "Could not save configuration.");
    }
  };

  const handleTestConnection = async () => {
    setTestingDb(true);
    const res = await testDbConnectionAction();
    setTestingDb(false);
    setDbTestResult(res);
    if (res.success) {
      addToast("success", "Database Connected", `Neon Postgres responded in ${res.latency}ms`);
    } else {
      addToast("error", "Connection Error", res.error || "Database ping failed");
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-1 overflow-x-auto pb-px">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "general"
              ? "border-sky-500 text-sky-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Store className="w-4 h-4" />
          General & Store Identity
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "contacts"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <PhoneCall className="w-4 h-4" />
          Main & Sub Contacts (Phones/Emails)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("theme")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "theme"
              ? "border-amber-500 text-amber-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" />
          Theme & Appearance
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("commerce")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "commerce"
              ? "border-indigo-500 text-indigo-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Checkout & E-Commerce
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("health")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "health"
              ? "border-amber-500 text-amber-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Database className="w-4 h-4" />
          Database & Health
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "security"
              ? "border-purple-500 text-purple-400 bg-slate-900/50"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Security & Access
        </button>
      </div>

      {/* TAB 1: GENERAL & STORE IDENTITY */}
      <div className={activeTab === "general" ? "block" : "hidden"}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">Business Identity & Store Configuration</h3>
            <p className="text-xs text-slate-400">Configure global storefront branding and GST identity.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300">Store / Company Name</label>
              <input
                type="text"
                name="store_name"
                defaultValue={initialSettings.store_name || "OM Automation & Controls"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500 font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300">GSTIN / Tax Identification</label>
              <input
                type="text"
                name="gst_number"
                defaultValue={initialSettings.gst_number || "27AAAAA0000A1Z5"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TAB 2: MAIN & SUB CONTACTS (PHONES & EMAILS) */}
      <div className={activeTab === "contacts" ? "block" : "hidden"}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200 font-mono">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-mono">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              Dynamic Main & Sub Contact Management
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Editing these values dynamically updates all phone numbers, email addresses, and contact persons in the Header, Footer, Contact Us page, and Delivery page across the entire website.
            </p>
          </div>

          {/* Section 1: Main Public Phone & Email */}
          <div className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4" />
              1. Main Contact Channels (Header & Primary CTAs)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Main Support Email</label>
                <input
                  type="email"
                  name="support_email"
                  defaultValue={initialSettings.support_email || "omautomation2012@gmail.com"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Main Support Phone (Header CTA)</label>
                <input
                  type="text"
                  name="support_phone"
                  defaultValue={initialSettings.support_phone || "+91 90993 92066"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sub Contact Persons & Phone Numbers (Footer & Direct Call Lines) */}
          <div className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-sky-400 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              2. Sub Contact Persons & Direct Phone Lines (Footer Display)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sub Contact 1 */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Sub Contact 1 (Founder / Lead 1)</span>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Contact Name</label>
                  <input
                    type="text"
                    name="sub_contact_1_name"
                    defaultValue={initialSettings.sub_contact_1_name || "Hiren Padia"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    name="sub_contact_1_phone"
                    defaultValue={initialSettings.sub_contact_1_phone || "+91 90993 92066"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Sub Contact 2 */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Sub Contact 2 (Founder / Lead 2)</span>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Contact Name</label>
                  <input
                    type="text"
                    name="sub_contact_2_name"
                    defaultValue={initialSettings.sub_contact_2_name || "Mahesh Pambhar"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    name="sub_contact_2_phone"
                    defaultValue={initialSettings.sub_contact_2_phone || "+91 99130 85220"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>

              {/* Sub Contact 3 */}
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-[10px] text-amber-400 font-bold uppercase block">Sub Contact 3 (Founder / Lead 3)</span>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Contact Name</label>
                  <input
                    type="text"
                    name="sub_contact_3_name"
                    defaultValue={initialSettings.sub_contact_3_name || "Dharmesh Pambhar"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase">Phone Number</label>
                  <input
                    type="text"
                    name="sub_contact_3_phone"
                    defaultValue={initialSettings.sub_contact_3_phone || "+91 94272 70113"}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Sub Emails (Footer & Public Support Channels) */}
          <div className="space-y-4 bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
            <h4 className="text-sm font-bold text-pink-400 uppercase tracking-wider flex items-center gap-2">
              <Mail className="w-4 h-4" />
              3. Secondary / Sub Email Addresses (Footer Display)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Sub Email 1 (Primary Public Mail)</label>
                <input
                  type="email"
                  name="sub_email_1"
                  defaultValue={initialSettings.sub_email_1 || "omautomation2012@gmail.com"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-bold uppercase">Sub Email 2 (Secondary Public Mail)</label>
                <input
                  type="email"
                  name="sub_email_2"
                  defaultValue={initialSettings.sub_email_2 || "padiahiren24565@gmail.com"}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-pink-400"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 3: THEME & APPEARANCE (Dark Mode vs Light Mode) */}
      <div className={activeTab === "theme" ? "block" : "hidden"}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white font-mono flex items-center gap-2">
              <Palette className="w-5 h-5 text-amber-400" />
              Admin Panel Theme & Appearance
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Switch the Admin Panel UI between Dark Mode (Default) and Light Mode. All dashboard colors, tables, and sidebars will adjust accordingly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
            {/* Dark Mode Card (Default) */}
            <div
              onClick={() => {
                setAdminTheme("dark");
                addToast("info", "Dark Mode Active", "Admin panel switched to Dark Mode.");
              }}
              className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 bg-slate-950 text-white flex flex-col justify-between space-y-4 shadow-2xl ${
                currentTheme === "dark"
                  ? "border-amber-400 ring-4 ring-amber-400/20 scale-102"
                  : "border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-amber-400 shadow">
                    <Moon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base font-mono">Dark Mode (Current System Default)</h4>
                    <p className="text-xs text-slate-400">Deep obsidian background with amber accents</p>
                  </div>
                </div>

                {currentTheme === "dark" && (
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Theme Mini Preview Frame */}
              <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-amber-400">Sidebar</span>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-sky-400">Table Data</span>
                </div>
                <div className="h-2 bg-slate-800 rounded w-3/4" />
                <div className="h-2 bg-slate-800 rounded w-1/2" />
              </div>
            </div>

            {/* Light Mode Card */}
            <div
              onClick={() => {
                setAdminTheme("light");
                addToast("info", "Light Mode Active", "Admin panel switched to Light Mode.");
              }}
              className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 bg-white text-slate-900 flex flex-col justify-between space-y-4 shadow-xl ${
                currentTheme === "light"
                  ? "border-amber-500 ring-4 ring-amber-500/20 scale-102"
                  : "border-slate-300 opacity-70 hover:opacity-100 hover:border-slate-400"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-amber-600 shadow">
                    <Sun className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base font-mono">Light Mode</h4>
                    <p className="text-xs text-slate-500">Crisp white background with high-contrast slate text</p>
                  </div>
                </div>

                {currentTheme === "light" && (
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Theme Mini Preview Frame */}
              <div className="bg-slate-100 rounded-xl p-3 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-600">
                  <span className="bg-slate-200 px-2 py-0.5 rounded text-amber-600">Sidebar</span>
                  <span className="bg-slate-200 px-2 py-0.5 rounded text-sky-600">Table Data</span>
                </div>
                <div className="h-2 bg-slate-300 rounded w-3/4" />
                <div className="h-2 bg-slate-300 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 4: CHECKOUT & E-COMMERCE */}
      <div className={activeTab === "commerce" ? "block" : "hidden"}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">E-Commerce & Orders Configuration</h3>
            <p className="text-xs text-slate-400">Manage minimum order limits, taxes, and checkout options.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300">Minimum Order Amount (₹)</label>
              <input
                type="number"
                name="min_order_value"
                defaultValue={initialSettings.min_order_value || "1000"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300">Default Tax / GST Rate (%)</label>
              <input
                type="number"
                name="tax_rate"
                defaultValue={initialSettings.tax_rate || "18"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-sm text-white block">Cash on Delivery (COD)</span>
                <span className="text-xs text-slate-400">Allow customers to place COD orders for verified B2B shipments.</span>
              </div>
              <select
                name="cod_enabled"
                defaultValue={initialSettings.cod_enabled || "true"}
                className="bg-slate-900 border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-emerald-400 focus:outline-none cursor-pointer font-mono"
              >
                <option value="true">ENABLED</option>
                <option value="false">DISABLED</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <span className="font-bold text-sm text-white block">System Maintenance Mode</span>
                <span className="text-xs text-slate-400">Temporarily pause storefront checkout for database upgrades.</span>
              </div>
              <select
                name="maintenance_mode"
                defaultValue={initialSettings.maintenance_mode || "false"}
                className="bg-slate-900 border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-amber-400 focus:outline-none cursor-pointer font-mono"
              >
                <option value="false">OFF (STOREFRONT LIVE)</option>
                <option value="true">ON (MAINTENANCE ACTIVE)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 5: DATABASE & HEALTH */}
      <div className={activeTab === "health" ? "block" : "hidden"}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Database Telemetry & Neon Serverless Health</h3>
              <p className="text-xs text-slate-400">Monitor PostgreSQL connection latency and serverless pool status.</p>
            </div>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testingDb}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700 font-mono"
            >
              {testingDb ? <Loader2 className="w-4 h-4 animate-spin text-amber-400" /> : <RefreshCw className="w-4 h-4 text-sky-400" />}
              <span>Test Connection</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Provider Engine</span>
              <div className="text-base font-extrabold text-white font-mono">Neon Serverless Postgres</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Transport Protocol</span>
              <div className="text-base font-extrabold text-sky-400 font-mono">WebSocket (ws)</div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-1">
              <span className="text-xs font-mono text-slate-400 font-bold uppercase">Ping Status</span>
              <div className="text-base font-extrabold text-emerald-400 font-mono">
                {dbTestResult?.latency ? `${dbTestResult.latency} ms` : "Connected"}
              </div>
            </div>
          </div>

          {dbTestResult && (
            <div className={`p-4 rounded-2xl border ${dbTestResult.success ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
              <div className="flex items-center gap-2 text-xs font-mono font-bold">
                {dbTestResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                <span>{dbTestResult.success ? "PostgreSQL Query Succeeded" : "PostgreSQL Query Failed"}</span>
              </div>
              <p className="text-xs mt-1 font-mono opacity-90">{dbTestResult.timestamp || dbTestResult.error}</p>
            </div>
          )}
        </div>
      </div>

      {/* TAB 6: SECURITY & ACCESS */}
      <div className={activeTab === "security" ? "block" : "hidden"}>
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">Security & Admin Authentication Policies</h3>
            <p className="text-xs text-slate-400">Configure Auth.js session cookies, password hashing standards, and encryption controls.</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-sm text-white block">Password Hashing Algorithm</span>
              <p className="text-xs text-slate-400">High-security Argon2id memory-hard password hashing is enforced for all system users.</p>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="font-bold text-sm text-white block">Admin Session Security</span>
              <p className="text-xs text-slate-400">JWT sessions are signed with server-side secrets and expire after 24 hours of inactivity.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Submit Save Button */}
      <div className="flex items-center justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50 active:scale-95 font-mono"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{loading ? "Saving..." : "Save Settings Changes"}</span>
        </button>
      </div>
    </form>
  );
}
