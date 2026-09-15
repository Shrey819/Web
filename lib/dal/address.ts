import "server-only";
import { query, transaction } from "@/lib/db";
import { formatDisplayPhone } from "@/lib/utils";
import { CustomerAddressDTO, AddressInput } from "@/lib/dal/types";
import crypto from "crypto";

const ADDRESS_COLUMNS = `
  "id", "userId", "fullName", "companyName", "email", "phone",
  "street", "city", "state", "zip", "country", "type", "isDefault",
  "createdAt", "updatedAt"
`;

function mapRowToAddressDTO(r: any): CustomerAddressDTO {
  return {
    id: r.id,
    userId: r.userId,
    fullName: r.fullName,
    companyName: r.companyName || "",
    email: r.email || "",
    phone: r.phone ? formatDisplayPhone(r.phone) : "",
    street: r.street,
    city: r.city,
    state: r.state,
    zip: r.zip,
    country: r.country || "India",
    type: r.type || "Home",
    isDefault: Boolean(r.isDefault),
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : undefined,
    updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : undefined,
  };
}

/**
 * Fetch all saved addresses for a specific authenticated user.
 * Internal DAL function: userId must originate from server-authenticated identity.
 */
export async function getAddressesForUser(userId: string): Promise<CustomerAddressDTO[]> {
  if (!userId) return [];

  const res = await query(
    `SELECT ${ADDRESS_COLUMNS} FROM "Address" 
     WHERE "userId" = $1
     ORDER BY "isDefault" DESC, "updatedAt" DESC, "createdAt" DESC
     LIMIT 4`,
    [userId]
  );

  return res.rows.map(mapRowToAddressDTO);
}

/**
 * Fetch single address by ID scoped strictly to user ownership.
 * Returns null if not found or belongs to another user (zero existence leakage).
 */
export async function getAddressByIdForUser(addressId: string, userId: string): Promise<CustomerAddressDTO | null> {
  if (!addressId || !userId) return null;

  const res = await query(
    `SELECT ${ADDRESS_COLUMNS} FROM "Address" 
     WHERE "id" = $1 AND "userId" = $2 
     LIMIT 1`,
    [addressId, userId]
  );

  if (res.rows.length === 0) return null;
  return mapRowToAddressDTO(res.rows[0]);
}

/**
 * Create a new address for a verified user.
 * Enforces per-user address limit (max 4).
 */
export async function createAddressForUser(userId: string, data: AddressInput): Promise<CustomerAddressDTO> {
  const id = `addr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const isDefault = Boolean(data.isDefault);

  const countRes = await query(
    `SELECT count(*)::int as count FROM "Address" WHERE "userId" = $1`,
    [userId]
  );
  const existingCount = countRes.rows[0]?.count || 0;
  if (existingCount >= 4) {
    throw new Error("Maximum 4 saved addresses allowed. Please delete an existing address.");
  }

  if (isDefault) {
    await query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
  }

  const res = await query(
    `INSERT INTO "Address" (
      "id", "userId", "fullName", "companyName", "email", "phone",
      "street", "city", "state", "zip", "country", "type", "isDefault", "createdAt", "updatedAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    RETURNING ${ADDRESS_COLUMNS}`,
    [
      id,
      userId,
      data.fullName.trim(),
      data.companyName?.trim() || null,
      data.email?.trim() || null,
      formatDisplayPhone(data.phone),
      data.street.trim(),
      data.city.trim(),
      data.state.trim(),
      data.zip.trim(),
      data.country?.trim() || "India",
      data.type || "Home",
      isDefault,
    ]
  );

  return mapRowToAddressDTO(res.rows[0]);
}

/**
 * Update an existing address strictly scoped by user ownership (WHERE id = $1 AND userId = $2).
 */
export async function updateAddressForUser(
  addressId: string,
  userId: string,
  data: AddressInput
): Promise<CustomerAddressDTO | null> {
  const isDefault = Boolean(data.isDefault);

  if (isDefault) {
    await query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
  }

  const res = await query(
    `UPDATE "Address" SET
      "fullName" = $1,
      "companyName" = $2,
      "email" = $3,
      "phone" = $4,
      "street" = $5,
      "city" = $6,
      "state" = $7,
      "zip" = $8,
      "country" = $9,
      "type" = $10,
      "isDefault" = $11,
      "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = $12 AND "userId" = $13
     RETURNING ${ADDRESS_COLUMNS}`,
    [
      data.fullName.trim(),
      data.companyName?.trim() || null,
      data.email?.trim() || null,
      data.phone.trim(),
      data.street.trim(),
      data.city.trim(),
      data.state.trim(),
      data.zip.trim(),
      data.country?.trim() || "India",
      data.type || "Home",
      isDefault,
      addressId,
      userId,
    ]
  );

  if (res.rows.length === 0) return null;
  return mapRowToAddressDTO(res.rows[0]);
}

/**
 * Delete an address strictly scoped by user ownership (WHERE id = $1 AND userId = $2).
 */
export async function deleteAddressForUser(addressId: string, userId: string): Promise<boolean> {
  const res = await query(
    `DELETE FROM "Address" WHERE "id" = $1 AND "userId" = $2 RETURNING "id"`,
    [addressId, userId]
  );
  return res.rows.length > 0;
}

/**
 * Set an address as default atomically in a transaction.
 */
export async function setDefaultAddressForUser(addressId: string, userId: string): Promise<boolean> {
  let success = false;
  await transaction(async (client) => {
    const check = await client.query(
      `SELECT "id" FROM "Address" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
      [addressId, userId]
    );
    if (check.rows.length === 0) {
      throw new Error("Address not found.");
    }

    await client.query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
    await client.query(
      `UPDATE "Address" SET "isDefault" = true, "updatedAt" = CURRENT_TIMESTAMP 
       WHERE "id" = $1 AND "userId" = $2`,
      [addressId, userId]
    );
    success = true;
  });
  return success;
}

/**
 * Save or update address during checkout bound to authenticated user.
 */
export async function saveAddressFromCheckoutForUser(
  userId: string,
  data: AddressInput & { saveAsDefault?: boolean }
): Promise<CustomerAddressDTO | null> {
  const existing = await query(
    `SELECT "id" FROM "Address" 
     WHERE "userId" = $1 AND LOWER(TRIM("street")) = LOWER(TRIM($2)) AND TRIM("zip") = TRIM($3)
     LIMIT 1`,
    [userId, data.street, data.zip]
  );

  if (existing.rows.length > 0) {
    const res = await query(
      `UPDATE "Address" SET
        "fullName" = $1,
        "companyName" = $2,
        "email" = $3,
        "phone" = $4,
        "city" = $5,
        "state" = $6,
        "country" = $7,
        "type" = COALESCE($8, "type"),
        "isDefault" = CASE WHEN $9 = true THEN true ELSE "isDefault" END,
        "updatedAt" = CURRENT_TIMESTAMP
       WHERE "id" = $10 AND "userId" = $11
       RETURNING ${ADDRESS_COLUMNS}`,
      [
        data.fullName.trim(),
        data.companyName?.trim() || null,
        data.email?.trim() || null,
        formatDisplayPhone(data.phone),
        data.city.trim(),
        data.state.trim(),
        data.country?.trim() || "India",
        data.type || "Home",
        Boolean(data.saveAsDefault),
        existing.rows[0].id,
        userId,
      ]
    );
    return mapRowToAddressDTO(res.rows[0]);
  } else {
    const countRes = await query(
      `SELECT count(*)::int as count FROM "Address" WHERE "userId" = $1`,
      [userId]
    );
    const existingCount = countRes.rows[0]?.count || 0;
    if (existingCount >= 4) {
      return null;
    }

    const id = `addr_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
    if (data.saveAsDefault) {
      await query(`UPDATE "Address" SET "isDefault" = false WHERE "userId" = $1`, [userId]);
    }
    const res = await query(
      `INSERT INTO "Address" (
        "id", "userId", "fullName", "companyName", "email", "phone",
        "street", "city", "state", "zip", "country", "type", "isDefault", "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING ${ADDRESS_COLUMNS}`,
      [
        id,
        userId,
        data.fullName.trim(),
        data.companyName?.trim() || null,
        data.email?.trim() || null,
        formatDisplayPhone(data.phone),
        data.street.trim(),
        data.city.trim(),
        data.state.trim(),
        data.zip.trim(),
        data.country?.trim() || "India",
        data.type || "Home",
        Boolean(data.saveAsDefault),
      ]
    );
    return mapRowToAddressDTO(res.rows[0]);
  }
}
