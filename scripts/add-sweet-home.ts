import fs from "fs";
import path from "path";

const TMDB_API_KEY = "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i;

const folderUrl = "http://172.16.50.14/DHAKA-FLIX-14/KOREAN%20TV%20%26%20WEB%20Series/Sweet%20Home%20%28TV%20Series%202020%E2%80%932024%29%201080p%20%5BMulti%20Audio%5D/";
const folderName = "Sweet Home (TV Series 2020–2024) 1080p [Multi Audio]";

function formatBytes(input: string): string {
  const kbMatch = String(input || "").match(/([\d\.]+)\s*KB/i);
  if (kbMatch) {
    const kb = parseFloat(kbMatch[1]);
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(2) + " GB";
    return (kb / 1024).toFixed(0) + " MB";
  }
  return input || "";
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

async function fetchH5aiDirectory(urlStr: string) {
  try {
    const res = await fetch(urlStr);
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
  } catch (e) {
    console.error("fetchH5aiDirectory error:", e);
    return [];
  }
}

async function main() {
  console.log("=== Indexing Sweet Home TV Series ===");

  // 1. Fetch Show details from TMDb
  console.log("1. Fetching show metadata from TMDb...");
  const tmdbSearchUrl = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent("Sweet Home")}&first_air_date_year=2020&language=en-US`;
  const searchRes = await fetch(tmdbSearchUrl);
  const searchData = await searchRes.json();
  const showMatch = searchData.results?.[0];

  if (!showMatch) {
    throw new Error("Could not find Sweet Home on TMDb!");
  }

  const showId = showMatch.id;
  const showTitle = showMatch.name || "Sweet Home";
  const poster = showMatch.poster_path ? `${TMDB_IMAGE_BASE}/w500${showMatch.poster_path}` : `${folderUrl}a_AL_.jpg`;
  const backdrop = showMatch.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${showMatch.backdrop_path}` : undefined;
  const overview = showMatch.overview;
  const rating = showMatch.vote_average ? Number(showMatch.vote_average.toFixed(1)) : 8.2;

  console.log(`✓ TMDb Show Match: ${showTitle} (ID: ${showId}, Rating: ${rating})`);

  // 2. Fetch Seasons from BDIX server
  console.log("2. Fetching seasons & files from BDIX Server 14...");
  const rootItems = await fetchH5aiDirectory(folderUrl);
  const seasonFolders = rootItems.filter((i) => i.isFolder && /season|s\d+/i.test(i.name));

  seasonFolders.sort((a, b) => {
    const numA = parseInt(a.name.match(/\d+/)?.[0] || "0", 10);
    const numB = parseInt(b.name.match(/\d+/)?.[0] || "0", 10);
    return numA - numB;
  });

  const seasons = [];

  for (let sIdx = 0; sIdx < seasonFolders.length; sIdx++) {
    const sf = seasonFolders[sIdx];
    const sNumMatch = sf.name.match(/\d+/);
    const sNum = sNumMatch ? parseInt(sNumMatch[0], 10) : sIdx + 1;

    console.log(`  Scanning ${sf.name} (Season ${sNum})...`);

    // Fetch TMDb season episodes for episode metadata enrichment
    let tmdbEps: any[] = [];
    try {
      const tmdbSeasonUrl = `${TMDB_BASE_URL}/tv/${showId}/season/${sNum}?api_key=${TMDB_API_KEY}`;
      const tmdbSeasonRes = await fetch(tmdbSeasonUrl);
      if (tmdbSeasonRes.ok) {
        const tmdbSeasonData = await tmdbSeasonRes.json();
        tmdbEps = tmdbSeasonData.episodes || [];
      }
    } catch (err) {
      console.warn(`  Warning: Could not fetch TMDb season ${sNum} details`);
    }

    const subFiles = await fetchH5aiDirectory(sf.href);
    const videoFiles = subFiles.filter((f) => !f.isFolder && VIDEO_EXTENSIONS.test(f.name));

    videoFiles.sort((a, b) => {
      const epA = parseEpisodeNumber(a.name, 0);
      const epB = parseEpisodeNumber(b.name, 0);
      return epA !== epB ? epA - epB : a.name.localeCompare(b.name, undefined, { numeric: true });
    });

    const episodes = videoFiles.map((vf, idx) => {
      const epNum = parseEpisodeNumber(vf.name, idx + 1);
      const tmdbEp = tmdbEps.find((e: any) => e.episode_number === epNum);

      return {
        id: Buffer.from(vf.href).toString("base64url"),
        episodeNumber: epNum,
        seasonNumber: sNum,
        title: tmdbEp?.name || `Episode ${epNum}`,
        overview: tmdbEp?.overview || "",
        still: tmdbEp?.still_path ? `${TMDB_IMAGE_BASE}/w500${tmdbEp.still_path}` : null,
        voteAverage: tmdbEp?.vote_average ? Number(tmdbEp.vote_average.toFixed(1)) : undefined,
        fileName: vf.name,
        streamUrl: vf.href,
        fileSize: formatBytes(vf.size),
        date: vf.date || tmdbEp?.air_date || "2024-07-20",
      };
    });

    console.log(`  ✓ Season ${sNum}: ${episodes.length} episodes indexed`);

    seasons.push({
      seasonNumber: sNum,
      seasonName: sf.name,
      folderUrl: sf.href,
      episodes,
    });
  }

  const totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);
  const id = Buffer.from(folderUrl).toString("base64url");

  const sweetHomeItem = {
    id,
    title: showTitle,
    rawName: folderName,
    year: 2020,
    quality: "1080p Multi Audio",
    serverUrl: folderUrl,
    sourceServer: "Server 14",
    category: "TV & Web Series",
    poster,
    backdrop,
    overview,
    rating,
    modifiedDate: "2024-07-20 00:00",
    seasons,
    totalSeasons: seasons.length,
    totalEpisodes,
  };

  console.log(`\nSuccessfully constructed Sweet Home item: ${seasons.length} seasons, ${totalEpisodes} episodes.`);

  // 3. Update public/catalog/tvSeries.json & data/catalog/tvSeries.json
  const tvCatalogPaths = [
    path.join(process.cwd(), "public", "catalog", "tvSeries.json"),
    path.join(process.cwd(), "data", "catalog", "tvSeries.json"),
  ];

  for (const catalogPath of tvCatalogPaths) {
    if (!fs.existsSync(catalogPath)) continue;
    console.log(`Updating ${catalogPath}...`);
    const data = JSON.parse(fs.readFileSync(catalogPath, "utf-8"));
    
    // Remove if already present (to avoid duplication)
    data.items = (data.items || []).filter(
      (i: any) =>
        i.id !== id &&
        i.serverUrl?.toLowerCase().replace(/\/+$/, "") !== folderUrl.toLowerCase().replace(/\/+$/, "") &&
        i.title?.toLowerCase() !== "sweet home"
    );

    // Prepend to front of items list
    data.items.unshift(sweetHomeItem);
    data.total = data.items.length;

    fs.writeFileSync(catalogPath, JSON.stringify(data), "utf-8");
    console.log(`✓ Updated ${path.basename(catalogPath)} (${data.items.length} total items)`);
  }

  // 4. Update public/catalog/home.json & data/catalog/home.json
  const homeCatalogPaths = [
    path.join(process.cwd(), "public", "catalog", "home.json"),
    path.join(process.cwd(), "data", "catalog", "home.json"),
  ];

  for (const homePath of homeCatalogPaths) {
    if (!fs.existsSync(homePath)) continue;
    console.log(`Updating ${homePath}...`);
    const homeData = JSON.parse(fs.readFileSync(homePath, "utf-8"));

    // Add to spotlight (at the beginning)
    if (Array.isArray(homeData.spotlight)) {
      homeData.spotlight = homeData.spotlight.filter(
        (i: any) => i.id !== id && i.title?.toLowerCase() !== "sweet home"
      );
      homeData.spotlight.unshift(sweetHomeItem);
      if (homeData.spotlight.length > 5) {
        homeData.spotlight = homeData.spotlight.slice(0, 5);
      }
    }

    // Add to TV & Web Series section
    if (Array.isArray(homeData.sections)) {
      const tvSec = homeData.sections.find((s: any) => s.id === "tvSeries");
      if (tvSec) {
        tvSec.items = (tvSec.items || []).filter(
          (i: any) => i.id !== id && i.title?.toLowerCase() !== "sweet home"
        );
        tvSec.items.unshift(sweetHomeItem);
        if (tvSec.items.length > 24) {
          tvSec.items = tvSec.items.slice(0, 24);
        }
        tvSec.total = (tvSec.total || 0) + 1;
      }
    }

    homeData.updatedAt = new Date().toISOString();
    fs.writeFileSync(homePath, JSON.stringify(homeData), "utf-8");
    console.log(`✓ Updated ${path.basename(homePath)} successfully`);
  }

  console.log("\n=== Finished Adding Sweet Home ===");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
