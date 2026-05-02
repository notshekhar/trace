import type { RawArticle } from "../types";

export abstract class ScraperSource {
  abstract readonly name: string;
  abstract readonly feedUrl: string;
  abstract scrape(): Promise<RawArticle[]>;
}
