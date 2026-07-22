"use client";

import { useState } from "react";
import SearchBar from "@/components/SearchBar";
import DatasetResults from "@/components/DatasetResults";
import { useDatasetSearch } from "@/hooks/useDatasetSearch";
import type { CkanPackage } from "@/lib/types";

export default function Home() {
  const { data, loading, error, isEmpty, search, retry } = useDatasetSearch();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSelect(pkg: CkanPackage) {
    setSelectedId(pkg.id);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold text-slate-900">
        Explore Toronto&rsquo;s open data
      </h1>
      <p className="max-w-2xl text-slate-700">
        Search datasets published by the City of Toronto and browse the results as an
        accessible list, kept in sync with an interactive map.
      </p>
      <SearchBar onSearch={search} />
      <DatasetResults
        packages={data}
        loading={loading}
        error={error}
        isEmpty={isEmpty}
        selectedId={selectedId}
        onSelect={handleSelect}
        onRetry={retry}
      />
    </div>
  );
}
