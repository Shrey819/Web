import { ImportProductsClient } from "@/components/admin/products/import/ImportProductsClient";

export const metadata = {
  title: "Import Products | Admin Dashboard",
  description: "Bulk create and update physical products via CSV or Excel import",
};

export default function ImportProductsPage() {
  return <ImportProductsClient />;
}
