/**
 * build-snapshot.ts
 * Run locally (requires BDIX LAN access) to rebuild lib/catalog-snapshot.json.
 * This JSON becomes the static catalog served on Vercel / cloud deployments.
 *
 * Usage:
 *   npx tsx scripts/build-snapshot.ts              (default: 120 top movies per category, ~1 min)
 *   npx tsx scripts/build-snapshot.ts --limit=200  (200 movies per category)
 *   npx tsx scripts/build-snapshot.ts --all        (all movies across all years)
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ── Config ───────────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SNAPSHOT_PATH = path.resolve(__dirname, "../lib/catalog-snapshot.json");
const TMDB_API_KEY = process.env.TMDB_API_KEY || "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE    = "https://api.themoviedb.org/3";
const TMDB_IMG     = "https://image.tmdb.org/t/p";
const CONCURRENCY  = 12; // concurrent workers
const REQUEST_DELAY_MS = 60; // ms between TMDb calls

// Parse CLI flags
const args = process.argv.slice(2);
const isAll = args.includes("--all");
const limitFlag = args.find((a) => a.startsWith("--limit="));
const DEFAULT_LIMIT = isAll ? Infinity : (limitFlag ? parseInt(limitFlag.split("=")[1], 10) : 120);

// ── DhakaFlix Section Map ────────────────────────────────────────────────────

const DHAKA_SERVERS = {
  server14: "http://172.16.50.14",
  server7:  "http://172.16.50.7",
  server12: "http://172.16.50.12",
  server10: "http://172.16.50.10",
};

const DHAKA_SECTIONS: Record<string, { label: string; server: string; url: string; isContainer: boolean }> = {
  movies1080p:   { label: "English Movies -1080p",       server: "Server 14", url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/English%20Movies%20%281080p%29/`,           isContainer: true },
  movies720p:    { label: "English Movies",               server: "Server 7",  url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/English%20Movies/`,                           isContainer: true },
  hindi:         { label: "Hindi Movies",                 server: "Server 14", url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Hindi%20Movies/`,                           isContainer: true },
  southMovies:   { label: "South Indian Movies",          server: "Server 14", url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/`,   isContainer: true },
  southDubbed:   { label: "South-Movie Hindi Dubbed",     server: "Server 14", url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/`,   isContainer: true },
  kolkata:       { label: "Kolkata Bangla Movies",        server: "Server 7",  url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/`,                  isContainer: true },
  animation:     { label: "Animation Movies",             server: "Server 14", url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies/`,                       isContainer: true },
  animation1080p:{ label: "Animation Movies -1080p",      server: "Server 14", url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/`,         isContainer: false },
  foreign:       { label: "Foreign Language Movies",      server: "Server 7",  url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Foreign%20Language%20Movies/`,                isContainer: true },
  imdb250:       { label: "IMDb Top-250 Movies",          server: "Server 14", url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/IMDb%20Top-250%20Movies/`,                  isContainer: false },
  movies3D:      { label: "3D Movies",                    server: "Server 7",  url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/3D%20Movies/`,                                isContainer: false },
  tvSeries:      { label: "TV & Web Series",              server: "Server 12", url: `${DHAKA_SERVERS.server12}/DHAKA-FLIX-12/TV-WEB-Series/`,                            isContainer: true },
};

// ── Pre-load Existing Snapshot for 0ms Instant Cache ─────────────────────────

let existingItemsMap = new Map<string, any>();
try {
  if (fs.existsSync(SNAPSHOT_PATH)) {
    const raw = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, "utf8"));
    for (const cat of Object.values(raw) as any[]) {
      for (const item of (cat.items || [])) {
        if (item.serverUrl) existingItemsMap.set(item.serverUrl, item);
        if (item.rawName) existingItemsMap.set(item.rawName, item);
      }
    }
    console.log(`Loaded ${existingItemsMap.size} pre-cached items from existing snapshot.`);
  }
} catch (e) {
  console.log("Starting fresh snapshot.");
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i;

async function fetchDir(urlStr: string): Promise<{ href: string; name: string; date: string; size: string; isFolder: boolean }[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(urlStr, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const html = await res.text();
    const regex = /<td class="fb-n"><a href="([^"]+)">([^<]+)<\/a><\/td><td class="fb-d">([^<]*)<\/td><td class="fb-s">([^<]*)<\/td>/g;
    const matches = [...html.matchAll(regex)];
    return matches
      .filter((m) => m[2] !== "Parent Directory")
      .map((m) => {
        const href = new URL(m[1], urlStr).href;
        const name = m[2];
        const date = m[3];
        const size = m[4];
        const isFolder = !size && href.endsWith("/");
        return { href, name, date, size, isFolder };
      });
  } catch {
    return [];
  }
}

function parseFolderTitle(folderName: string) {
  const yearMatch = folderName.match(/\(((?:19|20)\d{2})\)/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : new Date().getFullYear();
  let title = folderName;
  if (yearMatch && yearMatch.index !== undefined) {
    title = folderName.substring(0, yearMatch.index).trim();
  } else {
    title = folderName.replace(/(1080p|720p|2160p|4k|bluray|webrip|amzn|nf).*/i, "").trim();
  }
  title = title.replace(/\(TV (Mini )?Series.*\)/i, "").trim();
  title = title.replace(/^\d{1,3}[.\-_\s]+\s*/, "").trim();
  title = title.replace(/-(Part|Episode|The|Volume)/i, ": $1");
  title = title.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  let quality = "720p";
  if (/1080p/i.test(folderName)) quality = "1080p";
  else if (/2160p|4k/i.test(folderName)) quality = "4K UHD";
  if (/Dual\s*Audio/i.test(folderName)) quality += " Dual Audio";
  if (/IMAX/i.test(folderName)) quality += " IMAX";
  return { title: title || folderName, year, quality };
}

async function getCategoryFolders(catKey: string): Promise<{ href: string; name: string; date: string; size: string; isFolder: boolean }[]> {
  const sec = DHAKA_SECTIONS[catKey];
  if (!sec) return [];

  if (!sec.isContainer) {
    const raw = await fetchDir(sec.url);
    return raw.filter((f) => f.isFolder);
  }

  const sub = await fetchDir(sec.url);
  const containers = sub.filter((f) => f.isFolder);

  // Sort reverse chronological
  containers.sort((a, b) => {
    const yA = a.name.match(/\d{4}/);
    const yB = b.name.match(/\d{4}/);
    if (yA && yB) return parseInt(yB[0]) - parseInt(yA[0]);
    if (yA) return -1;
    if (yB) return 1;
    return a.name.localeCompare(b.name);
  });

  const arrays = await Promise.all(containers.map((c) => fetchDir(c.href).catch(() => [])));
  return arrays.flat().filter((f) => f.isFolder);
}

async function getVideoFile(folderUrl: string): Promise<{ url: string; name: string; size: string } | null> {
  try {
    const items = await fetchDir(folderUrl);
    const video = items.find((i) => !i.isFolder && VIDEO_EXTENSIONS.test(i.name));
    if (!video) return null;
    return { url: video.href, name: video.name, size: video.size };
  } catch {
    return null;
  }
}

// ── TMDb Enrichment ───────────────────────────────────────────────────────────

const tmdbCache = new Map<string, any>();

async function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

async function searchTMDb(title: string): Promise<any | null> {
  if (tmdbCache.has(title)) return tmdbCache.get(title);

  try {
    await sleep(REQUEST_DELAY_MS);
    const url = `${TMDB_BASE}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(title)}&include_adult=true&language=en-US&page=1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    const result = (data.results || [])[0] || null;
    tmdbCache.set(title, result);
    return result;
  } catch {
    return null;
  }
}

function formatFileSize(kbStr: string): string {
  const m = kbStr.match(/(\d+)\s*KB/i);
  if (!m) return kbStr || "Unknown";
  const kb = parseInt(m[1]);
  if (kb > 1024 * 1024) return (kb / (1024 * 1024)).toFixed(2) + " GB";
  return (kb / 1024).toFixed(0) + " MB";
}

// ── Pool-based concurrency ────────────────────────────────────────────────────

async function processWithConcurrency<T, R>(
  items: T[],
  fn: (item: T, idx: number) => Promise<R>,
  limit: number
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let idx = 0;

  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }

  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function buildCategory(catKey: string) {
  const sec = DHAKA_SECTIONS[catKey];
  console.log(`\n[${catKey}] Crawling ${sec.label}...`);

  const allFolders = await getCategoryFolders(catKey);
  const maxToProcess = catKey === "imdb250" || catKey === "movies3D" 
    ? allFolders.length 
    : Math.min(allFolders.length, DEFAULT_LIMIT);

  const targetFolders = allFolders.slice(0, maxToProcess);
  console.log(`[${catKey}] Discovered ${allFolders.length} total folders; processing top ${targetFolders.length}...`);

  const items: any[] = [];

  await processWithConcurrency(targetFolders, async (folder, i) => {
    // Check if we already have this item cached from previous snapshot
    const cachedItem = existingItemsMap.get(folder.href) || existingItemsMap.get(folder.name);
    if (cachedItem && cachedItem.poster && !cachedItem.poster.endsWith("a_AL_.jpg")) {
      items.push({
        ...cachedItem,
        serverUrl: folder.href,
        sourceServer: sec.server,
        category: sec.label,
        modifiedDate: folder.date || cachedItem.modifiedDate || "2026",
      });
      return;
    }

    const { title, year, quality } = parseFolderTitle(folder.name);
    const id = Buffer.from(folder.href).toString("base64url");
    const localPoster = `${folder.href}a_AL_.jpg`;

    // Get video file
    const video = await getVideoFile(folder.href);

    // Enrich with TMDb
    let poster = localPoster;
    let backdrop: string | undefined;
    let overview: string | undefined;
    let rating: number | undefined;

    const match = await searchTMDb(title);
    if (match) {
      const rYear = match.release_date || match.first_air_date;
      const yearOk = !rYear || rYear.startsWith(String(year)) ||
        Math.abs(parseInt(rYear) - year) <= 1;
      if (yearOk) {
        if (match.poster_path)   poster   = `${TMDB_IMG}/w500${match.poster_path}`;
        if (match.backdrop_path) backdrop = `${TMDB_IMG}/w1280${match.backdrop_path}`;
        if (match.overview)      overview = match.overview;
        if (match.vote_average)  rating   = match.vote_average;
      }
    }

    const item: any = {
      id,
      title,
      rawName: folder.name,
      year,
      quality,
      serverUrl: folder.href,
      sourceServer: sec.server,
      category: sec.label,
      poster,
      modifiedDate: folder.date || String(year),
    };
    if (backdrop) item.backdrop = backdrop;
    if (overview) item.overview = overview;
    if (rating)   item.rating   = rating;
    if (video) {
      item.videoUrl      = video.url;
      item.videoFileName = video.name;
      item.videoFileSize = formatFileSize(video.size);
    }

    items.push(item);

    if ((i + 1) % 30 === 0) {
      process.stdout.write(`  [${catKey}] ${i + 1}/${targetFolders.length} processed...\r`);
    }
  }, CONCURRENCY);

  console.log(`\n[${catKey}] ✓ ${items.length} items ready`);
  return { category: sec.label, server: sec.server, items };
}

async function main() {
  console.log("=== DhakaFlix Catalog Snapshot Builder ===");
  console.log(`Snapshot destination: ${SNAPSHOT_PATH}`);
  console.log(`Target limit per category: ${isAll ? "UNLIMITED (ALL)" : DEFAULT_LIMIT}`);

  // Verify BDIX connectivity
  try {
    const testRes = await fetch("http://172.16.50.14/DHAKA-FLIX-14/", {
      method: "HEAD",
      signal: AbortSignal.timeout(3000),
    });
    if (!testRes.ok) throw new Error("Not reachable");
    console.log("✓ BDIX LAN is reachable\n");
  } catch {
    console.error("✗ Cannot reach BDIX LAN (172.16.50.14). Are you on the BDIX network?");
    process.exit(1);
  }

  const snapshot: Record<string, any> = {};
  const categoryKeys = Object.keys(DHAKA_SECTIONS);

  for (const catKey of categoryKeys) {
    snapshot[catKey] = await buildCategory(catKey);
  }

  // Write snapshot
  console.log("\nWriting snapshot to disk...");
  fs.writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2));

  const stats = fs.statSync(SNAPSHOT_PATH);
  const totalItems = Object.values(snapshot).reduce(
    (sum: number, cat: any) => sum + (cat.items?.length || 0), 0
  );

  console.log(`\n✓ Snapshot written: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`✓ Total items across all categories: ${totalItems.toLocaleString()}`);
  console.log("\nDone! Commit lib/catalog-snapshot.json to Git, and push to deploy to Vercel.");
}

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
