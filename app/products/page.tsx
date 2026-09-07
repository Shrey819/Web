import { Metadata } from "next";
import { getActiveProducts, getStorefrontCategories } from "@/lib/storefront";
import { StorefrontCatalog } from "@/components/catalog/StorefrontCatalog";
import { PRODUCTS as MOCK_PRODUCTS } from "@/data/products";
import { getSiteUrl, generateBreadcrumbJsonLd } from "@/lib/seo";

interface ProductsPageProps {
  searchParams?: Promise<{
    brand?: string;
    category?: string;
    filter?: string;
    search?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: ProductsPageProps): Promise<Metadata> {
  const params = searchParams ? await searchParams : {};
  const siteUrl = getSiteUrl();

  let title = "Industrial Automation Products Catalog";
  let description =
    "Explore our catalog of high-precision linear guideways, ballscrews, sensors, PLCs, servo motors, and VFDs. Factory direct with same-day dispatch across India.";

  if (params.brand && params.brand.trim()) {
    title = `${params.brand.trim()} Products & Motion Systems`;
    description = `Browse genuine ${params.brand.trim()} linear guideways, ballscrews, and industrial hardware components. Factory stock with express delivery.`;
  } else if (params.category && params.category.trim()) {
    title = `${params.category.trim()} Hardware & Components`;
    description = `Explore high-precision ${params.category.trim()} components engineered for machinery and industrial automation.`;
  } else if (params.search && params.search.trim()) {
    title = `Search: "${params.search.trim()}"`;
    description = `Search results for "${params.search.trim()}" across our industrial automation components catalog.`;
  }

  const canonicalUrl = `${siteUrl}/products`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} | OM AUTOMATION`,
      description,
      url: canonicalUrl,
      type: "website",
      siteName: "OM AUTOMATION",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | OM AUTOMATION`,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = searchParams ? await searchParams : {};
  const [dbProducts, categories] = await Promise.all([
    getActiveProducts(),
    getStorefrontCategories(),
  ]);

  const products = dbProducts.length > 0 ? dbProducts : MOCK_PRODUCTS;

  const breadcrumbs = [
    { name: "Home", url: "/" },
    { name: "Products", url: "/products" },
  ];

  if (params.brand) {
    breadcrumbs.push({
      name: params.brand,
      url: `/products?brand=${encodeURIComponent(params.brand)}`,
    });
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd(breadcrumbs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <StorefrontCatalog
        initialProducts={products}
        categories={categories}
        initialBrand={params.brand}
        initialCategory={params.category}
        initialSearch={params.search}
      />
    </>
  );
}
