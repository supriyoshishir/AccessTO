"use client";

import type { Place } from "@/lib/types";

export interface ResultsListProps {
  places: Place[] | null;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (place: Place) => void;
}

function statusMessage(
  props: Pick<ResultsListProps, "loading" | "error" | "places">,
): string {
  if (props.loading) {
    return "Loading records…";
  }
  if (props.error) {
    return props.error;
  }
  if (props.places && props.places.length === 0) {
    return "No location records found for this dataset.";
  }
  if (props.places && props.places.length > 0) {
    return `${props.places.length} record${props.places.length === 1 ? "" : "s"} found.`;
  }
  return "";
}

export default function ResultsList({
  places,
  loading,
  error,
  selectedId,
  onSelect,
}: ResultsListProps) {
  const hasLoaded = loading || error !== null || places !== null;

  return (
    <div className="flex flex-col gap-4">
      {/* Persistent live region — see the same pattern in DatasetResults. */}
      <p aria-live="polite" aria-atomic="true" className="sr-only">
        {statusMessage({ loading, error, places })}
      </p>

      {!hasLoaded && (
        <p className="text-slate-600">Select a dataset above to see its records.</p>
      )}

      {loading && <p className="text-slate-600">Loading records…</p>}

      {!loading && error && (
        <p className="rounded-md border border-red-300 bg-red-50 p-4 text-red-900">
          {error}
        </p>
      )}

      {!loading && !error && places && places.length === 0 && (
        <p className="text-slate-600">No location records found for this dataset.</p>
      )}

      {!loading && !error && places && places.length > 0 && (
        <ul className="flex flex-col gap-2">
          {places.map((place) => {
            const isSelected = place.id === selectedId;
            const locationUnavailable = place.lat === null || place.lng === null;
            return (
              <li key={place.id}>
                <button
                  type="button"
                  aria-current={isSelected ? "true" : undefined}
                  onClick={() => onSelect(place)}
                  className={`w-full rounded-md border p-3 text-left ${
                    isSelected
                      ? "border-blue-700 bg-blue-50"
                      : "border-slate-200 bg-white hover:bg-slate-50"
                  }`}
                >
                  <span className="block font-medium text-slate-900">
                    {isSelected && <span aria-hidden="true">✓ </span>}
                    {place.name}
                  </span>
                  {locationUnavailable && (
                    <span className="mt-1 block text-sm text-slate-600">
                      Location unavailable
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
