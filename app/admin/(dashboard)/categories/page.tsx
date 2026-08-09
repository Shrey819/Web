import { query } from "@/lib/db";
import { CategoryManager } from "@/components/admin/categories/CategoryManager";

export default async function AdminCategoriesPage() {
  let categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    product_count: number;
  }> = [];

  try {
    const res = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description,
        COALESCE(c.status, 'active') as status,
        COUNT(DISTINCT pc."productId")::int as product_count
      FROM "Category" c
      LEFT JOIN (
        SELECT "productId", "categoryId" FROM "ProductCategory"
        UNION
        SELECT "id" as "productId", "categoryId" FROM "Product" WHERE "categoryId" IS NOT NULL
      ) pc ON c.id = pc."categoryId" OR c.slug = pc."categoryId"
      GROUP BY c.id, c.name, c.slug, c.description, c.status
      ORDER BY c.name ASC
    `);
    categories = res.rows as Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
      status: string;
      product_count: number;
    }>;
  } catch (error) {
    console.error("Failed to load categories:", error);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <CategoryManager categories={categories} />
    </div>
  );
}
