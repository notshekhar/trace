import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Masthead } from "@/components/masthead/Masthead";
import { SectionNav } from "@/components/navigation/SectionNav";
import { ArticleGrid } from "@/components/edition/ArticleGrid";
import { TrendingSidebar } from "@/components/edition/TrendingSidebar";
import { PageShell } from "@/components/layout/PageShell";
import {
  getEdition,
  getArticlesByEditionAndSection,
  getAllPublishedEditions,
  getTodayEditionDate,
  getTrendingArticles,
} from "@/lib/db/queries";
import { CATEGORIES, CATEGORY_LABELS } from "@/types";
import type { Category } from "@/types";

export const revalidate = 3600;

interface Props {
  params: Promise<{ date: string; section: string }>;
}

export async function generateStaticParams() {
  const { getAllPublishedEditions } = await import("@/lib/db/queries");
  const editions = await getAllPublishedEditions();
  return editions.flatMap((ed) =>
    CATEGORIES.map((category) => ({ date: ed.date, section: category }))
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date, section } = await params;
  const label = CATEGORY_LABELS[section as Category] ?? section;
  return {
    title: `Trace — ${label} — ${date}`,
    description: `${label} news from the ${date} edition`,
  };
}

export default async function SectionPage({ params }: Props) {
  const { date, section } = await params;

  if (!CATEGORIES.includes(section as Category)) notFound();

  const category = section as Category;
  const today = getTodayEditionDate();
  const isToday = date === today;

  const [edition, articles, publishedEditions, trending] = await Promise.all([
    getEdition(date),
    getArticlesByEditionAndSection(date, category),
    getAllPublishedEditions(),
    getTrendingArticles(date, 8),
  ]);

  if (!isToday && (!edition || !edition.published)) notFound();

  return (
    <>
      <Masthead currentDate={date} editions={publishedEditions} articleCount={articles.length} />
      <SectionNav editionDate={date} activeSection={category} />
      <PageShell
        center={
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-gray-500 border-b border-gray-200 dark:border-gray-800 pb-3">
              {CATEGORY_LABELS[category]}
            </h2>
            <ArticleGrid articles={articles} columns={3} />
          </div>
        }
        right={<TrendingSidebar articles={trending} />}
      />
    </>
  );
}
