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
        COUNT(DISTINCT pc."productId")::int as "itemCount"
      FROM "Category" c
      LEFT JOIN (
        SELECT pc."productId", pc."categoryId" 
        FROM "ProductCategory" pc 
        JOIN "Product" p ON pc."productId" = p.id 
        WHERE (p.status IS NULL OR p.status != 'DELETED') AND p."deletedAt" IS NULL AND p.status = 'ACTIVE' AND COALESCE(p.visible, true) = true
        UNION
        SELECT id as "productId", "categoryId" 
        FROM "Product" 
        WHERE (status IS NULL OR status != 'DELETED') AND "deletedAt" IS NULL AND (status = 'ACTIVE' OR COALESCE(visible, true) = true) AND "categoryId" IS NOT NULL
      ) pc ON c.id = pc."categoryId" OR c.slug = pc."categoryId"
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
