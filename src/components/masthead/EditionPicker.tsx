"use client";

import { useRouter } from "next/navigation";
import type { Edition } from "@/lib/db/schema";

interface Props {
  currentDate: string;
  editions: Edition[];
}

export function EditionPicker({ currentDate, editions }: Props) {
  const router = useRouter();
  if (editions.length <= 1) return null;
  return (
    <select
      value={currentDate}
      onChange={(e) => router.push(`/edition/${e.target.value}`)}
      className="text-xs border border-gray-300 dark:border-gray-700 bg-transparent rounded px-2 py-1 text-gray-600 dark:text-gray-400"
    >
      {editions.map((ed) => (
        <option key={ed.date} value={ed.date}>
          {ed.date}
        </option>
      ))}
    </select>
  );
}
