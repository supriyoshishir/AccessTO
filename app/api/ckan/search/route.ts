import { NextRequest, NextResponse } from "next/server";
import { CkanApiError, searchPackages } from "@/lib/ckanClient";

const DEFAULT_ROWS = 10;
const MAX_ROWS = 100;

function parseRows(raw: string | null): number {
  if (!raw) {
    return DEFAULT_ROWS;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_ROWS;
  }
  return Math.min(Math.floor(parsed), MAX_ROWS);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json(
      { error: 'Query parameter "q" is required.' },
      { status: 400 },
    );
  }

  const rows = parseRows(request.nextUrl.searchParams.get("rows"));

  try {
    const packages = await searchPackages(q, rows);
    // Matches the server-side CKAN fetch's own revalidate window (see
    // lib/ckanClient.ts) — lets the browser skip re-hitting this route
    // entirely for an identical query, not just skip re-querying CKAN
    // (NFR-PERF-1: "no redundant client refetching of unchanged queries").
    // Error responses are deliberately left uncached below, so a
    // transient failure doesn't get replayed for the next hour.
    return NextResponse.json(
      { packages },
      {
        headers: {
          "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    if (error instanceof CkanApiError) {
      return NextResponse.json(
        { error: "The Toronto Open Data service is unavailable. Please try again." },
        { status: 502 },
      );
    }
    throw error;
  }
}
