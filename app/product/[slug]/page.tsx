import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getActiveProductBySlug, getActiveProducts } from "@/lib/storefront";
import { ProductDetailClient } from "@/components/product/ProductDetailClient";
import { PRODUCTS } from "@/data/products";
import {
  getSiteUrl,
  stripHtml,
  truncateText,
  generateProductJsonLd,
  generateBreadcrumbJsonLd,
} from "@/lib/seo";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Dynamic Metadata Generator for Product Page (SEO Title, Description, OpenGraph, Canonical)
 */
export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

  const dbProduct = await getActiveProductBySlug(slug);
  const product = dbProduct || PRODUCTS.find((p) => p.slug === slug);

  if (!product) {
    return {
      title: "Product Not Found",
      description: "The requested industrial product could not be found.",
    };
  }

  const title =
    product.seoTitle ||
    `${product.name} | ${product.brand || "Industrial"} | OM AUTOMATION`;

  const description =
    product.seoDesc ||
    truncateText(stripHtml(product.description), 160) ||
    `Buy ${product.name} online at OM AUTOMATION. Genuine quality, same-day dispatch, and technical support across India.`;

  const canonicalUrl = `${siteUrl}/product/${encodeURIComponent(product.slug)}`;

  const images = Array.isArray(product.images) && product.images.length > 0
    ? product.images.map((img: any) => ({
        url: typeof img === "string" ? img : img.url,
        alt: (typeof img === "object" && img.alt) ? img.alt : product.name,
      }))
    : [{ url: `${siteUrl}/images/placeholder.jpg`, alt: product.name }];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "OM AUTOMATION",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: images.map((i: { url: string; alt: string }) => i.url),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const siteUrl = getSiteUrl();

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
    (p) =>
      p.id !== product.id &&
      ((product.categoryId &&
        (p.categoryId === product.categoryId ||
          (p as any).categoryIds?.includes(product.categoryId))) ||
        (product.brand && p.brand === product.brand))
  );

  if (relatedProducts.length === 0) {
    relatedProducts = allProducts.filter((p) => p.id !== product.id);
  }
  relatedProducts = relatedProducts.slice(0, 4);

  const productPageUrl = `${siteUrl}/product/${encodeURIComponent(product.slug)}`;
  const productJsonLd = generateProductJsonLd(product, productPageUrl);
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
    {
      name: product.brand || "Catalog",
      url: `/products?brand=${encodeURIComponent(product.brand || "")}`,
    },
    { name: product.name, url: `/product/${product.slug}` },
  ]);

  return (
    <>
      {/* Schema.org Structured Data: Product + Offer */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Schema.org Structured Data: BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <ProductDetailClient
        product={product}
        relatedProducts={relatedProducts}
      />
    </>
  );
}
