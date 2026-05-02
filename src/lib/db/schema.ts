import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const articles = sqliteTable("articles", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  summary: text("summary"),
  summaryAi: text("summary_ai"),
  keyTakeaways: text("key_takeaways"),
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
