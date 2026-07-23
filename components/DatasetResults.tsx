"use client";

import type { CkanPackage } from "@/lib/types";

export interface DatasetResultsProps {
  packages: CkanPackage[] | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  selectedId: string | null;
  onSelect: (pkg: CkanPackage) => void;
  onRetry: () => void;
}

function summarize(notes: string | null): string {
  if (!notes) {
    return "No description available.";
  }
  const flattened = notes.replace(/\s+/g, " ").trim();
  return flattened.length > 160 ? `${flattened.slice(0, 160)}…` : flattened;
}

function statusMessage(
  props: Pick<DatasetResultsProps, "loading" | "error" | "isEmpty" | "packages">,
): string {
  if (props.loading) {
    return "Searching…";
  }
  if (props.error) {
    return props.error;
  }
  if (props.isEmpty) {
    return "No datasets match your search.";
  }
  if (props.packages && props.packages.length > 0) {
    return `${props.packages.length} dataset${props.packages.length === 1 ? "" : "s"} found.`;
  }
  return "";
}

export default function DatasetResults({
  packages,
  loading,
  error,
  isEmpty,
  selectedId,
  onSelect,
  onRetry,
}: DatasetResultsProps) {
  const hasSearched = loading || error !== null || packages !== null;

  return (
    <div className="flex flex-col gap-4">
      {/* Persistent live region so screen readers reliably announce state
          changes; kept mounted at all times rather than conditionally, since
          a region that appears and disappears isn't reliably announced. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage({ loading, error, isEmpty, packages })}
      </p>

      {!hasSearched && (
        <p className="text-slate-600 dark:text-slate-400">
          Search for a dataset to get started.
        </p>
      )}

      {loading && <p className="text-slate-600 dark:text-slate-400">Searching…</p>}

      {!loading && error && (
        <div className="rounded-md border border-red-300 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
          <p>{error}</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 rounded-md border border-red-700 px-3 py-1.5 font-medium text-red-800 hover:bg-red-100 dark:border-red-500 dark:text-red-300 dark:hover:bg-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && isEmpty && (
        <p className="text-slate-600 dark:text-slate-400">
          No datasets match your search.
        </p>
      )}

      {!loading && !error && packages && packages.length > 0 && (
        <ul className="flex flex-col gap-2">
          {packages.map((pkg) => {
            const isSelected = pkg.id === selectedId;
            return (
              <li key={pkg.id}>
                <button
                  type="button"
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => onSelect(pkg)}
                  className={`w-full rounded-md border p-3 text-left ${
                    isSelected
                      ? "border-blue-700 bg-blue-50 dark:border-blue-400 dark:bg-blue-950"
                      : "border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="block font-medium text-slate-900 dark:text-slate-100">
                    {isSelected && <span aria-hidden="true">✓ </span>}
                    {pkg.title || pkg.name}
                  </span>
                  <span className="mt-1 block text-sm text-slate-600 dark:text-slate-400">
                    {summarize(pkg.notes)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
