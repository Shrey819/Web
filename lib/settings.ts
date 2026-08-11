import { query } from "@/lib/db";

export interface SystemSettings {
  store_name: string;
  support_email: string;
  support_phone: string;
  currency_symbol: string;
  gst_number: string;
  min_order_value: number;
  tax_rate: number;
  cod_enabled: boolean;
  maintenance_mode: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
  store_name: "OM Automation & Industrial Controls",
  support_email: "support@omautomation.com",
  support_phone: "+91 9876543210",
  currency_symbol: "₹",
  gst_number: "27AAAAA0000A1Z5",
  min_order_value: 1000,
  tax_rate: 18,
  cod_enabled: true,
  maintenance_mode: false,
};

export async function getSystemSettings(): Promise<SystemSettings> {
  try {
    const res = await query(`SELECT key, value FROM "SystemSetting"`);
    const settings: Record<string, string> = {};
    
    res.rows.forEach((row: any) => {
      if (row.key && row.value !== null && row.value !== undefined) {
        settings[String(row.key)] = String(row.value);
      }
    });

    return {
      store_name: settings.store_name || DEFAULT_SETTINGS.store_name,
      support_email: settings.support_email || DEFAULT_SETTINGS.support_email,
      support_phone: settings.support_phone || DEFAULT_SETTINGS.support_phone,
      currency_symbol: settings.currency_symbol || DEFAULT_SETTINGS.currency_symbol,
      gst_number: settings.gst_number || DEFAULT_SETTINGS.gst_number,
      min_order_value: Number(settings.min_order_value ?? DEFAULT_SETTINGS.min_order_value),
      tax_rate: Number(settings.tax_rate ?? DEFAULT_SETTINGS.tax_rate),
      cod_enabled: settings.cod_enabled !== "false",
      maintenance_mode: settings.maintenance_mode === "true",
    };
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return DEFAULT_SETTINGS;
  }
}
