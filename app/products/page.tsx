import { getActiveProducts, getStorefrontCategories } from "@/lib/storefront";
import { StorefrontCatalog } from "@/components/catalog/StorefrontCatalog";
import { PRODUCTS as MOCK_PRODUCTS } from "@/data/products";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams?: Promise<{ brand?: string; category?: string; filter?: string; search?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  const [dbProducts, categories] = await Promise.all([
    getActiveProducts(),
    getStorefrontCategories(),
  ]);

  const products = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

  return (
    <StorefrontCatalog
      initialProducts={products}
      categories={categories}
      initialBrand={params.brand}
      initialCategory={params.category}
      initialSearch={params.search}
    />
  );
}
