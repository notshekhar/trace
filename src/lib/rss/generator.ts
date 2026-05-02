import type { Article } from "@/lib/db/schema";

export function generateRssFeed(articles: Article[], baseUrl: string): string {
  const items = articles
    .map((a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${a.url}</link>
      <guid isPermaLink="false">${a.id}</guid>
      <description><![CDATA[${a.summaryAi ?? a.summary ?? ""}]]></description>
      <category>${a.category}</category>
      <pubDate>${new Date(a.scrapedAt).toUTCString()}</pubDate>
      ${a.imageUrl ? `<enclosure url="${a.imageUrl}" type="image/jpeg" length="0"/>` : ""}
    </item>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Trace — Daily News</title>
    <link>${baseUrl}</link>
    <description>All the news fit to read</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}
