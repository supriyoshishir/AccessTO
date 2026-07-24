"use client";

import { useEffect, useState } from "react";
import { isRecord } from "@/lib/guards";
import { normalizeRecords } from "@/lib/normalizeRecords";
import type { DatastoreRecord, Place } from "@/lib/types";

export interface UseDatasetRecordsResult {
  places: Place[] | null;
  loading: boolean;
  error: string | null;
}

interface RecordsSuccessBody {
  resourceId: string;
  records: DatastoreRecord[];
}

interface RecordsErrorBody {
  error: string;
}

interface FetchResult {
  forId: string;
  places: Place[] | null;
  error: string | null;
}

const GENERIC_ERROR_MESSAGE =
  "Something went wrong while loading records. Please try again.";

function isRecordsSuccessBody(value: unknown): value is RecordsSuccessBody {
  return isRecord(value) && Array.isArray(value.records);
}

function isRecordsErrorBody(value: unknown): value is RecordsErrorBody {
  return isRecord(value) && typeof value.error === "string";
}

/**
 * Fetches and normalizes a dataset's geographic records. Auto-fetches
 * whenever `packageId` changes; pass `null` when nothing is selected yet.
 */
export function useDatasetRecords(packageId: string | null): UseDatasetRecordsResult {
  // `loading` is derived by comparing `packageId` against which id the
  // stored result belongs to, rather than a separate setState call at the
  // top of the effect — keeps every state update inside the fetch's async
  // callbacks, where it belongs.
  const [result, setResult] = useState<FetchResult | null>(null);

  useEffect(() => {
    if (!packageId) {
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    fetch(`/api/ckan/records?id=${encodeURIComponent(packageId)}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const body: unknown = await response.json().catch(() => null);
        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setResult({
            forId: packageId,
            places: null,
            error: isRecordsErrorBody(body) ? body.error : GENERIC_ERROR_MESSAGE,
          });
          return;
        }

        if (!isRecordsSuccessBody(body)) {
          setResult({ forId: packageId, places: null, error: GENERIC_ERROR_MESSAGE });
          return;
        }

        setResult({
          forId: packageId,
          places: normalizeRecords(packageId, body.records),
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (cancelled || (cause instanceof DOMException && cause.name === "AbortError")) {
          return;
        }
        setResult({ forId: packageId, places: null, error: GENERIC_ERROR_MESSAGE });
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [packageId]);

  if (!packageId) {
    return { places: null, loading: false, error: null };
  }

  const loading = result === null || result.forId !== packageId;
  return {
    places: loading ? null : result.places,
    loading,
    error: loading ? null : result.error,
  };
}
