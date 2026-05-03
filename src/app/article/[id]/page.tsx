import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageShell } from "@/components/layout/PageShell";
import { ArticleEntry } from "@/components/edition/ArticleEntry";
import { ArticleMoreCard } from "@/components/edition/ArticleMoreCard";
import { TrendingSidebar } from "@/components/edition/TrendingSidebar";
import { HotLinks } from "@/components/edition/HotLinks";
import { ArchiveCta } from "@/components/edition/ArchiveCta";
import { BackButton } from "@/components/nav/BackButton";
import { getArticle, getTodayEditionDate } from "@/lib/api";

export const revalidate = 3600;

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const payload = await getArticle(id);
  if (!payload) return { title: "Article not found — Trace" };
  const { article } = payload;
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
  const payload = await getArticle(id);
  if (!payload) notFound();

  const { article, rest: moreStories, trending, hotLinks } = payload;
  const isToday = article.editionDate === getTodayEditionDate();
  const backHref = isToday ? "/" : `/edition/${article.editionDate}`;
  const backLabel = isToday ? "today" : formatLongDate(article.editionDate);

  return (
    <PageShell
      left={<HotLinks links={hotLinks} title="Hot on HN" />}
      aside={<TrendingSidebar articles={trending} title="Most popular" />}
    >
      <div className="pb-6">
        <BackButton fallbackHref={backHref} fallbackLabel={backLabel} />
      </div>

      <ArticleEntry article={article} variant="lead" linked={false} />

      {moreStories.length > 0 && (
        <section className="mt-14">
          <div className="flex items-baseline justify-between border-b border-rule pb-3 mb-6">
            <p className="eyebrow">More in this edition</p>
            <span className="text-[11px] text-subtle tabular-nums">
              {moreStories.length}{" "}
              {moreStories.length === 1 ? "story" : "stories"}
            </span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-7">
            {moreStories.map((a) => (
              <li key={a.id}>
                <ArticleMoreCard article={a} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <ArchiveCta />
    </PageShell>
  );
}
