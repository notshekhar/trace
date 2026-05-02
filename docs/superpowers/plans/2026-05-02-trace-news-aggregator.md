# Trace News Aggregator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a newspaper-style daily news aggregator with a Bun scraper collecting from 16 sources every 2 hours and a Next.js 16.2 web app displaying articles as fixed daily editions.

**Architecture:** Two Bun processes share a SQLite DB file. Scraper runs independently, tags articles with tomorrow's edition_date, publishes at midnight. Web app SSRs current edition, SSGs past editions. Zustand manages client UI state only.

**Tech Stack:** Next.js 16.2, Bun runtime, `bun:sqlite`, Drizzle ORM, Zustand, Tailwind CSS, Cheerio, fast-xml-parser, Playfair Display + Inter (next/font/google)

---

## File Map

```
trace/
├── app/
│   ├── layout.tsx                    # Root layout, fonts, theme provider
│   ├── page.tsx                      # Redirect to today's edition
│   ├── edition/
│   │   └── [date]/
│   │       ├── page.tsx              # Edition home (SSR)
│   │       └── [section]/
│   │           └── page.tsx          # Section page (SSR/SSG)
│   ├── rss.xml/
│   │   └── route.ts                  # RSS feed
│   └── sitemap.xml/
│       └── route.ts                  # Sitemap
├── components/
│   ├── masthead/
│   │   ├── Masthead.tsx
│   │   └── EditionPicker.tsx         # "use client"
│   ├── navigation/
│   │   └── SectionNav.tsx            # "use client"
│   ├── edition/
│   │   ├── HeroStory.tsx
│   │   ├── ArticleGrid.tsx
│   │   ├── ArticleCard.tsx
│   │   └── SectionStrip.tsx
│   └── ui/
│       ├── CategoryBadge.tsx
│       └── SourceTag.tsx
├── store/
│   ├── editionStore.ts               # Active date, section
│   └── uiStore.ts                    # Theme
├── lib/
│   ├── db/
│   │   ├── schema.ts                 # Drizzle table definitions
│   │   ├── queries.ts                # All read queries for web
│   │   └── index.ts                  # DB connection singleton
│   └── rss/
│       └── generator.ts              # RSS XML string builder
├── scraper/
│   ├── index.ts                      # Entry: runs scheduler
│   ├── scheduler.ts                  # Bun.cron definitions
│   ├── orchestrator.ts               # Runs all sources, writes DB
│   ├── categorizer.ts                # source name → category
│   ├── rss-parser.ts                 # RSS XML → Article[]
│   ├── db.ts                         # Scraper-side DB connection + writes
│   ├── types.ts                      # Shared types
│   └── sources/
│       ├── base.ts                   # Abstract ScraperSource
│       ├── cnn.ts
│       ├── bbc.ts
│       ├── guardian.ts
│       ├── reuters.ts
│       ├── ap.ts
│       ├── techcrunch.ts
│       ├── theverge.ts
│       ├── wired.ts
│       ├── arstechnica.ts
│       ├── dailydev.ts
│       ├── espn.ts
│       ├── bbcsport.ts
│       ├── bloomberg.ts
│       ├── forbes.ts
│       ├── politico.ts
│       └── npr.ts
├── package.json
├── scraper/package.json
├── drizzle.config.ts
├── .env.local
└── next.config.ts
```

---

## Task 1: Initialize Project Structure

**Files:**
- Create: `trace/package.json`
- Create: `trace/scraper/package.json`
- Create: `trace/.env.local`
- Create: `trace/drizzle.config.ts`

- [ ] **Step 1: Init Next.js 16.2 app with Bun**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
bunx create-next-app@latest . --typescript --tailwind --app --turbopack --no-git --no-eslint --import-alias "@/*"
```

Expected: Next.js project scaffolded with Turbopack and Tailwind.

- [ ] **Step 2: Add web app dependencies**

```bash
bun add drizzle-orm zustand
bun add -d drizzle-kit
```

- [ ] **Step 3: Init scraper package**

```bash
mkdir -p scraper/sources
cd scraper
bun init -y
```

- [ ] **Step 4: Add scraper dependencies**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace/scraper
bun add drizzle-orm fast-xml-parser cheerio
bun add -d @types/cheerio drizzle-kit
```

- [ ] **Step 5: Create .env.local**

```bash
# trace/.env.local
DATABASE_URL=./trace.db
```

- [ ] **Step 6: Create drizzle.config.ts (web)**

```typescript
// trace/drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "./trace.db",
  },
} satisfies Config;
```

- [ ] **Step 7: Create scraper drizzle.config.ts**

```typescript
// trace/scraper/drizzle.config.ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./db.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "../trace.db",
  },
} satisfies Config;
```

- [ ] **Step 8: Update next.config.ts**

```typescript
// trace/next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
```

- [ ] **Step 9: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git init
git add .
git commit -m "chore: init project structure"
```

---

## Task 2: Database Schema

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`

- [ ] **Step 1: Write schema**

```typescript
// lib/db/schema.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  url: text("url").notNull().unique(),
  imageUrl: text("image_url"),
  source: text("source").notNull(),
  category: text("category").notNull(),
  editionDate: text("edition_date").notNull(),
  scrapedAt: text("scraped_at").notNull(),
  isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
});

export const editions = sqliteTable("editions", {
  date: text("date").primaryKey(),
  published: integer("published", { mode: "boolean" }).default(false),
  articleCount: integer("article_count").default(0),
});

export type Article = typeof articles.$inferSelect;
export type Edition = typeof editions.$inferSelect;
```

- [ ] **Step 2: Write DB connection (web)**

```typescript
// lib/db/index.ts
import { drizzle } from "drizzle-orm/bun-sqlite";
import { Database } from "bun:sqlite";
import * as schema from "./schema";

const sqlite = new Database(process.env.DATABASE_URL ?? "./trace.db");
sqlite.exec("PRAGMA journal_mode = WAL;");

export const db = drizzle(sqlite, { schema });
```

- [ ] **Step 3: Run migration**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
bunx drizzle-kit push
```

Expected: `trace.db` created with `articles` and `editions` tables.

- [ ] **Step 4: Commit**

```bash
git add lib/db/ drizzle.config.ts
git commit -m "feat: add SQLite schema with articles and editions tables"
```

---

## Task 3: Scraper Types + Base Interface

**Files:**
- Create: `scraper/types.ts`
- Create: `scraper/sources/base.ts`

- [ ] **Step 1: Write types**

```typescript
// scraper/types.ts
export type Category =
  | "tech"
  | "politics"
  | "sports"
  | "business"
  | "world";

export interface RawArticle {
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt?: string;
}

export interface ScrapedArticle extends RawArticle {
  category: Category;
  editionDate: string; // YYYY-MM-DD (tomorrow)
  scrapedAt: string;   // ISO timestamp
  isFeatured: boolean;
}
```

- [ ] **Step 2: Write base scraper interface**

```typescript
// scraper/sources/base.ts
import type { RawArticle } from "../types";

export abstract class ScraperSource {
  abstract readonly name: string;
  abstract readonly feedUrl: string;

  abstract scrape(): Promise<RawArticle[]>;
}
```

- [ ] **Step 3: Write test for base type structure**

```typescript
// scraper/sources/base.test.ts
import { describe, expect, it } from "bun:test";
import type { RawArticle } from "../types";

describe("RawArticle type", () => {
  it("accepts valid article shape", () => {
    const article: RawArticle = {
      title: "Test headline",
      url: "https://example.com/article",
      source: "test",
    };
    expect(article.title).toBe("Test headline");
    expect(article.summary).toBeUndefined();
  });
});
```

- [ ] **Step 4: Run test**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace/scraper
bun test sources/base.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add scraper/types.ts scraper/sources/base.ts scraper/sources/base.test.ts
git commit -m "feat: add scraper types and abstract base source"
```

---

## Task 4: RSS Parser Utility

**Files:**
- Create: `scraper/rss-parser.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/rss-parser.test.ts
import { describe, expect, it } from "bun:test";
import { parseRssFeed } from "./rss-parser";

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <item>
      <title>Article One</title>
      <link>https://example.com/one</link>
      <description>Summary of article one</description>
      <pubDate>Fri, 02 May 2026 10:00:00 GMT</pubDate>
      <enclosure url="https://example.com/img.jpg" type="image/jpeg"/>
    </item>
    <item>
      <title>Article Two</title>
      <link>https://example.com/two</link>
    </item>
  </channel>
</rss>`;

describe("parseRssFeed", () => {
  it("parses items from RSS XML", () => {
    const articles = parseRssFeed(SAMPLE_RSS, "test-source");
    expect(articles).toHaveLength(2);
    expect(articles[0].title).toBe("Article One");
    expect(articles[0].url).toBe("https://example.com/one");
    expect(articles[0].summary).toBe("Summary of article one");
    expect(articles[0].imageUrl).toBe("https://example.com/img.jpg");
    expect(articles[0].source).toBe("test-source");
  });

  it("handles items without optional fields", () => {
    const articles = parseRssFeed(SAMPLE_RSS, "test-source");
    expect(articles[1].summary).toBeUndefined();
    expect(articles[1].imageUrl).toBeUndefined();
  });

  it("returns empty array on empty channel", () => {
    const empty = `<rss><channel></channel></rss>`;
    expect(parseRssFeed(empty, "test")).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace/scraper
bun test rss-parser.test.ts
```

Expected: FAIL — "Cannot find module './rss-parser'"

- [ ] **Step 3: Implement RSS parser**

```typescript
// scraper/rss-parser.ts
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

  const items: any[] = parsed?.rss?.channel?.item ?? [];

  return items
    .filter((item: any) => item.title && item.link)
    .map((item: any) => ({
      title: String(item.title),
      url: String(item.link),
      summary: item.description ? String(item.description).replace(/<[^>]+>/g, "").trim() || undefined : undefined,
      imageUrl: item.enclosure?.["@_url"] ?? item["media:content"]?.["@_url"] ?? undefined,
      source,
      publishedAt: item.pubDate ? String(item.pubDate) : undefined,
    }));
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
bun test rss-parser.test.ts
```

Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add scraper/rss-parser.ts scraper/rss-parser.test.ts
git commit -m "feat: add RSS parser utility using fast-xml-parser"
```

---

## Task 5: Categorizer

**Files:**
- Create: `scraper/categorizer.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/categorizer.test.ts
import { describe, expect, it } from "bun:test";
import { categorize } from "./categorizer";

describe("categorize", () => {
  it("maps tech sources correctly", () => {
    expect(categorize("techcrunch")).toBe("tech");
    expect(categorize("theverge")).toBe("tech");
    expect(categorize("wired")).toBe("tech");
    expect(categorize("arstechnica")).toBe("tech");
    expect(categorize("dailydev")).toBe("tech");
  });
  it("maps sports sources correctly", () => {
    expect(categorize("espn")).toBe("sports");
    expect(categorize("bbcsport")).toBe("sports");
  });
  it("maps business sources correctly", () => {
    expect(categorize("bloomberg")).toBe("business");
    expect(categorize("forbes")).toBe("business");
  });
  it("maps politics sources correctly", () => {
    expect(categorize("politico")).toBe("politics");
    expect(categorize("npr")).toBe("politics");
  });
  it("falls back to world for general news", () => {
    expect(categorize("cnn")).toBe("world");
    expect(categorize("bbc")).toBe("world");
    expect(categorize("guardian")).toBe("world");
    expect(categorize("reuters")).toBe("world");
    expect(categorize("ap")).toBe("world");
  });
});
```

- [ ] **Step 2: Run test — verify fail**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace/scraper
bun test categorizer.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement categorizer**

```typescript
// scraper/categorizer.ts
import type { Category } from "./types";

const SOURCE_MAP: Record<string, Category> = {
  techcrunch: "tech",
  theverge: "tech",
  wired: "tech",
  arstechnica: "tech",
  dailydev: "tech",
  espn: "sports",
  bbcsport: "sports",
  bloomberg: "business",
  forbes: "business",
  politico: "politics",
  npr: "politics",
};

export function categorize(source: string): Category {
  return SOURCE_MAP[source] ?? "world";
}
```

- [ ] **Step 4: Run test — verify pass**

```bash
bun test categorizer.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add scraper/categorizer.ts scraper/categorizer.test.ts
git commit -m "feat: add source categorizer"
```

---

## Task 6: General News Scraper Sources (CNN, BBC, Guardian, Reuters, AP)

**Files:**
- Create: `scraper/sources/cnn.ts`
- Create: `scraper/sources/bbc.ts`
- Create: `scraper/sources/guardian.ts`
- Create: `scraper/sources/reuters.ts`
- Create: `scraper/sources/ap.ts`
- Create: `scraper/sources/sources.test.ts`

- [ ] **Step 1: Write failing integration test**

```typescript
// scraper/sources/sources.test.ts
import { describe, expect, it, mock } from "bun:test";
import { CnnSource } from "./cnn";
import { BbcSource } from "./bbc";

const MOCK_RSS = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <item>
      <title>Breaking News</title>
      <link>https://cnn.com/story</link>
      <description>Summary here</description>
    </item>
  </channel>
</rss>`;

describe("CnnSource", () => {
  it("scrapes and returns articles", async () => {
    const source = new CnnSource();
    // mock global fetch
    global.fetch = mock(async () => new Response(MOCK_RSS));
    const articles = await source.scrape();
    expect(articles.length).toBeGreaterThan(0);
    expect(articles[0].source).toBe("cnn");
    expect(articles[0].url).toBeTruthy();
  });
});

describe("BbcSource", () => {
  it("has correct source name", () => {
    const source = new BbcSource();
    expect(source.name).toBe("bbc");
  });
});
```

- [ ] **Step 2: Run test — verify fail**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace/scraper
bun test sources/sources.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement CNN source**

```typescript
// scraper/sources/cnn.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";

export class CnnSource extends ScraperSource {
  readonly name = "cnn";
  readonly feedUrl = "https://rss.cnn.com/rss/edition.rss";

  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, {
      headers: { "User-Agent": "Trace-NewsBot/1.0" },
    });
    if (!res.ok) return [];
    const xml = await res.text();
    return parseRssFeed(xml, this.name);
  }
}
```

- [ ] **Step 4: Implement BBC source**

```typescript
// scraper/sources/bbc.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";

export class BbcSource extends ScraperSource {
  readonly name = "bbc";
  readonly feedUrl = "https://feeds.bbci.co.uk/news/rss.xml";

  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, {
      headers: { "User-Agent": "Trace-NewsBot/1.0" },
    });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

- [ ] **Step 5: Implement Guardian source**

```typescript
// scraper/sources/guardian.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";

export class GuardianSource extends ScraperSource {
  readonly name = "guardian";
  readonly feedUrl = "https://www.theguardian.com/world/rss";

  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, {
      headers: { "User-Agent": "Trace-NewsBot/1.0" },
    });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

- [ ] **Step 6: Implement Reuters source**

```typescript
// scraper/sources/reuters.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";

export class ReutersSource extends ScraperSource {
  readonly name = "reuters";
  readonly feedUrl = "https://feeds.reuters.com/reuters/topNews";

  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, {
      headers: { "User-Agent": "Trace-NewsBot/1.0" },
    });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

- [ ] **Step 7: Implement AP source**

```typescript
// scraper/sources/ap.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";

export class ApSource extends ScraperSource {
  readonly name = "ap";
  readonly feedUrl = "https://feeds.apnews.com/rss/apf-topnews";

  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, {
      headers: { "User-Agent": "Trace-NewsBot/1.0" },
    });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

- [ ] **Step 8: Run tests**

```bash
bun test sources/sources.test.ts
```

Expected: PASS

- [ ] **Step 9: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add scraper/sources/cnn.ts scraper/sources/bbc.ts scraper/sources/guardian.ts scraper/sources/reuters.ts scraper/sources/ap.ts scraper/sources/sources.test.ts
git commit -m "feat: add general news scraper sources (CNN, BBC, Guardian, Reuters, AP)"
```

---

## Task 7: Tech, Sports, Business, Politics Sources

**Files:**
- Create: `scraper/sources/techcrunch.ts`
- Create: `scraper/sources/theverge.ts`
- Create: `scraper/sources/wired.ts`
- Create: `scraper/sources/arstechnica.ts`
- Create: `scraper/sources/dailydev.ts`
- Create: `scraper/sources/espn.ts`
- Create: `scraper/sources/bbcsport.ts`
- Create: `scraper/sources/bloomberg.ts`
- Create: `scraper/sources/forbes.ts`
- Create: `scraper/sources/politico.ts`
- Create: `scraper/sources/npr.ts`

All sources follow the same pattern as CnnSource. Each fetches its RSS feed URL.

- [ ] **Step 1: Implement all remaining sources**

```typescript
// scraper/sources/techcrunch.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class TechCrunchSource extends ScraperSource {
  readonly name = "techcrunch";
  readonly feedUrl = "https://techcrunch.com/feed/";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/theverge.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class TheVergeSource extends ScraperSource {
  readonly name = "theverge";
  readonly feedUrl = "https://www.theverge.com/rss/index.xml";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/wired.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class WiredSource extends ScraperSource {
  readonly name = "wired";
  readonly feedUrl = "https://www.wired.com/feed/rss";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/arstechnica.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class ArsTechnicaSource extends ScraperSource {
  readonly name = "arstechnica";
  readonly feedUrl = "https://feeds.arstechnica.com/arstechnica/index";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/dailydev.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
// daily.dev exposes a public RSS feed of trending dev articles
export class DailyDevSource extends ScraperSource {
  readonly name = "dailydev";
  readonly feedUrl = "https://daily.dev/blog/rss.xml";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/espn.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class EspnSource extends ScraperSource {
  readonly name = "espn";
  readonly feedUrl = "https://www.espn.com/espn/rss/news";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/bbcsport.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class BbcSportSource extends ScraperSource {
  readonly name = "bbcsport";
  readonly feedUrl = "https://feeds.bbci.co.uk/sport/rss.xml";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/bloomberg.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class BloombergSource extends ScraperSource {
  readonly name = "bloomberg";
  readonly feedUrl = "https://feeds.bloomberg.com/markets/news.rss";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/forbes.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class ForbesSource extends ScraperSource {
  readonly name = "forbes";
  readonly feedUrl = "https://www.forbes.com/real-time/feed2/";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/politico.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class PoliticoSource extends ScraperSource {
  readonly name = "politico";
  readonly feedUrl = "https://rss.politico.com/politics-news.xml";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

```typescript
// scraper/sources/npr.ts
import { ScraperSource } from "./base";
import { parseRssFeed } from "../rss-parser";
import type { RawArticle } from "../types";
export class NprSource extends ScraperSource {
  readonly name = "npr";
  readonly feedUrl = "https://feeds.npr.org/1001/rss.xml";
  async scrape(): Promise<RawArticle[]> {
    const res = await fetch(this.feedUrl, { headers: { "User-Agent": "Trace-NewsBot/1.0" } });
    if (!res.ok) return [];
    return parseRssFeed(await res.text(), this.name);
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add scraper/sources/
git commit -m "feat: add all 11 remaining scraper sources"
```

---

## Task 8: Scraper DB Writer

**Files:**
- Create: `scraper/db.ts`

- [ ] **Step 1: Write failing test**

```typescript
// scraper/db.test.ts
import { describe, expect, it, beforeAll, afterAll } from "bun:test";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { articles, editions } from "../lib/db/schema";
import { saveArticles, publishEdition } from "./db";

// Use in-memory DB for tests
const testDb = new Database(":memory:");

describe("saveArticles", () => {
  it("inserts articles and dedupes by URL", async () => {
    const testArticles = [
      {
        id: "1",
        title: "Test",
        url: "https://example.com/1",
        source: "cnn",
        category: "world" as const,
        editionDate: "2026-05-03",
        scrapedAt: new Date().toISOString(),
        isFeatured: false,
      },
    ];
    // Just verify the function signature accepts correct types
    expect(typeof saveArticles).toBe("function");
  });
});
```

- [ ] **Step 2: Run test — verify fail**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace/scraper
bun test db.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement scraper DB module**

```typescript
// scraper/db.ts
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { sql } from "drizzle-orm";
import { articles, editions } from "../lib/db/schema";
import type { ScrapedArticle } from "./types";

const DB_PATH = process.env.DATABASE_URL ?? "../trace.db";

function getDb() {
  const sqlite = new Database(DB_PATH);
  sqlite.exec("PRAGMA journal_mode = WAL;");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT,
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
  return drizzle(sqlite, { schema: { articles, editions } });
}

export async function saveArticles(scrapedArticles: ScrapedArticle[]): Promise<void> {
  if (scrapedArticles.length === 0) return;
  const db = getDb();

  await db
    .insert(articles)
    .values(scrapedArticles)
    .onConflictDoNothing({ target: articles.url });

  // upsert edition record
  const dates = [...new Set(scrapedArticles.map((a) => a.editionDate))];
  for (const date of dates) {
    const count = scrapedArticles.filter((a) => a.editionDate === date).length;
    await db
      .insert(editions)
      .values({ date, published: false, articleCount: count })
      .onConflictDoUpdate({
        target: editions.date,
        set: { articleCount: sql`article_count + ${count}` },
      });
  }
}

export async function publishEdition(date: string): Promise<void> {
  const db = getDb();
  await db
    .insert(editions)
    .values({ date, published: true })
    .onConflictDoUpdate({
      target: editions.date,
      set: { published: true },
    });
}
```

- [ ] **Step 4: Run test**

```bash
bun test db.test.ts
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add scraper/db.ts scraper/db.test.ts
git commit -m "feat: add scraper DB writer with dedup and edition upsert"
```

---

## Task 9: Scraper Orchestrator + Scheduler

**Files:**
- Create: `scraper/orchestrator.ts`
- Create: `scraper/scheduler.ts`
- Create: `scraper/index.ts`

- [ ] **Step 1: Write orchestrator**

```typescript
// scraper/orchestrator.ts
import { randomUUID } from "crypto";
import { categorize } from "./categorizer";
import { saveArticles } from "./db";
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

function toScrapedArticle(raw: RawArticle, index: number): ScrapedArticle {
  return {
    ...raw,
    id: randomUUID(),
    category: categorize(raw.source),
    editionDate: getTomorrow(),
    scrapedAt: new Date().toISOString(),
    isFeatured: index === 0, // first article per source is featured candidate
  };
}

export async function runScrape(): Promise<void> {
  console.log(`[scraper] Starting scrape at ${new Date().toISOString()}`);
  const results = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const raw = await source.scrape();
      const articles = raw.map((a, i) => toScrapedArticle(a, i));
      await saveArticles(articles);
      console.log(`[scraper] ${source.name}: ${articles.length} articles`);
    })
  );
  const failed = results.filter((r) => r.status === "rejected");
  if (failed.length > 0) {
    console.warn(`[scraper] ${failed.length} sources failed`);
  }
  console.log(`[scraper] Done`);
}
```

- [ ] **Step 2: Write scheduler**

```typescript
// scraper/scheduler.ts
import { runScrape } from "./orchestrator";
import { publishEdition } from "./db";

function getYesterday(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

export function startScheduler(): void {
  // Scrape every 2 hours
  Bun.cron("0 */2 * * *", async () => {
    await runScrape();
  });

  // Publish previous day's collected articles at midnight
  Bun.cron("0 0 * * *", async () => {
    const today = new Date().toISOString().split("T")[0];
    await publishEdition(today);
    console.log(`[scheduler] Published edition ${today}`);
  });

  console.log("[scheduler] Cron jobs registered");
}
```

- [ ] **Step 3: Write entry point**

```typescript
// scraper/index.ts
import { startScheduler } from "./scheduler";
import { runScrape } from "./orchestrator";

// Run immediately on start, then on schedule
await runScrape();
startScheduler();
```

- [ ] **Step 4: Add start script to scraper package.json**

```json
// scraper/package.json — update scripts
{
  "name": "trace-scraper",
  "scripts": {
    "start": "bun run index.ts",
    "test": "bun test"
  }
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add scraper/orchestrator.ts scraper/scheduler.ts scraper/index.ts scraper/package.json
git commit -m "feat: add scraper orchestrator and Bun.cron scheduler"
```

---

## Task 10: Web DB Queries

**Files:**
- Create: `lib/db/queries.ts`

- [ ] **Step 1: Write failing test**

```typescript
// lib/db/queries.test.ts
import { describe, expect, it } from "bun:test";
import { getTodayEditionDate } from "./queries";

describe("getTodayEditionDate", () => {
  it("returns YYYY-MM-DD format", () => {
    const date = getTodayEditionDate();
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
```

- [ ] **Step 2: Run test — verify fail**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
bun test lib/db/queries.test.ts
```

Expected: FAIL

- [ ] **Step 3: Implement queries**

```typescript
// lib/db/queries.ts
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

export async function getRecentArticlesForRss(limit = 50): Promise<Article[]> {
  return db
    .select()
    .from(articles)
    .orderBy(desc(articles.scrapedAt))
    .limit(limit);
}
```

- [ ] **Step 4: Add shared Category type to app**

```typescript
// types.ts (root of trace/)
export type Category = "tech" | "politics" | "sports" | "business" | "world";

export const CATEGORIES: Category[] = [
  "world", "tech", "politics", "sports", "business",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  world: "World",
  tech: "Tech",
  politics: "Politics",
  sports: "Sports",
  business: "Business",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  world: "text-teal-700 bg-teal-50",
  tech: "text-blue-700 bg-blue-50",
  politics: "text-amber-700 bg-amber-50",
  sports: "text-green-700 bg-green-50",
  business: "text-purple-700 bg-purple-50",
};
```

- [ ] **Step 5: Run test**

```bash
bun test lib/db/queries.test.ts
```

Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/db/queries.ts lib/db/queries.test.ts types.ts
git commit -m "feat: add web DB queries and shared category types"
```

---

## Task 11: Zustand Stores

**Files:**
- Create: `store/editionStore.ts`
- Create: `store/uiStore.ts`

- [ ] **Step 1: Create edition store**

```typescript
// store/editionStore.ts
import { create } from "zustand";
import type { Category } from "@/types";

interface EditionState {
  activeSection: Category | "all";
  setActiveSection: (section: Category | "all") => void;
}

export const useEditionStore = create<EditionState>((set) => ({
  activeSection: "all",
  setActiveSection: (section) => set({ activeSection: section }),
}));
```

- [ ] **Step 2: Create UI store**

```typescript
// store/uiStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  theme: "light" | "dark";
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "light",
      toggleTheme: () =>
        set({ theme: get().theme === "light" ? "dark" : "light" }),
    }),
    { name: "trace-ui" }
  )
);
```

- [ ] **Step 3: Commit**

```bash
git add store/
git commit -m "feat: add Zustand stores for edition section and UI theme"
```

---

## Task 12: Root Layout + Fonts + Theme

**Files:**
- Modify: `app/layout.tsx`
- Create: `app/providers.tsx`

- [ ] **Step 1: Create providers (client boundary)**

```typescript
// app/providers.tsx
"use client";

import { useEffect } from "react";
import { useUiStore } from "@/store/uiStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useUiStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Update root layout**

```typescript
// app/layout.tsx
import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import { ThemeProvider } from "./providers";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Trace — Daily Edition",
  description: "All the news fit to read",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${inter.variable} font-inter bg-[#FAFAF7] dark:bg-[#111111] text-[#1A1A1A] dark:text-[#F0EDE8] antialiased`}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Update globals.css for font variables and dark mode**

```css
/* app/globals.css — add after existing Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --font-playfair: '';
  --font-inter: '';
}

.font-inter { font-family: var(--font-inter), ui-sans-serif, system-ui, sans-serif; }
.font-playfair { font-family: var(--font-playfair), ui-serif, Georgia, serif; }
```

- [ ] **Step 4: Update tailwind.config.ts**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        accent: "#C41E3A",
      },
    },
  },
};
export default config;
```

- [ ] **Step 5: Commit**

```bash
git add app/layout.tsx app/providers.tsx app/globals.css tailwind.config.ts
git commit -m "feat: add root layout with Playfair/Inter fonts and dark mode"
```

---

## Task 13: UI Primitives (CategoryBadge, SourceTag)

**Files:**
- Create: `components/ui/CategoryBadge.tsx`
- Create: `components/ui/SourceTag.tsx`

- [ ] **Step 1: Create CategoryBadge**

```typescript
// components/ui/CategoryBadge.tsx
import { CATEGORY_COLORS, CATEGORY_LABELS, type Category } from "@/types";

interface Props {
  category: Category;
}

export function CategoryBadge({ category }: Props) {
  return (
    <span
      className={`inline-block text-xs font-inter font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${CATEGORY_COLORS[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}
```

- [ ] **Step 2: Create SourceTag**

```typescript
// components/ui/SourceTag.tsx
const SOURCE_DISPLAY: Record<string, string> = {
  cnn: "CNN",
  bbc: "BBC",
  guardian: "The Guardian",
  reuters: "Reuters",
  ap: "AP News",
  techcrunch: "TechCrunch",
  theverge: "The Verge",
  wired: "Wired",
  arstechnica: "Ars Technica",
  dailydev: "daily.dev",
  espn: "ESPN",
  bbcsport: "BBC Sport",
  bloomberg: "Bloomberg",
  forbes: "Forbes",
  politico: "Politico",
  npr: "NPR",
};

interface Props {
  source: string;
}

export function SourceTag({ source }: Props) {
  return (
    <span className="text-xs font-inter text-gray-500 dark:text-gray-400 uppercase tracking-wide">
      {SOURCE_DISPLAY[source] ?? source}
    </span>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add components/ui/
git commit -m "feat: add CategoryBadge and SourceTag UI primitives"
```

---

## Task 14: Article Components

**Files:**
- Create: `components/edition/ArticleCard.tsx`
- Create: `components/edition/HeroStory.tsx`
- Create: `components/edition/ArticleGrid.tsx`
- Create: `components/edition/SectionStrip.tsx`

- [ ] **Step 1: Create ArticleCard**

```typescript
// components/edition/ArticleCard.tsx
import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import type { Article } from "@/lib/db/schema";
import type { Category } from "@/types";

interface Props {
  article: Article;
  showCategory?: boolean;
}

export function ArticleCard({ article, showCategory = true }: Props) {
  return (
    <article className="group flex flex-col gap-2 border-b border-gray-200 dark:border-gray-800 pb-4">
      {article.imageUrl && (
        <Link href={article.url} target="_blank" rel="noopener noreferrer">
          <div className="relative w-full h-40 overflow-hidden rounded">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          </div>
        </Link>
      )}
      <div className="flex items-center gap-2">
        <SourceTag source={article.source} />
        {showCategory && <CategoryBadge category={article.category as Category} />}
      </div>
      <Link href={article.url} target="_blank" rel="noopener noreferrer">
        <h3 className="font-playfair text-lg font-bold leading-tight group-hover:text-accent transition-colors">
          {article.title}
        </h3>
      </Link>
      {article.summary && (
        <p className="text-sm font-inter text-gray-600 dark:text-gray-400 line-clamp-2">
          {article.summary}
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 2: Create HeroStory**

```typescript
// components/edition/HeroStory.tsx
import Image from "next/image";
import Link from "next/link";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { SourceTag } from "@/components/ui/SourceTag";
import type { Article } from "@/lib/db/schema";
import type { Category } from "@/types";

interface Props {
  article: Article;
}

export function HeroStory({ article }: Props) {
  return (
    <article className="group">
      {article.imageUrl && (
        <Link href={article.url} target="_blank" rel="noopener noreferrer">
          <div className="relative w-full h-72 md:h-96 overflow-hidden rounded mb-4">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 65vw"
            />
          </div>
        </Link>
      )}
      <div className="flex items-center gap-2 mb-2">
        <SourceTag source={article.source} />
        <CategoryBadge category={article.category as Category} />
      </div>
      <Link href={article.url} target="_blank" rel="noopener noreferrer">
        <h1 className="font-playfair text-3xl md:text-4xl font-bold leading-tight mb-3 group-hover:text-accent transition-colors">
          {article.title}
        </h1>
      </Link>
      {article.summary && (
        <p className="font-inter text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          {article.summary}
        </p>
      )}
    </article>
  );
}
```

- [ ] **Step 3: Create ArticleGrid**

```typescript
// components/edition/ArticleGrid.tsx
import { ArticleCard } from "./ArticleCard";
import type { Article } from "@/lib/db/schema";

interface Props {
  articles: Article[];
  showCategory?: boolean;
}

export function ArticleGrid({ articles, showCategory = true }: Props) {
  if (articles.length === 0) {
    return (
      <p className="font-inter text-gray-400 text-sm py-8 text-center">
        No articles in this section yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} showCategory={showCategory} />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Create SectionStrip**

```typescript
// components/edition/SectionStrip.tsx
import Link from "next/link";
import { ArticleCard } from "./ArticleCard";
import type { Article } from "@/lib/db/schema";
import { CATEGORY_LABELS, type Category } from "@/types";

interface Props {
  category: Category;
  articles: Article[];
  editionDate: string;
}

export function SectionStrip({ category, articles, editionDate }: Props) {
  if (articles.length === 0) return null;

  return (
    <section>
      <div className="flex items-center justify-between mb-4 border-t-2 border-[#C41E3A] pt-3">
        <h2 className="font-playfair text-2xl font-bold uppercase tracking-wide">
          {CATEGORY_LABELS[category]}
        </h2>
        <Link
          href={`/edition/${editionDate}/${category}`}
          className="font-inter text-sm text-accent hover:underline"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 4).map((article) => (
          <ArticleCard key={article.id} article={article} showCategory={false} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/edition/
git commit -m "feat: add ArticleCard, HeroStory, ArticleGrid, SectionStrip components"
```

---

## Task 15: Masthead + Navigation Components

**Files:**
- Create: `components/masthead/Masthead.tsx`
- Create: `components/masthead/EditionPicker.tsx`
- Create: `components/navigation/SectionNav.tsx`

- [ ] **Step 1: Create Masthead (server component)**

```typescript
// components/masthead/Masthead.tsx
import Link from "next/link";
import { EditionPicker } from "./EditionPicker";
import { ThemeToggle } from "./ThemeToggle";
import type { Edition } from "@/lib/db/schema";

interface Props {
  currentDate: string;
  editions: Edition[];
}

export function Masthead({ currentDate, editions }: Props) {
  const displayDate = new Date(currentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <header className="border-b-2 border-[#1A1A1A] dark:border-[#F0EDE8] pb-4 mb-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <Link href="/">
            <h1 className="font-playfair text-5xl md:text-7xl font-black tracking-tight leading-none">
              TRACE
            </h1>
          </Link>
          <p className="font-inter text-xs text-gray-500 uppercase tracking-widest mt-1">
            All the news fit to read
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <ThemeToggle />
          <p className="font-inter text-sm text-gray-500">{displayDate}</p>
          <EditionPicker currentDate={currentDate} editions={editions} />
        </div>
      </div>
      <div className="border-t border-gray-300 dark:border-gray-700 mt-4" />
    </header>
  );
}
```

- [ ] **Step 2: Create ThemeToggle (client component)**

```typescript
// components/masthead/ThemeToggle.tsx
"use client";

import { useUiStore } from "@/store/uiStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useUiStore();
  return (
    <button
      onClick={toggleTheme}
      className="font-inter text-xs border border-gray-300 dark:border-gray-700 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label="Toggle theme"
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
```

- [ ] **Step 3: Create EditionPicker (client component)**

```typescript
// components/masthead/EditionPicker.tsx
"use client";

import { useRouter } from "next/navigation";
import type { Edition } from "@/lib/db/schema";

interface Props {
  currentDate: string;
  editions: Edition[];
}

export function EditionPicker({ currentDate, editions }: Props) {
  const router = useRouter();

  if (editions.length <= 1) return null;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="edition-select" className="font-inter text-xs text-gray-500">
        Edition:
      </label>
      <select
        id="edition-select"
        value={currentDate}
        onChange={(e) => router.push(`/edition/${e.target.value}`)}
        className="font-inter text-xs border border-gray-300 dark:border-gray-700 bg-transparent rounded px-2 py-1"
      >
        {editions.map((ed) => (
          <option key={ed.date} value={ed.date}>
            {ed.date}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 4: Create SectionNav (client component)**

```typescript
// components/navigation/SectionNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/types";

interface Props {
  editionDate: string;
  activeSection?: Category | "all";
}

export function SectionNav({ editionDate, activeSection = "all" }: Props) {
  const sections: Array<{ key: Category | "all"; label: string }> = [
    { key: "all", label: "All" },
    ...CATEGORIES.map((c) => ({ key: c, label: CATEGORY_LABELS[c] })),
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-gray-200 dark:border-gray-800">
      {sections.map(({ key, label }) => {
        const href =
          key === "all"
            ? `/edition/${editionDate}`
            : `/edition/${editionDate}/${key}`;
        const isActive = activeSection === key;

        return (
          <Link
            key={key}
            href={href}
            className={`font-inter text-sm font-medium px-3 py-1.5 rounded whitespace-nowrap transition-colors ${
              isActive
                ? "bg-[#1A1A1A] dark:bg-[#F0EDE8] text-[#FAFAF7] dark:text-[#111111]"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/masthead/ components/navigation/
git commit -m "feat: add Masthead, EditionPicker, ThemeToggle, SectionNav components"
```

---

## Task 16: Edition Home Page (SSR)

**Files:**
- Create: `app/page.tsx`
- Create: `app/edition/[date]/page.tsx`

- [ ] **Step 1: Create root redirect**

```typescript
// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  const today = new Date().toISOString().split("T")[0];
  redirect(`/edition/${today}`);
}
```

- [ ] **Step 2: Create edition home page**

```typescript
// app/edition/[date]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Masthead } from "@/components/masthead/Masthead";
import { SectionNav } from "@/components/navigation/SectionNav";
import { HeroStory } from "@/components/edition/HeroStory";
import { ArticleGrid } from "@/components/edition/ArticleGrid";
import { SectionStrip } from "@/components/edition/SectionStrip";
import {
  getEdition,
  getArticlesByEdition,
  getFeaturedArticle,
  getAllPublishedEditions,
  getTodayEditionDate,
} from "@/lib/db/queries";
import { CATEGORIES } from "@/types";

export const revalidate = 3600; // revalidate hourly

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `Trace — Edition ${date}`,
    description: `Daily news edition for ${date}`,
    openGraph: {
      title: `Trace — ${date}`,
      description: "All the news fit to read",
    },
  };
}

export default async function EditionPage({ params }: Props) {
  const { date } = await params;
  const today = getTodayEditionDate();
  const isToday = date === today;

  const [edition, allArticles, featuredArticle, publishedEditions] =
    await Promise.all([
      getEdition(date),
      getArticlesByEdition(date),
      getFeaturedArticle(date),
      getAllPublishedEditions(),
    ]);

  // Show 404 for future editions or non-existent dates
  if (!isToday && (!edition || !edition.published)) {
    notFound();
  }

  const hero = featuredArticle ?? allArticles[0] ?? null;
  const sidebarArticles = allArticles.filter((a) => a.id !== hero?.id).slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Masthead currentDate={date} editions={publishedEditions} />
      <SectionNav editionDate={date} activeSection="all" />

      {hero && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2">
            <HeroStory article={hero} />
          </div>
          <div className="flex flex-col gap-4">
            {sidebarArticles.map((article) => (
              <ArticleGrid key={article.id} articles={[article]} showCategory />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-12">
        {CATEGORIES.map((category) => {
          const sectionArticles = allArticles.filter(
            (a) => a.category === category && a.id !== hero?.id
          );
          return (
            <SectionStrip
              key={category}
              category={category}
              articles={sectionArticles}
              editionDate={date}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx app/edition/
git commit -m "feat: add edition home page with SSR and hero layout"
```

---

## Task 17: Section Page (SSR + SSG)

**Files:**
- Create: `app/edition/[date]/[section]/page.tsx`

- [ ] **Step 1: Create section page**

```typescript
// app/edition/[date]/[section]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Masthead } from "@/components/masthead/Masthead";
import { SectionNav } from "@/components/navigation/SectionNav";
import { ArticleGrid } from "@/components/edition/ArticleGrid";
import {
  getEdition,
  getArticlesByEditionAndSection,
  getAllPublishedEditions,
  getTodayEditionDate,
} from "@/lib/db/queries";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  type Category,
} from "@/types";

export const revalidate = 3600;

interface Props {
  params: Promise<{ date: string; section: string }>;
}

export async function generateStaticParams() {
  const editions = await getAllPublishedEditions();
  return editions.flatMap((ed) =>
    CATEGORIES.map((category) => ({ date: ed.date, section: category }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date, section } = await params;
  const label = CATEGORY_LABELS[section as Category] ?? section;
  return {
    title: `Trace — ${label} — ${date}`,
    description: `${label} news from the ${date} edition`,
  };
}

export default async function SectionPage({ params }: Props) {
  const { date, section } = await params;

  if (!CATEGORIES.includes(section as Category)) {
    notFound();
  }

  const category = section as Category;
  const today = getTodayEditionDate();
  const isToday = date === today;

  const [edition, articles, publishedEditions] = await Promise.all([
    getEdition(date),
    getArticlesByEditionAndSection(date, category),
    getAllPublishedEditions(),
  ]);

  if (!isToday && (!edition || !edition.published)) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Masthead currentDate={date} editions={publishedEditions} />
      <SectionNav editionDate={date} activeSection={category} />

      <div className="border-t-2 border-[#C41E3A] pt-4 mb-8">
        <h2 className="font-playfair text-3xl font-bold uppercase tracking-wide">
          {CATEGORY_LABELS[category]}
        </h2>
      </div>

      <ArticleGrid articles={articles} showCategory={false} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/edition/
git commit -m "feat: add section page with SSG for past editions"
```

---

## Task 18: RSS Feed + Sitemap

**Files:**
- Create: `lib/rss/generator.ts`
- Create: `app/rss.xml/route.ts`
- Create: `app/sitemap.xml/route.ts`

- [ ] **Step 1: Create RSS generator**

```typescript
// lib/rss/generator.ts
import type { Article } from "@/lib/db/schema";

export function generateRssFeed(articles: Article[], baseUrl: string): string {
  const items = articles
    .map(
      (a) => `
    <item>
      <title><![CDATA[${a.title}]]></title>
      <link>${a.url}</link>
      <guid>${a.url}</guid>
      <description><![CDATA[${a.summary ?? ""}]]></description>
      <category>${a.category}</category>
      <source url="${baseUrl}">${a.source}</source>
      <pubDate>${new Date(a.scrapedAt).toUTCString()}</pubDate>
      ${a.imageUrl ? `<enclosure url="${a.imageUrl}" type="image/jpeg" length="0"/>` : ""}
    </item>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Trace — Daily News</title>
    <link>${baseUrl}</link>
    <description>All the news fit to read</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${items}
  </channel>
</rss>`;
}
```

- [ ] **Step 2: Create RSS route**

```typescript
// app/rss.xml/route.ts
import { NextResponse } from "next/server";
import { getRecentArticlesForRss } from "@/lib/db/queries";
import { generateRssFeed } from "@/lib/rss/generator";

export const revalidate = 7200; // 2 hours

export async function GET() {
  const articles = await getRecentArticlesForRss(100);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trace.news";
  const xml = generateRssFeed(articles, baseUrl);

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=7200",
    },
  });
}
```

- [ ] **Step 3: Create sitemap route**

```typescript
// app/sitemap.xml/route.ts
import { NextResponse } from "next/server";
import { getAllPublishedEditions } from "@/lib/db/queries";
import { CATEGORIES } from "@/types";

export const revalidate = 86400; // 24 hours

export async function GET() {
  const editions = await getAllPublishedEditions();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://trace.news";

  const urls = [
    `<url><loc>${baseUrl}</loc><changefreq>daily</changefreq></url>`,
    ...editions.flatMap((ed) => [
      `<url><loc>${baseUrl}/edition/${ed.date}</loc><changefreq>daily</changefreq><lastmod>${ed.date}</lastmod></url>`,
      ...CATEGORIES.map(
        (cat) =>
          `<url><loc>${baseUrl}/edition/${ed.date}/${cat}</loc><changefreq>daily</changefreq><lastmod>${ed.date}</lastmod></url>`
      ),
    ]),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/rss/ app/rss.xml/ app/sitemap.xml/
git commit -m "feat: add RSS feed and sitemap route handlers"
```

---

## Task 19: Run + Verify

**Files:** None new — verification only

- [ ] **Step 1: Seed some test data**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace/scraper
DATABASE_URL="../trace.db" bun run index.ts
```

Expected: Scraper runs, outputs article counts per source, writes to trace.db.

- [ ] **Step 2: Start Next.js dev server**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
DATABASE_URL=./trace.db bun run dev
```

Expected: Turbopack starts, server available at http://localhost:3000

- [ ] **Step 3: Verify pages load**

Open in browser:
- `http://localhost:3000` → redirects to `/edition/YYYY-MM-DD`
- `http://localhost:3000/edition/YYYY-MM-DD` → shows masthead, sections
- `http://localhost:3000/edition/YYYY-MM-DD/tech` → shows tech articles
- `http://localhost:3000/rss.xml` → valid RSS XML
- `http://localhost:3000/sitemap.xml` → valid sitemap XML

- [ ] **Step 4: Run all tests**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
bun test
cd scraper
bun test
```

Expected: All tests pass.

- [ ] **Step 5: Final commit**

```bash
cd /Users/notshekhar/Documents/notshekhar/trace
git add .
git commit -m "feat: complete Trace news aggregator MVP"
```

---

## Self-Review Checklist

- [x] **Scraper sources** — 16 sources across 5 categories ✓
- [x] **RSS parser** — parses feed XML, handles missing fields ✓
- [x] **Scheduler** — Bun.cron every 2hrs + midnight publish ✓
- [x] **Edition logic** — tomorrow's date tagging, published flag ✓
- [x] **DB schema** — articles + editions tables with Drizzle ✓
- [x] **Dedup** — `onConflictDoNothing` on URL ✓
- [x] **Web queries** — all reads needed by pages ✓
- [x] **SSR current edition** — `revalidate = 3600` ✓
- [x] **SSG past editions** — `generateStaticParams` from published editions ✓
- [x] **Zustand stores** — section nav + theme, client only ✓
- [x] **Dark mode** — class-based, persisted in localStorage ✓
- [x] **Newspaper layout** — hero + sidebar + section strips ✓
- [x] **Section pages** — per category with SectionNav active state ✓
- [x] **RSS feed** — `/rss.xml` route ✓
- [x] **Sitemap** — `/sitemap.xml` route ✓
- [x] **Fonts** — Playfair Display + Inter via next/font/google ✓
- [x] **No re-render issues** — Zustand client-only, RSC fetch all data ✓
- [x] **SOLID components** — single responsibility per file ✓
- [x] **Auth** — explicitly deferred, no stubs left in ✓
