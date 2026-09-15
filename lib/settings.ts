import "server-only";
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
  shiprocket_enabled: boolean;
  shiprocket_email: string;
  shiprocket_password: string;
  shiprocket_pickup_location: string;
  shiprocket_pickup_pincode: string;
  shiprocket_default_weight: number;
  shiprocket_default_length: number;
  shiprocket_default_breadth: number;
  shiprocket_default_height: number;
  shiprocket_auto_sync: boolean;
  shiprocket_webhook_secret?: string;
}

/**
 * Strictly allowlisted public settings DTO.
 * Guaranteed to NEVER contain Shiprocket credentials, API secrets, tokens, or passwords.
 */
export interface PublicSettings {
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
  shiprocket_enabled: boolean;
  shiprocket_pickup_pincode: string;
  shiprocket_default_weight: number;
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
  min_order_value: 1,
  tax_rate: 18,
  cod_enabled: true,
  maintenance_mode: false,
  shiprocket_enabled: true,
  shiprocket_email: "",
  shiprocket_password: "",
  shiprocket_pickup_location: "Primary",
  shiprocket_pickup_pincode: "360004",
  shiprocket_default_weight: 0.5,
  shiprocket_default_length: 10,
  shiprocket_default_breadth: 10,
  shiprocket_default_height: 10,
  shiprocket_auto_sync: false,
  shiprocket_webhook_secret: "",
};

/**
 * Server-only: retrieves full settings from database and environment variables.
 * Contains private credentials (shiprocket_email, shiprocket_password).
 * Must NEVER be sent to the browser or serialized in client props.
 */
export async function getPrivateSystemSettings(): Promise<SystemSettings> {
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
      shiprocket_enabled: settings.shiprocket_enabled !== "false",
      shiprocket_email: settings.shiprocket_email || process.env.SHIPROCKET_EMAIL || DEFAULT_SETTINGS.shiprocket_email,
      shiprocket_password: settings.shiprocket_password || process.env.SHIPROCKET_PASSWORD || DEFAULT_SETTINGS.shiprocket_password,
      shiprocket_pickup_location: settings.shiprocket_pickup_location || DEFAULT_SETTINGS.shiprocket_pickup_location,
      shiprocket_pickup_pincode: settings.shiprocket_pickup_pincode || DEFAULT_SETTINGS.shiprocket_pickup_pincode,
      shiprocket_default_weight: Number(settings.shiprocket_default_weight ?? DEFAULT_SETTINGS.shiprocket_default_weight),
      shiprocket_default_length: Number(settings.shiprocket_default_length ?? DEFAULT_SETTINGS.shiprocket_default_length),
      shiprocket_default_breadth: Number(settings.shiprocket_default_breadth ?? DEFAULT_SETTINGS.shiprocket_default_breadth),
      shiprocket_default_height: Number(settings.shiprocket_default_height ?? DEFAULT_SETTINGS.shiprocket_default_height),
      shiprocket_auto_sync: settings.shiprocket_auto_sync === "true",
      shiprocket_webhook_secret: settings.shiprocket_webhook_secret || process.env.SHIPROCKET_WEBHOOK_SECRET || DEFAULT_SETTINGS.shiprocket_webhook_secret,
    };
  } catch (error) {
    console.error("Failed to fetch system settings:", error);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Returns strictly allowlisted, browser-safe public settings.
 * Uses an explicit allowlist to prevent any accidental credential leakage.
 */
export async function getPublicSettings(): Promise<PublicSettings> {
  const full = await getPrivateSystemSettings();
  return {
    store_name: full.store_name,
    support_email: full.support_email,
    support_phone: full.support_phone,
    sub_contact_1_name: full.sub_contact_1_name,
    sub_contact_1_phone: full.sub_contact_1_phone,
    sub_contact_2_name: full.sub_contact_2_name,
    sub_contact_2_phone: full.sub_contact_2_phone,
    sub_contact_3_name: full.sub_contact_3_name,
    sub_contact_3_phone: full.sub_contact_3_phone,
    sub_email_1: full.sub_email_1,
    sub_email_2: full.sub_email_2,
    currency_symbol: full.currency_symbol,
    gst_number: full.gst_number,
    min_order_value: full.min_order_value,
    tax_rate: full.tax_rate,
    cod_enabled: full.cod_enabled,
    maintenance_mode: full.maintenance_mode,
    shiprocket_enabled: full.shiprocket_enabled,
    shiprocket_pickup_pincode: full.shiprocket_pickup_pincode,
    shiprocket_default_weight: full.shiprocket_default_weight,
  };
}

/**
 * Backwards compatibility alias for server-side services (shiprocket, order processing).
 */
export const getSystemSettings = getPrivateSystemSettings;

