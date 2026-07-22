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
    return NextResponse.json({ packages });
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
