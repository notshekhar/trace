import { Database } from "bun:sqlite";
import type { ScrapedArticle, ScrapedHotLink } from "./types";

function getDb(): Database {
  const dbPath = process.env.DATABASE_URL ?? "../trace.db";
  const db = new Database(dbPath);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
      summary_ai TEXT,
      key_takeaways TEXT,
      url TEXT NOT NULL UNIQUE,
      image_url TEXT,
      source TEXT NOT NULL,
      category TEXT NOT NULL,
      edition_date TEXT NOT NULL,
      scraped_at TEXT NOT NULL,
      is_featured INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS editions (
      date TEXT PRIMARY KEY,
      published INTEGER DEFAULT 0,
      article_count INTEGER DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS hot_links (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      external_id TEXT,
      score INTEGER,
      comments INTEGER,
      byline TEXT,
      edition_date TEXT NOT NULL,
      scraped_at TEXT NOT NULL,
      UNIQUE(source, external_id, edition_date)
    );
  `);
  return db;
}

export function saveArticles(scrapedArticles: ScrapedArticle[]): void {
  if (scrapedArticles.length === 0) return;
  const db = getDb();

  const insert = db.prepare(`
    INSERT OR IGNORE INTO articles
      (id, title, summary, summary_ai, key_takeaways, url, image_url, source, category, edition_date, scraped_at, is_featured)
    VALUES
      ($id, $title, $summary, $summaryAi, $keyTakeaways, $url, $imageUrl, $source, $category, $editionDate, $scrapedAt, $isFeatured)
  `);

  const upsertEdition = db.prepare(`
    INSERT INTO editions (date, published, article_count)
    VALUES ($date, 0, $count)
    ON CONFLICT(date) DO UPDATE SET article_count = article_count + $count
  `);

  const insertMany = db.transaction((articles: ScrapedArticle[]) => {
    for (const a of articles) {
      insert.run({
        $id: a.id,
        $title: a.title,
        $summary: a.summary ?? null,
        $summaryAi: a.summaryAi ?? null,
        $keyTakeaways: a.keyTakeaways ?? null,
        $url: a.url,
        $imageUrl: a.imageUrl ?? null,
        $source: a.source,
        $category: a.category,
        $editionDate: a.editionDate,
        $scrapedAt: a.scrapedAt,
        $isFeatured: a.isFeatured ? 1 : 0,
      });
    }
    // group by edition date and upsert counts
    const byDate = articles.reduce<Record<string, number>>((acc, a) => {
      acc[a.editionDate] = (acc[a.editionDate] ?? 0) + 1;
      return acc;
    }, {});
    for (const [date, count] of Object.entries(byDate)) {
      upsertEdition.run({ $date: date, $count: count });
    }
  });

  insertMany(scrapedArticles);
  db.close();
}

export function saveHotLinks(date: string, links: ScrapedHotLink[]): void {
  if (links.length === 0) return;
  const db = getDb();

  // Replace today's hot links for that source so we always show fresh top N
  const sources = [...new Set(links.map((l) => l.source))];
  const del = db.prepare(`DELETE FROM hot_links WHERE edition_date = ? AND source = ?`);
  const insert = db.prepare(`
    INSERT OR IGNORE INTO hot_links
      (id, source, title, url, external_id, score, comments, byline, edition_date, scraped_at)
    VALUES
      ($id, $source, $title, $url, $externalId, $score, $comments, $byline, $editionDate, $scrapedAt)
  `);

  const tx = db.transaction(() => {
    for (const s of sources) del.run(date, s);
    for (const l of links) {
      insert.run({
        $id: l.id,
        $source: l.source,
        $title: l.title,
        $url: l.url,
        $externalId: l.externalId ?? null,
        $score: l.score ?? null,
        $comments: l.comments ?? null,
        $byline: l.byline ?? null,
        $editionDate: l.editionDate,
        $scrapedAt: l.scrapedAt,
      });
    }
  });

  tx();
  db.close();
}

export function publishEdition(date: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO editions (date, published, article_count)
    VALUES ($date, 1, 0)
    ON CONFLICT(date) DO UPDATE SET published = 1
  `).run({ $date: date });
  db.close();
}
