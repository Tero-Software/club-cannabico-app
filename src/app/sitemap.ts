import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clubcannabico.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${siteUrl}/postulacion`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/marco-legal`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    { url: `${siteUrl}/contacto`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
  ];
}
