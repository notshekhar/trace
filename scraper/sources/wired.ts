import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";

export class WiredSource extends ScraperSource {
  readonly name = "wired";
  readonly feedUrl = "https://www.wired.com/feed/rss";

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
