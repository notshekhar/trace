export type Category = "tech" | "politics" | "sports" | "business" | "world";

export const CATEGORIES: Category[] = [
  "world", "tech", "politics", "sports", "business",
];

export const CATEGORY_LABELS: Record<Category, string> = {
  world: "World",
  tech: "Tech",
  politics: "Politics",
  sports: "Sports",
  business: "Business",
};

export const CATEGORY_COLORS: Record<Category, string> = {
  world: "text-teal-700 bg-teal-50",
  tech: "text-blue-700 bg-blue-50",
  politics: "text-amber-700 bg-amber-50",
  sports: "text-green-700 bg-green-50",
  business: "text-purple-700 bg-purple-50",
};
