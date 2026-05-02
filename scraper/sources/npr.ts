import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";

export class NprSource extends ScraperSource {
  readonly name = "npr";
  readonly feedUrl = "https://feeds.npr.org/1001/rss.xml";

  async scrape(): Promise<RawArticle[]> {
    try {
      const res = await fetch(this.feedUrl, {
        headers: { "User-Agent": "Trace-NewsBot/1.0" },
      });
      if (!res.ok) return [];
      return parseRssFeed(await res.text(), this.name);
    } catch {
      return [];
    }
  }
}
