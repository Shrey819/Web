import { 
  getAdminCategories, 
  getGlobalRibbons, 
  getGlobalTags, 
  getGlobalInfoSections, 
  getGlobalBrands,
  getLastUsedInfoSectionIds,
  getLastUsedCategoryIds
} from "@/app/actions/productManagement";
import { ProductEditorForm } from "@/components/admin/products/ProductEditorForm";

export default async function NewProductPage() {
  const [catsRes, ribbonsRes, tagsRes, sectionsRes, brandsRes, lastUsedSections, lastUsedCats] = await Promise.all([
    getAdminCategories(),
    getGlobalRibbons(),
    getGlobalTags(),
    getGlobalInfoSections(),
    getGlobalBrands(),
    getLastUsedInfoSectionIds(),
    getLastUsedCategoryIds(),
  ]);

  const categories = catsRes.categories || [];
  const allRibbons = ribbonsRes.ribbons || [];
  const allTags = tagsRes.tags || [];
  const allInfoSections = sectionsRes.sections || [];
  const allBrands = brandsRes.brands || [];

  return (
    <ProductEditorForm
      categories={categories}
      allRibbons={allRibbons}
      allTags={allTags}
      allInfoSections={allInfoSections}
      allBrands={allBrands}
      defaultSectionIds={lastUsedSections}
      defaultCategoryIds={lastUsedCats.categoryIds}
      defaultPrimaryCategoryId={lastUsedCats.primaryCategoryId}
      isEdit={false}
    />
  );
}
