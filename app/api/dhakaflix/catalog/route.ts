import { NextRequest, NextResponse } from "next/server";
import { fetchH5aiDirectory, parseFolderTitle, DHAKA_SECTIONS, checkBdixAvailability } from "@/lib/dhakaflix";
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

let catalogCache: Record<string, { items: CatalogMovie[]; savedAt: number }> = {};
const CACHE_TTL = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const categoryKey = searchParams.get("category") || "movies1080p";
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  // Map category to real DhakaFlix section
  const sec = DHAKA_SECTIONS[categoryKey] || DHAKA_SECTIONS.movies1080p;

  // Check cache
  const cached = catalogCache[categoryKey];
  if (cached && cached.items.length >= limit && Date.now() - cached.savedAt < CACHE_TTL) {
    return NextResponse.json({
      category: sec.label,
      server: sec.server,
      items: cached.items.slice(0, limit),
    });
  }

  // Fast check: If in cloud (Vercel) without direct BDIX LAN access, return snapshot instantly
  const isOnline = await checkBdixAvailability();
  if (!isOnline) {
    const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
    const mappedItems = (fallback?.items || []).slice(0, limit).map((m: any) => ({
      ...m,
      serverUrl: m.videoUrl || m.serverUrl,
      videoUrl: m.videoUrl,
      videoFileName: m.videoFileName,
      videoFileSize: m.videoFileSize,
    }));
    return NextResponse.json({
      category: fallback?.category || sec.label,
      server: fallback?.server || sec.server,
      items: mappedItems,
    });
  }

  try {
    const rawFolders = await fetchH5aiDirectory(sec.url);
    const movieFolders = rawFolders.filter((f) => f.isFolder);

    if (movieFolders.length === 0) {
      const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
      if (fallback && fallback.items?.length > 0) {
        const mappedItems = fallback.items.slice(0, limit).map((m: any) => ({
          ...m,
          serverUrl: m.videoUrl || m.serverUrl,
          videoUrl: m.videoUrl,
          videoFileName: m.videoFileName,
          videoFileSize: m.videoFileSize,
        }));
        return NextResponse.json({
          category: fallback.category || sec.label,
          server: fallback.server || sec.server,
          items: mappedItems,
        });
      }
    }

    const items: CatalogMovie[] = [];

    for (const folder of movieFolders.slice(0, limit)) {
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

    // Authentically enrich with TMDb in parallel (up to 20 items per request)
    await Promise.all(
      items.slice(0, 20).map(async (item) => {
        try {
          const results = await searchTMDb(item.title);
          if (results && results.length > 0) {
            // Find best matching release by year
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

    catalogCache[categoryKey] = { items, savedAt: Date.now() };

    return NextResponse.json({
      category: sec.label,
      server: sec.server,
      items,
    });
  } catch (err: any) {
    // Cloud fallback (Vercel)
    const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
    if (fallback && fallback.items?.length > 0) {
      const mappedItems = fallback.items.slice(0, limit).map((m: any) => ({
        ...m,
        serverUrl: m.videoUrl || m.serverUrl,
        videoUrl: m.videoUrl,
        videoFileName: m.videoFileName,
        videoFileSize: m.videoFileSize,
      }));
      return NextResponse.json({
        category: fallback.category || sec.label,
        server: fallback.server || sec.server,
        items: mappedItems,
      });
    }

    return NextResponse.json({ error: err.message, items: [] }, { status: 500 });
  }
}
