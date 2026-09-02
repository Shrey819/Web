"use server";

import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function saveSettingsAction(prevState: any, formData: FormData) {
  const session = await auth();
  if (!session) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const keys = [
      "store_name",
      "support_email",
      "support_phone",
      "sub_contact_1_name",
      "sub_contact_1_phone",
      "sub_contact_2_name",
      "sub_contact_2_phone",
      "sub_contact_3_name",
      "sub_contact_3_phone",
      "sub_email_1",
      "sub_email_2",
      "gst_number",
      "min_order_value",
      "tax_rate",
      "cod_enabled",
      "maintenance_mode",
      "shiprocket_enabled",
      "shiprocket_email",
      "shiprocket_password",
      "shiprocket_pickup_location",
      "shiprocket_pickup_pincode",
      "shiprocket_default_weight",
      "shiprocket_default_length",
      "shiprocket_default_breadth",
      "shiprocket_default_height",
      "shiprocket_auto_sync",
    ];

    for (const key of keys) {
      const val = formData.get(key);
      if (val !== null) {
        await query(
          `INSERT INTO "SystemSetting" ("key", "value", "updatedAt") 
           VALUES ($1, $2, CURRENT_TIMESTAMP) 
           ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value", "updatedAt" = CURRENT_TIMESTAMP`,
          [key, String(val)]
        );
      }
    }

    revalidatePath("/admin/settings");
    revalidatePath("/contact");
    revalidatePath("/delivery");
    revalidatePath("/about");
    revalidatePath("/checkout");
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save settings:", error);
    return { success: false, error: error.message || "Failed to save settings" };
  }
}

export async function testDbConnectionAction() {
  const start = Date.now();
  try {
    const res = await query("SELECT NOW() as now, version() as version");
    const latency = Date.now() - start;
    const nowVal = res.rows[0]?.now;
    const timestampStr = nowVal instanceof Date ? nowVal.toISOString() : String(nowVal || new Date().toISOString());
    const versionStr = String(res.rows[0]?.version || "PostgreSQL Neon Serverless");

    return {
      success: true,
      latency,
      timestamp: timestampStr,
      version: versionStr
    };
  } catch (error: any) {
    return { success: false, error: String(error.message || error) };
  }
}
