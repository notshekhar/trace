interface Props {
  date: string;
  articleCount?: number;
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

export function EditionHeader({ date, articleCount }: Props) {
  return (
    <div className="text-center pb-2">
      <p className="eyebrow mb-3">Trace</p>
      <h1 className="font-serif-display font-medium text-[34px] sm:text-[42px] leading-[1.05] tracking-[-0.015em] text-foreground">
        {formatLongDate(date)}
      </h1>
      <p className="mt-3 text-[12.5px] text-subtle tracking-wide">
        Daily edition · {date}
        {typeof articleCount === "number" && articleCount > 0
          ? ` · ${articleCount} ${articleCount === 1 ? "story" : "stories"}`
          : ""}
      </p>
    </div>
  );
}
