import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { getArchive } from "@/lib/api";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Archive — Trace",
  description: "Every published daily edition of Trace.",
};

function monthKey(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

function longDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default async function ArchivePage() {
  const editions = await getArchive();

  const grouped: Record<string, typeof editions> = {};
  for (const ed of editions) {
    const key = monthKey(ed.date);
    grouped[key] ??= [];
    grouped[key].push(ed);
  }

  return (
    <PageShell>
        <div className="text-center pb-12">
          <p className="eyebrow mb-3">Trace</p>
          <h1 className="font-serif-display font-medium text-[34px] sm:text-[42px] leading-[1.05] tracking-[-0.015em] text-foreground">
            Daily archive index
          </h1>
          <p className="mt-3 text-[13px] text-muted">
            Every public daily edition, newest first. Open any date for the full read.
          </p>
        </div>

        {editions.length === 0 ? (
          <p className="text-center text-[13px] text-subtle py-16">
            No editions published yet.
          </p>
        ) : (
          <div className="flex flex-col gap-12">
            {Object.entries(grouped).map(([month, eds]) => (
              <section key={month}>
                <p className="eyebrow mb-2">{month}</p>
                <ul className="flex flex-col">
                  {eds.map((ed) => (
                    <li key={ed.date} className="border-t border-rule last:border-b">
                      <Link
                        href={`/edition/${ed.date}`}
                        className="group grid grid-cols-[1fr_auto] items-baseline gap-6 py-5"
                      >
                        <div className="min-w-0">
                          <p className="text-[15px] font-semibold text-foreground group-hover:text-muted transition-colors">
                            {longDate(ed.date)}
                          </p>
                          {ed.leadTitle && (
                            <p className="mt-1 text-[13.5px] text-subtle line-clamp-1">
                              {ed.leadTitle}
                            </p>
                          )}
                        </div>
                        <span className="text-[11.5px] text-subtle tabular-nums tracking-wide whitespace-nowrap">
                          {ed.articleCount} {ed.articleCount === 1 ? "story" : "stories"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
    </PageShell>
  );
}
