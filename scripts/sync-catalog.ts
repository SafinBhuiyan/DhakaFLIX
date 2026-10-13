/**
 * scripts/sync-catalog.ts
 *
 * Automated incremental catalog synchronization for DhakaFLIX.
 * Checks BDIX servers for new movie releases and TV series episodes,
 * enriches metadata from TMDb, updates public/catalog/{category}.json,
 * rebuilds public/catalog/home.json, and optionally pushes to GitHub
 * to trigger automated Vercel redeployment.
 *
 * Usage:
 *   npx tsx scripts/sync-catalog.ts           (syncs locally without git push)
 *   npx tsx scripts/sync-catalog.ts --push    (syncs and automatically pushes changes to GitHub)
 */

import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

// ── Configuration ─────────────────────────────────────────────────────────────

const TMDB_API_KEY = process.env.TMDB_API_KEY || "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i;

const DHAKA_SERVERS = {
  server14: "http://172.16.50.14",
  server7: "http://172.16.50.7",
  server12: "http://172.16.50.12",
  server10: "http://172.16.50.10",
};

interface SectionConfig {
  id: string;
  label: string;
  server: string;
  url: string;
  isContainer: boolean;
  scanFolders?: string[]; // Specific subfolders to inspect (e.g. 2026, 2025)
}

const SECTIONS: SectionConfig[] = [
  {
    id: "movies1080p",
    label: "English Movies - 1080p",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/English%20Movies%20%281080p%29/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "hindi",
    label: "Hindi Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Hindi%20Movies/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "southDubbed",
    label: "South Movies Hindi Dubbed",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/Hindi%20Dubbed/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "southMovies",
    label: "South Indian Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "movies720p",
    label: "English Movies - 720p",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/English%20Movies/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "animation1080p",
    label: "Animation Movies - 1080p",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies%20%281080p%29/`,
    isContainer: false,
  },
  {
    id: "animation",
    label: "Animation Movies",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/Animation%20Movies/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "kolkata",
    label: "Kolkata Bangla Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Kolkata%20Bangla%20Movies/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "foreign",
    label: "Foreign Language Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/Foreign%20Language%20Movies/`,
    isContainer: true,
    scanFolders: ["2026/", "2025/", "2024/"],
  },
  {
    id: "imdb250",
    label: "IMDb Top 250",
    server: "Server 14",
    url: `${DHAKA_SERVERS.server14}/DHAKA-FLIX-14/IMDb%20Top-250%20Movies/`,
    isContainer: false,
  },
  {
    id: "movies3D",
    label: "3D Movies",
    server: "Server 7",
    url: `${DHAKA_SERVERS.server7}/DHAKA-FLIX-7/3D%20Movies/`,
    isContainer: false,
  },
];

// ── BDIX Connectivity Check ──────────────────────────────────────────────────

async function checkBdixAvailability(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch("http://172.16.50.14/DHAKA-FLIX-14/", {
      method: "HEAD",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return res.ok || res.status < 500;
  } catch {
    return false;
  }
}

// ── H5ai Directory Scraper ────────────────────────────────────────────────────

interface H5aiItem {
  href: string;
  name: string;
  date: string;
  size: string;
  isFolder: boolean;
}

async function fetchH5aiDirectory(urlStr: string): Promise<H5aiItem[]> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(urlStr, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();
    const regex =
      /<td class="fb-n"><a href="([^"]+)">([^<]+)<\/a><\/td><td class="fb-d">([^<]*)<\/td><td class="fb-s">([^<]*)<\/td>/g;
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

// ── Title Parser ─────────────────────────────────────────────────────────────

function parseFolderTitle(folderName: string) {
  const currentYear = new Date().getFullYear();
  const yearMatch = folderName.match(/\(((?:19|20)\d{2})\)/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : currentYear;

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
  if (/3D/i.test(folderName)) quality = "3D Half-SBS";

  return { title: title || folderName, year, quality };
}

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

function formatBytes(input: string): string {
  const kbMatch = String(input || "").match(/([\d\.]+)\s*KB/i);
  if (kbMatch) {
    const kb = parseFloat(kbMatch[1]);
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(2) + " GB";
    return (kb / 1024).toFixed(0) + " MB";
  }
  return input || "";
}

// ── TMDb Metadata Enrichment ──────────────────────────────────────────────────

interface TMDbResult {
  poster?: string;
  backdrop?: string;
  overview?: string;
  rating?: number;
}

async function enrichWithTMDb(title: string, year?: number, isTv = false): Promise<TMDbResult> {
  const cleanQ = title
    .replace(/[\(\[]?TV\s+(?:Mini\s+)?Series[^\)\]]*[\)\]]?/i, "")
    .replace(/\b(1080p|720p|2160p|4k)\b/gi, "")
    .trim();

  try {
    const endpoint = isTv ? "search/tv" : "search/movie";
    const yearParam = year ? (isTv ? `&first_air_date_year=${year}` : `&year=${year}`) : "";
    const url = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQ)}${yearParam}&language=en-US&page=1`;

    let res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    let data = res.ok ? await res.json() : null;

    if (!data?.results?.length && year) {
      // Fallback without year constraint
      const fallbackUrl = `${TMDB_BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanQ)}&language=en-US&page=1`;
      res = await fetch(fallbackUrl, { signal: AbortSignal.timeout(3000) });
      data = res.ok ? await res.json() : null;
    }

    const match = data?.results?.[0];
    if (match) {
      return {
        poster: match.poster_path ? `${TMDB_IMAGE_BASE}/w500${match.poster_path}` : undefined,
        backdrop: match.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${match.backdrop_path}` : undefined,
        overview: match.overview || undefined,
        rating: match.vote_average ? Number(match.vote_average.toFixed(1)) : undefined,
      };
    }
  } catch {}

  return {};
}

// ── Direct Video File Resolver ────────────────────────────────────────────────

async function resolveDirectVideo(folderUrl: string) {
  const files = await fetchH5aiDirectory(folderUrl);
  for (const f of files) {
    if (!f.isFolder && VIDEO_EXTENSIONS.test(f.name)) {
      return {
        videoUrl: f.href,
        fileName: f.name,
        fileSize: formatBytes(f.size),
      };
    }
  }
  return null;
}

// ── Scrape Seasons and Episodes for a TV Series ──────────────────────────────

async function scrapeTvSeasons(folderUrl: string) {
  const items = await fetchH5aiDirectory(folderUrl);
  const seasonFolders = items.filter((i) => i.isFolder && /season|s\d+/i.test(i.name));
  const otherFolders = items.filter((i) => i.isFolder && !/season|s\d+/i.test(i.name));
  const directVideos = items.filter((i) => !i.isFolder && VIDEO_EXTENSIONS.test(i.name));

  const targetFolders = seasonFolders.length > 0 ? seasonFolders : otherFolders;

  if (targetFolders.length > 0) {
    const seasons = [];
    for (let sIdx = 0; sIdx < targetFolders.length; sIdx++) {
      const sf = targetFolders[sIdx];
      const sNumMatch = sf.name.match(/\d+/);
      const sNum = sNumMatch ? parseInt(sNumMatch[0], 10) : sIdx + 1;

      const subFiles = await fetchH5aiDirectory(sf.href);
      const videoFiles = subFiles.filter((f) => !f.isFolder && VIDEO_EXTENSIONS.test(f.name));

      videoFiles.sort((a, b) => {
        const epA = parseEpisodeNumber(a.name, 0);
        const epB = parseEpisodeNumber(b.name, 0);
        return epA !== epB ? epA - epB : a.name.localeCompare(b.name, undefined, { numeric: true });
      });

      const episodes = videoFiles.map((vf, idx) => {
        const epNum = parseEpisodeNumber(vf.name, idx + 1);
        return {
          episodeNumber: epNum,
          seasonNumber: sNum,
          title: `Episode ${epNum}`,
          fileName: vf.name,
          streamUrl: vf.href,
          fileSize: formatBytes(vf.size),
          date: vf.date,
        };
      });

      if (episodes.length > 0) {
        seasons.push({
          seasonNumber: sNum,
          seasonName: sf.name,
          folderUrl: sf.href,
          episodes,
        });
      }
    }
    return seasons;
  } else if (directVideos.length > 0) {
    directVideos.sort((a, b) => {
      const epA = parseEpisodeNumber(a.name, 0);
      const epB = parseEpisodeNumber(b.name, 0);
      return epA !== epB ? epA - epB : a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    const episodes = directVideos.map((vf, idx) => {
      const epNum = parseEpisodeNumber(vf.name, idx + 1);
      return {
        episodeNumber: epNum,
        seasonNumber: 1,
        title: `Episode ${epNum}`,
        fileName: vf.name,
        streamUrl: vf.href,
        fileSize: formatBytes(vf.size),
        date: vf.date,
      };
    });

    return [
      {
        seasonNumber: 1,
        seasonName: "Season 1",
        folderUrl,
        episodes,
      },
    ];
  }

  return [];
}

// ── Main Synchronization Logic ────────────────────────────────────────────────

async function syncCatalog(autoPush = false) {
  console.log("====================================================");
  console.log("      DhakaFLIX Automated Catalog Sync (Daily)      ");
  console.log("====================================================");
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const isOnline = await checkBdixAvailability();
  if (!isOnline) {
    console.warn("⚠️  BDIX LAN (172.16.50.x) is not reachable from this machine.");
    console.warn("   Ensure this machine is connected to a BDIX ISP. Sync skipped.");
    return;
  }
  console.log("✓ Connected to BDIX high-speed media network.");

  const catalogDir = path.join(process.cwd(), "public", "catalog");
  if (!fs.existsSync(catalogDir)) {
    fs.mkdirSync(catalogDir, { recursive: true });
  }

  let totalNewTitles = 0;

  // 1. Sync Movies across categories
  for (const sec of SECTIONS) {
    const catalogPath = path.join(catalogDir, `${sec.id}.json`);
    let existingData: any = { category: sec.label, server: sec.server, total: 0, items: [] };

    if (fs.existsSync(catalogPath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
      } catch {}
    }

    const seenUrls = new Set<string>();
    const seenNames = new Set<string>();
    for (const item of existingData.items || []) {
      if (item.serverUrl) seenUrls.add(item.serverUrl.toLowerCase().replace(/\/+$/, ""));
      if (item.rawName) seenNames.add(item.rawName.toLowerCase().trim());
    }

    console.log(`\nChecking category: ${sec.label} (${existingData.items.length} existing titles)...`);

    // Determine target folders to scan for new uploads
    const targetScanUrls: string[] = [];
    if (sec.isContainer && sec.scanFolders?.length) {
      for (const sub of sec.scanFolders) {
        targetScanUrls.push(`${sec.url}${sub}`);
      }
    } else {
      targetScanUrls.push(sec.url);
    }

    const candidateFolders: H5aiItem[] = [];
    for (const scanUrl of targetScanUrls) {
      const items = await fetchH5aiDirectory(scanUrl);
      for (const item of items) {
        if (!item.isFolder) continue;
        const normUrl = item.href.toLowerCase().replace(/\/+$/, "");
        const normName = item.name.toLowerCase().trim();
        if (!seenUrls.has(normUrl) && !seenNames.has(normName)) {
          candidateFolders.push(item);
        }
      }
    }

    if (candidateFolders.length === 0) {
      console.log(`  ✓ Up to date (0 new titles).`);
      continue;
    }

    console.log(`  Found ${candidateFolders.length} new titles to enrich...`);
    const newItems: any[] = [];

    // Process candidate folders
    for (const folder of candidateFolders) {
      const { title, year, quality } = parseFolderTitle(folder.name);
      const videoInfo = await resolveDirectVideo(folder.href);
      const tmdb = await enrichWithTMDb(title, year, false);

      const newItem = {
        id: Buffer.from(folder.href).toString("base64url"),
        title,
        rawName: folder.name,
        year,
        quality,
        serverUrl: folder.href,
        sourceServer: sec.server,
        category: sec.label,
        poster: tmdb.poster || `${folder.href}a_AL_.jpg`,
        backdrop: tmdb.backdrop,
        overview: tmdb.overview,
        rating: tmdb.rating,
        modifiedDate: folder.date || "2026",
        videoUrl: videoInfo?.videoUrl,
        videoFileName: videoInfo?.fileName,
        videoFileSize: videoInfo?.fileSize,
      };

      newItems.push(newItem);
      console.log(`   + Added: "${title}" (${year})`);
    }

    if (newItems.length > 0) {
      existingData.items = [...newItems, ...existingData.items];
      existingData.total = existingData.items.length;
      fs.writeFileSync(catalogPath, JSON.stringify(existingData), "utf-8");
      totalNewTitles += newItems.length;
      console.log(`  ✓ Saved ${newItems.length} new titles to ${sec.id}.json.`);
    }
  }

  // 2. Sync TV & Web Series
  const tvCatalogPath = path.join(catalogDir, "tvSeries.json");
  if (fs.existsSync(tvCatalogPath)) {
    console.log(`\nChecking TV & Web Series for new shows and episodes...`);
    let tvData: any = JSON.parse(fs.readFileSync(tvCatalogPath, "utf-8"));
    const seenTvUrls = new Set<string>();
    const seenTvNames = new Set<string>();

    for (const item of tvData.items || []) {
      if (item.serverUrl) seenTvUrls.add(item.serverUrl.toLowerCase().replace(/\/+$/, ""));
      if (item.rawName) seenTvNames.add(item.rawName.toLowerCase().trim());
    }

    const tvBuckets = [
      "TV Series ★  0  —  9/",
      "TV Series ♥  A  —  L/",
      "TV Series ♦  M  —  R/",
      "TV Series ♦  S  —  Z/",
    ];

    let newShows = 0;
    for (const bucket of tvBuckets) {
      const bucketUrl = `${DHAKA_SERVERS.server12}/DHAKA-FLIX-12/TV-WEB-Series/${encodeURIComponent(bucket)}/`;
      const folders = await fetchH5aiDirectory(bucketUrl);

      for (const f of folders) {
        if (!f.isFolder) continue;
        const normUrl = f.href.toLowerCase().replace(/\/+$/, "");
        const normName = f.name.toLowerCase().trim();

        if (!seenTvUrls.has(normUrl) && !seenTvNames.has(normName)) {
          const { title, year, quality } = parseFolderTitle(f.name);
          const seasons = await scrapeTvSeasons(f.href);
          const tmdb = await enrichWithTMDb(title, year, true);

          const newTvItem = {
            id: Buffer.from(f.href).toString("base64url"),
            title,
            rawName: f.name,
            year,
            quality,
            serverUrl: f.href,
            sourceServer: "Server 12",
            category: "TV & Web Series",
            poster: tmdb.poster || `${f.href}a_AL_.jpg`,
            backdrop: tmdb.backdrop,
            overview: tmdb.overview,
            rating: tmdb.rating,
            modifiedDate: f.date || "2026",
            seasons,
            totalSeasons: seasons.length,
            totalEpisodes: seasons.reduce((acc: number, s: any) => acc + s.episodes.length, 0),
          };

          tvData.items.unshift(newTvItem);
          seenTvUrls.add(normUrl);
          newShows++;
          console.log(`   + Added TV Series: "${title}" (${seasons.length} seasons)`);
        }
      }
    }

    if (newShows > 0) {
      tvData.total = tvData.items.length;
      fs.writeFileSync(tvCatalogPath, JSON.stringify(tvData), "utf-8");
      totalNewTitles += newShows;
      console.log(`  ✓ Saved ${newShows} new TV series to tvSeries.json.`);
    } else {
      console.log(`  ✓ TV Series catalog is up to date.`);
    }
  }

  // 3. Rebuild Curated Home Catalog (home.json)
  console.log(`\nUpdating public/catalog/home.json with fresh releases...`);
  const homePath = path.join(catalogDir, "home.json");
  const homeSections: Array<{ id: string; title: string; subtitle?: string; server?: string; total?: number; items: any[] }> = [];

  const mainCategories = [
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

  for (const cat of mainCategories) {
    const filePath = path.join(catalogDir, `${cat.id}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const catData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        homeSections.push({
          id: cat.id,
          title: cat.title,
          total: catData.items?.length || 0,
          items: (catData.items || []).slice(0, 24),
        });
      } catch {}
    }
  }

  // Spotlight: Top 5 items with high ratings and backdrops
  const candidateSpotlight = (homeSections[0]?.items || []).filter((i: any) => i.backdrop);
  const spotlight = (candidateSpotlight.length >= 3 ? candidateSpotlight : homeSections[0]?.items || []).slice(0, 5);

  const homeData = {
    updatedAt: new Date().toISOString(),
    spotlight,
    sections: homeSections,
  };

  fs.writeFileSync(homePath, JSON.stringify(homeData), "utf-8");
  console.log("✓ Updated public/catalog/home.json successfully.");

  // 4. Git Auto-Commit & Push (if enabled)
  if (autoPush) {
    console.log("\nChecking git status for catalog updates...");
    try {
      const gitStatus = execSync("git status --porcelain public/catalog/").toString().trim();
      if (gitStatus) {
        console.log("Changes detected in public/catalog/. Committing and pushing...");
        execSync("git add public/catalog/");
        const commitMsg = `chore(catalog): automated daily sync [${new Date().toISOString().split("T")[0]}]`;
        execSync(`git commit -m "${commitMsg}"`);
        console.log(`Committed: "${commitMsg}"`);
        console.log("Pushing to origin/master...");
        execSync("git push origin master");
        console.log("✓ Successfully pushed to GitHub! Vercel redeployment triggered.");
      } else {
        console.log("✓ No changes to commit in public/catalog/.");
      }
    } catch (err: any) {
      console.error("Git push failed:", err.message);
    }
  }

  console.log("\n====================================================");
  console.log(`Sync complete! Total new titles indexed: ${totalNewTitles}`);
  console.log("====================================================");
}

// CLI Execution
const args = process.argv.slice(2);
const shouldPush = args.includes("--push");

syncCatalog(shouldPush).catch((err) => {
  console.error("Sync error:", err);
  process.exit(1);
});
