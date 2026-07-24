import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import SkipLink from "@/components/SkipLink";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { ThemeProvider } from "@/context/ThemeContext";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AccessTO — Accessible Toronto Open Data Explorer",
  description:
    "Browse and map open datasets published by the City of Toronto, with an accessibility-first, keyboard- and screen-reader-friendly interface.",
};

// Sets data-theme on <html> before hydration, from the same storage key
// ThemeContext reads/writes — avoids a flash of the wrong theme on load.
// Static except for interpolating the shared storage-key constant, so it's
// safe as inline JS (no user input reaches it). Light is the default for
// first-time visitors (no stored preference) regardless of OS setting.
const themeInitScript = `(function() {
  try {
    var stored = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var theme = stored === "light" || stored === "dark" ? stored : "light";
    document.documentElement.setAttribute("data-theme", theme);
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-full flex-col bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <SkipLink />
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
