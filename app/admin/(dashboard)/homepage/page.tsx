import { getHomepageData } from "@/lib/homepage";
import { getStorefrontCategories } from "@/lib/storefront";
import { HomepageManagementForm } from "@/components/admin/homepage/HomepageManagementForm";

export const metadata = {
  title: "Homepage Management | Admin",
};

export default async function AdminHomepageManagementPage() {
  const homepageData = await getHomepageData();
  const dbCategories = await getStorefrontCategories();

  const categories = dbCategories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));

  return (
    <div>
      <HomepageManagementForm
        initialData={homepageData}
        categories={categories}
      />
    </div>
  );
}
