import { getAdminCategories, getGlobalRibbons, getGlobalTags, getGlobalInfoSections } from "@/app/actions/productManagement";
import { ProductEditorForm } from "@/components/admin/products/ProductEditorForm";

export default async function NewProductPage() {
  const [catsRes, ribbonsRes, tagsRes, sectionsRes] = await Promise.all([
    getAdminCategories(),
    getGlobalRibbons(),
    getGlobalTags(),
    getGlobalInfoSections(),
  ]);

  const categories = catsRes.categories || [];
  const allRibbons = ribbonsRes.ribbons || [];
  const allTags = tagsRes.tags || [];
  const allInfoSections = sectionsRes.sections || [];

  return (
    <ProductEditorForm
      categories={categories}
      allRibbons={allRibbons}
      allTags={allTags}
      allInfoSections={allInfoSections}
      isEdit={false}
    />
  );
}
