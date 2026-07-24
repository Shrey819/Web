import { MetadataRoute } from "next";
import { PRODUCTS } from "@/data/products";
import { CATEGORIES } from "@/data/categories";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://propelauto-industrial.com";

  const staticPages = [
    "",
    "/products",
    "/cart",
    "/checkout",
    "/login",
    "/register",
    "/forgot-password",
    "/wishlist",
    "/compare",
    "/profile",
    "/orders",
    "/quote",
    "/about",
    "/contact",
    "/faq",
    "/resources",
    "/privacy",
    "/terms",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : 0.8,
  }));

  const productPages = PRODUCTS.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryPages = CATEGORIES.map((c) => ({
    url: `${baseUrl}/category/${c.slug}`,
    lastModified: new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
