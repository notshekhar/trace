const SOURCE_DISPLAY: Record<string, string> = {
  cnn: "CNN", bbc: "BBC", guardian: "The Guardian", reuters: "Reuters",
  ap: "AP News", techcrunch: "TechCrunch", theverge: "The Verge",
  wired: "Wired", arstechnica: "Ars Technica", dailydev: "daily.dev",
  espn: "ESPN", bbcsport: "BBC Sport", bloomberg: "Bloomberg",
  forbes: "Forbes", politico: "Politico", npr: "NPR",
};

export function SourceTag({ source, time }: { source: string; time?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {SOURCE_DISPLAY[source] ?? source}
      </span>
      {time && (
        <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
      )}
    </div>
  );
}
