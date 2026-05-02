import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { ArticleEntry } from "@/components/edition/ArticleEntry";
import { TrendingSidebar } from "@/components/edition/TrendingSidebar";
import { HotLinks } from "@/components/edition/HotLinks";
import { ArchiveCta } from "@/components/edition/ArchiveCta";
import {
  getArticleById,
  getArticlesByEdition,
  getTodayEditionDate,
  getTrendingForEdition,
  getHotLinks,
} from "@/lib/db/queries";

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

function formatLongDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ArticlePage({ params }: Props) {
  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  const editionDate = article.editionDate;
  const today = getTodayEditionDate();
  const isToday = editionDate === today;

  const [allArticles, trending, hotLinks] = await Promise.all([
    getArticlesByEdition(editionDate),
    getTrendingForEdition(editionDate, 8),
    getHotLinks(editionDate, "hackernews", 10),
  ]);

  const idx = allArticles.findIndex((a) => a.id === article.id);
  const rest = idx >= 0 ? allArticles.slice(idx + 1) : [];

  const backHref = isToday ? "/" : `/edition/${editionDate}`;
  const backLabel = isToday ? "today" : formatLongDate(editionDate);

  return (
    <PageShell
      left={<HotLinks links={hotLinks} title="Hot on HN" />}
      aside={<TrendingSidebar articles={trending} title="Most popular" />}
    >
        <div className="pb-6">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-foreground transition-colors"
          >
            <span aria-hidden>←</span> Back to {backLabel}
          </Link>
        </div>

        <ArticleEntry article={article} variant="lead" linked={false} />

        {rest.length > 0 && (
          <div className="flex flex-col">
            {rest.map((next) => (
              <div key={next.id}>
                <hr className="my-10 border-0 border-t border-rule" />
                <ArticleEntry article={next} variant="next" linked />
              </div>
            ))}
          </div>
        )}

      <ArchiveCta />
    </PageShell>
  );
}
