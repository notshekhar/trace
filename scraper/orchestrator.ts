import { randomUUID } from "crypto";
import { categorize } from "./categorizer";
import { saveArticles, saveHotLinks } from "./db";
import { summarizeArticle } from "./summarizer";
import { scrapeHackerNews } from "./sources/hackernews";
import type { RawArticle, ScrapedArticle } from "./types";
import { CnnSource } from "./sources/cnn";
import { BbcSource } from "./sources/bbc";
import { GuardianSource } from "./sources/guardian";
import { ReutersSource } from "./sources/reuters";
import { ApSource } from "./sources/ap";
import { TechCrunchSource } from "./sources/techcrunch";
import { TheVergeSource } from "./sources/theverge";
import { WiredSource } from "./sources/wired";
import { ArsTechnicaSource } from "./sources/arstechnica";
import { DailyDevSource } from "./sources/dailydev";
import { EspnSource } from "./sources/espn";
import { BbcSportSource } from "./sources/bbcsport";
import { BloombergSource } from "./sources/bloomberg";
import { ForbesSource } from "./sources/forbes";
import { PoliticoSource } from "./sources/politico";
import { NprSource } from "./sources/npr";

const SOURCES = [
  new CnnSource(), new BbcSource(), new GuardianSource(),
  new ReutersSource(), new ApSource(), new TechCrunchSource(),
  new TheVergeSource(), new WiredSource(), new ArsTechnicaSource(),
  new DailyDevSource(), new EspnSource(), new BbcSportSource(),
  new BloombergSource(), new ForbesSource(), new PoliticoSource(),
  new NprSource(),
];

function getTomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function getToday(): string {
  return new Date().toISOString().split("T")[0];
}

async function enrichWithAi(raw: RawArticle, index: number): Promise<ScrapedArticle> {
  const aiResult = await summarizeArticle(raw.title, raw.summary);
  return {
    id: randomUUID(),
    title: raw.title,
    summary: raw.summary,
    summaryAi: aiResult?.summaryAi,
    keyTakeaways: aiResult?.keyTakeaways,
    url: raw.url,
    imageUrl: raw.imageUrl,
    source: raw.source,
    category: categorize(raw.source),
    editionDate: getTomorrow(),
    scrapedAt: new Date().toISOString(),
    isFeatured: index === 0,
  };
}

async function scrapeHotLinksOnce(): Promise<void> {
  try {
    const today = getToday();
    const links = await scrapeHackerNews(today, 12);
    saveHotLinks(today, links);
    console.log(`[scraper] hackernews: ${links.length} hot links`);
  } catch (err) {
    console.error(`[scraper] hackernews failed:`, err);
  }
}

export async function runScrape(): Promise<void> {
  console.log(`[scraper] Starting at ${new Date().toISOString()}`);

  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      try {
        const raw = await source.scrape();
        // Enrich first 3 articles per source with AI (cost control)
        const articles = await Promise.all(
          raw.slice(0, 20).map((a, i) => enrichWithAi(a, i))
        );
        saveArticles(articles);
        console.log(`[scraper] ${source.name}: ${articles.length} articles`);
      } catch (err) {
        console.error(`[scraper] ${source.name} failed:`, err);
      }
    })
  );

  await scrapeHotLinksOnce();

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0) console.warn(`[scraper] ${failed} sources failed`);
  console.log(`[scraper] Done`);
}
