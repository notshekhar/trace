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
