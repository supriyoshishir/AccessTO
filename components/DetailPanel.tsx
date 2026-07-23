"use client";

import { useEffect, useRef } from "react";
import type { Place } from "@/lib/types";

export interface DetailPanelProps {
  place: Place | null;
}

function prettifyLabel(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }
  return JSON.stringify(value);
}

/**
 * Shows the selected Place's fields and moves focus to its heading (FR-5.5)
 * so keyboard/screen-reader users know a selection took effect — this is
 * the standard master-detail pattern (WAI-ARIA APG), not a live region,
 * since the user directly initiated the change and wants to land on it.
 */
export default function DetailPanel({ place }: DetailPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (place) {
      headingRef.current?.focus();
    }
  }, [place]);

  if (!place) {
    return (
      <p className="text-slate-600 dark:text-slate-400">
        Select a record to see its details.
      </p>
    );
  }

  const fieldEntries = Object.entries(place.fields);

  return (
    <section
      aria-labelledby="detail-panel-heading"
      className="rounded-md border border-slate-200 p-4 dark:border-slate-700"
    >
      <h2
        id="detail-panel-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-xl font-semibold text-slate-900 dark:text-slate-100"
      >
        {place.name}
      </h2>
      {(place.lat === null || place.lng === null) && (
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Location unavailable
        </p>
      )}
      {fieldEntries.length > 0 && (
        <dl className="mt-4 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-2 text-sm">
          {fieldEntries.map(([key, value]) => (
            <div key={key} className="contents">
              <dt className="font-medium text-slate-700 dark:text-slate-300">
                {prettifyLabel(key)}
              </dt>
              <dd className="text-slate-900 dark:text-slate-100">
                {formatFieldValue(value)}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}
