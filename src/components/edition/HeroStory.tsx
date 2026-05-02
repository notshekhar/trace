import Image from "next/image";
import Link from "next/link";
import { SourceTag } from "@/components/ui/SourceTag";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import type { Article } from "@/lib/db/schema";
import type { Category } from "@/types";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

export function HeroStory({ article }: { article: Article }) {
  return (
    <Link href={`/article/${article.id}`} className="group block">
      <article className="flex flex-col gap-3">
        {article.imageUrl && (
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              priority
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 1024px) 100vw, 65vw"
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <SourceTag source={article.source} time={formatTime(article.scrapedAt)} />
          <CategoryBadge category={article.category as Category} />
        </div>
        <h2 className="font-bold text-2xl md:text-3xl leading-tight group-hover:text-accent transition-colors" style={{ fontFamily: "var(--font-playfair-var), Georgia, serif" }}>
          {article.title}
        </h2>
        {article.summary && (
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
            {article.summary}
          </p>
        )}
      </article>
    </Link>
  );
}
