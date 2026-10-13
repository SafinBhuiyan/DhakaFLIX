import fs from "fs";
import path from "path";

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
  const prioritySections = ["tvSeries", "movies1080p", "hindi", "imdb250", "southDubbed", "animation1080p", "foreign", "kolkata"];
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
    // If specific category is not found, fallback to movies1080p
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
  { id: "hindi", title: "Hindi & Bollywood" },
  { id: "imdb250", title: "IMDb Top 250" },
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
  const tvCatalog = await getCategoryCatalog("tvSeries");
  if (!tvCatalog?.items || !Array.isArray(tvCatalog.items)) return null;

  const cleanT = (s?: string) =>
    (s || "")
      .toLowerCase()
      .replace(/[\(\[]?tv\s+(?:mini\s+)?series[^\)\]]*[\)\]]?/gi, "")
      .replace(/\b(1080p|720p|2160p|4k)\b/gi, "")
      .trim();

  const normUrl = url ? url.toLowerCase().replace(/\/+$/, "") : "";
  const normTitle = cleanT(title);

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
