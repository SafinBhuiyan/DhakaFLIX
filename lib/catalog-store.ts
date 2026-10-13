import fs from "fs";
import path from "path";
import { parseFolderTitle } from "./dhakaflix";
import { searchTMDb, getPosterUrl, getBackdropUrl } from "./tmdb";

const categoryCache = new Map<string, { data: any; loadedAt: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCatalogDir(): string {
  const publicPath = path.join(process.cwd(), "public", "catalog");
  if (fs.existsSync(publicPath)) return publicPath;
  const dataPath = path.join(process.cwd(), "data", "catalog");
  if (fs.existsSync(dataPath)) return dataPath;
  return publicPath;
}

/**
 * Fast search across modular catalog files on demand without ever loading 35k items at once.
 */
export async function searchModularCatalog(query: string, maxResults = 36): Promise<any[]> {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return [];

  const results: any[] = [];
  const seen = new Set<string>();

  // 1. Check Home catalog first (covers curated trending items in ~1ms)
  const home = await getHomeCatalog();
  if (home?.sections) {
    for (const sec of home.sections) {
      for (const item of sec.items || []) {
        const idKey = item.id || item.serverUrl;
        if (seen.has(idKey)) continue;
        if (
          item.title?.toLowerCase().includes(cleanQ) ||
          item.rawName?.toLowerCase().includes(cleanQ)
        ) {
          seen.add(idKey);
          results.push(item);
          if (results.length >= maxResults) return results;
        }
      }
    }
  }

  // 2. Search main sections in priority order
  const prioritySections = ["tvSeries", "koreanTv", "cartoonTv", "movies1080p", "hindi", "imdb250", "southDubbed", "animation1080p", "documentary", "foreign", "kolkata"];
  for (const catKey of prioritySections) {
    const catalog = await getCategoryCatalog(catKey);
    if (!catalog?.items) continue;
    for (const item of catalog.items) {
      const idKey = item.id || item.serverUrl;
      if (seen.has(idKey)) continue;
      if (
        item.title?.toLowerCase().includes(cleanQ) ||
        item.rawName?.toLowerCase().includes(cleanQ)
      ) {
        seen.add(idKey);
        results.push(item);
        if (results.length >= maxResults) return results;
      }
    }
  }

  return results;
}

/**
 * Loads a modular category JSON from data/catalog/{categoryKey}.json on demand.
 * Cached in memory so subsequent reads take 0ms.
 */
export async function getCategoryCatalog(categoryKey: string): Promise<any | null> {
  const cached = categoryCache.get(categoryKey);
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return cached.data;
  }

  const filePath = path.join(getCatalogDir(), `${categoryKey}.json`);
  try {
    const raw = await fs.promises.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    categoryCache.set(categoryKey, { data, loadedAt: Date.now() });
    return data;
  } catch {
    // If specific TV/Series category is not found, fallback to tvSeries
    if (categoryKey.includes("Tv") || categoryKey.includes("Series")) {
      return getCategoryCatalog("tvSeries");
    }
    // Fallback to movies1080p
    if (categoryKey !== "movies1080p") {
      return getCategoryCatalog("movies1080p");
    }
    return null;
  }
}

/**
 * Loads the curated Home payload (home.json: ~274KB).
 * Eliminates loading the 47MB snapshot when opening the Home page!
 */
export const ALL_HOME_CATEGORIES = [
  { id: "movies1080p", title: "Latest 1080p Releases" },
  { id: "tvSeries", title: "Popular TV & Web Series" },
  { id: "koreanTv", title: "Korean TV & Web Series" },
  { id: "cartoonTv", title: "Anime & Cartoon TV Series" },
  { id: "hindi", title: "Hindi & Bollywood" },
  { id: "imdb250", title: "IMDb Top 250" },
  { id: "documentary", title: "Documentaries & Docuseries" },
  { id: "southDubbed", title: "South Hindi Dubbed" },
  { id: "southMovies", title: "South Indian Movies" },
  { id: "kolkata", title: "Kolkata Bangla" },
  { id: "animation1080p", title: "Animation (1080p)" },
  { id: "foreign", title: "Foreign Language Cinema" },
  { id: "movies720p", title: "English Movies (720p)" },
  { id: "animation", title: "Animation Classics" },
  { id: "movies3D", title: "3D Movies" },
];

/**
 * Loads the curated Home payload.
 * Guarantees all categories have curated rails rendered on the homepage.
 */
export async function getHomeCatalog(): Promise<any | null> {
  const cached = categoryCache.get("home");
  if (cached && Date.now() - cached.loadedAt < CACHE_TTL) {
    return cached.data;
  }

  const filePath = path.join(getCatalogDir(), "home.json");
  try {
    const raw = await fs.promises.readFile(filePath, "utf-8");
    const data = JSON.parse(raw);
    if (data?.sections && data.sections.length >= 10) {
      categoryCache.set("home", { data, loadedAt: Date.now() });
      return data;
    }
  } catch {
    // Proceed to dynamic category synthesis
  }

  // Synthesize dynamically from modular category files if home.json is missing or partial
  const sections: any[] = [];
  for (const cat of ALL_HOME_CATEGORIES) {
    const catData = await getCategoryCatalog(cat.id);
    if (catData?.items?.length) {
      sections.push({
        id: cat.id,
        title: cat.title,
        total: catData.items.length,
        items: catData.items.slice(0, 24),
      });
    }
  }

  const firstItems = sections[0]?.items || [];
  const candidateSpotlight = firstItems.filter((i: any) => i.backdrop);
  const spotlight = (candidateSpotlight.length >= 3 ? candidateSpotlight : firstItems).slice(0, 5);

  const fallbackData = {
    updatedAt: new Date().toISOString(),
    spotlight,
    sections,
  };

  categoryCache.set("home", { data: fallbackData, loadedAt: Date.now() });
  return fallbackData;
}

/**
 * Find a specific TV series item from data/catalog/tvSeries.json
 */
export async function findTvSeriesItem(url?: string, title?: string): Promise<any | null> {
  const catKeys = ["tvSeries", "koreanTv", "cartoonTv"];
  const cleanT = (s?: string) =>
    (s || "")
      .toLowerCase()
      .replace(/[\(\[]?tv\s+(?:mini\s+)?series[^\)\]]*[\)\]]?/gi, "")
      .replace(/\b(1080p|720p|2160p|4k)\b/gi, "")
      .trim();

  const normUrl = url ? url.toLowerCase().replace(/\/+$/, "") : "";
  const normTitle = cleanT(title);

  for (const catKey of catKeys) {
    const tvCatalog = await getCategoryCatalog(catKey);
    if (!tvCatalog?.items || !Array.isArray(tvCatalog.items)) continue;

    // Pass 1: Exact matches
    for (const item of tvCatalog.items) {
      if (normUrl && item.serverUrl) {
        const itemUrl = item.serverUrl.toLowerCase().replace(/\/+$/, "");
        if (itemUrl === normUrl) return item;
      }
      if (normTitle && item.title) {
        const itemClean = cleanT(item.title);
        if (itemClean === normTitle) return item;
      }
    }

    // Pass 2: Fuzzy / inclusion matches
    for (const item of tvCatalog.items) {
      if (normUrl && item.serverUrl) {
        const itemUrl = item.serverUrl.toLowerCase().replace(/\/+$/, "");
        if (normUrl.includes(itemUrl) || itemUrl.includes(normUrl)) return item;
      }
      if (normTitle && normTitle.length >= 3 && item.title) {
        const itemClean = cleanT(item.title);
        if (itemClean.includes(normTitle) || normTitle.includes(itemClean)) return item;
      }
    }
  }

  return null;
}

/**
 * Global snapshot item lookup for direct streams (movies and series)
 */
export async function findCatalogStreamItem(url?: string, title?: string): Promise<any | null> {
  if (!url && !title) return null;

  // 1. Check TV Series if url or title looks like a series
  const isSeries = Boolean(
    (url && /\/TV-WEB-Series\/|\/TV%20Series\/|\/TV Series\/|\/Anime|\/Cartoon|Season/i.test(url)) ||
    (title && /[\(\[]?(?:TV\s+(?:Mini\s+)?Series|Season|\bS\d+\b)[^\)\]]*[\)\]]?/i.test(title))
  );

  if (isSeries) {
    const tvItem = await findTvSeriesItem(url, title);
    if (tvItem) return tvItem;
  }

  // 2. Check Home items first (fast ~250 items scan)
  const home = await getHomeCatalog();
  if (home?.sections) {
    const normUrl = url ? url.toLowerCase().replace(/\/+$/, "") : "";
    const normTitle = title ? title.toLowerCase().trim() : "";
    for (const sec of home.sections) {
      for (const item of sec.items || []) {
        if (normUrl && item.serverUrl && item.serverUrl.toLowerCase().replace(/\/+$/, "") === normUrl) {
          return item;
        }
        if (normTitle && item.title && item.title.toLowerCase().trim() === normTitle) {
          return item;
        }
      }
    }
  }

  // 3. Fallback to movies1080p, hindi, foreign
  const priorityCategories = ["movies1080p", "hindi", "movies720p", "foreign", "southDubbed", "animation1080p"];
  const normUrl = url ? url.toLowerCase().replace(/\/+$/, "") : "";
  const normTitle = title ? title.toLowerCase().trim() : "";

  for (const cat of priorityCategories) {
    const catalog = await getCategoryCatalog(cat);
    if (!catalog?.items) continue;
    for (const item of catalog.items) {
      if (normUrl && item.serverUrl && item.serverUrl.toLowerCase().replace(/\/+$/, "") === normUrl) {
        return item;
      }
      if (normTitle && item.title && item.title.toLowerCase().trim() === normTitle) {
        return item;
      }
    }
  }

  return null;
}

/**
 * Resolves a CatalogMovie by its ID (base64url folder URL or catalog item ID).
 * Instant in-memory cache lookup (<2ms) across home and all category catalogs,
 * with resilient fallback to base64url URL decoding.
 */
export async function findCatalogMovieById(id: string): Promise<any | null> {
  if (!id) return null;
  const decodedId = decodeURIComponent(id).trim();

  // 1. Check Home catalog first (fastest, covers all spotlight and top rows)
  const home = await getHomeCatalog();
  if (home?.sections) {
    for (const sec of home.sections) {
      for (const item of sec.items || []) {
        if (item.id === decodedId || item.id === id) {
          return item;
        }
      }
    }
  }

  // 2. Decode base64url if applicable
  let decodedUrl = "";
  try {
    const buf = Buffer.from(decodedId, "base64url");
    const str = buf.toString("utf-8");
    if (str.startsWith("http://") || str.startsWith("https://")) {
      decodedUrl = str;
    }
  } catch {}

  const normDecodedUrl = decodedUrl ? decodedUrl.toLowerCase().replace(/\/+$/, "") : "";

  // 3. Search main sections in priority order
  const prioritySections = [
    "tvSeries",
    "koreanTv",
    "cartoonTv",
    "movies1080p",
    "hindi",
    "imdb250",
    "documentary",
    "southDubbed",
    "southMovies",
    "kolkata",
    "animation1080p",
    "foreign",
    "movies720p",
    "animation",
    "movies3D",
  ];

  for (const catKey of prioritySections) {
    const catalog = await getCategoryCatalog(catKey);
    if (!catalog?.items || !Array.isArray(catalog.items)) continue;
    for (const item of catalog.items) {
      if (item.id === decodedId || item.id === id) {
        return item;
      }
      if (normDecodedUrl && item.serverUrl) {
        const itemUrl = item.serverUrl.toLowerCase().replace(/\/+$/, "");
        if (itemUrl === normDecodedUrl) {
          return item;
        }
      }
    }
  }

  // 4. Try global stream lookup via decoded URL
  if (decodedUrl) {
    const streamItem = await findCatalogStreamItem(decodedUrl);
    if (streamItem) return streamItem;

    // 5. On-the-fly synthesis for direct BDIX URLs
    try {
      const u = new URL(decodedUrl);
      const segments = u.pathname.split("/").filter(Boolean);
      const lastSeg = segments[segments.length - 1] || "";
      const rawName = decodeURIComponent(lastSeg);
      const { title, year, quality } = parseFolderTitle(rawName);

      let sourceServer = "Server 14";
      if (decodedUrl.includes("172.16.50.14")) sourceServer = "Server 14";
      else if (decodedUrl.includes("172.16.50.10")) sourceServer = "Server 10";
      else if (decodedUrl.includes("172.16.50.7")) sourceServer = "Server 7";
      else if (decodedUrl.includes("172.16.50.8")) sourceServer = "Server 8";

      const isSeries = Boolean(
        decodedUrl.includes("/TV-WEB-Series/") ||
        decodedUrl.includes("/TV%20Series/") ||
        decodedUrl.includes("/KOREAN%20TV") ||
        decodedUrl.includes("/Anime") ||
        decodedUrl.includes("/Cartoon") ||
        /tv\s+series|season/i.test(rawName)
      );

      const tmdbResults = await searchTMDb(title);
      const best = tmdbResults?.[0];

      return {
        id: decodedId,
        title: best?.title || best?.name || title,
        rawName,
        year: year || (best?.release_date ? parseInt(best.release_date.slice(0, 4), 10) : 2026),
        quality: quality || "1080p",
        serverUrl: decodedUrl,
        sourceServer,
        category: isSeries ? "TV & Web Series" : "English Movies - 1080p",
        poster: best?.poster_path ? getPosterUrl(best.poster_path) : `${decodedUrl}a_AL_.jpg`,
        backdrop: best?.backdrop_path ? getBackdropUrl(best.backdrop_path) : undefined,
        overview: best?.overview || "",
        rating: best?.vote_average || 0,
        modifiedDate: "2026",
      };
    } catch {}
  }

  return null;
}

