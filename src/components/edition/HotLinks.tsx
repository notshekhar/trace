import type { HotLink } from "@/lib/db/schema";

interface Props {
  links: HotLink[];
  title?: string;
}

function shortHost(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export function HotLinks({ links, title = "Hot on HN" }: Props) {
  if (links.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-5">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="#FF6600"
          stroke="#FF6600"
          strokeWidth="1"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
        <p
          className="text-[11px] font-semibold tracking-[0.18em] uppercase"
          style={{ color: "#FF6600" }}
        >
          {title}
        </p>
      </div>
      <ol className="flex flex-col">
        {links.map((link, i) => (
          <li
            key={link.id}
            className="border-t border-rule first:border-t-0 py-3.5"
          >
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex gap-3"
            >
              <span className="text-[11px] font-medium tabular-nums text-subtle pt-0.5 w-5 shrink-0">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex flex-col gap-1.5">
                <p className="font-serif-display text-[14px] leading-[1.35] tracking-[-0.005em] text-foreground/90 group-hover:text-muted transition-colors line-clamp-3">
                  {link.title}
                </p>
                <div className="flex items-center gap-2 text-[10.5px] text-subtle">
                  <span className="tracking-wide">{shortHost(link.url)}</span>
                  {typeof link.score === "number" && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{link.score} pts</span>
                    </>
                  )}
                  {typeof link.comments === "number" && link.comments > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="tabular-nums">{link.comments}c</span>
                    </>
                  )}
                </div>
              </div>
            </a>
          </li>
        ))}
      </ol>
      {links[0]?.externalId && (
        <p className="mt-5 text-[10.5px] text-subtle/80 tracking-wide">
          via news.ycombinator.com
        </p>
      )}
    </div>
  );
}
