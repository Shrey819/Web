"use client";

import { useState } from "react";
import { saveSettingsAction, testDbConnectionAction } from "@/app/admin/(dashboard)/settings/actions";
import { useToastStore } from "@/store/useToastStore";
import { Store, CreditCard, Database, ShieldCheck, Save, Loader2, Activity, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";

interface SettingsFormProps {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [activeTab, setActiveTab] = useState<"general" | "commerce" | "health" | "security">("general");
  const [loading, setLoading] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{ success: boolean; latency?: number; timestamp?: string; error?: string } | null>(null);
  const [testingDb, setTestingDb] = useState(false);
  const { addToast } = useToastStore();

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await saveSettingsAction(null, formData);
    setLoading(false);

    if (res.success) {
      addToast("success", "Settings Saved", "System configuration updated successfully.");
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
          onClick={() => setActiveTab("commerce")}
          className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
            activeTab === "commerce"
              ? "border-emerald-500 text-emerald-400 bg-slate-900/50"
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
      {activeTab === "general" && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl animate-in fade-in duration-200">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-white">Business Identity & Support Contacts</h3>
            <p className="text-xs text-slate-400">Configure global storefront branding, GST identity, and customer support channels.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300">Store / Company Name</label>
              <input
                type="text"
                name="store_name"
                defaultValue={initialSettings.store_name || "OM Automation & Controls"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
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

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300">Customer Support Email</label>
              <input
                type="email"
                name="support_email"
                defaultValue={initialSettings.support_email || "support@omautomation.com"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono font-bold uppercase text-slate-300">Support Contact Phone</label>
              <input
                type="text"
                name="support_phone"
                defaultValue={initialSettings.support_phone || "+91 9876543210"}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CHECKOUT & E-COMMERCE */}
      {activeTab === "commerce" && (
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
                className="bg-slate-900 border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-emerald-400 focus:outline-none cursor-pointer"
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
                className="bg-slate-900 border border-slate-700 text-xs font-bold rounded-xl px-3 py-2 text-amber-400 focus:outline-none cursor-pointer"
              >
                <option value="false">OFF (STOREFRONT LIVE)</option>
                <option value="true">ON (MAINTENANCE ACTIVE)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DATABASE & HEALTH */}
      {activeTab === "health" && (
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
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors border border-slate-700"
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
      )}

      {/* TAB 4: SECURITY & ACCESS */}
      {activeTab === "security" && (
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
      )}

      {/* Submit Save Button */}
      <div className="flex items-center justify-end pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-all shadow-xl shadow-sky-500/20 disabled:opacity-50 active:scale-95"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{loading ? "Saving..." : "Save Settings Changes"}</span>
        </button>
      </div>
    </form>
  );
}
