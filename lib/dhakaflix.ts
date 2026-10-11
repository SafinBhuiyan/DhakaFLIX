import catalogSnapshot from "@/lib/catalog-snapshot.json";

export interface DhakaFlixStream {
  title: string;
  year?: number;
  quality: string;
  fileName: string;
  streamUrl: string;
  folderUrl: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  fileSize?: string;
  sourceServer: string;
  category: string;
  modifiedDate: string;
}

export interface DhakaFlixMediaItem {
  id: string;
  title: string;
  rawFolderName: string;
  year: number;
  quality: string;
  sourceServer: string;
  category: string;
  folderUrl: string;
  posterUrl: string;
  modifiedDate: string;
  streams?: DhakaFlixStream[];
  overview?: string;
  backdropUrl?: string;
  rating?: number;
}

export const DHAKA_SERVERS = {
  server14: "http://172.16.50.14",
  server7: "http://172.16.50.7",
  server12: "http://172.16.50.12",
  server10: "http://172.16.50.10",
  server8: "http://172.16.50.8",
};

export const DHAKA_SECTIONS: Record<string, { id: string; label: string; server: string; url: string; subUrls?: string[] }> = {
  movies1080p: {
    id: "movies1080p",
    label: "English Movies -1080p",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/English%20Movies%20%281080p%29/%282026%29%201080p/`,
  },
  movies720p: {
    id: "movies720p",
    label: "English Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/English%20Movies/%282026%29/`,
  },
  hindi: {
    id: "hindi",
    label: "Hindi Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Hindi%20Movies/%282026%29/`,
  },
  southMovies: {
    id: "southMovies",
    label: "South Indian Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/2026/`,
    subUrls: [
      `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/2026/`,
      `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/2025/`,
      `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/2024/`,
    ],
  },
  southDubbed: {
    id: "southDubbed",
    label: "South-Movie Hindi Dubbed",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/%282026%29/`,
  },
  kolkata: {
    id: "kolkata",
    label: "Kolkata Bangla Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/%282024%29/`,
    subUrls: [
      `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/%282024%29/`,
      `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/%282023%29/`,
      `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/%282022%29/`,
    ],
  },
  animation: {
    id: "animation",
    label: "Animation Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies/%282024%29/`,
    subUrls: [
      `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies/%282024%29/`,
      `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies/%282023%29/`,
    ],
  },
  animation1080p: {
    id: "animation1080p",
    label: "Animation Movies -1080p",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/`,
  },
  foreign: {
    id: "foreign",
    label: "Foreign Language Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Foreign%20Language%20Movies/Korean%20Language/`,
    subUrls: [
      `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Foreign%20Language%20Movies/Korean%20Language/`,
      `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Foreign%20Language%20Movies/Chinese%20Language/`,
      `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Foreign%20Language%20Movies/Japanese%20Language/`,
    ],
  },
  imdb250: {
    id: "imdb250",
    label: "IMDb Top-250 Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/IMDb%20Top-250%20Movies/`,
  },
  movies3D: {
    id: "movies3D",
    label: "3D Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/3D%20Movies/`,
  },
  tvSeries: {
    id: "tvSeries",
    label: "TV & Web Series",
    server: "Server 12",
    url: `${DHAKA_SERVERS.server12}/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A5%20%20A%20%20%E2%80%94%20%20L/`,
  },
  tvSeriesSZ: {
    id: "tvSeriesSZ",
    label: "TV & Web Series (S-Z)",
    server: "Server 12",
    url: `${DHAKA_SERVERS.server12}/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A6%20%20S%20%20%E2%80%94%20%20Z/`,
  },
  koreanTv: {
    id: "koreanTv",
    label: "KOREAN TV & WEB Series",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/KOREAN%20TV%20%26%20WEB%20Series/`,
  },
  cartoonTv: {
    id: "cartoonTv",
    label: "Cartoon TV Series",
    server: "Server 10",
    url: `${DHAKA_SERVERS.server10}/DHAKA-FLIX-10/Anime%20%26%20Cartoon%20TV%20Series/`,
  },
  documentary: {
    id: "documentary",
    label: "Documentary",
    server: "Server 10",
    url: `${DHAKA_SERVERS.server10}/DHAKA-FLIX-10/Documentary/`,
  },
  wwe: {
    id: "wwe",
    label: "WWE & AEW Wrestling",
    server: "Server 10",
    url: `${DHAKA_SERVERS.server10}/DHAKA-FLIX-10/WWE%20%26%20AEW%20Wrestling/`,
  },
  games: {
    id: "games",
    label: "PC Games",
    server: "Server 8",
    url: `${DHAKA_SERVERS.server8}/DHAKA-FLIX-8/PC%20Games/`,
  },
  software: {
    id: "software",
    label: "Software",
    server: "Server 8",
    url: `${DHAKA_SERVERS.server8}/DHAKA-FLIX-8/Software/`,
  },
};

const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i;
const CACHE_TTL = 5 * 60 * 1000; // 5 mins
const directoryCache = new Map<string, { items: any[]; savedAt: number }>();

// Circuit breaker for BDIX 172.16.50.x connectivity
let isBdixOnline: boolean | null = null;
let lastBdixCheck = 0;
const BDIX_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes

export async function checkBdixAvailability(): Promise<boolean> {
  // Cloud environments like Vercel / AWS can NEVER route to private RFC-1918 172.16.50.x
  if (process.env.VERCEL === "1" || process.env.NEXT_PUBLIC_VERCEL_ENV) {
    return false;
  }

  const now = Date.now();
  if (isBdixOnline !== null && now - lastBdixCheck < BDIX_CHECK_INTERVAL) {
    return isBdixOnline;
  }

  try {
    const controller = new AbortController();
    // Strict 500ms timeout: never hang or queue user requests
    const timeout = setTimeout(() => controller.abort(), 500);
    const res = await fetch("http://172.16.50.14/DHAKA-FLIX-14/", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    isBdixOnline = res.ok || res.status < 500;
  } catch {
    isBdixOnline = false;
  }

  lastBdixCheck = now;
  return isBdixOnline;
}

export function formatBytes(kbString: string): string {
  const match = kbString.match(/(\d+)\s*KB/i);
  if (!match) return kbString || "Unknown size";
  const kb = parseInt(match[1], 10);
  if (kb > 1024 * 1024) {
    return (kb / (1024 * 1024)).toFixed(2) + " GB";
  }
  return (kb / 1024).toFixed(0) + " MB";
}

export function parseFolderTitle(folderName: string) {
  // Extract year
  const yearMatch = folderName.match(/\((19|20\d{2})\)/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;

  // Clean title
  let title = folderName;
  if (yearMatch && yearMatch.index !== undefined) {
    title = folderName.substring(0, yearMatch.index).trim();
  } else {
    title = folderName.replace(/(1080p|720p|2160p|4k|bluray|webrip|amzn|nf).*/i, "").trim();
  }
  // Remove TV Series tag
  title = title.replace(/\(TV (Mini )?Series.*\)/i, "").trim();

  // Extract quality
  let quality = "720p";
  if (/1080p/i.test(folderName)) quality = "1080p";
  else if (/2160p|4k/i.test(folderName)) quality = "4K UHD";
  if (/Dual\s*Audio/i.test(folderName)) quality += " Dual Audio";
  if (/IMAX/i.test(folderName)) quality += " IMAX";

  return { title: title || folderName, year, quality };
}

export async function fetchH5aiDirectory(urlStr: string): Promise<{ href: string; name: string; date: string; size: string; isFolder: boolean }[]> {
  const cached = directoryCache.get(urlStr);
  if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
    return cached.items;
  }

  // Fast check: If BDIX LAN is not reachable (or on Vercel), do not hang
  const isOnline = await checkBdixAvailability();
  if (!isOnline) {
    return [];
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(urlStr, { signal: controller.signal, next: { revalidate: 300 } });
    clearTimeout(timeout);
    if (!res.ok) return [];

    const html = await res.text();
    const matches = [...html.matchAll(/<td class="fb-n"><a href="([^"]+)">([^<]+)<\/a><\/td><td class="fb-d">([^<]*)<\/td><td class="fb-s">([^<]*)<\/td>/g)];

    const parsed = matches
      .filter((m) => m[2] !== "Parent Directory")
      .map((m) => {
        const href = new URL(m[1], urlStr).href;
        const name = m[2];
        const date = m[3];
        const size = m[4];
        const isFolder = !size && href.endsWith("/");
        return { href, name, date, size, isFolder };
      });

    directoryCache.set(urlStr, { items: parsed, savedAt: Date.now() });
    return parsed;
  } catch {
    return [];
  }
}

// Inspect a movie folder to get all actual video files (.mkv, .mp4)
export async function getFolderStreams(folderUrl: string, title: string, year: number): Promise<DhakaFlixStream[]> {
  const items = await fetchH5aiDirectory(folderUrl);
  const streams: DhakaFlixStream[] = [];

  for (const item of items) {
    if (!item.isFolder && VIDEO_EXTENSIONS.test(item.name)) {
      let quality = "720p";
      if (/1080p/i.test(item.name) || /1080p/i.test(folderUrl)) quality = "1080p";
      if (/4k|2160p/i.test(item.name)) quality = "4K";
      if (/Dual\s*Audio/i.test(item.name) || /Dual\s*Audio/i.test(folderUrl)) quality += " Dual Audio";
      if (/IMAX/i.test(item.name)) quality += " IMAX";

      // Server name
      const host = new URL(folderUrl).hostname;
      const sourceServer = host === "172.16.50.14" ? "Server 14" : host === "172.16.50.7" ? "Server 7" : host === "172.16.50.12" ? "Server 12" : host;

      streams.push({
        title,
        year,
        quality,
        fileName: item.name,
        streamUrl: item.href,
        folderUrl,
        fileSizeBytes: 0,
        fileSizeFormatted: formatBytes(item.size),
        sourceServer,
        category: "DhakaFlix Media",
        modifiedDate: item.date,
      });
    }
  }

  return streams;
}

// Instant snapshot streams for cloud/Vercel (0ms latency)
export function getSnapshotStreams(title: string, year?: number, url?: string): DhakaFlixStream[] {
  const cleanTitle = title ? title.toLowerCase().replace(/[^a-z0-9]/g, "") : "";

  const allSnapshotItems: any[] = Object.values(catalogSnapshot).flatMap(
    (cat: any) => cat.items || []
  );

  let match = url
    ? allSnapshotItems.find((m: any) => m.videoUrl === url || m.serverUrl === url)
    : null;

  if (!match && cleanTitle) {
    match = allSnapshotItems.find((m: any) => {
      const norm = (m.title || m.rawName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
      return norm.includes(cleanTitle) || cleanTitle.includes(norm);
    });
  }

  if (match) {
    const directStreamUrl = match.videoUrl || match.serverUrl;
    const directFileName = match.videoFileName || `${match.rawName || match.title}.mkv`;
    const directFileSize = match.videoFileSize || "Direct BDIX Stream";

    return [
      {
        title: match.title,
        year: match.year || year || 2026,
        quality: match.quality || "1080p",
        fileName: directFileName,
        streamUrl: directStreamUrl,
        folderUrl: match.serverUrl,
        fileSizeBytes: 0,
        fileSizeFormatted: directFileSize,
        sourceServer: match.sourceServer || "DhakaFlix",
        category: match.category || "DhakaFlix Media",
        modifiedDate: match.modifiedDate || "2026",
      },
    ];
  }

  return [];
}

// Find streams across all servers for a title
export async function findDhakaFlixStreams(title: string, year?: number): Promise<DhakaFlixStream[]> {
  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleanTitle) return [];

  const isOnline = await checkBdixAvailability();
  if (!isOnline) {
    return getSnapshotStreams(title, year);
  }

  const found: DhakaFlixStream[] = [];
  const searchSections = [
    DHAKA_SECTIONS.movies1080p,
    DHAKA_SECTIONS.movies720p,
    DHAKA_SECTIONS.hindi,
    DHAKA_SECTIONS.southDubbed,
    DHAKA_SECTIONS.animation,
  ];

  for (const sec of searchSections) {
    try {
      const folders = await fetchH5aiDirectory(sec.url);
      for (const f of folders) {
        if (!f.isFolder) continue;
        const normName = f.name.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (normName.includes(cleanTitle) || cleanTitle.includes(normName)) {
          const { title: parsedTitle, year: parsedYear } = parseFolderTitle(f.name);
          const streams = await getFolderStreams(f.href, parsedTitle, parsedYear);
          found.push(...streams);
        }
      }
    } catch {}
  }

  return found.length > 0 ? found : getSnapshotStreams(title, year);
}

export interface DhakaFlixSearchResult {
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

// Fast in-memory search across catalog snapshot (0ms latency, zero network overhead)
export function searchSnapshotCatalog(query: string, maxResults = 36): DhakaFlixSearchResult[] {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const allSnapshotItems: any[] = Object.values(catalogSnapshot).flatMap(
    (cat: any) => cat.items || []
  );

  const seen = new Set<string>();
  const results: DhakaFlixSearchResult[] = [];

  for (const item of allSnapshotItems) {
    const idKey = item.id || item.serverUrl;
    if (seen.has(idKey)) continue;

    const titleMatch = item.title?.toLowerCase().includes(cleanQ);
    const rawMatch = item.rawName?.toLowerCase().includes(cleanQ);
    const catMatch = item.category?.toLowerCase().includes(cleanQ);

    if (titleMatch || rawMatch || catMatch) {
      seen.add(idKey);
      results.push({
        id: item.id || Buffer.from(item.serverUrl).toString("base64url"),
        title: item.title,
        rawName: item.rawName || item.title,
        year: item.year || 2026,
        quality: item.quality || "1080p",
        serverUrl: item.videoUrl || item.serverUrl,
        sourceServer: item.sourceServer || "Server 14",
        category: item.category || "DhakaFlix Media",
        poster: item.poster || `${item.serverUrl}a_AL_.jpg`,
        backdrop: item.backdrop,
        overview: item.overview,
        rating: item.rating,
        modifiedDate: item.modifiedDate || "2026",
        videoUrl: item.videoUrl,
        videoFileName: item.videoFileName,
        videoFileSize: item.videoFileSize,
      });
      if (results.length >= maxResults) break;
    }
  }

  return results;
}

// Global search across all major DhakaFlix sections
export async function searchDhakaFlixCatalog(query: string, maxResults = 36): Promise<DhakaFlixSearchResult[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  // Check if BDIX LAN is actually available (returns false immediately on Vercel)
  const isOnline = await checkBdixAvailability();
  if (!isOnline) {
    return searchSnapshotCatalog(cleanQ, maxResults);
  }

  const searchSections = [
    DHAKA_SECTIONS.movies1080p,
    DHAKA_SECTIONS.movies720p,
    DHAKA_SECTIONS.hindi,
    DHAKA_SECTIONS.southDubbed,
    DHAKA_SECTIONS.tvSeries,
    DHAKA_SECTIONS.tvSeriesSZ,
    DHAKA_SECTIONS.animation1080p,
    DHAKA_SECTIONS.kolkata,
  ];

  const results: DhakaFlixSearchResult[] = [];

  await Promise.all(
    searchSections.map(async (sec) => {
      try {
        const folders = await fetchH5aiDirectory(sec.url);
        for (const f of folders) {
          if (!f.isFolder) continue;
          if (f.name.toLowerCase().includes(cleanQ)) {
            const { title, year, quality } = parseFolderTitle(f.name);
            results.push({
              id: Buffer.from(f.href).toString("base64url"),
              title,
              rawName: f.name,
              year,
              quality,
              serverUrl: f.href,
              sourceServer: sec.server,
              category: sec.label,
              poster: `${f.href}a_AL_.jpg`,
              modifiedDate: f.date || "2026",
            });
          }
        }
      } catch {}
    })
  );

  return results.length > 0 ? results.slice(0, maxResults) : searchSnapshotCatalog(cleanQ, maxResults);
}
