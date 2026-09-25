"use server";

import { revalidatePath } from "next/cache";
import { updateHomepageData } from "@/lib/homepage-server";
import { HomepageData } from "@/lib/homepage";
import { requireAdmin } from "@/lib/auth-checks";
import { safeActionResponse } from "@/lib/safe-error";

export async function saveHomepageConfigAction(data: Partial<HomepageData>) {
  await requireAdmin();
  try {
    const res = await updateHomepageData(data);
    if (res.success) {
      revalidatePath("/");
      revalidatePath("/admin/homepage");
    }
    return res;
  } catch (error) {
    return safeActionResponse(error, "Failed to save homepage settings");
  }
}
