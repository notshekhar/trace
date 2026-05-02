import { notFound } from "next/navigation";
import { PageShell } from "@/components/layout/PageShell";
import { EditionHeader } from "@/components/edition/EditionHeader";
import { DateNav } from "@/components/edition/DateNav";
import { ArticleEntry } from "@/components/edition/ArticleEntry";
import { TrendingSidebar } from "@/components/edition/TrendingSidebar";
import { HotLinks } from "@/components/edition/HotLinks";
import { ArchiveCta } from "@/components/edition/ArchiveCta";
import { getEdition, getToday } from "@/lib/api";

interface Props {
  date: string;
  isToday?: boolean;
}

export async function EditionView({ date, isToday = false }: Props) {
  const payload = isToday ? await getToday() : await getEdition(date);
  if (!payload) notFound();

  const { articles, trending, hotLinks, neighbors } = payload;
  const hasNeighbors = !!neighbors.prev || !!neighbors.next;

  return (
    <PageShell
      left={<HotLinks links={hotLinks} title="Hot on HN" />}
      aside={<TrendingSidebar articles={trending} title="Trending" />}
    >
      <EditionHeader date={payload.date} articleCount={articles.length} />

      {hasNeighbors && (
        <DateNav prevDate={neighbors.prev} nextDate={neighbors.next} />
      )}

      <div className={hasNeighbors ? "mt-2" : "mt-8"}>
        {articles.length === 0 ? (
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
            {articles.map((article, i) => (
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
