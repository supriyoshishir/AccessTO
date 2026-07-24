"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isRecord } from "@/lib/guards";
import type { CkanPackage } from "@/lib/types";

export interface UseDatasetSearchResult {
  data: CkanPackage[] | null;
  loading: boolean;
  error: string | null;
  isEmpty: boolean;
  search: (query: string) => void;
  retry: () => void;
}

interface SearchSuccessBody {
  packages: CkanPackage[];
}

interface SearchErrorBody {
  error: string;
}

const GENERIC_ERROR_MESSAGE = "Something went wrong while searching. Please try again.";

function isSearchSuccessBody(value: unknown): value is SearchSuccessBody {
  return isRecord(value) && Array.isArray(value.packages);
}

function isSearchErrorBody(value: unknown): value is SearchErrorBody {
  return isRecord(value) && typeof value.error === "string";
}

/**
 * Search is submit-driven (FR-3.6): callers only invoke `search` when the
 * user commits a query (e.g. on form submit), not on every keystroke, so no
 * debounce is needed on top.
 */
export function useDatasetSearch(): UseDatasetSearchResult {
  const [data, setData] = useState<CkanPackage[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastQueryRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const runSearch = useCallback((query: string) => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    lastQueryRef.current = trimmed;

    setLoading(true);
    setError(null);

    fetch(`/api/ckan/search?q=${encodeURIComponent(trimmed)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);

        if (!response.ok) {
          setError(isSearchErrorBody(body) ? body.error : GENERIC_ERROR_MESSAGE);
          setData(null);
          return;
        }

        if (!isSearchSuccessBody(body)) {
          setError(GENERIC_ERROR_MESSAGE);
          setData(null);
          return;
        }

        setData(body.packages);
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") {
          return;
        }
        setError(GENERIC_ERROR_MESSAGE);
        setData(null);
      })
      .finally(() => {
        if (abortRef.current === controller) {
          setLoading(false);
        }
      });
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  const retry = useCallback(() => {
    if (lastQueryRef.current) {
      runSearch(lastQueryRef.current);
    }
  }, [runSearch]);

  return {
    data,
    loading,
    error,
    isEmpty: data !== null && data.length === 0 && !loading,
    search: runSearch,
    retry,
  };
}
