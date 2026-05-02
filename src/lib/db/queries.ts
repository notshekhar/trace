import { eq, desc, and, lt, gt, asc } from "drizzle-orm";
import { db } from "./index";
import { articles, editions, hotLinks, type Article, type Edition, type HotLink } from "./schema";

export function getTodayEditionDate(): string {
  return new Date().toISOString().split("T")[0];
}

export async function getEdition(date: string): Promise<Edition | null> {
  const result = await db
    .select()
    .from(editions)
    .where(eq(editions.date, date))
    .limit(1);
  return result[0] ?? null;
}

export async function getArticlesByEdition(date: string): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(eq(articles.editionDate, date))
    .orderBy(desc(articles.scrapedAt));
}

export async function getAllPublishedEditions(): Promise<Edition[]> {
  return db
    .select()
    .from(editions)
    .where(eq(editions.published, true))
    .orderBy(desc(editions.date));
}

export async function getArticleById(id: string): Promise<Article | null> {
  const result = await db
    .select()
    .from(articles)
    .where(eq(articles.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function getRecentArticlesForRss(limit = 50): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .orderBy(desc(articles.scrapedAt))
    .limit(limit);
}

export async function getTrendingForEdition(date: string, limit = 8): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(eq(articles.editionDate, date))
    .orderBy(desc(articles.scrapedAt))
    .limit(limit);
}

export async function getHotLinks(date: string, source = "hackernews", limit = 10): Promise<HotLink[]> {
  return db
    .select()
    .from(hotLinks)
    .where(and(eq(hotLinks.editionDate, date), eq(hotLinks.source, source)))
    .orderBy(desc(hotLinks.score))
    .limit(limit);
}

export interface EditionSummary {
  date: string;
  articleCount: number;
  leadTitle: string | null;
}

export async function getEditionSummaries(): Promise<EditionSummary[]> {
  const eds = await db
    .select()
    .from(editions)
    .where(eq(editions.published, true))
    .orderBy(desc(editions.date));

  if (eds.length === 0) return [];

  // Pull a lead title per edition: featured first, otherwise newest scraped
  const leads = await Promise.all(
    eds.map(async (ed) => {
      const featured = await db
        .select({ title: articles.title })
        .from(articles)
        .where(and(eq(articles.editionDate, ed.date), eq(articles.isFeatured, true)))
        .limit(1);
      if (featured[0]) return { date: ed.date, title: featured[0].title };

      const fallback = await db
        .select({ title: articles.title })
        .from(articles)
        .where(eq(articles.editionDate, ed.date))
        .orderBy(desc(articles.scrapedAt))
        .limit(1);
      return { date: ed.date, title: fallback[0]?.title ?? null };
    })
  );

  const titleByDate = new Map(leads.map((l) => [l.date, l.title]));

  return eds.map((ed) => ({
    date: ed.date,
    articleCount: ed.articleCount ?? 0,
    leadTitle: titleByDate.get(ed.date) ?? null,
  }));
}

export async function getNeighborEditions(date: string): Promise<{
  prev: Edition | null;
  next: Edition | null;
}> {
  const [prev, next] = await Promise.all([
    db
      .select()
      .from(editions)
      .where(and(eq(editions.published, true), lt(editions.date, date)))
      .orderBy(desc(editions.date))
      .limit(1),
    db
      .select()
      .from(editions)
      .where(and(eq(editions.published, true), gt(editions.date, date)))
      .orderBy(asc(editions.date))
      .limit(1),
  ]);
  return { prev: prev[0] ?? null, next: next[0] ?? null };
}
