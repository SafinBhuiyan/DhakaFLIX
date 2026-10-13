import { NextRequest, NextResponse } from "next/server";
import { findCatalogMovieById } from "@/lib/catalog-store";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 });
  }

  try {
    const movie = await findCatalogMovieById(id);
    if (!movie) {
      return NextResponse.json({ error: "Movie not found" }, { status: 404 });
    }

    return NextResponse.json({ movie }, { headers: CACHE_HEADERS });
  } catch (err: any) {
    console.error("Movie detail API error:", err);
    return NextResponse.json({ error: "Failed to retrieve movie details" }, { status: 500 });
  }
}
