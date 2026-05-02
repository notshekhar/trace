import { NextResponse } from "next/server";
import { getAllPublishedEditions } from "@/lib/db/queries";

export const revalidate = 86400;

export async function GET() {
  const editions = await getAllPublishedEditions();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trace.news";

  const urls = [
    `<url><loc>${baseUrl}</loc><changefreq>daily</changefreq></url>`,
    `<url><loc>${baseUrl}/archive</loc><changefreq>daily</changefreq></url>`,
    ...editions.map(
      (ed) => `<url><loc>${baseUrl}/edition/${ed.date}</loc><changefreq>daily</changefreq><lastmod>${ed.date}</lastmod></url>`
    ),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
