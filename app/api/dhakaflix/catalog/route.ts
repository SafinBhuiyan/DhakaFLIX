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
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || "24", 10));
  const startIndex = (page - 1) * limit;

  // Map category to real DhakaFlix section
  const sec = DHAKA_SECTIONS[categoryKey] || DHAKA_SECTIONS.movies1080p;

  // Check cache for instant paginated returns
  const cached = catalogCache[categoryKey];
  if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
    const total = cached.items.length;
    const paginated = cached.items.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;
    return NextResponse.json({
      category: sec.label,
      server: sec.server,
      page,
      limit,
      total,
      hasMore,
      items: paginated,
    });
  }

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
      serverUrl: m.videoUrl || m.serverUrl,
      videoUrl: m.videoUrl,
      videoFileName: m.videoFileName,
      videoFileSize: m.videoFileSize,
    }));

    return NextResponse.json({
      category: fallback?.category || sec.label,
      server: fallback?.server || sec.server,
      page,
      limit,
      total,
      hasMore,
      items: mappedItems,
    });
  }

  try {
    const urlsToFetch = sec.subUrls && sec.subUrls.length > 0 ? sec.subUrls : [sec.url];
    const folderArrays = await Promise.all(
      urlsToFetch.map((u) => fetchH5aiDirectory(u).catch(() => []))
    );
    const rawFolders = folderArrays.flat();
    const movieFolders = rawFolders.filter((f) => f.isFolder);

    if (movieFolders.length === 0) {
      const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
      const allItems: any[] = fallback?.items || [];
      const total = allItems.length;
      const paginated = allItems.slice(startIndex, startIndex + limit);
      const hasMore = startIndex + limit < total;

      const mappedItems = paginated.map((m: any) => ({
        ...m,
        serverUrl: m.videoUrl || m.serverUrl,
        videoUrl: m.videoUrl,
        videoFileName: m.videoFileName,
        videoFileSize: m.videoFileSize,
      }));

      return NextResponse.json({
        category: fallback?.category || sec.label,
        server: fallback?.server || sec.server,
        page,
        limit,
        total,
        hasMore,
        items: mappedItems,
      });
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
      category: sec.label,
      server: sec.server,
      page,
      limit,
      total,
      hasMore,
      items,
    });
  } catch (err: any) {
    // Cloud fallback (Vercel)
    const fallback = (catalogSnapshot as any)[categoryKey] || (catalogSnapshot as any).movies1080p;
    const allItems: any[] = fallback?.items || [];
    const total = allItems.length;
    const paginated = allItems.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < total;

    const mappedItems = paginated.map((m: any) => ({
      ...m,
      serverUrl: m.videoUrl || m.serverUrl,
      videoUrl: m.videoUrl,
      videoFileName: m.videoFileName,
      videoFileSize: m.videoFileSize,
    }));

    return NextResponse.json({
      category: fallback?.category || sec.label,
      server: fallback?.server || sec.server,
      page,
      limit,
      total,
      hasMore,
      items: mappedItems,
    });
  }
}
