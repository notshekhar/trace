export type Category = "tech" | "politics" | "sports" | "business" | "world";

export interface RawArticle {
  title: string;
  summary?: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt?: string;
}

export interface ScrapedArticle {
  id: string;
  title: string;
  summary?: string;
  summaryAi?: string;
  keyTakeaways?: string;
  url: string;
  imageUrl?: string;
  source: string;
  category: Category;
  editionDate: string;
  scrapedAt: string;
  isFeatured: boolean;
}
