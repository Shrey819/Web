import { getAdminProductsList } from "@/app/actions/product";
import { AdminProductsClient } from "@/components/admin/products/AdminProductsClient";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; status?: string }>;
}) {
  const params = await searchParams;
  const products = await getAdminProductsList(params);

  return <AdminProductsClient products={products} />;
}
