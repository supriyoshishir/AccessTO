import ThemeToggle from "@/components/ThemeToggle";

export default function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <span className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            AccessTO
          </span>
          <span className="ml-2 text-sm text-slate-600 dark:text-slate-400">
            Accessible Toronto Open Data Explorer
          </span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
