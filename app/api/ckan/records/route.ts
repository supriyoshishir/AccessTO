import { NextRequest, NextResponse } from "next/server";
import {
  CkanApiError,
  isDatastoreActive,
  searchDatastore,
  showPackage,
} from "@/lib/ckanClient";

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

function parseLimit(raw: string | null): number {
  if (!raw) {
    return DEFAULT_LIMIT;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(parsed), MAX_LIMIT);
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")?.trim();
  if (!id) {
    return NextResponse.json(
      { error: 'Query parameter "id" is required.' },
      { status: 400 },
    );
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"));

  try {
    const pkg = await showPackage(id);
    const resource = pkg.resources.find((r) => isDatastoreActive(r.datastore_active));

    if (!resource) {
      return NextResponse.json(
        { error: `Package "${id}" has no datastore-active resource.` },
        { status: 404 },
      );
    }

    const records = await searchDatastore(resource.id, limit);
    return NextResponse.json({ resourceId: resource.id, records });
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
