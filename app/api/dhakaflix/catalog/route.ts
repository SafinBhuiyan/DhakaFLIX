import { NextRequest, NextResponse } from "next/server";
import { getCategoryMovieFolders, parseFolderTitle, DHAKA_SECTIONS, checkBdixAvailability } from "@/lib/dhakaflix";
import { searchTMDb, getPosterUrl, getBackdropUrl } from "@/lib/tmdb";
import catalogSnapshot from "@/lib/catalog-snapshot.json";

export interface CatalogMovie {
  id: string;
  title: string;
  rawName: string;
  year: number;
  quality: string;
  serverUrl: string;
  sourceServer: string;
  category: string;
  poster: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
  modifiedDate: string;
  videoUrl?: string;
  videoFileName?: string;
  videoFileSize?: string;
}

// In-memory cache for TMDb enriched metadata per title+year
const tmdbEnrichmentCache = new Map<string, { poster?: string; backdrop?: string; overview?: string; rating?: number }>();
const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryKey = searchParams.get("category") || "movies1080p";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "24", 10));
  const startIndex = (page - 1) * limit;

  // Dedicated Curated Home Payload: 1-Request Instant Multi-Section Catalog
  if (categoryKey === "home") {
    const HOME_SECTIONS_CONFIG = [
      { key: "movies1080p", label: "Trending 1080p Movies", server: "Server 14" },
      { key: "tvSeries", label: "TV & Web Series", server: "Server 12" },
      { key: "hindi", label: "Hindi & Bollywood Hits", server: "Server 14" },
      { key: "imdb250", label: "IMDb Top-250 Masterpieces", server: "Server 14" },
      { key: "southDubbed", label: "South-Movie Hindi Dubbed", server: "Server 14" },
      { key: "animation1080p", label: "Animation & Anime (1080p)", server: "Server 14" },
      { key: "foreign", label: "Foreign Language Cinema", server: "Server 7" },
      { key: "kolkata", label: "Kolkata Bangla Movies", server: "Server 7" },
      { key: "movies720p", label: "English Movies (720p)", server: "Server 7" },
    ];

    const snapshot = catalogSnapshot as Record<string, any>;
    const sections = HOME_SECTIONS_CONFIG.map((secDef) => {
      const data = snapshot[secDef.key];
      const items: CatalogMovie[] = (data?.items || []).slice(0, 20).map((m: any) => ({
        ...m,
        serverUrl: m.serverUrl,
        videoUrl: m.videoUrl,
        videoFileName: m.videoFileName,
        videoFileSize: m.videoFileSize,
      }));
      return {
        id: secDef.key,
        label: secDef.label,
        server: data?.server || secDef.server,
        total: data?.items?.length || items.length,
        items,
      };
    });

    // Curate top 5 high-rating items with backdrop for the Hero Spotlight
    const spotlightCandidates = [
      ...(snapshot.movies1080p?.items || []).slice(0, 8),
      ...(snapshot.imdb250?.items || []).slice(0, 6),
      ...(snapshot.tvSeries?.items || []).slice(0, 6),
    ];
    const spotlight = spotlightCandidates
      .filter((m: any) => m.backdrop && m.overview)
      .slice(0, 5)
      .map((m: any) => ({
        ...m,
        serverUrl: m.serverUrl,
        videoUrl: m.videoUrl,
        videoFileName: m.videoFileName,
        videoFileSize: m.videoFileSize,
      }));

    return NextResponse.json(
      {
        isHome: true,
        category: "Home",
        server: "All Storage Nodes",
        spotlight,
        sections,
      },
      { headers: CACHE_HEADERS }
    );
  }

  // Map category to real DhakaFlix section
  const sec = DHAKA_SECTIONS[categoryKey] || DHAKA_SECTIONS.movies1080p;

  // Fast check: If in cloud (Vercel) without direct BDIX LAN access, return paginated snapshot instantly
  const isOnline = await checkBdixAvailability();
  if (!isOnline) {
    const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
    const allItems: any[] = fallback?.items || [];
    const total = allItems.length;
    const paginated = allItems.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    const mappedItems = paginated.map((m: any) => ({
      ...m,
      serverUrl: m.serverUrl,
      videoUrl: m.videoUrl,
      videoFileName: m.videoFileName,
      videoFileSize: m.videoFileSize,
    }));

    return NextResponse.json(
      {
        category: fallback?.category || sec.label,
        server: fallback?.server || sec.server,
        page,
        limit,
        total,
        hasMore,
        items: mappedItems,
      },
      { headers: CACHE_HEADERS }
    );
  }

  try {
    const movieFolders = await getCategoryMovieFolders(categoryKey);

    if (movieFolders.length === 0) {
      const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
      const allItems: any[] = fallback?.items || [];
      const total = allItems.length;
      const paginated = allItems.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < total;

      const mappedItems = paginated.map((m: any) => ({
        ...m,
        serverUrl: m.serverUrl,
        videoUrl: m.videoUrl,
        videoFileName: m.videoFileName,
        videoFileSize: m.videoFileSize,
      }));

      return NextResponse.json(
        {
          category: fallback?.category || sec.label,
          server: fallback?.server || sec.server,
          page,
          limit,
          total,
          hasMore,
          items: mappedItems,
        },
        { headers: CACHE_HEADERS }
      );
    }

    const total = movieFolders.length;
    const paginatedFolders = movieFolders.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    const items: CatalogMovie[] = [];

    for (const folder of paginatedFolders) {
      const { title, year, quality } = parseFolderTitle(folder.name);
      const localPoster = `${folder.href}a_AL_.jpg`;

      items.push({
        id: Buffer.from(folder.href).toString("base64url"),
        title,
        rawName: folder.name,
        year,
        quality,
        serverUrl: folder.href,
        sourceServer: sec.server,
        category: sec.label,
        poster: localPoster,
        modifiedDate: folder.date || "2026",
      });
    }

    // Authentically enrich with TMDb in parallel for this page
    await Promise.all(
      items.map(async (item) => {
        const cacheKey = `${item.title.toLowerCase()}_${item.year}`;
        if (tmdbEnrichmentCache.has(cacheKey)) {
          const cached = tmdbEnrichmentCache.get(cacheKey)!;
          if (cached.poster) item.poster = cached.poster;
          if (cached.backdrop) item.backdrop = cached.backdrop;
          if (cached.overview) item.overview = cached.overview;
          if (cached.rating) item.rating = cached.rating;
          return;
        }

        try {
          const results = await searchTMDb(item.title);
          if (results && results.length > 0) {
            const match = results.find((r) => {
              const rYear = r.release_date || r.first_air_date;
              return rYear ? rYear.startsWith(String(item.year)) : false;
            }) || results[0];

            const meta: { poster?: string; backdrop?: string; overview?: string; rating?: number } = {};
            if (match.poster_path) meta.poster = getPosterUrl(match.poster_path, "w500");
            if (match.backdrop_path) meta.backdrop = getBackdropUrl(match.backdrop_path, "w1280");
            if (match.overview) meta.overview = match.overview;
            if (match.vote_average) meta.rating = match.vote_average;

            tmdbEnrichmentCache.set(cacheKey, meta);

            if (meta.poster) item.poster = meta.poster;
            if (meta.backdrop) item.backdrop = meta.backdrop;
            if (meta.overview) item.overview = meta.overview;
            if (meta.rating) item.rating = meta.rating;
          }
        } catch {}
      })
    );

    return NextResponse.json(
      {
        category: sec.label,
        server: sec.server,
        page,
        limit,
        total,
        hasMore,
        items,
      },
      { headers: CACHE_HEADERS }
    );
  } catch (err: any) {
    // Cloud fallback (Vercel)
    const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
    const allItems: any[] = fallback?.items || [];
    const total = allItems.length;
    const paginated = allItems.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    const mappedItems = paginated.map((m: any) => ({
      ...m,
      serverUrl: m.serverUrl,
      videoUrl: m.videoUrl,
      videoFileName: m.videoFileName,
      videoFileSize: m.videoFileSize,
    }));

    return NextResponse.json(
      {
        category: fallback?.category || sec.label,
        server: fallback?.server || sec.server,
        page,
        limit,
        total,
        hasMore,
        items: mappedItems,
      },
      { headers: CACHE_HEADERS }
    );
  }
}
