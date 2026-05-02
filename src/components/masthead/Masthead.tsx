import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

interface Props {
  /** Tailwind max-width class so the header aligns with the page below it. */
  maxWidthClassName?: string;
}

export function Masthead({ maxWidthClassName = "max-w-[680px]" }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className={`${maxWidthClassName} mx-auto px-5 h-14 grid grid-cols-3 items-center`}>
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-1.5 group">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-subtle group-hover:text-foreground transition-colors"
            >
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M12 2a7 7 0 0 0-4 12.7c.7.6 1 1.5 1 2.3v1h6v-1c0-.8.3-1.7 1-2.3A7 7 0 0 0 12 2Z" />
            </svg>
            <span className="text-[11px] font-medium tracking-[0.22em] uppercase text-foreground">
              Trace
            </span>
          </Link>
        </div>

        <nav className="flex items-center justify-center gap-5 text-[12px] text-muted">
          <Link href="/" className="hover:text-foreground transition-colors">
            Today
          </Link>
          <Link href="/archive" className="hover:text-foreground transition-colors">
            Archive
          </Link>
        </nav>

        <div className="flex items-center justify-end">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
