import Link from "next/link";
import { ArticleCard } from "./ArticleCard";
import { CATEGORY_LABELS } from "@/types";
import type { Article } from "@/lib/db/schema";
import type { Category } from "@/types";

interface Props {
  category: Category;
  articles: Article[];
  editionDate: string;
}

export function SectionStrip({ category, articles, editionDate }: Props) {
  if (articles.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-bold text-sm uppercase tracking-widest text-gray-700 dark:text-gray-300" style={{ fontFamily: "var(--font-inter-var), system-ui, sans-serif" }}>
          {CATEGORY_LABELS[category]}
        </h2>
        <Link href={`/edition/${editionDate}/${category}`} className="text-xs text-accent hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {articles.slice(0, 4).map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </section>
  );
}
