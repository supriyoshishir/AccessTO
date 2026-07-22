import { describe, expect, it } from "vitest";
import { normalizeRecords } from "@/lib/normalizeRecords";
import type { DatastoreRecord } from "@/lib/types";

const PACKAGE_ID = "test-package";

function normalizeOne(record: DatastoreRecord) {
  return normalizeRecords(PACKAGE_ID, [record])[0];
}

describe("normalizeRecords", () => {
  it("parses tidy numeric lat/lng fields", () => {
    const place = normalizeOne({
      _id: 1,
      name: "Trinity Bellwoods Park",
      lat: 43.6467,
      lng: -79.4152,
    });

    expect(place.lat).toBe(43.6467);
    expect(place.lng).toBe(-79.4152);
    expect(place.name).toBe("Trinity Bellwoods Park");
  });

  it("detects alternate, case-varying field names with string values", () => {
    // Mirrors the real TPL library-branch dataset: capitalized "Lat"/"Long"
    // stored as text, plus a BranchName label field.
    const place = normalizeOne({
      _id: 2,
      BranchName: "Albion",
      Lat: "43.73999",
      Long: "-79.5845",
    });

    expect(place.lat).toBe(43.73999);
    expect(place.lng).toBe(-79.5845);
    expect(place.name).toBe("Albion");
  });

  it("falls back to a GeoJSON Point geometry field", () => {
    const place = normalizeOne({
      _id: 3,
      name: "Point Geometry Row",
      geometry: JSON.stringify({ type: "Point", coordinates: [-79.4152, 43.6467] }),
    });

    expect(place.lat).toBe(43.6467);
    expect(place.lng).toBe(-79.4152);
  });

  it("falls back to a GeoJSON MultiPoint geometry field", () => {
    // Mirrors the real TPL dataset's geometry field shape.
    const place = normalizeOne({
      _id: 4,
      name: "MultiPoint Geometry Row",
      geometry: JSON.stringify({
        coordinates: [[-79.5845, 43.73999]],
        type: "MultiPoint",
      }),
    });

    expect(place.lat).toBe(43.73999);
    expect(place.lng).toBe(-79.5845);
  });

  it("prefers direct lat/lng fields over a geometry field when both are present", () => {
    const place = normalizeOne({
      _id: 5,
      lat: 1,
      lng: 2,
      geometry: JSON.stringify({ type: "Point", coordinates: [99, 99] }),
    });

    expect(place.lat).toBe(1);
    expect(place.lng).toBe(2);
  });

  it("keeps a row with no coordinate fields at all, with lat/lng set to null", () => {
    const place = normalizeOne({
      _id: 6,
      name: "No Location Data",
    });

    expect(place.lat).toBeNull();
    expect(place.lng).toBeNull();
    expect(place.name).toBe("No Location Data");
    expect(place.id).toBe("test-package:6");
  });

  it("treats non-numeric lat/lng strings as missing rather than throwing", () => {
    expect(() =>
      normalizeOne({
        _id: 7,
        lat: "not-a-number",
        lng: "-79.4152",
      }),
    ).not.toThrow();

    const place = normalizeOne({
      _id: 7,
      lat: "not-a-number",
      lng: "-79.4152",
    });

    expect(place.lat).toBeNull();
    expect(place.lng).toBeNull();
  });

  it("rejects out-of-range coordinates defensively", () => {
    const place = normalizeOne({
      _id: 8,
      lat: 999,
      lng: -79.4152,
    });

    expect(place.lat).toBeNull();
    expect(place.lng).toBeNull();
  });

  it("rejects NaN produced by empty or malformed geometry", () => {
    const place = normalizeOne({
      _id: 9,
      geometry: "{not valid json",
    });

    expect(place.lat).toBeNull();
    expect(place.lng).toBeNull();
  });

  it("builds a stable id from the package id and row _id", () => {
    const place = normalizeOne({ _id: 42, name: "Anything" });
    expect(place.id).toBe("test-package:42");
  });

  it("falls back to a generic label when no name-like field is present", () => {
    const place = normalizeOne({ _id: 10, SomeUnrelatedField: "value" });
    expect(place.name).toBe("Record 10");
  });

  it("normalizes a full batch of records without throwing", () => {
    const places = normalizeRecords(PACKAGE_ID, [
      { _id: 1, name: "A", lat: 43.6, lng: -79.4 },
      { _id: 2, name: "B" },
      { _id: 3, name: "C", lat: "bad", lng: "bad" },
    ]);

    expect(places).toHaveLength(3);
    expect(places[0].lat).toBe(43.6);
    expect(places[1].lat).toBeNull();
    expect(places[2].lat).toBeNull();
  });
});
