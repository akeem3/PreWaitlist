import type { MetadataRoute } from "next";

const sitemapUrl = new URL(
  "/sitemap.xml",
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.prewaitlist.com"
).toString();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "OAI-SearchBot", allow: "/" },
      { userAgent: "GPTBot", allow: "/" },
    ],
    sitemap: sitemapUrl,
  };
}
