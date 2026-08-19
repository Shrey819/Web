import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const res = await query(`
      SELECT 
        c.id,
        c.name,
        c.slug,
        COALESCE(c.description, '') as description,
        COALESCE(c."sortOrder", 0) as "sortOrder",
        COUNT(DISTINCT p.id)::int as "itemCount"
      FROM "Category" c
      LEFT JOIN "Product" p ON (c.id = p."categoryId" OR c.slug = p."categoryId") AND p.status = 'ACTIVE'
      WHERE COALESCE(c.status, 'active') != 'hidden'
      GROUP BY c.id, c.name, c.slug, c.description, c."sortOrder"
      ORDER BY c."sortOrder" ASC, c.name ASC
    `);

    return NextResponse.json(res.rows);
  } catch (error) {
    console.error("Failed to fetch active database categories:", error);
    return NextResponse.json([], { status: 500 });
  }
}
