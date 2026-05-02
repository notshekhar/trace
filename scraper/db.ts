import { Database } from "bun:sqlite";
import type { ScrapedArticle } from "./types";

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

export function publishEdition(date: string): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO editions (date, published, article_count)
    VALUES ($date, 1, 0)
    ON CONFLICT(date) DO UPDATE SET published = 1
  `).run({ $date: date });
  db.close();
}
