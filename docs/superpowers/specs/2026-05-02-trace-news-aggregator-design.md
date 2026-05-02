# Trace — News Aggregator Design Spec
Date: 2026-05-02

## Overview

Trace is a newspaper-style daily news aggregator. Scraper collects articles 24/7; each day's articles become the next day's edition. Users browse like a real newspaper — fixed editions, section navigation, date archives. No algorithm, no personalization (yet), no infinite scroll.

## Stack

- **Runtime:** Bun throughout (web + scraper)
- **Framework:** Next.js 16.2 (App Router, Turbopack)
- **Database:** SQLite via Drizzle ORM
- **State:** Zustand (client UI state only)
- **Styling:** Tailwind CSS
- **Fonts:** Playfair Display (headlines), Inter (body)

## Architecture

Two separate processes sharing one SQLite file:

```
scraper/ (Bun process)     →     SQLite DB     →     app/ (Next.js 16.2)
  Bun.cron every 2hrs      →   articles table   →   SSR current edition
  Midnight: publish        →   editions table   →   SSG past editions
                                                 →   /rss.xml route
```

### Edition Logic

- Articles scraped today → `edition_date = tomorrow`
- Midnight cron: marks tomorrow's edition as `published = true`
- Current edition (today): SSR with short revalidation
- Past editions: fully static (SSG), cached forever

## Data Layer

### Schema

```sql
articles
  id           TEXT PRIMARY KEY  -- uuid
  title        TEXT NOT NULL
  summary      TEXT
  url          TEXT UNIQUE NOT NULL
  image_url    TEXT
  source       TEXT NOT NULL     -- "cnn", "bbc", "techcrunch"...
  category     TEXT NOT NULL     -- "tech" | "politics" | "sports" | "business" | "world"
  edition_date TEXT NOT NULL     -- YYYY-MM-DD
  scraped_at   TEXT NOT NULL     -- ISO timestamp
  is_featured  INTEGER DEFAULT 0 -- 1 = hero/lead story per section

editions
  date          TEXT PRIMARY KEY  -- YYYY-MM-DD
  published     INTEGER DEFAULT 0
  article_count INTEGER DEFAULT 0
```

### Scraper Sources

| Category  | Sources |
|-----------|---------|
| General   | CNN, BBC, Reuters, AP, The Guardian |
| Tech      | TechCrunch, The Verge, Wired, Ars Technica, daily.dev |
| Sports    | ESPN, BBC Sport |
| Business  | Bloomberg, Forbes |
| Politics  | Politico, NPR |

Each source: RSS feed primary, HTML scraping (cheerio) as fallback. One file per source in `scraper/sources/`. All extend `base.ts` abstract interface.

### Cron Schedule

- Every 2 hours: scrape all sources → upsert to SQLite (dedupe by URL)
- Midnight: set `editions.published = true` for tomorrow's date

## Component Architecture (SOLID)

```
app/
  page.tsx                        # Redirect → today's edition
  edition/[date]/page.tsx         # Edition home (SSR/SSG)
  edition/[date]/[section]/       # Section page (SSR/SSG)
    page.tsx
  rss.xml/route.ts                # RSS feed
  sitemap.xml/route.ts            # Sitemap
  layout.tsx

components/
  masthead/
    Masthead.tsx                  # Logo, date, tagline
    EditionPicker.tsx             # Date navigation (Zustand)
  navigation/
    SectionNav.tsx                # Section tabs (Zustand)
  edition/
    HeroStory.tsx                 # Lead article, big image
    ArticleGrid.tsx               # Grid of ArticleCards
    ArticleCard.tsx               # Single article display
    SectionStrip.tsx              # Section preview row on home
  ui/
    CategoryBadge.tsx             # Color-coded category tag
    SourceTag.tsx                 # Source name display

store/
  editionStore.ts                 # Active date, active section
  uiStore.ts                      # Theme (light/dark)

lib/
  db/
    schema.ts                     # Drizzle schema definitions
    queries.ts                    # All DB query functions
    index.ts                      # DB connection singleton
  rss/
    generator.ts                  # RSS XML builder

scraper/
  index.ts                        # Entry point, runs cron
  scheduler.ts                    # Bun.cron definitions
  categorizer.ts                  # Map source → category
  sources/
    base.ts                       # Abstract ScraperSource interface
    cnn.ts
    bbc.ts
    guardian.ts
    reuters.ts
    ap.ts
    techcrunch.ts
    theverge.ts
    wired.ts
    arstechnica.ts
    dailydev.ts
    espn.ts
    bbcsport.ts
    bloomberg.ts
    forbes.ts
    politico.ts
    npr.ts
```

## UI Design

### Layout

```
┌─────────────────────────────────────────┐
│  TRACE          May 2, 2026    [dark🌙] │  Masthead
│  "All the news fit to read"             │
├─────────────────────────────────────────┤
│  All │ Tech │ Politics │ Sports │ Biz  │  SectionNav
├─────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌──────────┐ │
│  │                     │  │ Article  │ │
│  │    HERO STORY       │  │ Card     │  HeroStory + sidebar
│  │    (big image)      │  ├──────────┤ │
│  │                     │  │ Article  │ │
│  └─────────────────────┘  │ Card     │ │
├─────────────────────────────────────────┤
│  TECH ──────────────────────────────── │
│  [Card] [Card] [Card] [Card]            │  SectionStrip × N
├─────────────────────────────────────────┤
│  SPORTS ───────────────────────────── │
│  [Card] [Card] [Card] [Card]            │
└─────────────────────────────────────────┘
```

### Color Palette

| Mode  | Background | Text      | Accent  |
|-------|------------|-----------|---------|
| Light | `#FAFAF7`  | `#1A1A1A` | `#C41E3A` |
| Dark  | `#111111`  | `#F0EDE8` | `#C41E3A` |

Section colors: Tech=blue, Sports=green, Politics=amber, Business=purple, World=teal

### Rules

- No infinite scroll — paginated per section
- Fixed edition per day — no live updates to current view
- Past editions: browse by date via EditionPicker

## SEO + RSS

- `generateMetadata()` on every page — dynamic OG tags
- `/sitemap.xml` — all published editions + sections
- `/rss.xml` — full feed, article per item with category + source
- Server Components fetch DB directly — no client waterfalls
- `next/image` for all images

## Performance

- Zustand: pure UI state only (no async, no fetches)
- Server Components do all data fetching
- Past editions: `export const dynamic = 'force-static'`
- Current edition: `export const revalidate = 3600`
- Turbopack in dev, `bun run build` for production

## Project Structure

```
trace/
  app/                  # Next.js 16.2
  components/
  store/
  lib/
  scraper/              # Standalone Bun process
  docs/
  package.json          # Next.js deps
  scraper/package.json  # Scraper deps (cheerio, drizzle)
  .env                  # DATABASE_URL=./trace.db
```

## Auth (Future)

Planned but not in scope. Personalized sections, saved articles, edition preferences — added later without restructuring.
