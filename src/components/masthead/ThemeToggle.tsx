"use client";

import { useUiStore } from "@/store/uiStore";

export function ThemeToggle() {
  const { theme, toggleTheme } = useUiStore();
  const next = theme === "light" ? "Dark" : "Light";
  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${next.toLowerCase()} theme`}
      className="text-[11px] tracking-[0.18em] uppercase text-subtle hover:text-foreground transition-colors"
    >
      {next}
    </button>
  );
}
