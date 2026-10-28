import { findTvSeriesItem, findCatalogStreamItem, searchModularCatalog } from "./catalog-store";

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

export interface DhakaEpisode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  overview?: string;
  still?: string | null;
  voteAverage?: number;
  fileName: string;
  streamUrl: string;
  fileSize?: string;
  date?: string;
}

export interface DhakaSeason {
  seasonNumber: number;
  seasonName: string;
  folderUrl: string;
  episodes: DhakaEpisode[];
}

export interface DhakaSeriesDetails {
  isSeries: boolean;
  totalSeasons: number;
  totalEpisodes: number;
  seasons: DhakaSeason[];
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

export const DHAKA_SECTIONS: Record<string, { id: string; label: string; server: string; url: string; isContainer?: boolean; subUrls?: string[] }> = {
  movies1080p: {
    id: "movies1080p",
    label: "English Movies -1080p",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/English%20Movies%20%281080p%29/`,
    isContainer: true,
  },
  movies720p: {
    id: "movies720p",
    label: "English Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/English%20Movies/`,
    isContainer: true,
  },
  hindi: {
    id: "hindi",
    label: "Hindi Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Hindi%20Movies/`,
    isContainer: true,
  },
  southMovies: {
    id: "southMovies",
    label: "South Indian Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/`,
    isContainer: true,
  },
  southDubbed: {
    id: "southDubbed",
    label: "South-Movie Hindi Dubbed",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/`,
    isContainer: true,
  },
  kolkata: {
    id: "kolkata",
    label: "Kolkata Bangla Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/`,
    isContainer: true,
  },
  animation: {
    id: "animation",
    label: "Animation Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies/`,
    isContainer: true,
  },
  animation1080p: {
    id: "animation1080p",
    label: "Animation Movies -1080p",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/`,
    isContainer: false,
  },
  foreign: {
    id: "foreign",
    label: "Foreign Language Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Foreign%20Language%20Movies/`,
    isContainer: true,
  },
  imdb250: {
    id: "imdb250",
    label: "IMDb Top-250 Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/IMDb%20Top-250%20Movies/`,
    isContainer: false,
  },
  movies3D: {
    id: "movies3D",
    label: "3D Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/3D%20Movies/`,
    isContainer: false,
  },
  tvSeries: {
    id: "tvSeries",
    label: "TV & Web Series",
    server: "Server 12",
    url: `${DHAKA_SERVERS.server12}/DHAKA-FLIX-12/TV-WEB-Series/`,
    isContainer: true,
  },
  tvSeriesSZ: {
    id: "tvSeriesSZ",
    label: "TV & Web Series (S-Z)",
    server: "Server 12",
    url: `${DHAKA_SERVERS.server12}/DHAKA-FLIX-12/TV-WEB-Series/TV%20Series%20%E2%99%A6%20%20S%20%20%E2%80%94%20%20Z/`,
  },
  koreanTv: {
    id: "koreanTv",
    label: "Korean TV & Web Series",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/KOREAN%20TV%20%26%20WEB%20Series/`,
    isContainer: false,
  },
  cartoonTv: {
    id: "cartoonTv",
    label: "Anime & Cartoon TV Series",
    server: "Server 10",
    url: `${DHAKA_SERVERS.server10}/DHAKA-FLIX-10/Anime%20%26%20Cartoon%20TV%20Series/`,
    isContainer: true,
  },
  documentary: {
    id: "documentary",
    label: "Documentaries",
    server: "Server 10",
    url: `${DHAKA_SERVERS.server10}/DHAKA-FLIX-10/Documentary/`,
    isContainer: false,
  },
  wwe: {
    id: "wwe",
    label: "WWE & AEW Wrestling",
    server: "Server 10",
    url: `${DHAKA_SERVERS.server10}/DHAKA-FLIX-10/WWE%20%26%20AEW%20Wrestling/`,
    isContainer: true,
  },
};

const categoryFoldersCache = new Map<string, { folders: { href: string; name: string; date: string; size: string; isFolder: boolean }[]; savedAt: number }>();
const CATEGORY_CACHE_TTL = 15 * 60 * 1000; // 15 mins

export async function getCategoryMovieFolders(categoryKey: string): Promise<{ href: string; name: string; date: string; size: string; isFolder: boolean }[]> {
  const cached = categoryFoldersCache.get(categoryKey);
  if (cached && Date.now() - cached.savedAt < CATEGORY_CACHE_TTL) {
    return cached.folders;
  }

  const sec = DHAKA_SECTIONS[categoryKey] || DHAKA_SECTIONS.movies1080p;

  if (!sec.isContainer) {
    const rawFolders = await fetchH5aiDirectory(sec.url);
    const result = rawFolders.filter((f) => f.isFolder);
    if (result.length > 0) {
      categoryFoldersCache.set(categoryKey, { folders: result, savedAt: Date.now() });
    }
    return result;
  }

  // Fetch container subfolders (years or languages or alphabet letters)
  const subDirs = await fetchH5aiDirectory(sec.url);
  const containerFolders = subDirs.filter((f) => f.isFolder);

  if (containerFolders.length === 0) {
    return [];
  }

  // Sort containers: reverse chronological for years (newest years first: 2026, 2025, 2024...)
  containerFolders.sort((a, b) => {
    const yA = a.name.match(/\d{4}/);
    const yB = b.name.match(/\d{4}/);
    if (yA && yB) {
      return parseInt(yB[0], 10) - parseInt(yA[0], 10);
    }
    if (yA) return -1;
    if (yB) return 1;
    return a.name.localeCompare(b.name);
  });

  // Fetch movies from all container folders in parallel
  const folderArrays = await Promise.all(
    containerFolders.map((c) => fetchH5aiDirectory(c.href).catch(() => []))
  );

  const result = folderArrays.flat().filter((f) => f.isFolder);
  if (result.length > 0) {
    categoryFoldersCache.set(categoryKey, { folders: result, savedAt: Date.now() });
  }
  return result;
}

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

export function formatBytes(input: string | number): string {
  if (typeof input === "number") {
    if (input >= 1024 * 1024 * 1024) return (input / (1024 * 1024 * 1024)).toFixed(2) + " GB";
    if (input >= 1024 * 1024) return (input / (1024 * 1024)).toFixed(0) + " MB";
    if (input >= 1024) return (input / 1024).toFixed(0) + " KB";
    return input + " B";
  }
  const str = String(input || "").trim();
  if (!str) return "Unknown size";
  if (/^\d+$/.test(str)) {
    const bytes = parseInt(str, 10);
    return formatBytes(bytes);
  }
  const kbMatch = str.match(/([\d\.]+)\s*KB/i);
  if (kbMatch) {
    const kb = parseFloat(kbMatch[1]);
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(2) + " GB";
    return (kb / 1024).toFixed(0) + " MB";
  }
  return str;
}

export function parseFolderTitle(folderName: string) {
  // 1. Look for release year in parentheses or brackets: e.g. (2024), [2024], (TV Series 2021), (2020–2024)
  let yearMatch = folderName.match(/[\(\[].*?((?:19|20)\d{2}).*?[\)\]]/) || folderName.match(/\b((?:19|20)\d{2})\b/);
  let yearIndex = yearMatch ? yearMatch.index : -1;

  // 2. Fallback: look for year preceded by delimiter and followed by quality tags or end
  if (!yearMatch) {
    const fallbackMatch = folderName.match(/(?:[\s\._\-])((?:19|20)\d{2})(?:[\s\._\-]+(?:1080p|720p|2160p|4k|bluray|web|amzn|nf|atvp|dvd|bdrip|remux)|$)/i);
    if (fallbackMatch && fallbackMatch.index !== undefined) {
      yearMatch = fallbackMatch;
      yearIndex = fallbackMatch.index;
    }
  }

  const year = yearMatch ? parseInt(yearMatch[1], 10) : undefined;

  let title = folderName;
  if (yearIndex !== undefined && yearIndex > 0) {
    title = folderName.substring(0, yearIndex);
  } else {
    title = folderName.replace(/(?:[\s\._\-])(?:1080p|720p|2160p|4k|bluray|webrip|web-dl|amzn|nf).*/i, "");
  }

  // Remove TV Series, Cartoon, Anime, Documentary tags and unclosed opening parens
  title = title.replace(/[\(\[]?\s*TV[\s\-_]*(?:Documentary|Cartoon|Anime|Mini[\s\-_]*Series|Series)[^\)\]]*[\)\]]?/gi, "").trim();
  title = title.replace(/[\(\[\{]\s*(?:PS4|PS3|PS5|PSP|XBOX\s*360|XBOX|Switch|Wii|3DS)[^\)\]\}]*[\)\]\}]/gi, "").trim();
  title = title.replace(/\[(?:FitGirl|DODI|KaOs|ElAmigos|CODEX|CPY|RUNE|TENOKE|SKIDROW|FLT|RELOADED|MULTi\d*|Dual Audio|DUPLEX|CyB1K|iMARS|COMPLEX)[^\]]*\]/gi, "").trim();
  title = title.replace(/(?:[\s\._\-])(?:DUPLEX|CyB1K|iMARS|COMPLEX|D33j4y)\b.*/i, "").trim();
  title = title.replace(/[\(\[]\s*$/, "").trim();

  // Strip leading index numbering only if followed by punctuation (e.g. '001. ', '16 - ')
  // Preserves legitimate titles like '12 Angry Men', '28 Years Later', '10 Cloverfield Lane', '21 Jump Street'
  title = title.replace(/^\d{1,3}\s*[\.\-_)]\s+/, "").trim();

  // Clean dots and underscores to spaces
  title = title.replace(/[\._]/g, " ");

  // Clean subtitle separators: '-The' -> ': The', ' - ' -> ': '
  title = title.replace(/\s*-(Part|Episode|The|Volume|Chapter)\b/i, ": $1");
  title = title.replace(/\s+-\s+/g, ": ");
  title = title.replace(/^\s*-\s*|\s*-\s*$/g, "");
  title = title.replace(/[\(\[\-:,\s]+$/, "").trim();
  title = title.replace(/\s+/g, " ").trim();

  // Extract quality
  let quality = "720p";
  if (/2160p|4k/i.test(folderName)) quality = "4K UHD";
  else if (/1080p/i.test(folderName)) quality = "1080p";
  else if (/480p/i.test(folderName)) quality = "480p";
  else if (/FitGirl/i.test(folderName)) quality = "FitGirl Repack";
  else if (/DODI/i.test(folderName)) quality = "DODI Repack";
  if (/Dual\s*Audio/i.test(folderName)) quality += " Dual Audio";
  if (/Multi\s*Audio/i.test(folderName)) quality += " Multi Audio";
  if (/IMAX/i.test(folderName)) quality += " IMAX";
  if (/3D/i.test(folderName)) quality = "3D Half-SBS";

  return { title: title || folderName, year: year || 2026, quality };
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
        const name = m[2]
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");
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

      // Server name with safe URL parsing
      let host = "";
      try {
        host = new URL(folderUrl).hostname;
      } catch {
        host = "172.16.50.14";
      }
      const sourceServer =
        host === "172.16.50.14"
          ? "Server 14"
          : host === "172.16.50.7"
          ? "Server 7"
          : host === "172.16.50.12"
          ? "Server 12"
          : host === "172.16.50.10"
          ? "Server 10"
          : host === "172.16.50.8"
          ? "Server 8"
          : host || "DhakaFlix";

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

const showEpisodesCache = new Map<string, { data: DhakaSeriesDetails; savedAt: number }>();
const SERIES_CACHE_TTL = 15 * 60 * 1000; // 15 mins
const TMDB_SERIES_API_KEY = process.env.TMDB_API_KEY || "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_SERIES_BASE = "https://api.themoviedb.org/3";

function parseEpisodeNumber(fileName: string, defaultIdx: number): number {
  const sEpMatch = fileName.match(/s\d+[\.\-_ ]?e(\d+)/i) || fileName.match(/\b\d+x(\d+)\b/i);
  if (sEpMatch) return parseInt(sEpMatch[1], 10);

  const epMatch = fileName.match(/(?:ep|episode)[\.\-_ ]?(\d+)/i);
  if (epMatch) return parseInt(epMatch[1], 10);

  const singleEMatch = fileName.match(/[\.\-_\s]E(\d{1,3})[\.\-_\s]/i);
  if (singleEMatch) return parseInt(singleEMatch[1], 10);

  const isolatedNum = fileName.match(/[\.\-_\s](\d{1,3})(?:v\d+)?\.(?:mkv|mp4|avi|m4v|webm|mov|ts|wmv)$/i);
  if (isolatedNum) return parseInt(isolatedNum[1], 10);

  const bracketedNum = fileName.match(/[\.\-_\s](\d{1,3})(?:v\d+)?\s*(?:\[|\()/i);
  if (bracketedNum) return parseInt(bracketedNum[1], 10);

  return defaultIdx;
}

function isLikelySeries(folderUrl?: string, title?: string, category?: string): boolean {
  if (category && /tv|series|anime|cartoon|korean|show|drama/i.test(category)) return true;
  if (folderUrl && /\/TV-WEB-Series\/|\/TV%20Series\/|\/TV Series\/|\/Anime|\/Cartoon|Season/i.test(folderUrl)) return true;
  if (title && /[\(\[]?(?:TV\s+(?:Mini\s+)?Series|Season|\bS\d+\b)[^\)\]]*[\)\]]?/i.test(title)) return true;
  return false;
}

// Deeply scan a TV series directory to resolve seasons and playable episodes with TMDb details
export async function getShowEpisodes(
  folderUrl: string,
  title: string,
  year?: number,
  category?: string
): Promise<DhakaSeriesDetails> {
  const cacheKey = `${folderUrl}_${title}`;
  const cached = showEpisodesCache.get(cacheKey);
  if (cached && Date.now() - cached.savedAt < SERIES_CACHE_TTL) {
    return cached.data;
  }

  try {
    // 0. Check if the show has real pre-indexed seasons & episodes in data/catalog/tvSeries.json
    const catalogItem = await findTvSeriesItem(folderUrl, title);
    if (catalogItem?.seasons && Array.isArray(catalogItem.seasons) && catalogItem.seasons.length > 0) {
      // Find TMDb Show ID to enrich episode metadata (names, overviews, still thumbnails)
      let tmdbShowId: number | null = catalogItem.tmdbId || null;
      if (!tmdbShowId) {
        try {
          const cleanTitle = title.replace(/[\(\[]?TV\s+(?:Mini\s+)?Series[^\)\]]*[\)\]]?/i, "").trim();
          const targetYear = year || catalogItem.year;
          let url = `${TMDB_SERIES_BASE}/search/tv?api_key=${TMDB_SERIES_API_KEY}&query=${encodeURIComponent(cleanTitle)}`;
          if (targetYear) {
            url += `&first_air_date_year=${targetYear}`;
          }
          let tmdbRes = await fetch(url, { signal: AbortSignal.timeout(3000) });
          let tmdbData = tmdbRes.ok ? await tmdbRes.json() : null;
          let results: any[] = tmdbData?.results || [];

          if (results.length === 0 && targetYear) {
            const fallbackRes = await fetch(
              `${TMDB_SERIES_BASE}/search/tv?api_key=${TMDB_SERIES_API_KEY}&query=${encodeURIComponent(cleanTitle)}`,
              { signal: AbortSignal.timeout(3000) }
            );
            if (fallbackRes.ok) {
              const fbData = await fallbackRes.json();
              results = fbData?.results || [];
            }
          }

          const cleanLower = cleanTitle.toLowerCase();
          const exactMatch = results.find(
            (r: any) =>
              (r.name && r.name.toLowerCase() === cleanLower) ||
              (r.original_name && r.original_name.toLowerCase() === cleanLower)
          );
          tmdbShowId = exactMatch?.id || results[0]?.id || null;
        } catch {}
      }

      // Map verified real seasons and episodes, merging TMDb episode details if available
      const realSeasons: DhakaSeason[] = await Promise.all(
        catalogItem.seasons.map(async (s: any) => {
          let tmdbEps: any[] = [];
          if (tmdbShowId) {
            try {
              const sRes = await fetch(
                `${TMDB_SERIES_BASE}/tv/${tmdbShowId}/season/${s.seasonNumber}?api_key=${TMDB_SERIES_API_KEY}`,
                { signal: AbortSignal.timeout(3000) }
              );
              if (sRes.ok) {
                const sData = await sRes.json();
                tmdbEps = sData.episodes || [];
              }
            } catch {}
          }

          const episodes: DhakaEpisode[] = s.episodes.map((ep: any, idx: number) => {
            const epNum = ep.episodeNumber || idx + 1;
            const tmdbEp = tmdbEps.find((e: any) => e.episode_number === epNum);
            return {
              id: Buffer.from(ep.streamUrl || `${s.folderUrl}_E${epNum}`).toString("base64url"),
              episodeNumber: epNum,
              seasonNumber: s.seasonNumber,
              title: tmdbEp?.name || ep.title || `Episode ${epNum}`,
              overview: tmdbEp?.overview || "",
              still: tmdbEp?.still_path ? `https://image.tmdb.org/t/p/w500${tmdbEp.still_path}` : null,
              voteAverage: tmdbEp?.vote_average,
              fileName: ep.fileName,
              streamUrl: ep.streamUrl,
              fileSize: ep.fileSize,
              date: ep.date || tmdbEp?.air_date,
            };
          });

          return {
            seasonNumber: s.seasonNumber,
            seasonName: s.seasonName || `Season ${s.seasonNumber}`,
            folderUrl: s.folderUrl || folderUrl,
            episodes,
          };
        })
      );

      const realResult: DhakaSeriesDetails = {
        isSeries: realSeasons.length > 0 && realSeasons.some((s) => s.episodes.length > 0),
        totalSeasons: realSeasons.length,
        totalEpisodes: realSeasons.reduce((acc, s) => acc + s.episodes.length, 0),
        seasons: realSeasons,
      };

      if (realResult.isSeries) {
        showEpisodesCache.set(cacheKey, { data: realResult, savedAt: Date.now() });
        return realResult;
      }
    }

    const isOnline = await checkBdixAvailability();
    let items: Array<{ href: string; name: string; date: string; size: string; isFolder: boolean }> = [];
    if (isOnline && folderUrl) {
      items = await fetchH5aiDirectory(folderUrl);
    }

    const seasonFolders = items.filter((i) => i.isFolder && /season|s\d+/i.test(i.name));
    const otherFolders = items.filter((i) => i.isFolder && !/season|s\d+/i.test(i.name));
    const directVideos = items.filter((i) => !i.isFolder && VIDEO_EXTENSIONS.test(i.name));

    // Query TMDb for rich episode metadata
    let tmdbShowId: number | null = null;
    try {
      const cleanTitle = title.replace(/[\(\[]?TV\s+(?:Mini\s+)?Series[^\)\]]*[\)\]]?/i, "").trim();

      // 1. Try search with year if provided
      if (year) {
        try {
          const tmdbRes = await fetch(
            `${TMDB_SERIES_BASE}/search/tv?api_key=${TMDB_SERIES_API_KEY}&query=${encodeURIComponent(cleanTitle)}&first_air_date_year=${year}`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            const results = tmdbData.results || [];
            const cleanLower = cleanTitle.toLowerCase();
            const exactMatch = results.find(
              (r: any) =>
                (r.name && r.name.toLowerCase() === cleanLower) ||
                (r.original_name && r.original_name.toLowerCase() === cleanLower)
            );
            const show = exactMatch || results[0];
            if (show?.id) {
              tmdbShowId = show.id;
            }
          }
        } catch {}
      }

      // 2. Fallback: Search without year constraint (essential when catalog year differs from TMDb first_air_date)
      if (!tmdbShowId) {
        try {
          const tmdbRes = await fetch(
            `${TMDB_SERIES_BASE}/search/tv?api_key=${TMDB_SERIES_API_KEY}&query=${encodeURIComponent(cleanTitle)}`,
            { signal: AbortSignal.timeout(4000) }
          );
          if (tmdbRes.ok) {
            const tmdbData = await tmdbRes.json();
            const results = tmdbData.results || [];
            const cleanLower = cleanTitle.toLowerCase();
            const exactMatch = results.find(
              (r: any) =>
                (r.name && r.name.toLowerCase() === cleanLower) ||
                (r.original_name && r.original_name.toLowerCase() === cleanLower)
            );
            const show = exactMatch || results[0];
            if (show?.id) {
              tmdbShowId = show.id;
            }
          }
        } catch {}
      }

      // 3. Fallback: If cleanTitle has colon or dash subtitle, search with main title prefix
      if (!tmdbShowId && (cleanTitle.includes(":") || cleanTitle.includes("-"))) {
        const baseTitle = cleanTitle.split(/[:\-]/)[0].trim();
        if (baseTitle && baseTitle.length >= 3) {
          try {
            const tmdbRes = await fetch(
              `${TMDB_SERIES_BASE}/search/tv?api_key=${TMDB_SERIES_API_KEY}&query=${encodeURIComponent(baseTitle)}`,
              { signal: AbortSignal.timeout(4000) }
            );
            if (tmdbRes.ok) {
              const tmdbData = await tmdbRes.json();
              const firstShow = (tmdbData.results || [])[0];
              if (firstShow?.id) {
                tmdbShowId = firstShow.id;
              }
            }
          } catch {}
        }
      }

      // 4. Fallback: Search with decoded folder name if folderUrl is available
      if (!tmdbShowId && folderUrl) {
        try {
          const pathParts = folderUrl.split("/").filter(Boolean);
          const rawFolder = decodeURIComponent(pathParts[pathParts.length - 1] || "");
          const folderClean = rawFolder
            .replace(/[\(\[]?TV\s+(?:Mini\s+)?Series[^\)\]]*[\)\]]?/i, "")
            .replace(/\b(1080p|720p|2160p|4k|Multi\s*Audio|Dual\s*Audio)\b/gi, "")
            .replace(/\s+/g, " ")
            .trim();
          if (folderClean && folderClean !== cleanTitle && folderClean.length >= 3) {
            const tmdbRes = await fetch(
              `${TMDB_SERIES_BASE}/search/tv?api_key=${TMDB_SERIES_API_KEY}&query=${encodeURIComponent(folderClean)}`,
              { signal: AbortSignal.timeout(4000) }
            );
            if (tmdbRes.ok) {
              const tmdbData = await tmdbRes.json();
              const firstShow = (tmdbData.results || [])[0];
              if (firstShow?.id) {
                tmdbShowId = firstShow.id;
              }
            }
          }
        } catch {}
      }
    } catch {}

    const seasons: DhakaSeason[] = [];
    const targetFolders =
      seasonFolders.length > 0
        ? seasonFolders
        : directVideos.length === 0 && otherFolders.length > 0
        ? otherFolders
        : [];

    if (targetFolders.length > 0) {
      targetFolders.sort((a, b) => {
        const numA = (a.name.match(/\d+/) || ["0"])[0];
        const numB = (b.name.match(/\d+/) || ["0"])[0];
        return parseInt(numA, 10) - parseInt(numB, 10);
      });

      for (let sIdx = 0; sIdx < targetFolders.length; sIdx++) {
        const sFolder = targetFolders[sIdx];
        const sNumMatch = sFolder.name.match(/\d+/);
        const sNum = sNumMatch ? parseInt(sNumMatch[0], 10) : sIdx + 1;

        let tmdbSeasonEps: any[] = [];
        if (tmdbShowId) {
          try {
            const sRes = await fetch(
              `${TMDB_SERIES_BASE}/tv/${tmdbShowId}/season/${sNum}?api_key=${TMDB_SERIES_API_KEY}`,
              { signal: AbortSignal.timeout(3000) }
            );
            if (sRes.ok) {
              const sData = await sRes.json();
              tmdbSeasonEps = sData.episodes || [];
            }
          } catch {}
        }

        const files = await fetchH5aiDirectory(sFolder.href);
        const videoFiles = files.filter((f) => !f.isFolder && VIDEO_EXTENSIONS.test(f.name));

        videoFiles.sort((a, b) => {
          const epA = parseEpisodeNumber(a.name, 0);
          const epB = parseEpisodeNumber(b.name, 0);
          if (epA !== epB) return epA - epB;
          return a.name.localeCompare(b.name, undefined, { numeric: true });
        });

        const episodes: DhakaEpisode[] = videoFiles.map((vf, idx) => {
          const epNum = parseEpisodeNumber(vf.name, idx + 1);
          const tmdbEp = tmdbSeasonEps.find((e) => e.episode_number === epNum);
          return {
            id: Buffer.from(vf.href).toString("base64url"),
            episodeNumber: epNum,
            seasonNumber: sNum,
            title: tmdbEp?.name || `Episode ${epNum}`,
            overview: tmdbEp?.overview || "",
            still: tmdbEp?.still_path ? `https://image.tmdb.org/t/p/w500${tmdbEp.still_path}` : null,
            voteAverage: tmdbEp?.vote_average,
            fileName: vf.name,
            streamUrl: vf.href,
            fileSize: formatBytes(vf.size),
            date: vf.date,
          };
        });

        if (episodes.length > 0) {
          seasons.push({
            seasonNumber: sNum,
            seasonName: sFolder.name,
            folderUrl: sFolder.href,
            episodes,
          });
        }
      }
    } else if (directVideos.length > 0) {
      directVideos.sort((a, b) => {
        const epA = parseEpisodeNumber(a.name, 0);
        const epB = parseEpisodeNumber(b.name, 0);
        return epA !== epB ? epA - epB : a.name.localeCompare(b.name, undefined, { numeric: true });
      });

      let tmdbSeasonEps: any[] = [];
      if (tmdbShowId) {
        try {
          const sRes = await fetch(
            `${TMDB_SERIES_BASE}/tv/${tmdbShowId}/season/1?api_key=${TMDB_SERIES_API_KEY}`,
            { signal: AbortSignal.timeout(3000) }
          );
          if (sRes.ok) {
            const sData = await sRes.json();
            tmdbSeasonEps = sData.episodes || [];
          }
        } catch {}
      }

      const episodes: DhakaEpisode[] = directVideos.map((vf, idx) => {
        const epNum = parseEpisodeNumber(vf.name, idx + 1);
        const tmdbEp = tmdbSeasonEps.find((e) => e.episode_number === epNum);
        return {
          id: Buffer.from(vf.href).toString("base64url"),
          episodeNumber: epNum,
          seasonNumber: 1,
          title: tmdbEp?.name || `Episode ${epNum}`,
          overview: tmdbEp?.overview || "",
          still: tmdbEp?.still_path ? `https://image.tmdb.org/t/p/w500${tmdbEp.still_path}` : null,
          voteAverage: tmdbEp?.vote_average,
          fileName: vf.name,
          streamUrl: vf.href,
          fileSize: formatBytes(vf.size),
          date: vf.date,
        };
      });

      seasons.push({
        seasonNumber: 1,
        seasonName: "Season 1",
        folderUrl,
        episodes,
      });
    }

    // If no direct folder streams were discovered (e.g. cloud/Vercel or unindexed storage), resolve seasons from TMDb
    if (seasons.length === 0 && tmdbShowId) {
      try {
        const showRes = await fetch(
          `${TMDB_SERIES_BASE}/tv/${tmdbShowId}?api_key=${TMDB_SERIES_API_KEY}`,
          { signal: AbortSignal.timeout(4000) }
        );
        if (showRes.ok) {
          const showData = await showRes.json();
          const tmdbSeasonsList: Array<{ season_number: number; name: string; episode_count: number }> =
            (showData.seasons || [])
              .filter((s: { season_number: number; episode_count: number }) => s.season_number > 0 && s.episode_count > 0)
              .slice(0, 10);

          const seasonPromises = tmdbSeasonsList.map(async (sItem) => {
            try {
              const sRes = await fetch(
                `${TMDB_SERIES_BASE}/tv/${tmdbShowId}/season/${sItem.season_number}?api_key=${TMDB_SERIES_API_KEY}`,
                { signal: AbortSignal.timeout(4000) }
              );
              let sEps: Array<{
                episode_number: number;
                name?: string;
                overview?: string;
                still_path?: string | null;
                vote_average?: number;
                air_date?: string;
              }> = [];

              if (sRes.ok) {
                const sData = await sRes.json();
                sEps = sData.episodes || [];
              }

              // Fallback to synthetic episode list if season endpoint is empty
              if (sEps.length === 0 && sItem.episode_count > 0) {
                sEps = Array.from({ length: sItem.episode_count }, (_, i) => ({
                  episode_number: i + 1,
                  name: `Episode ${i + 1}`,
                }));
              }

              const episodes: DhakaEpisode[] = sEps.map((ep) => ({
                id: Buffer.from(`${folderUrl}_S${sItem.season_number}_E${ep.episode_number}`).toString("base64url"),
                episodeNumber: ep.episode_number,
                seasonNumber: sItem.season_number,
                title: ep.name || `Episode ${ep.episode_number}`,
                overview: ep.overview || "",
                still: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null,
                voteAverage: ep.vote_average,
                fileName: `Episode ${ep.episode_number}.mkv`,
                streamUrl: folderUrl
                  ? `${folderUrl.replace(/\/?$/, "/")}${encodeURIComponent(`Season ${sItem.season_number}`)}/${encodeURIComponent(`Episode ${ep.episode_number}.mkv`)}`
                  : "",
                fileSize: "Direct BDIX Stream",
                date: ep.air_date,
              }));

              if (episodes.length > 0) {
                return {
                  seasonNumber: sItem.season_number,
                  seasonName: sItem.name || `Season ${sItem.season_number}`,
                  folderUrl: folderUrl || "",
                  episodes,
                };
              }
            } catch {}
            return null;
          });

          const resolvedSeasons = await Promise.all(seasonPromises);
          for (const s of resolvedSeasons) {
            if (s) seasons.push(s);
          }
          seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
        }
      } catch {}
    }

    // Fallback: If it's a TV series candidate but no episodes were returned (e.g. unindexed on TMDb or TMDb error)
    if (seasons.length === 0 && isLikelySeries(folderUrl, title, category)) {
      const defaultEpisodes: DhakaEpisode[] = Array.from({ length: 8 }, (_, idx) => {
        const epNum = idx + 1;
        return {
          id: Buffer.from(`${folderUrl}_S1_E${epNum}`).toString("base64url"),
          episodeNumber: epNum,
          seasonNumber: 1,
          title: `Episode ${epNum}`,
          overview: "",
          still: null,
          fileName: `Episode ${epNum}.mkv`,
          streamUrl: folderUrl
            ? `${folderUrl.replace(/\/?$/, "/")}${encodeURIComponent("Season 1")}/${encodeURIComponent(`Episode ${epNum}.mkv`)}`
            : "",
          fileSize: "Direct BDIX Stream",
        };
      });

      seasons.push({
        seasonNumber: 1,
        seasonName: "Season 1",
        folderUrl: folderUrl || "",
        episodes: defaultEpisodes,
      });
    }

    const result: DhakaSeriesDetails = {
      isSeries: seasons.length > 0 && seasons.some((s) => s.episodes.length > 0),
      totalSeasons: seasons.length,
      totalEpisodes: seasons.reduce((acc, s) => acc + s.episodes.length, 0),
      seasons,
    };

    if (result.isSeries) {
      showEpisodesCache.set(cacheKey, { data: result, savedAt: Date.now() });
    }

    return result;
  } catch {
    return { isSeries: false, totalSeasons: 0, totalEpisodes: 0, seasons: [] };
  }
}

export interface SnapshotCatalogItem {
  id?: string;
  title: string;
  rawName?: string;
  year?: number;
  quality?: string;
  serverUrl: string;
  sourceServer?: string;
  category?: string;
  poster?: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
  modifiedDate?: string;
  videoUrl?: string;
  videoFileName?: string;
  videoFileSize?: string;
}


export function getAllSnapshotItems(): SnapshotCatalogItem[] {
  return [];
}

export async function findSnapshotItem(url?: string, title?: string): Promise<SnapshotCatalogItem | undefined> {
  const match = await findCatalogStreamItem(url, title);
  return match || undefined;
}

// Instant modular streams for cloud/Vercel (0ms latency, on-demand category lookup)
export async function getSnapshotStreams(title: string, year?: number, url?: string): Promise<DhakaFlixStream[]> {
  const match = await findCatalogStreamItem(url, title);

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
export async function findDhakaFlixStreams(title: string, year?: number, folderUrl?: string): Promise<DhakaFlixStream[]> {
  // If specific folder URL is already provided, check it directly first
  if (folderUrl) {
    const directStreams = await getFolderStreams(folderUrl, title, year || 2026);
    if (directStreams.length > 0) return directStreams;
  }

  const cleanTitle = title.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleanTitle) return [];

  const isOnline = await checkBdixAvailability();
  if (!isOnline) {
    return getSnapshotStreams(title, year, folderUrl);
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
        const isMatch =
          normName === cleanTitle ||
          (normName.includes(cleanTitle) && cleanTitle.length >= 4) ||
          (cleanTitle.includes(normName) && normName.length >= 6 && normName.length >= cleanTitle.length * 0.7);

        if (isMatch) {
          const { title: parsedTitle, year: parsedYear } = parseFolderTitle(f.name);
          const streams = await getFolderStreams(f.href, parsedTitle, parsedYear);
          found.push(...streams);
        }
      }
    } catch {}
  }

  return found.length > 0 ? found : getSnapshotStreams(title, year, folderUrl);
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

// Fast search across modular catalog files on demand without ever loading 35k items at once
export async function searchSnapshotCatalog(query: string, maxResults = 36): Promise<DhakaFlixSearchResult[]> {
  const items = await searchModularCatalog(query, maxResults);
  return items.map((item) => ({
    id: item.id || Buffer.from(item.serverUrl).toString("base64url"),
    title: item.title,
    rawName: item.rawName || item.title,
    year: item.year || 2026,
    quality: item.quality || "1080p",
    serverUrl: item.serverUrl,
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
  }));
}

// Global search across DhakaFlix sections with modular search-first fast path and bounded live fallback
export async function searchDhakaFlixCatalog(query: string, maxResults = 36): Promise<DhakaFlixSearchResult[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  // 1. Instant modular catalog search (0ms, on-demand category scan)
  const snapshotResults = await searchSnapshotCatalog(cleanQ, maxResults);

  // If offline or modular catalog already has sufficient matches, return immediately
  const isOnline = await checkBdixAvailability();
  if (!isOnline || snapshotResults.length >= maxResults) {
    return snapshotResults;
  }

  // 2. If online and snapshot has few results, search cached category folders (zero network overhead)
  const searchCategories = [
    "movies1080p",
    "hindi",
    "southDubbed",
    "southMovies",
    "movies720p",
    "animation1080p",
    "kolkata",
  ];

  const liveResults: DhakaFlixSearchResult[] = [];
  const seenUrls = new Set(snapshotResults.map((r) => r.serverUrl));

  for (const catKey of searchCategories) {
    const cached = categoryFoldersCache.get(catKey);
    if (cached) {
      const sec = DHAKA_SECTIONS[catKey];
      for (const f of cached.folders) {
        if (!f.isFolder || seenUrls.has(f.href)) continue;
        if (f.name.toLowerCase().includes(cleanQ)) {
          seenUrls.add(f.href);
          const { title, year, quality } = parseFolderTitle(f.name);
          liveResults.push({
            id: Buffer.from(f.href).toString("base64url"),
            title,
            rawName: f.name,
            year,
            quality,
            serverUrl: f.href,
            sourceServer: sec ? sec.server : "DhakaFlix",
            category: sec ? sec.label : "DhakaFlix Media",
            poster: `${f.href}a_AL_.jpg`,
            modifiedDate: f.date || "2026",
          });
        }
      }
    }
  }

  const combined = [...liveResults, ...snapshotResults];
  if (combined.length >= maxResults) {
    return combined.slice(0, maxResults);
  }

  // 3. Only if still under maxResults and cache was cold for trending movies, fetch movies1080p safely
  if (!categoryFoldersCache.has("movies1080p")) {
    try {
      const folders = await getCategoryMovieFolders("movies1080p");
      const sec = DHAKA_SECTIONS.movies1080p;
      for (const f of folders) {
        if (!f.isFolder || seenUrls.has(f.href)) continue;
        if (f.name.toLowerCase().includes(cleanQ)) {
          seenUrls.add(f.href);
          const { title, year, quality } = parseFolderTitle(f.name);
          combined.push({
            id: Buffer.from(f.href).toString("base64url"),
            title,
            rawName: f.name,
            year,
            quality,
            serverUrl: f.href,
            sourceServer: sec ? sec.server : "Server 14",
            category: sec ? sec.label : "DhakaFlix Media",
            poster: `${f.href}a_AL_.jpg`,
            modifiedDate: f.date || "2026",
          });
          if (combined.length >= maxResults) break;
        }
      }
    } catch {}
  }

  return combined.slice(0, maxResults);
}
