/**
 * Not "use client" — imported by app/layout.tsx (a server component) for
 * its anti-flash inline script, and by context/ThemeContext.tsx (a client
 * component). Plain constants exported from a "use client" module resolve
 * to `undefined` when imported into a server component (only component
 * exports survive that boundary as client references), so this lives in
 * its own directive-free module instead.
 */
export const THEME_STORAGE_KEY = "accessto-theme";
