import { query } from "@/lib/db";
import { AdminProductsClient, AdminProductRow } from "@/components/admin/products/AdminProductsClient";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;
  const search = params?.search || "";
  const statusFilter = params?.status || "";
  const take = 20;
  const skip = (currentPage - 1) * take;

  let products: AdminProductRow[] = [];
  let total = 0;

  try {
    const searchParam = search ? `%${search}%` : null;
    const statusParam = statusFilter ? statusFilter : null;
    
    const whereClauses: string[] = [];
    const countParams: (string | number)[] = [];
    let dataParams: (string | number)[] = [];

    if (searchParam) {
      countParams.push(searchParam);
      whereClauses.push(`(p.name ILIKE $${countParams.length} OR p.sku ILIKE $${countParams.length} OR p."productCode" ILIKE $${countParams.length})`);
    }

    if (statusParam) {
      countParams.push(statusParam);
      whereClauses.push(`p.status = $${countParams.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countQuery = `
      SELECT COUNT(*) 
      FROM "Product" p
      ${whereSql}
    `;

    dataParams = [...countParams, take, skip];
    const limitOffsetSql = `LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;

    const dataQuery = `
      SELECT 
        p.*,
        json_build_object('name', c.name) as category,
        COALESCE(
          json_agg(json_build_object('url', i.url)) FILTER (WHERE i.id IS NOT NULL),
          '[]'::json
        ) as images
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "ProductImage" i ON p.id = i."productId" AND i."isPrimary" = true
      ${whereSql}
      GROUP BY p.id, c.id
      ORDER BY p."createdAt" DESC
      ${limitOffsetSql}
    `;

    const results = await Promise.all([
      query(dataQuery, dataParams),
      query(countQuery, countParams),
    ]);
    
    products = results[0].rows as unknown as AdminProductRow[];
    total = parseInt(results[1].rows[0].count, 10) || 0;
  } catch (error) {
    console.error("Database connection failed:", error);
    products = [];
    total = 0;
  }

  return (
    <AdminProductsClient
      products={products}
      total={total}
      currentPage={currentPage}
      take={take}
      currentSearch={search}
      currentStatus={statusFilter}
    />
  );
}
