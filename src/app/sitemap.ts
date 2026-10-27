import type { MetadataRoute } from "next";

const siteUrl = new URL(
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.prewaitlist.com"
);

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/pricing",
    "/legal/terms",
    "/legal/privacy",
    "/refund-policy",
  ].map((path) => ({ url: new URL(path, siteUrl).toString() }));
}
