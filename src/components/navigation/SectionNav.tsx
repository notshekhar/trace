"use client";

import Link from "next/link";
import { CATEGORIES, CATEGORY_LABELS } from "@/types";
import type { Category } from "@/types";

interface Props {
  editionDate: string;
  activeSection: Category | "all";
}

export function SectionNav({ editionDate, activeSection }: Props) {
  const tabs: Array<{ key: Category | "all"; label: string }> = [
    { key: "all", label: "All" },
    ...CATEGORIES.map((c) => ({ key: c as Category | "all", label: CATEGORY_LABELS[c as Category] })),
  ];

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 mb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-0 overflow-x-auto">
          {tabs.map(({ key, label }) => {
            const href = key === "all"
              ? `/edition/${editionDate}`
              : `/edition/${editionDate}/${key}`;
            const isActive = activeSection === key;
            return (
              <Link
                key={key}
                href={href}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  isActive
                    ? "border-foreground text-foreground dark:border-foreground dark:text-foreground font-semibold"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
