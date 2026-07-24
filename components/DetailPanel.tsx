"use client";

import { useEffect, useRef } from "react";
import { prettifyLabel } from "@/lib/formatLabel";
import type { Place } from "@/lib/types";

export interface DetailPanelProps {
  place: Place | null;
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
    if (!place) {
      return;
    }
    const heading = headingRef.current;
    if (!heading) {
      return;
    }
    // The browser's default focus-triggered scroll only moves the minimum
    // distance needed, which can leave the heading pinned at the very
    // bottom edge of the viewport (reported as "jumps to the bottom of the
    // page"). Take control instead: skip that default, then deliberately
    // scroll the panel to the top of the viewport — a predictable,
    // comfortable landing spot with room to read the fields below it.
    heading.focus({ preventScroll: true });
    // matchMedia isn't implemented in every environment (notably jsdom,
    // used by this project's component tests) — default to treating it as
    // "prefers reduced motion" (the safer fallback) rather than throwing.
    const prefersReducedMotion =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
        : true;
    // scrollIntoView isn't implemented in every environment either (also
    // jsdom) — same defensive guard.
    if (typeof heading.scrollIntoView === "function") {
      heading.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "start",
      });
    }
  }, [place]);

  if (!place) {
    return (
      <p className="sticky top-4 rounded-md border border-dashed border-slate-300 p-6 text-center text-slate-600 dark:border-slate-600 dark:text-slate-400">
        Select a record to see its details.
      </p>
    );
  }

  const fieldEntries = Object.entries(place.fields);

  return (
    <section
      aria-labelledby="detail-panel-heading"
      className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto rounded-md border border-slate-200 p-4 dark:border-slate-700"
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
