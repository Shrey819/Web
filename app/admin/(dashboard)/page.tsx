import { auth } from "@/auth";
import { query } from "@/lib/db";
import { AdminOverviewClient } from "@/components/admin/dashboard/AdminOverviewClient";

export default async function AdminOverviewPage() {
  const session = await auth();

  // Fetch high-level metrics with fallback for demo mode
  let totalProducts = 0;
  let totalCategories = 0;
  let outOfStockProducts = 0;

  try {
    const results = await Promise.all([
      query('SELECT COUNT(*) FROM "Product"'),
      query('SELECT COUNT(*) FROM "Category"'),
      query('SELECT COUNT(*) FROM "Inventory" WHERE status = $1', ['OUT_OF_STOCK']),
    ]);
    totalProducts = parseInt(results[0].rows[0].count, 10) || 0;
    totalCategories = parseInt(results[1].rows[0].count, 10) || 0;
    outOfStockProducts = parseInt(results[2].rows[0].count, 10) || 0;
  } catch (error) {
    console.warn("Database not connected, using demo data");
    totalProducts = 1542;
    totalCategories = 45;
    outOfStockProducts = 12;
  }

  return (
    <AdminOverviewClient
      userName={session?.user?.name || "Admin"}
      totalProducts={totalProducts}
      totalCategories={totalCategories}
      outOfStockProducts={outOfStockProducts}
    />
  );
}
