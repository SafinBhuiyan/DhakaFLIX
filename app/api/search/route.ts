import { NextRequest, NextResponse } from "next/server";
import { searchDhakaFlixCatalog, searchSnapshotCatalog, checkBdixAvailability } from "@/lib/dhakaflix";
import { searchTMDb, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const limit = parseInt(searchParams.get("limit") || "24", 10);

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    const isOnline = await checkBdixAvailability();

    // 1. If in cloud (Vercel), search snapshot instantly (0ms latency, zero timeout risk)
    if (!isOnline) {
      const items = searchSnapshotCatalog(q, limit);
      return NextResponse.json({
        query: q,
        total: items.length,
        results: items,
      });
    }

    // 2. If on local BDIX LAN, perform multi-server search
    let items = await searchDhakaFlixCatalog(q, limit);

    if (items.length === 0) {
      items = searchSnapshotCatalog(q, limit);
    } else {
      // Enrich top 6 items missing artwork with TMDb in parallel
      await Promise.all(
        items.slice(0, 6).map(async (item) => {
          if (item.poster && !item.poster.endsWith("a_AL_.jpg")) return;
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
    }

    return NextResponse.json({
      query: q,
      total: items.length,
      results: items,
    });
  } catch {
    const items = searchSnapshotCatalog(q, limit);
    return NextResponse.json({
      query: q,
      total: items.length,
      results: items,
    });
  }
}
