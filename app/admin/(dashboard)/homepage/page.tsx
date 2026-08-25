import { getHomepageData } from "@/lib/homepage-server";
import { getStorefrontCategories, getActiveProducts } from "@/lib/storefront";
import { HomepageVisualEditor } from "@/components/admin/homepage/HomepageVisualEditor";

export const metadata = {
  title: "Homepage Visual Editor | Admin",
};

export default async function AdminHomepageManagementPage() {
  const [homepageData, dbCategories, dbProducts] = await Promise.all([
    getHomepageData(),
    getStorefrontCategories(),
    getActiveProducts(),
  ]);

  return (
    <div className="-m-4 sm:-m-6 lg:-m-8">
      <HomepageVisualEditor
        initialData={homepageData}
        categories={dbCategories}
        products={dbProducts}
      />
    </div>
  );
}
