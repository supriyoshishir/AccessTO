/**
 * Envelope every CKAN action API response is wrapped in. Always check
 * `success` before trusting `result` — CKAN returns HTTP 200 even for some
 * application-level failures.
 */
export interface CkanEnvelope<T> {
  help?: string;
  success: boolean;
  result: T;
}

export interface CkanOrganization {
  id: string;
  name: string;
  title: string;
}

/**
 * A file/table attached to a CkanPackage. `datastore_active` tells us
 * whether its rows are queryable via `datastore_search`, as opposed to a
 * plain file download.
 */
export interface CkanResource {
  id: string;
  package_id: string;
  name: string;
  format: string;
  url: string;
  /**
   * Documented as a boolean, but the live API has been observed returning
   * the string "False" on at least one retired dataset — treat as
   * untrusted and normalize with `isDatastoreActive` before branching on it.
   */
  datastore_active: boolean | string;
  last_modified: string | null;
}

/** A CKAN dataset, as returned by `package_search` and `package_show`. */
export interface CkanPackage {
  id: string;
  name: string;
  title: string;
  notes: string | null;
  num_resources: number;
  organization: CkanOrganization | null;
  resources: CkanResource[];
}

export interface CkanPackageSearchResult {
  count: number;
  results: CkanPackage[];
}

export interface CkanDatastoreField {
  id: string;
  type: string;
}

/**
 * A single row from `datastore_search`. `_id` is the only field CKAN
 * guarantees; everything else is dataset-specific, so callers must narrow
 * before use.
 */
export interface DatastoreRecord {
  _id: number;
  [field: string]: unknown;
}

export interface CkanDatastoreSearchResult {
  resource_id: string;
  total: number;
  fields: CkanDatastoreField[];
  records: DatastoreRecord[];
}

/**
 * The app's normalized record shape, produced from raw DatastoreRecords by
 * the Phase 4 normalizer. Declared here so every phase shares one contract.
 *
 * `lat`/`lng` are nullable: a row without usable coordinates (FR-4.3) still
 * becomes a Place — shown in the list, just excluded from the map.
 */
export interface Place {
  id: string;
  name: string;
  lat: number | null;
  lng: number | null;
  fields: Record<string, unknown>;
}
