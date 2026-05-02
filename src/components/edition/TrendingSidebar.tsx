import Link from "next/link";
import type { Article } from "@/lib/api";

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
  articles: Article[];
  title?: string;
}

export function TrendingSidebar({ articles, title = "Trending" }: Props) {
  if (articles.length === 0) return null;

  return (
    <div>
      <p className="eyebrow mb-5">{title}</p>
      <ol className="flex flex-col">
        {articles.map((article, i) => (
          <li
            key={article.id}
            className="border-t border-rule first:border-t-0 py-3.5"
          >
            <Link href={`/article/${article.id}`} className="group flex gap-3">
              <span className="text-[11px] font-medium tabular-nums text-subtle pt-0.5 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex flex-col gap-1.5">
                <p className="font-serif-display text-[14px] leading-[1.35] tracking-[-0.005em] text-foreground/90 group-hover:text-muted transition-colors line-clamp-3">
                  {article.title}
                </p>
                <span className="text-[10px] font-medium tracking-[0.14em] uppercase text-subtle">
                  {SOURCE_DISPLAY[article.source] ?? article.source}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
