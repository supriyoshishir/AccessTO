"use client";

import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  /** False until the client snapshot is confirmed — see ThemeToggle. */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * The theme is treated as external state living in the DOM attribute
 * (`data-theme`, set pre-hydration by the inline script in layout.tsx) and
 * localStorage — `useSyncExternalStore` reconciles the server's arbitrary
 * guess against the real client value right after hydration, without an
 * effect-driven setState render (see react-hooks/set-state-in-effect).
 */
const listeners = new Set<() => void>();

function getThemeSnapshot(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";
}

function getThemeServerSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function writeTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable (private browsing, etc.) — theme still
    // applies for this session via the DOM attribute.
  }
  listeners.forEach((listener) => listener());
}

function subscribeMounted(listener: () => void): () => void {
  // Fires once, immediately, so useSyncExternalStore re-renders past the
  // server snapshot as soon as the client has actually mounted.
  const id = requestAnimationFrame(listener);
  return () => cancelAnimationFrame(id);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  );
  const mounted = useSyncExternalStore(
    subscribeMounted,
    () => true,
    () => false,
  );

  function toggleTheme() {
    writeTheme(theme === "light" ? "dark" : "light");
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
