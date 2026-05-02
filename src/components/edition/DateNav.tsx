import Link from "next/link";

interface Props {
  prevDate: string | null;
  nextDate: string | null;
}

function shortDate(date: string): string {
  return new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

const pillBase =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rule text-[12px] text-muted transition-colors";

export function DateNav({ prevDate, nextDate }: Props) {
  return (
    <div className="flex items-center justify-center gap-2 pt-6 pb-2">
      {prevDate && (
        <Link
          href={`/edition/${prevDate}`}
          className={`${pillBase} hover:text-foreground hover:border-foreground/40`}
        >
          <span aria-hidden>←</span>
          {shortDate(prevDate)}
        </Link>
      )}

      {nextDate && (
        <Link
          href={`/edition/${nextDate}`}
          className={`${pillBase} hover:text-foreground hover:border-foreground/40`}
        >
          {shortDate(nextDate)}
          <span aria-hidden>→</span>
        </Link>
      )}
    </div>
  );
}
