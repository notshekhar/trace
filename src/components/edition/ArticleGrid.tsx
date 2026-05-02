import { ArticleCard } from "./ArticleCard";
import type { Article } from "@/lib/db/schema";

interface Props {
  articles: Article[];
  columns?: 2 | 3 | 4;
}

const GRID_CLASSES = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function ArticleGrid({ articles, columns = 3 }: Props) {
  if (articles.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">No articles yet.</p>;
  }
  return (
    <div className={`grid ${GRID_CLASSES[columns]} gap-6`}>
      {articles.map((article, i) => (
        <ArticleCard key={article.id} article={article} priority={i === 0} />
      ))}
    </div>
  );
}
