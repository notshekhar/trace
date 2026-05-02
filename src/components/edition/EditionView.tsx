import { PageShell } from "@/components/layout/PageShell";
import { EditionHeader } from "@/components/edition/EditionHeader";
import { DateNav } from "@/components/edition/DateNav";
import { ArticleEntry } from "@/components/edition/ArticleEntry";
import { TrendingSidebar } from "@/components/edition/TrendingSidebar";
import { HotLinks } from "@/components/edition/HotLinks";
import { ArchiveCta } from "@/components/edition/ArchiveCta";
import {
  getArticlesByEdition,
  getNeighborEditions,
  getTrendingForEdition,
  getHotLinks,
} from "@/lib/db/queries";

interface Props {
  date: string;
}

export async function EditionView({ date }: Props) {
  const [allArticles, neighbors, trending, hotLinks] = await Promise.all([
    getArticlesByEdition(date),
    getNeighborEditions(date),
    getTrendingForEdition(date, 8),
    getHotLinks(date, "hackernews", 10),
  ]);

  const hasNeighbors = !!neighbors.prev || !!neighbors.next;

  return (
    <PageShell
      left={<HotLinks links={hotLinks} title="Hot on HN" />}
      aside={<TrendingSidebar articles={trending} title="Trending" />}
    >
        <EditionHeader date={date} articleCount={allArticles.length} />

        {hasNeighbors && (
          <DateNav
            prevDate={neighbors.prev?.date ?? null}
            nextDate={neighbors.next?.date ?? null}
          />
        )}

        <div className={hasNeighbors ? "mt-2" : "mt-8"}>
          {allArticles.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif-display text-[20px] italic text-muted leading-snug">
                The press is quiet.
              </p>
              <p className="mt-2 text-[13px] text-subtle">
                No stories have been filed for this edition yet.
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {allArticles.map((article, i) => (
                <div key={article.id}>
                  {i > 0 && <hr className="my-10 border-0 border-t border-rule" />}
                  <ArticleEntry
                    article={article}
                    variant={i === 0 ? "lead" : "next"}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

      <ArchiveCta />
    </PageShell>
  );
}
