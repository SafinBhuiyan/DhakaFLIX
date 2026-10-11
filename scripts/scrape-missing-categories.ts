import fs from "fs";
import path from "path";

const snapshotPath = path.join(process.cwd(), "lib", "catalog-snapshot.json");
const rawData = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));

const TMDB_API_KEY = "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

function parseFolderTitle(folderName: string) {
  const yearMatch = folderName.match(/\((19|20\d{2})\)/);
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2025;
  let title = folderName;
  if (yearMatch && yearMatch.index !== undefined) {
    title = folderName.substring(0, yearMatch.index).trim();
  } else {
    title = folderName.replace(/(1080p|720p|2160p|4k|bluray|webrip|amzn|nf).*/i, "").trim();
  }
  title = title.replace(/\(TV (Mini )?Series.*\)/i, "").trim();

  let quality = "720p";
  if (/1080p/i.test(folderName)) quality = "1080p";
  else if (/2160p|4k/i.test(folderName)) quality = "4K UHD";
  if (/Dual\s*Audio/i.test(folderName)) quality += " Dual Audio";
  if (/IMAX/i.test(folderName)) quality += " IMAX";
  if (/3D/i.test(folderName)) quality = "3D Half-SBS";

  return { title: title || folderName, year, quality };
}

async function searchTMDb(query: string) {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0] || null;
  } catch {
    return null;
  }
}

async function fetchH5aiFolder(urlStr: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(urlStr, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return [];
    const html = await res.text();
    const matches = [...html.matchAll(/<td class="fb-n"><a href="([^"]+)">([^<]+)<\/a><\/td><td class="fb-d">([^<]*)<\/td><td class="fb-s">([^<]*)<\/td>/g)];
    return matches
      .filter((m) => m[2] !== "Parent Directory")
      .map((m) => ({
        href: new URL(m[1], urlStr).href,
        name: m[2],
        date: m[3],
        size: m[4],
        isFolder: !m[4] && m[1].endsWith("/"),
      }));
  } catch {
    return [];
  }
}

async function resolveDirectVideo(folderUrl: string) {
  const items = await fetchH5aiFolder(folderUrl);
  for (const item of items) {
    if (!item.isFolder && /\.(mkv|mp4|avi|mov)$/i.test(item.name)) {
      let fileSizeFormatted = item.size;
      const kbMatch = (item.size || "").match(/(\d+)\s*KB/i);
      if (kbMatch) {
        const kb = parseInt(kbMatch[1], 10);
        if (kb > 1024 * 1024) fileSizeFormatted = (kb / (1024 * 1024)).toFixed(2) + " GB";
        else fileSizeFormatted = (kb / 1024).toFixed(0) + " MB";
      }
      return {
        videoUrl: item.href,
        fileName: item.name,
        fileSize: fileSizeFormatted.trim(),
      };
    }
  }
  return null;
}

async function scrapeSection(catId: string, label: string, server: string, urls: string[], limit = 40) {
  console.log(`Scraping category: ${label} (${catId})...`);
  const items: any[] = [];

  for (const rootUrl of urls) {
    if (items.length >= limit) break;
    const folders = await fetchH5aiFolder(rootUrl);
    for (const f of folders) {
      if (!f.isFolder || items.length >= limit) continue;
      const { title, year, quality } = parseFolderTitle(f.name);
      const videoInfo = await resolveDirectVideo(f.href);

      const tmdb = await searchTMDb(title);

      items.push({
        id: Buffer.from(f.href).toString("base64url"),
        title,
        rawName: f.name,
        year,
        quality,
        serverUrl: videoInfo?.videoUrl || f.href,
        sourceServer: server,
        category: label,
        poster: tmdb?.poster_path ? `${TMDB_IMAGE_BASE}/w500${tmdb.poster_path}` : `${f.href}a_AL_.jpg`,
        backdrop: tmdb?.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${tmdb.backdrop_path}` : undefined,
        overview: tmdb?.overview || undefined,
        rating: tmdb?.vote_average ? Number(tmdb.vote_average.toFixed(1)) : 7.2,
        modifiedDate: f.date || "2026",
        videoUrl: videoInfo?.videoUrl || f.href,
        videoFileName: videoInfo?.fileName || `${f.name}.mkv`,
        videoFileSize: videoInfo?.fileSize || "1.8 GB",
      });
      process.stdout.write(`  Loaded ${items.length} items...\r`);
    }
  }

  rawData[catId] = {
    category: label,
    server,
    items,
  };
  console.log(`\nCompleted ${label}: ${items.length} titles collected.`);
}

async function main() {
  // 1. South Indian Movies (Original languages)
  await scrapeSection(
    "southMovies",
    "South Indian Movies",
    "Server 14",
    [
      "http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/2026/",
      "http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/2025/",
      "http://172.16.50.14/DHAKA-FLIX-14/SOUTH%20INDIAN%20MOVIES/South%20Movies/2024/",
    ],
    40
  );

  // 2. Animation Movies (General)
  await scrapeSection(
    "animation",
    "Animation Movies",
    "Server 14",
    ["http://172.16.50.14/DHAKA-FLIX-14/Animation%20Movies/"],
    35
  );

  // 3. 3D Movies
  await scrapeSection(
    "movies3D",
    "3D Movies",
    "Server 7",
    ["http://172.16.50.7/DHAKA-FLIX-7/3D%20Movies/"],
    40
  );

  fs.writeFileSync(snapshotPath, JSON.stringify(rawData, null, 2), "utf-8");
  console.log("All categories successfully saved to catalog-snapshot.json!");
}

main().catch(console.error);
