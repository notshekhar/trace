import Image from "next/image";
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

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface Props {
  article: Article;
}

/**
 * Compact card used under the lead article in /article/[id].
 * Same look-and-feel as the feed grid: image on top, source eyebrow,
 * 3-line title, optional summary clamp.
 */
export function ArticleMoreCard({ article }: Props) {
  const source = SOURCE_DISPLAY[article.source] ?? article.source;
  const summary = article.summaryAi ?? article.summary;

  return (
    <Link
      href={`/article/${article.id}`}
      className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 rounded-md"
    >
      {article.imageUrl ? (
        <div className="relative aspect-16/10 w-full overflow-hidden rounded-md bg-rule/40">
          <Image
            src={article.imageUrl}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.015]"
            sizes="(max-width: 640px) 100vw, 320px"
          />
        </div>
      ) : (
        <div className="aspect-16/10 w-full rounded-md bg-rule/30" />
      )}

      <div className="mt-3">
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[10.5px] font-semibold tracking-[0.16em] uppercase text-foreground/75 truncate">
            {source}
          </span>
          <span className="text-subtle/60 shrink-0" aria-hidden>
            ·
          </span>
          <span className="text-[11px] text-subtle tabular-nums shrink-0">
            {formatTime(article.scrapedAt)}
          </span>
        </div>

        <h3 className="font-serif-display font-semibold text-[16px] leading-tight tracking-[-0.005em] text-foreground group-hover:text-muted transition-colors line-clamp-3">
          {article.title}
        </h3>

        {summary && (
          <p className="mt-1.5 text-[12.5px] leading-snug text-subtle line-clamp-2">
            {summary}
          </p>
        )}
      </div>
    </Link>
  );
}
