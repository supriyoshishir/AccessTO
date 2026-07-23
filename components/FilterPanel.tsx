"use client";

import { useId, useMemo } from "react";
import type { Place } from "@/lib/types";

export interface CategoricalFieldInfo {
  field: string;
  values: string[];
}

const MIN_DISTINCT_VALUES = 2;
// Datasets like the TPL library-branch one have many binary 0/1 amenity
// flags (KidsStop, CLC, DIH, ...). Those technically qualify as
// "categorical" but aren't useful filters, so a field needs at least 3
// distinct values to be preferred; a 2-value field is only used if nothing
// richer is available.
const PREFERRED_MIN_DISTINCT_VALUES = 3;
const MAX_DISTINCT_VALUES = 40;
const MAX_AVERAGE_VALUE_LENGTH = 40;

function prettifyLabel(key: string): string {
  const spaced = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * Datasets vary in shape, so rather than hardcoding a field name (e.g.
 * "ward"), this scans the current records for a field that behaves like a
 * category: a handful of repeated values, not free text like an address.
 * Picks the field with the fewest distinct values among the candidates —
 * the tightest, most "type/status"-like grouping (FR-7.1).
 */
export function detectCategoricalField(places: Place[]): CategoricalFieldInfo | null {
  if (places.length === 0) {
    return null;
  }

  const valuesByField = new Map<string, Set<string>>();
  const totalLengthByField = new Map<string, number>();
  const countByField = new Map<string, number>();

  for (const place of places) {
    for (const [key, raw] of Object.entries(place.fields)) {
      if (
        typeof raw !== "string" &&
        typeof raw !== "number" &&
        typeof raw !== "boolean"
      ) {
        continue;
      }
      const value = String(raw).trim();
      if (value === "") {
        continue;
      }
      if (!valuesByField.has(key)) {
        valuesByField.set(key, new Set());
      }
      valuesByField.get(key)!.add(value);
      totalLengthByField.set(key, (totalLengthByField.get(key) ?? 0) + value.length);
      countByField.set(key, (countByField.get(key) ?? 0) + 1);
    }
  }

  const candidates: CategoricalFieldInfo[] = [];

  for (const [field, valueSet] of valuesByField) {
    const distinctCount = valueSet.size;
    if (distinctCount < MIN_DISTINCT_VALUES || distinctCount > MAX_DISTINCT_VALUES) {
      continue;
    }
    const averageLength = totalLengthByField.get(field)! / countByField.get(field)!;
    if (averageLength > MAX_AVERAGE_VALUE_LENGTH) {
      continue;
    }
    candidates.push({ field, values: [...valueSet].sort((a, b) => a.localeCompare(b)) });
  }

  const pickSmallest = (pool: CategoricalFieldInfo[]): CategoricalFieldInfo | null =>
    pool.reduce<CategoricalFieldInfo | null>(
      (best, candidate) =>
        !best || candidate.values.length < best.values.length ? candidate : best,
      null,
    );

  const rich = candidates.filter((c) => c.values.length >= PREFERRED_MIN_DISTINCT_VALUES);
  return pickSmallest(rich) ?? pickSmallest(candidates);
}

export interface FilterPanelProps {
  places: Place[];
  selectedValue: string | null;
  onChange: (value: string | null) => void;
}

export default function FilterPanel({
  places,
  selectedValue,
  onChange,
}: FilterPanelProps) {
  const selectId = useId();
  const fieldInfo = useMemo(() => detectCategoricalField(places), [places]);

  if (!fieldInfo) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1 sm:max-w-xs">
      <label
        htmlFor={selectId}
        className="text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        Filter by {prettifyLabel(fieldInfo.field)}
      </label>
      <select
        id={selectId}
        value={selectedValue ?? ""}
        onChange={(event) =>
          onChange(event.target.value === "" ? null : event.target.value)
        }
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      >
        <option value="">All</option>
        {fieldInfo.values.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
    </div>
  );
}
