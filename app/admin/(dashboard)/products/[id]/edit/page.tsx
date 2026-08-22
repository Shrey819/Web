import { getProductForEdit } from "@/app/actions/product";
import { getAdminCategories, getGlobalRibbons, getGlobalTags, getGlobalInfoSections } from "@/app/actions/productManagement";
import { ProductEditorForm } from "@/components/admin/products/ProductEditorForm";
import { notFound } from "next/navigation";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;

  const [productData, catsRes, ribbonsRes, tagsRes, sectionsRes] = await Promise.all([
    getProductForEdit(id),
    getAdminCategories(),
    getGlobalRibbons(),
    getGlobalTags(),
    getGlobalInfoSections(),
  ]);

  if (!productData) {
    notFound();
  }

  const categories = catsRes.categories || [];
  const allRibbons = ribbonsRes.ribbons || [];
  const allTags = tagsRes.tags || [];
  const allInfoSections = sectionsRes.sections || [];

  return (
    <ProductEditorForm
      initialData={productData}
      categories={categories}
      allRibbons={allRibbons}
      allTags={allTags}
      allInfoSections={allInfoSections}
      isEdit={true}
    />
  );
}
