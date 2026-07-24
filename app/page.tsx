"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import SearchBar from "@/components/SearchBar";
import DatasetResults from "@/components/DatasetResults";
import ResultsList from "@/components/ResultsList";
import DetailPanel from "@/components/DetailPanel";
import FilterPanel, { detectCategoricalField } from "@/components/FilterPanel";
import { useDatasetSearch } from "@/hooks/useDatasetSearch";
import { useDatasetRecords } from "@/hooks/useDatasetRecords";
import type { CkanPackage, Place } from "@/lib/types";

// @vis.gl/react-google-maps pulls in Google's own Maps JS API script the
// instant it mounts — confirmed via a real network trace: that request
// fires on every page load, before any search, because MapView was
// rendered unconditionally. Splitting it into its own chunk keeps that
// weight off the critical path for the primary, guaranteed-accessible
// list (NFR-PERF-1). The loading fallback matches MapView's own layout
// (same height, same summary line) so there's no layout shift once it
// swaps in.
const MapView = dynamic(() => import("@/components/MapView"), {
  loading: () => (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-600 dark:text-slate-400">Loading map…</p>
      <div className="h-96 animate-pulse rounded-md border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800" />
    </div>
  ),
});

export default function Home() {
  const { data, loading, error, isEmpty, search, retry } = useDatasetSearch();
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [filterValue, setFilterValue] = useState<string | null>(null);

  const {
    places,
    loading: recordsLoading,
    error: recordsError,
  } = useDatasetRecords(selectedPackageId);

  function handleSelectPackage(pkg: CkanPackage) {
    setSelectedPackageId(pkg.id);
    // A previously selected record/filter belongs to the old dataset's records.
    setSelectedPlaceId(null);
    setFilterValue(null);
  }

  function handleSelectPlace(place: Place) {
    setSelectedPlaceId(place.id);
  }

  function handleFilterChange(value: string | null) {
    setFilterValue(value);
    // The current selection may no longer be in the filtered results.
    setSelectedPlaceId(null);
  }

  const filterField = useMemo(() => detectCategoricalField(places ?? []), [places]);

  const filteredPlaces = useMemo(() => {
    if (!places || !filterValue || !filterField) {
      return places;
    }
    return places.filter(
      (place) => String(place.fields[filterField.field] ?? "").trim() === filterValue,
    );
  }, [places, filterValue, filterField]);

  const selectedPlace =
    filteredPlaces?.find((place) => place.id === selectedPlaceId) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
        Explore Toronto&rsquo;s open data
      </h1>
      <p className="max-w-2xl text-slate-700 dark:text-slate-300">
        Search datasets published by the City of Toronto and browse the results as an
        accessible list, kept in sync with an interactive map.
      </p>
      <SearchBar onSearch={search} />
      <DatasetResults
        packages={data}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        selectedId={selectedPackageId}
        onSelect={handleSelectPackage}
        onRetry={retry}
      />
      {places && places.length > 0 && (
        <FilterPanel
          places={places}
          selectedValue={filterValue}
          onChange={handleFilterChange}
        />
      )}
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="lg:w-1/2">
          {selectedPackageId ? (
            <MapView
              places={filteredPlaces}
              selectedId={selectedPlaceId}
              onSelect={handleSelectPlace}
            />
          ) : (
            // Mounting MapView is what triggers Google's Maps script load
            // (confirmed via network trace) — deferred until a dataset is
            // actually selected, not merely on page load, so a visit that
            // never gets that far never pays that cost. Text and layout
            // match MapView's own idle rendering so there's no shift once
            // it swaps in.
            <div className="flex flex-col gap-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Map showing 0 locations; full list below.
              </p>
              <div className="flex h-96 items-center justify-center rounded-md border border-dashed border-slate-300 p-6 text-center text-slate-600 dark:border-slate-600 dark:text-slate-400">
                Select a dataset above to see it on the map.
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-6 lg:w-1/2">
          <ResultsList
            places={filteredPlaces}
            loading={recordsLoading}
            error={recordsError}
            selectedId={selectedPlaceId}
            onSelect={handleSelectPlace}
          />
          <DetailPanel place={selectedPlace} />
        </div>
      </div>
    </div>
  );
}
