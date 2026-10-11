import { NextRequest, NextResponse } from "next/server";
import { searchDhakaFlixCatalog, DhakaFlixSearchResult } from "@/lib/dhakaflix";
import { searchTMDb, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    // 1. Search all DhakaFlix storage servers in parallel
    const items = await searchDhakaFlixCatalog(q, limit);

    // 2. Enrich top 12 results with TMDb posters, ratings, and backdrops in parallel
    await Promise.all(
      items.slice(0, 12).map(async (item) => {
        try {
          const results = await searchTMDb(item.title);
          if (results && results.length > 0) {
            const match = results.find((r) => {
              const rYear = r.release_date || r.first_air_date;
              return rYear ? rYear.startsWith(String(item.year)) : false;
            }) || results[0];

            if (match.poster_path) item.poster = getPosterUrl(match.poster_path, "w500");
            if (match.backdrop_path) item.backdrop = getBackdropUrl(match.backdrop_path, "w1280");
            if (match.overview) item.overview = match.overview;
            if (match.vote_average) item.rating = match.vote_average;
          }
        } catch {}
      })
    );

    return NextResponse.json({
      query: q,
      total: items.length,
      results: items,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [], total: 0 }, { status: 500 });
  }
}
