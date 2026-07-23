"use client";

import { useMemo, useState } from "react";
import SearchBar from "@/components/SearchBar";
import DatasetResults from "@/components/DatasetResults";
import ResultsList from "@/components/ResultsList";
import DetailPanel from "@/components/DetailPanel";
import MapView from "@/components/MapView";
import FilterPanel, { detectCategoricalField } from "@/components/FilterPanel";
import { useDatasetSearch } from "@/hooks/useDatasetSearch";
import { useDatasetRecords } from "@/hooks/useDatasetRecords";
import type { CkanPackage, Place } from "@/lib/types";

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
          <MapView
            places={filteredPlaces}
            selectedId={selectedPlaceId}
            onSelect={handleSelectPlace}
          />
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
