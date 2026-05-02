import Link from "next/link";
import { SourceTag } from "@/components/ui/SourceTag";
import type { Article } from "@/lib/db/schema";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function TrendingSidebar({ articles }: { articles: Article[] }) {
  return (
    <aside className="flex flex-col gap-1">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-3">
        Trending Stories
      </h3>
      {articles.map((article, i) => (
        <Link key={article.id} href={`/article/${article.id}`} className="group flex gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-900 -mx-2 px-2 rounded transition-colors">
          <span className="text-xl font-bold text-gray-200 dark:text-gray-700 tabular-nums leading-none pt-1 w-6 shrink-0" style={{ fontFamily: "var(--font-inter-var), system-ui, sans-serif" }}>
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="flex flex-col gap-1 min-w-0">
            <p className="text-sm font-semibold leading-snug group-hover:text-accent transition-colors line-clamp-2" style={{ fontFamily: "var(--font-playfair-var), Georgia, serif" }}>
              {article.title}
            </p>
            <SourceTag source={article.source} time={formatTime(article.scrapedAt)} />
          </div>
        </Link>
      ))}
    </aside>
  );
}
