import { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/storefront";
import { getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // revalidate at most once every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  // 1. Core Public Marketing & Discovery Pages (Excludes private user/admin routes)
  const corePages: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/products`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/brands`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/about`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/faq`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/quote`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/resources`,
      lastModified: new Date().toISOString(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/shipping-policy`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/refund-policy`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/privacy`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/terms-of-service`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${siteUrl}/legal-notice`,
      lastModified: new Date().toISOString(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  // 2. Query Live Active Products & Categories from PostgreSQL
  const dbData = await getSitemapData();

  const productPages: MetadataRoute.Sitemap = dbData.products.map((p) => ({
    url: `${siteUrl}/product/${encodeURIComponent(p.slug)}`,
    lastModified: p.updatedAt || new Date().toISOString(),
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const categoryPages: MetadataRoute.Sitemap = dbData.categories.map((c) => ({
    url: `${siteUrl}/category/${encodeURIComponent(c.slug)}`,
    lastModified: c.updatedAt || new Date().toISOString(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...corePages, ...productPages, ...categoryPages];
}
