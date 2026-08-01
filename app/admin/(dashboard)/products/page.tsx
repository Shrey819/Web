import { query } from "@/lib/db";
import Link from "next/link";
import { Plus, Search, Edit2, Trash2, Eye, Package, Filter } from "lucide-react";
import { ProductVisibilityToggle } from "@/components/admin/products/ProductVisibilityToggle";

interface AdminProductRow {
  id: string;
  name: string;
  slug: string;
  sku: string;
  productCode?: string;
  basePrice: number;
  status: string;
  category?: { name?: string };
  images?: { url: string }[];
  [key: string]: unknown;
}

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

  const totalPages = Math.ceil(total / take);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="type-section-title text-white">Product Catalog Management</h1>
          <p className="text-xs text-slate-400 mt-1">Shopify/Wix-style multi-channel product workflow</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/25"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form className="flex items-center gap-2 w-full md:w-96">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search title, SKU, or product code..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <button type="submit" className="px-3.5 py-2 rounded-xl bg-slate-800 text-xs text-white font-medium hover:bg-slate-700">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <Link
            href="/admin/products"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${!statusFilter ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            All
          </Link>
          <Link
            href="/admin/products?status=ACTIVE"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === 'ACTIVE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Active
          </Link>
          <Link
            href="/admin/products?status=DRAFT"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${statusFilter === 'DRAFT' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
          >
            Draft
          </Link>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">SKU / Code</th>
                <th className="px-6 py-4">Base Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No products found matching your filters.
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden shrink-0 border border-slate-700">
                          {product.images && product.images[0]?.url ? (
                            <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-5 h-5 text-slate-500" />
                          )}
                        </div>
                        <div>
                          <Link href={`/admin/products/${product.id}/edit`} className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                            {product.name}
                          </Link>
                          <p className="text-[10px] text-slate-500">ID: {product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {product.category?.name || "Uncategorized"}
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-[11px]">
                      <div>{product.sku}</div>
                      {product.productCode && <div className="text-[10px] text-slate-500">{product.productCode}</div>}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white font-mono">
                      ₹{(product.basePrice / 100).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4">
                      <ProductVisibilityToggle
                        productId={product.id}
                        initialStatus={product.status}
                        productName={product.name}
                      />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          className="p-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 transition-colors"
                          title="Edit Product"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>Showing page {currentPage} of {totalPages} ({total} total items)</div>
            <div className="flex items-center gap-2">
              {currentPage > 1 && (
                <Link
                  href={`/admin/products?page=${currentPage - 1}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`/admin/products?page=${currentPage + 1}${search ? `&search=${search}` : ''}`}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
