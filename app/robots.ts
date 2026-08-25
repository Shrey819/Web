import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://omautomation.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/orders", "/checkout"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
