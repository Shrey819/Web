import { query } from "@/lib/db";
import { getProductForEdit } from "@/app/actions/product";
import { ProductEditorForm } from "@/components/admin/products/ProductEditorForm";
import { notFound } from "next/navigation";

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const productData = await getProductForEdit(id);

  if (!productData) {
    notFound();
  }

  let categories: { id: string; name: string }[] = [];
  let brands: { id: string; name: string }[] = [];

  try {
    const catRes = await query(`SELECT id, name FROM "Category" ORDER BY name ASC`);
    const brandRes = await query(`SELECT id, name FROM "Brand" ORDER BY name ASC`);

    categories = catRes.rows as { id: string; name: string }[];
    brands = brandRes.rows as { id: string; name: string }[];
  } catch (error) {
    console.error("Failed to load form lookup data:", error);
    categories = [
      { id: "sensors", name: "Sensors & Perception" },
      { id: "plcs", name: "PLCs & Controllers" },
      { id: "drives", name: "Drives & Servo Motors" }
    ];
    brands = [
      { id: "siemens", name: "SIEMENS" },
      { id: "omron", name: "OMRON" },
      { id: "schneider", name: "Schneider Electric" },
      { id: "default-brand", name: "Default Brand" }
    ];
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <ProductEditorForm initialData={productData} categories={categories} brands={brands} isEdit={true} />
    </div>
  );
}
