import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";
import { EditionPicker } from "./EditionPicker";
import type { Edition } from "@/lib/db/schema";

interface Props {
  currentDate: string;
  editions: Edition[];
  articleCount?: number;
}

export function Masthead({ currentDate, editions, articleCount }: Props) {
  const displayDate = new Date(currentDate + "T00:00:00Z").toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 mb-0">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Left: theme toggle */}
        <ThemeToggle />

        {/* Center: logo + date */}
        <div className="flex flex-col items-center gap-1">
          <Link href="/" className="flex items-center gap-1.5 group">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
            </svg>
            <span className="text-sm font-semibold tracking-widest uppercase text-gray-700 dark:text-gray-300 group-hover:text-accent transition-colors">
              Trace
            </span>
          </Link>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            {displayDate}
            {articleCount ? ` · ${articleCount} stories` : ""}
          </p>
        </div>

        {/* Right: edition picker */}
        <EditionPicker currentDate={currentDate} editions={editions} />
      </div>
    </header>
  );
}
