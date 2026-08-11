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
      "gst_number",
      "min_order_value",
      "tax_rate",
      "cod_enabled",
      "maintenance_mode"
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
    revalidatePath("/checkout");
    revalidatePath("/");
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
