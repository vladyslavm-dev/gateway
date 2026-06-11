import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.SITE_URL || "https://example.com";

  return [
    { url: `${siteUrl}/en`, priority: 1 },
    { url: `${siteUrl}/de`, priority: 1 },
    { url: `${siteUrl}/en/impressum`, priority: 0.3 },
    { url: `${siteUrl}/de/impressum`, priority: 0.3 },
    { url: `${siteUrl}/en/data-protection`, priority: 0.3 },
    { url: `${siteUrl}/de/datenschutz`, priority: 0.3 },
  ];
}
