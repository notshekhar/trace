import Image from "next/image";
import Link from "next/link";
import type { Article } from "@/lib/api";
import { CopyLinkButton } from "./CopyLinkButton";

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
  /** "lead" = no eyebrow label; "next" = shows "NEXT STORY" eyebrow */
  variant?: "lead" | "next";
  /** Show the title as a link to /article/[id]. Default true. */
  linked?: boolean;
}

export function ArticleEntry({ article, variant = "lead", linked = true }: Props) {
  const summary = article.summaryAi ?? article.summary;
  const takeaways = article.keyTakeaways;
  const source = SOURCE_DISPLAY[article.source] ?? article.source;

  const Title = (
    <h2 className="font-serif-display font-semibold text-[24px] sm:text-[28px] leading-[1.18] tracking-[-0.012em] text-foreground">
      {article.title}
    </h2>
  );

  return (
    <article id={`a-${article.id}`} className="scroll-mt-20">
      {variant === "next" && <p className="eyebrow mb-4">Next story</p>}

      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10.5px] font-semibold tracking-[0.16em] uppercase text-foreground/75">
          {source}
        </span>
        <span className="text-subtle/70" aria-hidden>·</span>
        <span className="text-[11px] text-subtle tracking-wide">
          {formatTime(article.scrapedAt)}
        </span>
      </div>

      {linked ? (
        <Link href={`/article/${article.id}`} className="block group">
          <div className="group-hover:text-muted transition-colors">{Title}</div>
        </Link>
      ) : (
        Title
      )}

      {article.imageUrl && (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-md bg-rule/40 mt-5">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            priority={variant === "lead"}
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 680px"
          />
        </div>
      )}

      {summary && (
        <p className="font-serif-display mt-4 text-[17px] leading-[1.55] text-foreground/85 tracking-[-0.003em]">
          {summary}
        </p>
      )}

      {takeaways.length > 0 && (
        <div className="mt-6 border-l-2 border-rule pl-4">
          <p className="eyebrow mb-3">Key takeaways</p>
          <ol className="flex flex-col gap-2">
            {takeaways.map((point, i) => (
              <li
                key={i}
                className="font-serif-display flex gap-3 text-[15px] leading-[1.55] text-muted"
              >
                <span className="text-subtle tabular-nums shrink-0 w-4">{i + 1}.</span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-6 flex items-center gap-5">
        <CopyLinkButton url={article.url} />
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-foreground transition-colors"
        >
          Read original
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 17 17 7" />
            <path d="M7 7h10v10" />
          </svg>
        </a>
      </div>
    </article>
  );
}
