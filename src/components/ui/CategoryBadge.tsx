import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/types";
import type { Category } from "@/types";

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className={`inline-block text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${CATEGORY_COLORS[category]}`}>
      {CATEGORY_LABELS[category]}
    </span>
  );
}
