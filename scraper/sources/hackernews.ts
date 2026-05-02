import { randomUUID } from "crypto";
import type { ScrapedHotLink } from "../types";

interface HnItem {
  id: number;
  type?: string;
  by?: string;
  title?: string;
  url?: string;
  score?: number;
  descendants?: number;
  time?: number;
  dead?: boolean;
  deleted?: boolean;
}

const TOP_ENDPOINT = "https://hacker-news.firebaseio.com/v0/topstories.json";
const ITEM_ENDPOINT = (id: number) =>
  `https://hacker-news.firebaseio.com/v0/item/${id}.json`;

export async function scrapeHackerNews(
  editionDate: string,
  limit = 12
): Promise<ScrapedHotLink[]> {
  const idsRes = await fetch(TOP_ENDPOINT);
  if (!idsRes.ok) throw new Error(`HN top stories failed: ${idsRes.status}`);
  const ids: number[] = await idsRes.json();

  const top = ids.slice(0, limit * 2); // overfetch in case some are jobs/dead
  const items = await Promise.all(
    top.map(async (id): Promise<HnItem | null> => {
      try {
        const r = await fetch(ITEM_ENDPOINT(id));
        if (!r.ok) return null;
        return (await r.json()) as HnItem;
      } catch {
        return null;
      }
    })
  );

  const now = new Date().toISOString();

  return items
    .filter((it): it is HnItem =>
      Boolean(it && it.title && it.url && it.type === "story" && !it.dead && !it.deleted)
    )
    .slice(0, limit)
    .map((it) => ({
      id: randomUUID(),
      source: "hackernews",
      title: it.title!,
      url: it.url!,
      externalId: String(it.id),
      score: it.score,
      comments: it.descendants,
      byline: it.by,
      editionDate,
      scrapedAt: now,
    }));
}
