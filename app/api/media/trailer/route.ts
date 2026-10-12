import { NextRequest, NextResponse } from "next/server";

const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const trailerCache = new Map<string, any>();
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title")?.trim();
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!title) {
    return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
  }

  const cacheKey = `${title.toLowerCase()}_${year || ""}`;
  if (trailerCache.has(cacheKey)) {
    return NextResponse.json(trailerCache.get(cacheKey), { headers: CACHE_HEADERS });
  }

  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
    `${title} ${year || ""} official trailer`
  )}`;

  try {
    // 1. Search TMDb for matching movie or TV show
    const searchRes = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(
        title
      )}&language=en-US&page=1`
    );

    if (!searchRes.ok) {
      return NextResponse.json({
        found: false,
        embedUrl: null,
        youtubeSearchUrl,
        trailerTitle: `${title} - Official Trailer`,
      });
    }

    const searchData = await searchRes.json();
    const results: Array<{ id: number; media_type: string; release_date?: string; first_air_date?: string }> = searchData.results || [];

    // Filter to movie or tv
    const mediaResults = results.filter((r) => r.media_type === "movie" || r.media_type === "tv");

    if (mediaResults.length === 0) {
      return NextResponse.json({
        found: false,
        embedUrl: null,
        youtubeSearchUrl,
        trailerTitle: `${title} - Official Trailer`,
      });
    }

    // Match best item by release year
    const bestMatch =
      mediaResults.find((m) => {
        const date = m.release_date || m.first_air_date;
        return year && date ? date.startsWith(String(year)) : false;
      }) || mediaResults[0];

    const mediaId = bestMatch.id;
    const mediaType = bestMatch.media_type === "tv" ? "tv" : "movie";

    // 2. Fetch official videos from TMDb
    const videosRes = await fetch(
      `${TMDB_BASE_URL}/${mediaType}/${mediaId}/videos?api_key=${TMDB_API_KEY}&language=en-US`
    );

    if (videosRes.ok) {
      const videosData = await videosRes.json();
      const videos: Array<{ site: string; type: string; official?: boolean; key: string; name?: string }> = videosData.results || [];

      // Find official YouTube trailer or teaser
      const youtubeTrailers = videos.filter((v) => v.site === "YouTube");
      const officialTrailer =
        youtubeTrailers.find((v) => v.type === "Trailer" && v.official) ||
        youtubeTrailers.find((v) => v.type === "Trailer") ||
        youtubeTrailers.find((v) => v.type === "Teaser") ||
        youtubeTrailers[0];

      if (officialTrailer && officialTrailer.key) {
        const payload = {
          found: true,
          isSearchFallback: false,
          key: officialTrailer.key,
          embedUrl: `https://www.youtube-nocookie.com/embed/${officialTrailer.key}?autoplay=1&rel=0`,
          youtubeUrl: `https://www.youtube.com/watch?v=${officialTrailer.key}`,
          trailerTitle: officialTrailer.name || `${title} - Official Trailer`,
        };
        trailerCache.set(cacheKey, payload);
        return NextResponse.json(payload, { headers: CACHE_HEADERS });
      }
    }

    // Fallback: No direct embed key found, provide external YouTube search URL
    const fallbackPayload = {
      found: false,
      embedUrl: null,
      youtubeSearchUrl,
      trailerTitle: `${title} - Official Trailer`,
    };
    trailerCache.set(cacheKey, fallbackPayload);
    return NextResponse.json(fallbackPayload, { headers: CACHE_HEADERS });
  } catch {
    return NextResponse.json({
      found: false,
      embedUrl: null,
      youtubeSearchUrl,
      trailerTitle: `${title} - Official Trailer`,
    });
  }
}
