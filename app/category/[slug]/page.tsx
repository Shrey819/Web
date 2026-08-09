import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getActiveProducts, getStorefrontCategoryBySlug } from "@/lib/storefront";
import { PRODUCTS } from "@/data/products";
import { CategoryProductGridWithFilters } from "@/components/catalog/CategoryProductGridWithFilters";
import { ChevronRight, Layers, ShieldCheck, Truck } from "lucide-react";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * DYNAMIC METADATA GENERATOR (SEO TITLE, OG TAGS, CANONICAL)
 */
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getStorefrontCategoryBySlug(slug);

  if (!category) {
    return {
      title: "Category Not Found | OM AUTOMATION",
      description: "The requested industrial hardware category could not be found.",
    };
  }

  const title = category.seoTitle || `Buy ${category.name} Online - Industrial Automation | OM AUTOMATION`;
  const description = category.seoDesc || category.description;
  const pageUrl = `https://omautomation.com/category/${category.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title,
      description,
      url: pageUrl,
      type: "website",
      siteName: "OM AUTOMATION Industrial Commerce",
      images: [
        {
          url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80",
          width: 1200,
          height: 630,
          alt: category.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getStorefrontCategoryBySlug(slug);

  if (!category) {
    return notFound();
  }

  // Fetch DB products or fallback to mock catalog
  const dbProducts = await getActiveProducts(category.slug);
  const categoryProducts = dbProducts.length > 0 
    ? dbProducts 
    : PRODUCTS.filter((p) => {
        const pCatIds: string[] = Array.isArray((p as any).categoryIds) ? (p as any).categoryIds : [];
        return p.categoryId === category.id || 
               p.categoryId === category.slug || 
               pCatIds.includes(category.id) || 
               pCatIds.includes(category.slug);
      });

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": category.name,
    "description": category.description,
    "url": `https://omautomation.com/category/${category.slug}`,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://omautomation.com",
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Products",
          "item": "https://omautomation.com/products",
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": category.name,
          "item": `https://omautomation.com/category/${category.slug}`,
        },
      ],
    },
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": categoryProducts.length,
      "itemListElement": categoryProducts.slice(0, 10).map((prod, idx) => ({
        "@type": "ListItem",
        "position": idx + 1,
        "item": {
          "@type": "Product",
          "name": prod.name,
          "url": `https://omautomation.com/product/${prod.slug}`,
          "sku": prod.sku,
          "offers": {
            "@type": "Offer",
            "priceCurrency": "INR",
            "price": (prod.basePrice / 100).toFixed(2),
            "availability": prod.stockStatus === 'in-stock' ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          },
        },
      })),
    },
  };

  return (
    <div className="bg-[#faf9f5] min-h-screen py-10 border-b border-slate-200">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="content-shell">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 type-body-small text-slate-500 font-mono mb-6">
          <Link href="/" className="hover:text-slate-900">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/products" className="hover:text-slate-900">
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-slate-900 font-bold">{category.name}</span>
        </nav>

        {/* Hero Banner for Category */}
        <div className="bg-slate-950 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl mb-12 relative overflow-hidden">
          <div className="max-w-3xl space-y-4 relative z-10">
            <span className="inline-flex items-center gap-2 type-label text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
              <Layers className="w-3.5 h-3.5" />
              {category.badge}
            </span>
            <h1 className="text-3xl sm:text-5xl font-extrabold font-mono text-white tracking-tight">
              {category.name}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
              {category.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" /> 100% Genuine Guarantee
              </span>
              <span className="flex items-center gap-1 text-sky-400 font-bold">
                <Truck className="w-4 h-4" /> Express Dispatch
              </span>
            </div>

            {category.subcategories && category.subcategories.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {category.subcategories.map((sub) => (
                  <Link
                    key={sub}
                    href={`/products?category=${category.slug}&sub=${encodeURIComponent(sub)}`}
                    className="type-technical bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1.5 rounded-full border border-slate-800 transition-colors"
                  >
                    {sub}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Product Grid with Filters & Sorting */}
        <CategoryProductGridWithFilters categoryName={category.name} products={categoryProducts} />
      </div>
    </div>
  );
}
