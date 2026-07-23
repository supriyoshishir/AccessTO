"use client";

import { useEffect } from "react";
import {
  APILoadingStatus,
  APIProvider,
  AdvancedMarker,
  ColorScheme,
  Map,
  Pin,
  useApiLoadingStatus,
  useMap,
} from "@vis.gl/react-google-maps";
import { useTheme } from "@/context/ThemeContext";
import type { Place } from "@/lib/types";

const TORONTO_CENTER = { lat: 43.6532, lng: -79.3832 };
const DEFAULT_ZOOM = 11;

export interface MapViewProps {
  places: Place[] | null;
  selectedId: string | null;
  onSelect: (place: Place) => void;
}

function hasCoordinates(place: Place): place is Place & { lat: number; lng: number } {
  return place.lat !== null && place.lng !== null;
}

function MapUnavailableNotice() {
  return (
    <div className="rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
      Map unavailable right now — use the list below to browse records.
    </div>
  );
}

interface MapMarkersProps {
  places: (Place & { lat: number; lng: number })[];
  selectedId: string | null;
  onSelect: (place: Place) => void;
}

function MapMarkers({ places, selectedId, onSelect }: MapMarkersProps) {
  const map = useMap();
  const selected = places.find((place) => place.id === selectedId) ?? null;

  useEffect(() => {
    if (map && selected) {
      map.panTo({ lat: selected.lat, lng: selected.lng });
    }
  }, [map, selected]);

  return (
    <>
      {places.map((place) => {
        const isSelected = place.id === selectedId;
        return (
          <AdvancedMarker
            key={place.id}
            position={{ lat: place.lat, lng: place.lng }}
            title={place.name}
            onClick={() => onSelect(place)}
          >
            {/* Selected marker distinguished by scale and a glyph, not
                colour alone (FR-6.3). */}
            <Pin
              scale={isSelected ? 1.4 : 1}
              glyphText={isSelected ? "✓" : undefined}
              background={isSelected ? "#1d4ed8" : "#dc2626"}
              borderColor={isSelected ? "#1e3a8a" : "#991b1b"}
              glyphColor="#ffffff"
            />
          </AdvancedMarker>
        );
      })}
    </>
  );
}

/**
 * Renders the actual map, or the fallback notice if the script failed to
 * load or the key was rejected (FR-6.5) — must live inside APIProvider to
 * read load status from its context.
 */
function MapContent({
  places,
  selectedId,
  onSelect,
  mapId,
}: MapMarkersProps & { mapId: string }) {
  const status = useApiLoadingStatus();
  const { theme } = useTheme();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return <MapUnavailableNotice />;
  }

  return (
    <Map
      mapId={mapId}
      defaultCenter={TORONTO_CENTER}
      defaultZoom={DEFAULT_ZOOM}
      gestureHandling="greedy"
      colorScheme={theme === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT}
    >
      <MapMarkers places={places} selectedId={selectedId} onSelect={onSelect} />
    </Map>
  );
}

export default function MapView({ places, selectedId, onSelect }: MapViewProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapId = process.env.NEXT_PUBLIC_MAP_ID;

  const withCoordinates = (places ?? []).filter(hasCoordinates);
  const count = withCoordinates.length;
  const summary = `Map showing ${count} location${count === 1 ? "" : "s"}; full list below.`;

  if (!apiKey || !mapId) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm text-slate-600 dark:text-slate-400">{summary}</p>
        <MapUnavailableNotice />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm text-slate-600 dark:text-slate-400">{summary}</p>
      <div
        role="region"
        aria-label={summary}
        className="h-96 overflow-hidden rounded-md border border-slate-200 dark:border-slate-700"
      >
        <APIProvider apiKey={apiKey}>
          <MapContent
            places={withCoordinates}
            selectedId={selectedId}
            onSelect={onSelect}
            mapId={mapId}
          />
        </APIProvider>
      </div>
    </div>
  );
}
