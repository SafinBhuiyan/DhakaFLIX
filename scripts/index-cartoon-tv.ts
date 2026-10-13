import fs from "fs";
import path from "path";

const TMDB_API_KEY = "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const CARTOON_URL = "http://172.16.50.10/DHAKA-FLIX-10/Anime%20%26%20Cartoon%20TV%20Series/";

function parseAnimeFolderTitle(folderName: string) {
  const currentYear = new Date().getFullYear();
  const yMatch = folderName.match(/\b((?:19|20)\d{2})\b/);
  const year = yMatch ? parseInt(yMatch[1], 10) : currentYear;

  let title = folderName.replace(/[\(\[]\s*TV[\s\-_]*(?:Cartoon|Anime|Mini[\s\-_]*Series|Series)[^\)\]]*[\)\]]/gi, "");
  title = title.replace(/[\(\[]\s*TV[\s\-_]*(?:Cartoon|Anime|Mini[\s\-_]*Series|Series).*/gi, "");
  title = title.replace(/(?:[\s\._\-])(?:1080p|720p|540p|480p|2160p|4k|bluray|webrip|web-dl|amzn|nf).*/i, "");
  title = title.replace(/[\(\[]\s*(?:19|20)\d{2}[^\)\]]*[\)\]]/g, "");
  title = title.replace(/-(Part|Episode|The|Volume|Tales|Real|Renegades)/i, ": $1");
  title = title.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  title = title.replace(/[\(\[\-:,\s]+$/, "").trim();

  let quality = "720p";
  if (/1080p/i.test(folderName)) quality = "1080p";
  else if (/2160p|4k/i.test(folderName)) quality = "4K UHD";
  else if (/480p/i.test(folderName)) quality = "480p";
  else if (/540p/i.test(folderName)) quality = "540p";
  if (/Dual\s*Audio/i.test(folderName)) quality += " Dual Audio";
  if (/Multi\s*Audio/i.test(folderName)) quality += " Multi Audio";

  return { title: title || folderName, year, quality };
}

async function fetchH5aiDirectory(urlStr: string) {
  try {
    const res = await fetch(urlStr, { signal: AbortSignal.timeout(6000) });
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

async function searchTMDbTv(cleanTitle: string, year?: number) {
  try {
    const doQuery = async (q: string, y?: number) => {
      const yearParam = y ? `&first_air_date_year=${y}` : "";
      const url = `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}${yearParam}&language=en-US&page=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const data = await res.json();
      return data?.results?.[0] || null;
    };

    let match = await doQuery(cleanTitle, year);
    if (!match && year) match = await doQuery(cleanTitle);

    if (!match && cleanTitle.includes("(")) {
      const primary = cleanTitle.replace(/\s*\([^)]*\)/g, "").trim();
      if (primary && primary !== cleanTitle) {
        match = await doQuery(primary, year);
        if (!match && year) match = await doQuery(primary);
      }
      if (!match) {
        const altMatch = cleanTitle.match(/\(([^)]+)\)/);
        if (altMatch && altMatch[1]) {
          match = await doQuery(altMatch[1].trim(), year);
          if (!match && year) match = await doQuery(altMatch[1].trim());
        }
      }
    }

    if (match) {
      return {
        poster: match.poster_path ? `${TMDB_IMAGE_BASE}/w500${match.poster_path}` : undefined,
        backdrop: match.backdrop_path ? `${TMDB_IMAGE_BASE}/w1280${match.backdrop_path}` : undefined,
        overview: match.overview || undefined,
        rating: match.vote_average ? Number(match.vote_average.toFixed(1)) : undefined,
      };
    }
  } catch {}
  return null;
}

async function main() {
  console.log("====================================================");
  console.log("   Batch Indexing Anime & Cartoon TV Series         ");
  console.log("====================================================");

  console.log(`Connecting to Server 10 Anime root: ${CARTOON_URL}`);
  const rootItems = await fetchH5aiDirectory(CARTOON_URL);
  const bucketFolders = rootItems.filter((i) => i.isFolder);

  console.log(`✓ Discovered ${bucketFolders.length} bucket containers.`);

  const allShowFolders: Array<{ href: string; name: string; date: string; bucket: string }> = [];

  for (const bucket of bucketFolders) {
    console.log(`  Scanning container: ${bucket.name}...`);
    const shows = await fetchH5aiDirectory(bucket.href);
    const validShows = shows.filter((s) => s.isFolder);
    for (const s of validShows) {
      allShowFolders.push({
        href: s.href,
        name: s.name,
        date: s.date,
        bucket: bucket.name,
      });
    }
    console.log(`    -> Found ${validShows.length} shows in ${bucket.name}`);
  }

  console.log(`\n✓ Total Anime & Cartoon TV shows collected: ${allShowFolders.length}`);

  const catalogItems: any[] = [];
  const BATCH_SIZE = 20;

  console.log(`Starting parallel metadata enrichment (Batch Size: ${BATCH_SIZE})...`);

  for (let i = 0; i < allShowFolders.length; i += BATCH_SIZE) {
    const chunk = allShowFolders.slice(i, i + BATCH_SIZE);
    const enrichedChunk = await Promise.all(
      chunk.map(async (f) => {
        const { title, year, quality } = parseAnimeFolderTitle(f.name);
        const folderUrl = f.href;
        const id = Buffer.from(folderUrl).toString("base64url");

        const tmdb = await searchTMDbTv(title, year);
        const localPoster = `${folderUrl}a_AL_.jpg`;
        const localBackdrop = `${folderUrl}a_VL_.jpg`;

        return {
          id,
          title,
          rawName: f.name,
          year,
          quality,
          serverUrl: folderUrl,
          sourceServer: "Server 10",
          category: "Anime & Cartoon TV Series",
          poster: tmdb?.poster || localPoster,
          backdrop: tmdb?.backdrop || localBackdrop,
          overview: tmdb?.overview,
          rating: tmdb?.rating,
          modifiedDate: f.date || "2026",
        };
      })
    );

    catalogItems.push(...enrichedChunk);
    process.stdout.write(`  Processed ${Math.min(i + BATCH_SIZE, allShowFolders.length)} / ${allShowFolders.length} anime series...\r`);
  }

  console.log(`\n✓ Successfully enriched ${catalogItems.length} Anime & Cartoon series.`);

  // Sort by year reverse chronological
  catalogItems.sort((a, b) => (b.year || 0) - (a.year || 0));

  const cartoonCatalog = {
    category: "Anime & Cartoon TV Series",
    server: "Server 10",
    total: catalogItems.length,
    items: catalogItems,
  };

  const publicCartoonPath = path.join(process.cwd(), "public", "catalog", "cartoonTv.json");
  const dataCartoonPath = path.join(process.cwd(), "data", "catalog", "cartoonTv.json");

  fs.writeFileSync(publicCartoonPath, JSON.stringify(cartoonCatalog), "utf-8");
  console.log(`✓ Saved ${publicCartoonPath} (${(fs.statSync(publicCartoonPath).size / 1024 / 1024).toFixed(2)} MB)`);

  if (fs.existsSync(path.dirname(dataCartoonPath))) {
    fs.writeFileSync(dataCartoonPath, JSON.stringify(cartoonCatalog), "utf-8");
    console.log(`✓ Saved ${dataCartoonPath}`);
  }

  // Update home.json
  const homePath = path.join(process.cwd(), "public", "catalog", "home.json");
  const dataHomePath = path.join(process.cwd(), "data", "catalog", "home.json");

  if (fs.existsSync(homePath)) {
    const homeData = JSON.parse(fs.readFileSync(homePath, "utf-8"));
    if (Array.isArray(homeData.sections)) {
      homeData.sections = homeData.sections.filter((s: any) => s.id !== "cartoonTv");

      const koreanIndex = homeData.sections.findIndex((s: any) => s.id === "koreanTv");
      const tvIndex = homeData.sections.findIndex((s: any) => s.id === "tvSeries");
      const insertIndex = koreanIndex !== -1 ? koreanIndex + 1 : (tvIndex !== -1 ? tvIndex + 1 : homeData.sections.length);

      const cartoonSection = {
        id: "cartoonTv",
        title: "Anime & Cartoon TV Series",
        total: catalogItems.length,
        items: catalogItems.slice(0, 24),
      };

      homeData.sections.splice(insertIndex, 0, cartoonSection);
      homeData.updatedAt = new Date().toISOString();

      fs.writeFileSync(homePath, JSON.stringify(homeData), "utf-8");
      console.log(`✓ Added Anime & Cartoon TV Series rail to home.json`);

      if (fs.existsSync(dataHomePath)) {
        fs.writeFileSync(dataHomePath, JSON.stringify(homeData), "utf-8");
      }
    }
  }

  console.log("\n====================================================");
  console.log("   Anime & Cartoon Indexing Completed!              ");
  console.log("====================================================");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
