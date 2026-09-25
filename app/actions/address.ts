"use server";

import { revalidatePath } from "next/cache";
import { requireCustomer } from "@/lib/auth-checks";
import type { CustomerAddressDTO, AddressInput } from "@/lib/dal/types";
import {
  getAddressesForUser,
  getAddressByIdForUser,
  createAddressForUser,
  updateAddressForUser,
  deleteAddressForUser,
  setDefaultAddressForUser,
  saveAddressFromCheckoutForUser,
} from "@/lib/dal/address";
import { addressCreateSchema } from "@/lib/validations/address";
import { idSchema } from "@/lib/validations/common";
import { safeActionResponse, sanitizeErrorMessage } from "@/lib/safe-error";

/**
 * Get all saved addresses for the authenticated customer.
 * Client parameters (userId, userEmail) are safely ignored; identity is derived from the server session.
 */
export async function getUserAddressesAction(userId?: string | null, userEmail?: string | null) {
  try {
    let sessionUser;
    try {
      sessionUser = await requireCustomer();
    } catch {
      // Unauthenticated caller returns empty addresses
      return { success: true, addresses: [] };
    }

    const addresses = await getAddressesForUser(sessionUser.id);
    return { success: true, addresses };
  } catch (error) {
    return { success: false, error: sanitizeErrorMessage(error, "Failed to load addresses"), addresses: [] };
  }
}

/**
 * Get single address by ID (Strict ownership check).
 * Returns null if not found or belongs to another user (zero existence leakage).
 */
export async function getAddressByIdAction(id: string): Promise<CustomerAddressDTO | null> {
  try {
    if (!id || typeof id !== "string") return null;
    const sessionUser = await requireCustomer();
    return await getAddressByIdForUser(id, sessionUser.id);
  } catch {
    return null;
  }
}

/**
 * Create a new address for the authenticated customer.
 * Ignores any client-submitted userId to prevent user spoofing.
 */
export async function createAddressAction(data: AddressInput) {
  try {
    const sessionUser = await requireCustomer();

    const parsed = addressCreateSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid address data." };
    }

    const address = await createAddressForUser(sessionUser.id, parsed.data as any);

    revalidatePath("/profile");
    revalidatePath("/checkout");

    return { success: true, address };
  } catch (error) {
    return safeActionResponse(error, "Failed to save address");
  }
}

/**
 * Update an existing address (Strict ownership check: WHERE id = $1 AND userId = $2).
 */
export async function updateAddressAction(id: string, data: AddressInput) {
  try {
    const sessionUser = await requireCustomer();

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: "Invalid address ID." };
    }

    const parsed = addressCreateSchema.partial().safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0]?.message || "Invalid address data." };
    }

    const address = await updateAddressForUser(parsedId.data, sessionUser.id, parsed.data as any);

    if (!address) {
      return { success: false, error: "Address not found." };
    }

    revalidatePath("/profile");
    revalidatePath("/checkout");

    return { success: true, address };
  } catch (error) {
    return safeActionResponse(error, "Failed to update address");
  }
}

/**
 * Delete an address (Strict ownership check: WHERE id = $1 AND userId = $2).
 */
export async function deleteAddressAction(id: string) {
  try {
    const sessionUser = await requireCustomer();

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: "Invalid address ID." };
    }

    const deleted = await deleteAddressForUser(parsedId.data, sessionUser.id);

    if (!deleted) {
      return { success: false, error: "Address not found." };
    }

    revalidatePath("/profile");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error) {
    return safeActionResponse(error, "Failed to delete address");
  }
}

/**
 * Set an address as default (Strict ownership check: WHERE id = $1 AND userId = $2).
 */
export async function setDefaultAddressAction(id: string, clientUserId?: string) {
  try {
    const sessionUser = await requireCustomer();

    const parsedId = idSchema.safeParse(id);
    if (!parsedId.success) {
      return { success: false, error: "Invalid address ID." };
    }

    const updated = await setDefaultAddressForUser(parsedId.data, sessionUser.id);

    revalidatePath("/profile");
    revalidatePath("/checkout");
    return { success: updated };
  } catch (error) {
    return safeActionResponse(error, "Failed to update default address");
  }
}

/**
 * Automatically save or update address during Checkout (Bound to authenticated session).
 */
export async function saveAddressFromCheckoutAction(data: AddressInput & { saveAsDefault?: boolean }) {
  try {
    let targetUserId: string | null = null;
    try {
      const sessionUser = await requireCustomer();
      targetUserId = sessionUser.id;
    } catch {
      // Unauthenticated guest: do NOT bind to database user accounts
      targetUserId = null;
    }

    if (!targetUserId) {
      return { success: true, message: "Guest address not stored in user account." };
    }

    const address = await saveAddressFromCheckoutForUser(targetUserId, data);
    if (!address) {
      return { success: false, error: "Maximum 4 saved addresses reached. Please delete an address to save a new one." };
    }

    return { success: true, address };
  } catch (error) {
    return safeActionResponse(error, "Failed to save address from checkout");
  }
}
