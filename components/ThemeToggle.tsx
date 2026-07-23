"use client";

import { useTheme } from "@/context/ThemeContext";

/**
 * Renders nothing until mounted (see ThemeContext) — the real theme isn't
 * known during server rendering, and rendering a guessed label first would
 * either mismatch hydration or flicker once corrected.
 */
export default function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      <span aria-hidden="true">{isDark ? "🌙" : "☀️"}</span>{" "}
      {isDark ? "Switch to light mode" : "Switch to dark mode"}
    </button>
  );
}
