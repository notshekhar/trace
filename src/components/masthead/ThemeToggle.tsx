"use client";

import { useUiStore } from "@/store/uiStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useUiStore();
  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className="text-xs border border-gray-300 dark:border-gray-700 px-2.5 py-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400"
    >
      {theme === "light" ? "🌙" : "☀️"}
    </button>
  );
}
