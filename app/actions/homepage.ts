"use server";

import { revalidatePath } from "next/cache";
import { updateHomepageData } from "@/lib/homepage-server";
import { HomepageData } from "@/lib/homepage";

export async function saveHomepageConfigAction(data: Partial<HomepageData>) {
  try {
    const res = await updateHomepageData(data);
    if (res.success) {
      revalidatePath("/");
      revalidatePath("/admin/homepage");
    }
    return res;
  } catch (error: any) {
    console.error("saveHomepageConfigAction error:", error);
    return { success: false, error: error.message || "Failed to save homepage settings" };
  }
}
