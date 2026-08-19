import { query } from "@/lib/db";
import { SettingsForm } from "@/components/admin/settings/SettingsForm";
import { Settings, Server } from "lucide-react";

export default async function AdminSettingsPage() {
  const settingsMap: Record<string, string> = {
    store_name: "OM Automation & Industrial Controls",
    support_email: "omautomation2012@gmail.com",
    support_phone: "+91 90993 92066",
    sub_contact_1_name: "Hiren Padia",
    sub_contact_1_phone: "+91 90993 92066",
    sub_contact_2_name: "Mahesh Pambhar",
    sub_contact_2_phone: "+91 99130 85220",
    sub_contact_3_name: "Dharmesh Pambhar",
    sub_contact_3_phone: "+91 94272 70113",
    sub_email_1: "omautomation2012@gmail.com",
    sub_email_2: "padiahiren24565@gmail.com",
    currency_symbol: "₹",
    gst_number: "27AAAAA0000A1Z5",
    min_order_value: "1000",
    tax_rate: "18",
    cod_enabled: "true",
    maintenance_mode: "false",
  };

  try {
    const res = await query(`SELECT key, value FROM "SystemSetting"`);
    res.rows.forEach((row: any) => {
      if (row.key && row.value !== null && row.value !== undefined) {
        settingsMap[String(row.key)] = String(row.value);
      }
    });
  } catch (error) {
    console.error("Failed to load system settings from database:", error);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <Settings className="w-6 h-6 text-sky-400" />
            <span>System & Platform Settings</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure global e-commerce parameters, main/sub contact phones, emails, taxes, and database telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
          <Server className="w-3.5 h-3.5 text-emerald-400" />
          <span>STATUS: ONLINE</span>
        </div>
      </div>

      {/* Main Settings Form */}
      <SettingsForm initialSettings={settingsMap} />
    </div>
  );
}
