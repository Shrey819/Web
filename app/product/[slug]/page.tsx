import { getActiveProductBySlug, getActiveProducts } from "@/lib/storefront";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { PRODUCTS } from "@/data/products";
import { notFound } from "next/navigation";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  
  // 1. Try to fetch from database
  const dbProduct = await getActiveProductBySlug(slug);
  
  // 2. Fallback to mock PRODUCTS if not found in DB
  const product = dbProduct || PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    return notFound();
  }

  // Related products
  const allDbProducts = await getActiveProducts();
  const relatedProducts = (allDbProducts.length > 0 ? allDbProducts : PRODUCTS)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
