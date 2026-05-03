"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Props {
  /** Where to go if there's no in-app history (deep link, fresh tab, etc.). */
  fallbackHref: string;
  /** Suffix used when we know the destination, e.g. "today" or "May 3, 2026". */
  fallbackLabel: string;
}

/**
 * Back nav for article detail. Prefers `router.back()` so the previous feed
 * (and its scroll position) is restored from Next's client cache. Falls back
 * to a hard navigation when this is the first entry in history.
 */
export function BackButton({ fallbackHref, fallbackLabel }: Props) {
  const router = useRouter();
  // `window.history.length > 1` only changes after mount; default to assuming
  // there IS history so SSR matches the most common case (in-app nav).
  const [hasHistory, setHasHistory] = useState(true);

  useEffect(() => {
    setHasHistory(window.history.length > 1);
  }, []);

  const label = hasHistory ? "Back" : `Back to ${fallbackLabel}`;

  return (
    <button
      type="button"
      onClick={() => {
        if (typeof window !== "undefined" && window.history.length > 1) {
          router.back();
        } else {
          router.push(fallbackHref);
        }
      }}
      className="inline-flex items-center gap-1.5 text-[12px] text-muted hover:text-foreground transition-colors cursor-pointer"
    >
      <span aria-hidden>←</span> {label}
    </button>
  );
}
