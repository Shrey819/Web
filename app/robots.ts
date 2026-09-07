import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/admin/*",
        "/api",
        "/api/*",
        "/cart",
        "/checkout",
        "/checkout/*",
        "/profile",
        "/profile/*",
        "/orders",
        "/orders/*",
        "/login",
        "/register",
        "/forgot-password",
      ],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
