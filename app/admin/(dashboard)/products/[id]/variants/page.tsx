import { getProductForEdit } from "@/app/actions/product";
import { AdminVariantsClient } from "@/components/admin/products/AdminVariantsClient";
import { notFound } from "next/navigation";

interface VariantsPageProps {
  params: Promise<{ id: string }>;
}

export default async function VariantsPage({ params }: VariantsPageProps) {
  const { id } = await params;
  const product = await getProductForEdit(id);

  if (!product) {
    notFound();
  }

  return (
    <AdminVariantsClient
      productId={product.id}
      productName={product.name}
      basePrice={product.price}
      initialVariants={product.variants || []}
    />
  );
}
