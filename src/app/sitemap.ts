import type { MetadataRoute } from "next";
import { getArchive } from "@/lib/api";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trace.news";
  const editions = await getArchive();
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/archive`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...editions.map((ed) => ({
      url: `${baseUrl}/edition/${ed.date}`,
      lastModified: ed.date,
      changeFrequency: "daily" as const,
      priority: 0.6,
    })),
  ];
}
