import { XMLParser } from "fast-xml-parser";
import type { RawArticle } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  isArray: (name) => name === "item",
});

export function parseRssFeed(xml: string, source: string): RawArticle[] {
  let parsed: any;
  try {
    parsed = parser.parse(xml);
  } catch {
    return [];
  }

  const items: any[] = parsed?.rss?.channel?.item ?? parsed?.feed?.entry ?? [];

  return items
    .filter((item: any) => item.title && (item.link || item.url))
    .map((item: any) => ({
      title: String(item.title?.["#text"] ?? item.title),
      url: String(item.link?.["@_href"] ?? item.link ?? item.url ?? ""),
      summary: item.description
        ? String(item.description).replace(/<[^>]+>/g, "").trim() || undefined
        : item.summary
        ? String(item.summary?.["#text"] ?? item.summary).replace(/<[^>]+>/g, "").trim() || undefined
        : undefined,
      imageUrl:
        item.enclosure?.["@_url"] ??
        item["media:content"]?.["@_url"] ??
        item["media:thumbnail"]?.["@_url"] ??
        undefined,
      source,
      publishedAt: item.pubDate ?? item.published ?? undefined,
    }));
}
