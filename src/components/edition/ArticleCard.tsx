import Image from "next/image";
import Link from "next/link";
import { SourceTag } from "@/components/ui/SourceTag";
import type { Article } from "@/lib/db/schema";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

interface Props {
  article: Article;
  priority?: boolean;
}

export function ArticleCard({ article, priority = false }: Props) {
  return (
    <Link href={`/article/${article.id}`} className="group block">
      <article className="flex flex-col gap-2">
        {article.imageUrl && (
          <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        )}
        <SourceTag source={article.source} time={formatTime(article.scrapedAt)} />
        <h3 className="font-playfair font-bold text-base leading-snug group-hover:text-accent transition-colors line-clamp-3" style={{ fontFamily: "var(--font-playfair-var), Georgia, serif" }}>
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
            {article.summary}
          </p>
        )}
      </article>
    </Link>
  );
}
