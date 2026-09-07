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

  // Related products from same category or brand
  const allDbProducts = await getActiveProducts();
  const allProducts = allDbProducts.length > 0 ? allDbProducts : PRODUCTS;
  
  let relatedProducts = allProducts.filter(
    (p) => p.id !== product.id && (
      (product.categoryId && (p.categoryId === product.categoryId || (p as any).categoryIds?.includes(product.categoryId))) ||
      (product.brand && p.brand === product.brand)
    )
  );

  if (relatedProducts.length === 0) {
    relatedProducts = allProducts.filter((p) => p.id !== product.id);
  }
  relatedProducts = relatedProducts.slice(0, 4);

  return <ProductDetailClient product={product} relatedProducts={relatedProducts} />;
}
