import { query } from "@/lib/db";
import { getGlobalBrands } from "@/app/actions/productManagement";
import { TaxonomyClient } from "@/components/admin/categories/TaxonomyClient";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const initialTab = params.tab === "brands" ? "brands" : "categories";

  let categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    product_count: number;
  }> = [];

  let brands: any[] = [];
  let unbrandedCount = 0;

  try {
    const [catRes, brandsRes] = await Promise.all([
      query(`
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
          UNION
          SELECT "id" as "productId", "primaryCategoryId" as "categoryId" FROM "Product" WHERE "primaryCategoryId" IS NOT NULL
        ) pc ON c.id = pc."categoryId" OR c.slug = pc."categoryId"
        GROUP BY c.id, c.name, c.slug, c.description, c.status
        ORDER BY c.name ASC
      `),
      getGlobalBrands(),
    ]);

    categories = catRes.rows as any[];
    if (brandsRes.success) {
      brands = brandsRes.brands;
      unbrandedCount = brandsRes.unbrandedCount || 0;
    }
  } catch (error) {
    console.error("Failed to load categories or brands:", error);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <TaxonomyClient
        categories={categories}
        brands={brands}
        unbrandedCount={unbrandedCount}
        initialTab={initialTab}
      />
    </div>
  );
}

