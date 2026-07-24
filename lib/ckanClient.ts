import { isRecord } from "@/lib/guards";
import type {
  CkanDatastoreSearchResult,
  CkanEnvelope,
  CkanPackage,
  CkanPackageSearchResult,
  DatastoreRecord,
} from "@/lib/types";

const CKAN_BASE_URL = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action";

/**
 * Thrown for any failure talking to CKAN: network errors, non-2xx
 * responses, a response that isn't a valid envelope, or `success: false`.
 * Route handlers catch this and map it to HTTP 502.
 */
export class CkanApiError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "CkanApiError";
  }
}

function isCkanEnvelope(value: unknown): value is CkanEnvelope<unknown> {
  return isRecord(value) && typeof value.success === "boolean" && "result" in value;
}

/**
 * Normalizes `datastore_active`, which the live API has been observed
 * returning as either a real boolean or the string "True"/"False".
 */
export function isDatastoreActive(value: boolean | string): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return value.trim().toLowerCase() === "true";
}

const NETWORK_RETRY_ATTEMPTS = 4;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * The live CKAN host intermittently resets the first connection attempt
 * (observed ECONNRESET on an otherwise healthy endpoint), so a bare network
 * error gets a couple of quick retries before we give up and surface it.
 */
async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= NETWORK_RETRY_ATTEMPTS; attempt++) {
    try {
      return await fetch(url, { next: { revalidate: 3600 } });
    } catch (error) {
      lastError = error;
      if (attempt < NETWORK_RETRY_ATTEMPTS) {
        await delay(200 * attempt);
      }
    }
  }
  throw lastError;
}

async function callCkanAction<T>(
  action: string,
  params: Record<string, string | number>,
): Promise<T> {
  const url = new URL(`${CKAN_BASE_URL}/${action}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, String(value));
  }

  let response: Response;
  try {
    response = await fetchWithRetry(url.toString());
  } catch (cause) {
    throw new CkanApiError(`Network error calling CKAN action "${action}"`, { cause });
  }

  if (!response.ok) {
    throw new CkanApiError(
      `CKAN action "${action}" responded with HTTP ${response.status}`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (cause) {
    throw new CkanApiError(`CKAN action "${action}" returned invalid JSON`, { cause });
  }

  if (!isCkanEnvelope(payload)) {
    throw new CkanApiError(
      `CKAN action "${action}" returned an unexpected response shape`,
    );
  }
  if (!payload.success) {
    throw new CkanApiError(`CKAN action "${action}" reported failure`);
  }

  return payload.result as T;
}

/** Searches datasets by keyword. Mirrors CKAN's `package_search` action. */
export async function searchPackages(q: string, rows = 10): Promise<CkanPackage[]> {
  const result = await callCkanAction<CkanPackageSearchResult>("package_search", {
    q,
    rows,
  });
  return result.results;
}

/** Fetches a single dataset's full metadata, including its resources. */
export async function showPackage(id: string): Promise<CkanPackage> {
  return callCkanAction<CkanPackage>("package_show", { id });
}

/** Fetches rows from a datastore-active resource. */
export async function searchDatastore(
  resourceId: string,
  limit = 100,
): Promise<DatastoreRecord[]> {
  const result = await callCkanAction<CkanDatastoreSearchResult>("datastore_search", {
    resource_id: resourceId,
    limit,
  });
  return result.records;
}
