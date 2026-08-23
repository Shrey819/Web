import { getProductForEdit } from "@/app/actions/product";
import { getAdminCategories, getGlobalRibbons, getGlobalTags, getGlobalInfoSections, getGlobalBrands } from "@/app/actions/productManagement";
import { ProductEditorForm } from "@/components/admin/products/ProductEditorForm";
import { notFound } from "next/navigation";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [productData, catsRes, ribbonsRes, tagsRes, sectionsRes, brandsRes] = await Promise.all([
    getProductForEdit(id),
    getAdminCategories(),
    getGlobalRibbons(),
    getGlobalTags(),
    getGlobalInfoSections(),
    getGlobalBrands(),
  ]);

  if (!productData) {
    notFound();
  }

  const categories = catsRes.categories || [];
  const allRibbons = ribbonsRes.ribbons || [];
  const allTags = tagsRes.tags || [];
  const allInfoSections = sectionsRes.sections || [];
  const allBrands = brandsRes.brands || [];

  return (
    <ProductEditorForm
      initialData={productData}
      categories={categories}
      allRibbons={allRibbons}
      allTags={allTags}
      allInfoSections={allInfoSections}
      allBrands={allBrands}
      isEdit={true}
    />
  );
}
