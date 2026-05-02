import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getArticleById, getTodayEditionDate, getTrendingArticles } from "@/lib/db/queries";
import { TrendingSidebar } from "@/components/edition/TrendingSidebar";
import { PageShell } from "@/components/layout/PageShell";
import { Masthead } from "@/components/masthead/Masthead";
import { getAllPublishedEditions } from "@/lib/db/queries";
import { SourceTag } from "@/components/ui/SourceTag";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { CopyButton } from "./CopyButton";
import type { Category } from "@/types";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) return { title: "Article not found — Trace" };
  return {
    title: `${article.title} — Trace`,
    description: article.summaryAi ?? article.summary ?? "",
    openGraph: {
      title: article.title,
      description: article.summaryAi ?? article.summary ?? "",
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  };
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;

  const today = getTodayEditionDate();
  const [article, trending, publishedEditions] = await Promise.all([
    getArticleById(id),
    getTrendingArticles(today, 8),
    getAllPublishedEditions(),
  ]);

  if (!article) notFound();

  let takeaways: string[] = [];
  if (article.keyTakeaways) {
    try {
      takeaways = JSON.parse(article.keyTakeaways);
    } catch {
      takeaways = [];
    }
  }

  const displaySummary = article.summaryAi ?? article.summary;

  const articleContent = (
    <article className="max-w-2xl mx-auto lg:mx-0">
      {/* Back link */}
      <Link
        href={`/edition/${today}`}
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-6 transition-colors"
      >
        ← Back to edition
      </Link>

      {/* Hero image */}
      {article.imageUrl && (
        <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl mb-6 bg-gray-100 dark:bg-gray-800">
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 65vw"
          />
        </div>
      )}

      {/* Meta row */}
      <div className="flex items-center gap-3 mb-4">
        <SourceTag source={article.source} time={formatTime(article.scrapedAt)} />
        <CategoryBadge category={article.category as Category} />
      </div>

      {/* Title */}
      <h1
        className="text-2xl md:text-3xl font-bold leading-tight mb-5"
        style={{ fontFamily: "var(--font-playfair-var), Georgia, serif" }}
      >
        {article.title}
      </h1>

      {/* AI Summary */}
      {displaySummary && (
        <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300 mb-6">
          {displaySummary}
        </p>
      )}

      {/* Key Takeaways */}
      {takeaways.length > 0 && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 mb-8 border border-gray-100 dark:border-gray-800">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">
            Key Takeaways
          </p>
          <ol className="flex flex-col gap-2">
            {takeaways.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                <span className="text-gray-300 dark:text-gray-600 font-medium tabular-nums shrink-0">
                  {i + 1}.
                </span>
                {point}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3">
        <CopyButton url={article.url} />
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-full hover:opacity-90 transition-opacity"
        >
          Read original source
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </article>
  );

  return (
    <>
      <Masthead currentDate={today} editions={publishedEditions} />
      <PageShell
        center={articleContent}
        right={<TrendingSidebar articles={trending} />}
      />
    </>
  );
}
