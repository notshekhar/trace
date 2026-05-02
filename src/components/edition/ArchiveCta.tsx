import Link from "next/link";

export function ArchiveCta() {
  return (
    <div className="mt-20 pt-10 border-t border-rule text-center">
      <h3 className="font-serif-display text-[20px] font-medium tracking-[-0.01em] text-foreground">
        Older stories and past days
      </h3>
      <p className="mt-2 text-[13px] text-muted">
        Browse saved daily editions in the public archive.
      </p>
      <Link
        href="/archive"
        className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full border border-rule text-[13px] text-foreground hover:border-foreground/40 hover:bg-surface transition-colors"
      >
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="20" height="5" x="2" y="3" rx="1" />
          <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
          <path d="M10 12h4" />
        </svg>
        Browse past days
      </Link>
    </div>
  );
}
