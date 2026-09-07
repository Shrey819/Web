/**
 * Centralized SEO Utilities and Schema.org JSON-LD Generators
 */

export function getSiteUrl(): string {
  const url = process.env.NEXT_PUBLIC_SITE_URL || "https://omautomation.com";
  return url.replace(/\/+$/, "");
}

export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]*>?/gm, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function truncateText(text: string, maxLength: number = 160): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trim() + "...";
}

/**
 * Global Schema.org Organization structured data
 */
export function generateOrganizationJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "OM AUTOMATION",
    legalName: "Om Automation & Industrial Controls",
    url: siteUrl,
    logo: `${siteUrl}/images/logo.png`,
    description:
      "Leading manufacturer, distributor, and supplier of precision CNC machines, industrial controllers, sensors, PLCs, VFDs, ballscrews, and linear guideways.",
    contactPoint: [
      {
        "@type": "ContactPoint",
        telephone: "+91-9876543210",
        contactType: "customer service",
        areaServed: "IN",
        availableLanguage: ["en", "hi", "gu"],
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Aji GIDC Industrial Area",
      addressLocality: "Rajkot",
      addressRegion: "Gujarat",
      postalCode: "360003",
      addressCountry: "IN",
    },
  };
}

/**
 * Global Schema.org WebSite structured data with Sitelinks Searchbox
 */
export function generateWebSiteJsonLd() {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "OM AUTOMATION",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/products?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Product-specific Schema.org structured data (Product, Offer, Brand, InStock)
 */
export function generateProductJsonLd(product: any, pageUrl: string) {
  const siteUrl = getSiteUrl();
  const images = Array.isArray(product.images)
    ? product.images.map((img: any) =>
        typeof img === "string" ? img : img.url
      )
    : [];

  const cleanDescription = truncateText(
    product.seoDesc || stripHtml(product.description) || product.name,
    500
  );

  const price = product.basePrice || product.price || 0;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: images.length > 0 ? images : [`${siteUrl}/images/placeholder.jpg`],
    description: cleanDescription,
    sku: product.sku || `SKU-${product.id}`,
    mpn: product.productCode || product.sku || product.id,
    brand: {
      "@type": "Brand",
      name: product.brand || "OM AUTOMATION",
    },
    offers: {
      "@type": "Offer",
      url: pageUrl,
      priceCurrency: "INR",
      price: typeof price === "number" ? price.toFixed(2) : String(price),
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      ).toISOString().split("T")[0],
      itemCondition: "https://schema.org/NewCondition",
      availability:
        product.stockStatus === "out-of-stock"
          ? "https://schema.org/OutOfStock"
          : "https://schema.org/InStock",
      seller: {
        "@type": "Organization",
        name: "OM AUTOMATION",
      },
    },
  };
}

/**
 * BreadcrumbList Schema.org structured data
 */
export function generateBreadcrumbJsonLd(
  crumbs: { name: string; url: string }[]
) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.name,
      item: crumb.url.startsWith("http") ? crumb.url : `${siteUrl}${crumb.url}`,
    })),
  };
}
