import "server-only";
import { query } from "@/lib/db";
import { CustomerProfileDTO } from "@/lib/dal/types";

const PROFILE_COLUMNS = `id, name, email, role, "companyName", image, avatar, "createdAt"`;

function mapRowToProfileDTO(r: any): CustomerProfileDTO {
  return {
    id: r.id,
    name: r.name || null,
    email: r.email,
    role: r.role === "ADMIN" ? "ADMIN" : "CUSTOMER",
    companyName: r.companyName || "",
    image: r.image || r.avatar || null,
    createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
  };
}

/**
 * Fetch customer profile by user ID.
 * Returns only safe profile fields; excludes passwords, tokens, and system credentials.
 */
export async function getCustomerProfile(userId: string): Promise<CustomerProfileDTO | null> {
  if (!userId) return null;

  await query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyName" TEXT`);

  const res = await query(
    `SELECT ${PROFILE_COLUMNS} FROM "User" WHERE id = $1 LIMIT 1`,
    [userId]
  );

  if (res.rows.length === 0) return null;
  return mapRowToProfileDTO(res.rows[0]);
}

/**
 * Update customer's own profile.
 * Strict allowlist: only `name` and `companyName` can be updated.
 * System fields (role, email, password, etc.) are strictly immutable here.
 */
export async function updateCustomerProfile(
  userId: string,
  data: { name?: string; companyName?: string }
): Promise<CustomerProfileDTO | null> {
  if (!userId) return null;

  await query(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyName" TEXT`);

  const cleanName = data.name !== undefined ? String(data.name).trim().slice(0, 100) : null;
  const cleanCompany = data.companyName !== undefined ? String(data.companyName).trim().slice(0, 100) : null;

  const res = await query(
    `UPDATE "User"
     SET "name" = COALESCE($1, "name"),
         "companyName" = COALESCE($2, "companyName"),
         "updatedAt" = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING ${PROFILE_COLUMNS}`,
    [cleanName, cleanCompany, userId]
  );

  if (res.rows.length === 0) return null;
  return mapRowToProfileDTO(res.rows[0]);
}
