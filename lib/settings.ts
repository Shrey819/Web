import { query } from "@/lib/db";

export interface SystemSettings {
  store_name: string;
  support_email: string;
  support_phone: string;
  sub_contact_1_name: string;
  sub_contact_1_phone: string;
  sub_contact_2_name: string;
  sub_contact_2_phone: string;
  sub_contact_3_name: string;
  sub_contact_3_phone: string;
  sub_email_1: string;
  sub_email_2: string;
  currency_symbol: string;
  gst_number: string;
  min_order_value: number;
  tax_rate: number;
  cod_enabled: boolean;
  maintenance_mode: boolean;
}

export const DEFAULT_SETTINGS: SystemSettings = {
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
      sub_contact_1_name: settings.sub_contact_1_name || DEFAULT_SETTINGS.sub_contact_1_name,
      sub_contact_1_phone: settings.sub_contact_1_phone || DEFAULT_SETTINGS.sub_contact_1_phone,
      sub_contact_2_name: settings.sub_contact_2_name || DEFAULT_SETTINGS.sub_contact_2_name,
      sub_contact_2_phone: settings.sub_contact_2_phone || DEFAULT_SETTINGS.sub_contact_2_phone,
      sub_contact_3_name: settings.sub_contact_3_name || DEFAULT_SETTINGS.sub_contact_3_name,
      sub_contact_3_phone: settings.sub_contact_3_phone || DEFAULT_SETTINGS.sub_contact_3_phone,
      sub_email_1: settings.sub_email_1 || DEFAULT_SETTINGS.sub_email_1,
      sub_email_2: settings.sub_email_2 || DEFAULT_SETTINGS.sub_email_2,
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
