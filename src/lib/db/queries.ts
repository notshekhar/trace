import { eq, desc, and } from "drizzle-orm";
import { db } from "./index";
import { articles, editions, type Article, type Edition } from "./schema";
import type { Category } from "@/types";

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

export async function getArticlesByEditionAndSection(
  date: string,
  category: Category
): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(and(eq(articles.editionDate, date), eq(articles.category, category)))
    .orderBy(desc(articles.scrapedAt));
}

export async function getFeaturedArticle(date: string): Promise<Article | null> {
  const result = await db
    .select()
    .from(articles)
    .where(and(eq(articles.editionDate, date), eq(articles.isFeatured, true)))
    .limit(1);
  return result[0] ?? null;
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

export async function getTrendingArticles(date: string, limit = 8): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .where(eq(articles.editionDate, date))
    .orderBy(desc(articles.scrapedAt))
    .limit(limit);
}
