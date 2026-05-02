import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Masthead } from "@/components/masthead/Masthead";
import { SectionNav } from "@/components/navigation/SectionNav";
import { HeroStory } from "@/components/edition/HeroStory";
import { ArticleGrid } from "@/components/edition/ArticleGrid";
import { SectionStrip } from "@/components/edition/SectionStrip";
import { TrendingSidebar } from "@/components/edition/TrendingSidebar";
import { PageShell } from "@/components/layout/PageShell";
import {
  getEdition,
  getArticlesByEdition,
  getFeaturedArticle,
  getAllPublishedEditions,
  getTodayEditionDate,
  getTrendingArticles,
} from "@/lib/db/queries";
import { CATEGORIES } from "@/types";

export const revalidate = 3600;

interface Props {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params;
  return {
    title: `Trace — ${date}`,
    description: `Daily news edition for ${date}`,
    openGraph: { title: `Trace — ${date}`, description: "All the news fit to read" },
  };
}

export default async function EditionPage({ params }: Props) {
  const { date } = await params;
  const today = getTodayEditionDate();
  const isToday = date === today;

  const [edition, allArticles, featuredArticle, publishedEditions, trending] =
    await Promise.all([
      getEdition(date),
      getArticlesByEdition(date),
      getFeaturedArticle(date),
      getAllPublishedEditions(),
      getTrendingArticles(date, 8),
    ]);

  if (!isToday && (!edition || !edition.published)) {
    notFound();
  }

  const hero = featuredArticle ?? allArticles[0] ?? null;
  const remainingArticles = allArticles.filter((a) => a.id !== hero?.id);

  const centerContent = (
    <div className="flex flex-col gap-8">
      {/* Hero + top articles */}
      {hero && (
        <div className="flex flex-col gap-6">
          <HeroStory article={hero} />
          <ArticleGrid articles={remainingArticles.slice(0, 4)} columns={2} />
        </div>
      )}

      {/* Section strips */}
      <div className="flex flex-col gap-10">
        {CATEGORIES.map((category) => {
          const sectionArticles = remainingArticles.filter(
            (a) => a.category === category
          );
          return (
            <SectionStrip
              key={category}
              category={category}
              articles={sectionArticles}
              editionDate={date}
            />
          );
        })}
      </div>
    </div>
  );

  return (
    <>
      <Masthead
        currentDate={date}
        editions={publishedEditions}
        articleCount={allArticles.length}
      />
      <SectionNav editionDate={date} activeSection="all" />
      <PageShell
        center={centerContent}
        right={<TrendingSidebar articles={trending} />}
      />
    </>
  );
}
