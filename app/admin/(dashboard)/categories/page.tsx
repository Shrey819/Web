import { query } from "@/lib/db";
import { CategoryManager } from "@/components/admin/categories/CategoryManager";

export default async function AdminCategoriesPage() {
  let categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    product_count: number;
  }> = [];

  try {
    const res = await query(`
      SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.description,
        COUNT(p.id)::int as product_count
      FROM "Category" c
      LEFT JOIN "Product" p ON c.id = p."categoryId"
      GROUP BY c.id, c.name, c.slug, c.description
      ORDER BY c.name ASC
    `);
    categories = res.rows as Array<{
      id: string;
      name: string;
      slug: string;
      description: string | null;
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
