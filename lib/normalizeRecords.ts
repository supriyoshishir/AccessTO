import type { DatastoreRecord, Place } from "@/lib/types";

const LAT_FIELD_CANDIDATES = ["lat", "latitude", "y"];
const LNG_FIELD_CANDIDATES = ["lng", "long", "longitude", "lon", "x"];
const GEOMETRY_FIELD_CANDIDATES = ["geometry", "geom", "the_geom"];
const NAME_FIELD_CANDIDATES = [
  "name",
  "title",
  "branchname",
  "sitename",
  "locationname",
  "parkname",
  "address",
  "location",
];

function normalizeKey(key: string): string {
  return key.trim().toLowerCase();
}

function buildFieldIndex(fields: Record<string, unknown>): Map<string, unknown> {
  const index = new Map<string, unknown>();
  for (const [key, value] of Object.entries(fields)) {
    index.set(normalizeKey(key), value);
  }
  return index;
}

function firstDefined(index: Map<string, unknown>, candidates: string[]): unknown {
  for (const candidate of candidates) {
    const value = index.get(candidate);
    if (value !== undefined && value !== null && value !== "") {
      return value;
    }
  }
  return undefined;
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function isValidLat(value: number): boolean {
  return value >= -90 && value <= 90;
}

function isValidLng(value: number): boolean {
  return value >= -180 && value <= 180;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Parses a GeoJSON-ish `geometry` field (as seen on live datasets: a JSON
 * *string* containing `{"type":"Point"|"MultiPoint","coordinates":...}`).
 * Only Point/MultiPoint are supported — that's what maps to a single
 * lat/lng pair; other geometry types aren't meaningful for a point map.
 */
function coordinatesFromGeometry(value: unknown): Coordinates | null {
  let geometry: unknown = value;
  if (typeof value === "string") {
    try {
      geometry = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (!isRecord(geometry)) {
    return null;
  }

  const { type, coordinates } = geometry;
  let pair: unknown;
  if (type === "Point" && Array.isArray(coordinates)) {
    pair = coordinates;
  } else if (
    type === "MultiPoint" &&
    Array.isArray(coordinates) &&
    Array.isArray(coordinates[0])
  ) {
    pair = coordinates[0];
  } else {
    return null;
  }

  if (!Array.isArray(pair) || pair.length < 2) {
    return null;
  }
  // GeoJSON orders coordinates as [longitude, latitude].
  const lng = toFiniteNumber(pair[0]);
  const lat = toFiniteNumber(pair[1]);
  if (lat === null || lng === null || !isValidLat(lat) || !isValidLng(lng)) {
    return null;
  }
  return { lat, lng };
}

function resolveCoordinates(index: Map<string, unknown>): Coordinates | null {
  const lat = toFiniteNumber(firstDefined(index, LAT_FIELD_CANDIDATES));
  const lng = toFiniteNumber(firstDefined(index, LNG_FIELD_CANDIDATES));
  if (lat !== null && lng !== null && isValidLat(lat) && isValidLng(lng)) {
    return { lat, lng };
  }

  const rawGeometry = firstDefined(index, GEOMETRY_FIELD_CANDIDATES);
  if (rawGeometry !== undefined) {
    const fromGeometry = coordinatesFromGeometry(rawGeometry);
    if (fromGeometry) {
      return fromGeometry;
    }
  }

  return null;
}

function resolveName(index: Map<string, unknown>, fallbackId: number): string {
  const raw = firstDefined(index, NAME_FIELD_CANDIDATES);
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim();
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return String(raw);
  }
  return `Record ${fallbackId}`;
}

function normalizeRecord(packageId: string, record: DatastoreRecord): Place {
  const { _id, ...fields } = record;
  const index = buildFieldIndex(fields);
  const coordinates = resolveCoordinates(index);

  return {
    id: `${packageId}:${_id}`,
    name: resolveName(index, _id),
    lat: coordinates?.lat ?? null,
    lng: coordinates?.lng ?? null,
    fields,
  };
}

/**
 * Maps raw `datastore_search` rows to the app's `Place` shape. Never
 * throws on bad input (FR-4.5): rows with missing or invalid coordinates
 * still become a Place, just with `lat`/`lng` set to `null` so they're
 * excluded from map plotting but retained in the list.
 */
export function normalizeRecords(packageId: string, records: DatastoreRecord[]): Place[] {
  return records.map((record) => normalizeRecord(packageId, record));
}
