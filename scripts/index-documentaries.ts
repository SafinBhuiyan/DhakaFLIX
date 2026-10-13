import fs from "fs";
import path from "path";

const TMDB_API_KEY = "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

const DOC_URL = "http://172.16.50.10/DHAKA-FLIX-10/Documentary/";

function parseDocumentaryFolderTitle(folderName: string) {
  const currentYear = new Date().getFullYear();
  const yMatch = folderName.match(/\b((?:19|20)\d{2})\b/);
  const year = yMatch ? parseInt(yMatch[1], 10) : currentYear;

  let title = folderName.replace(/[\(\[]\s*TV[\s\-_]*(?:Documentary|Mini[\s\-_]*Series|Series)[^\)\]]*[\)\]]/gi, "");
  title = title.replace(/[\(\[]\s*TV[\s\-_]*(?:Documentary|Mini[\s\-_]*Series|Series).*/gi, "");
  title = title.replace(/(?:[\s\._\-])(?:1080p|720p|540p|480p|2160p|4k|bluray|webrip|web-dl|amzn|nf).*/i, "");
  title = title.replace(/[\(\[]\s*(?:19|20)\d{2}[^\)\]]*[\)\]]/g, "");
  title = title.replace(/-(Part|Episode|The|Volume)/i, ": $1");
  title = title.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  title = title.replace(/[\(\[\-:,\s]+$/, "").trim();

  let quality = "1080p";
  if (/720p/i.test(folderName)) quality = "720p";
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

async function searchTMDbDoc(cleanTitle: string, year?: number) {
  try {
    const doQuery = async (q: string, y?: number) => {
      const url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(q)}&language=en-US&page=1`;
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (!res.ok) return null;
      const data = await res.json();
      if (!data?.results?.length) return null;

      if (y) {
        const yearMatch = data.results.find((r: any) => {
          const rYear = r.release_date?.slice(0, 4) || r.first_air_date?.slice(0, 4);
          return rYear && Math.abs(parseInt(rYear, 10) - y) <= 1;
        });
        if (yearMatch) return yearMatch;
      }
      return data.results[0];
    };

    let match = await doQuery(cleanTitle, year);
    if (!match && year) match = await doQuery(cleanTitle);

    if (!match && cleanTitle.includes("(")) {
      const primary = cleanTitle.replace(/\s*\([^)]*\)/g, "").trim();
      if (primary && primary !== cleanTitle) {
        match = await doQuery(primary, year);
        if (!match && year) match = await doQuery(primary);
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
  console.log("       Batch Indexing Documentaries (Server 10)     ");
  console.log("====================================================");

  console.log(`Connecting to Server 10 Documentary folder: ${DOC_URL}`);
  const items = await fetchH5aiDirectory(DOC_URL);
  const folders = items.filter((i) => i.isFolder);

  console.log(`✓ Discovered ${folders.length} Documentary titles on Server 10.`);

  const catalogItems: any[] = [];
  const BATCH_SIZE = 20;

  console.log(`Starting parallel metadata enrichment (Batch Size: ${BATCH_SIZE})...`);

  for (let i = 0; i < folders.length; i += BATCH_SIZE) {
    const chunk = folders.slice(i, i + BATCH_SIZE);
    const enrichedChunk = await Promise.all(
      chunk.map(async (f) => {
        const { title, year, quality } = parseDocumentaryFolderTitle(f.name);
        const folderUrl = f.href;
        const id = Buffer.from(folderUrl).toString("base64url");

        const tmdb = await searchTMDbDoc(title, year);
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
          category: "Documentary",
          poster: tmdb?.poster || localPoster,
          backdrop: tmdb?.backdrop || localBackdrop,
          overview: tmdb?.overview,
          rating: tmdb?.rating,
          modifiedDate: f.date || "2026",
        };
      })
    );

    catalogItems.push(...enrichedChunk);
    process.stdout.write(`  Processed ${Math.min(i + BATCH_SIZE, folders.length)} / ${folders.length} documentaries...\r`);
  }

  console.log(`\n✓ Successfully enriched ${catalogItems.length} Documentaries.`);

  // Sort by year reverse chronological
  catalogItems.sort((a, b) => (b.year || 0) - (a.year || 0));

  const docCatalog = {
    category: "Documentaries",
    server: "Server 10",
    total: catalogItems.length,
    items: catalogItems,
  };

  const publicDocPath = path.join(process.cwd(), "public", "catalog", "documentary.json");
  const dataDocPath = path.join(process.cwd(), "data", "catalog", "documentary.json");

  fs.writeFileSync(publicDocPath, JSON.stringify(docCatalog), "utf-8");
  console.log(`✓ Saved ${publicDocPath} (${(fs.statSync(publicDocPath).size / 1024 / 1024).toFixed(2)} MB)`);

  if (fs.existsSync(path.dirname(dataDocPath))) {
    fs.writeFileSync(dataDocPath, JSON.stringify(docCatalog), "utf-8");
    console.log(`✓ Saved ${dataDocPath}`);
  }

  // Update home.json
  const homePath = path.join(process.cwd(), "public", "catalog", "home.json");
  const dataHomePath = path.join(process.cwd(), "data", "catalog", "home.json");

  if (fs.existsSync(homePath)) {
    const homeData = JSON.parse(fs.readFileSync(homePath, "utf-8"));
    if (Array.isArray(homeData.sections)) {
      homeData.sections = homeData.sections.filter((s: any) => s.id !== "documentary");

      const docSection = {
        id: "documentary",
        title: "Documentaries & Docuseries",
        total: catalogItems.length,
        items: catalogItems.slice(0, 24),
      };

      const imdbIndex = homeData.sections.findIndex((s: any) => s.id === "imdb250");
      if (imdbIndex !== -1) {
        homeData.sections.splice(imdbIndex + 1, 0, docSection);
      } else {
        homeData.sections.push(docSection);
      }

      homeData.updatedAt = new Date().toISOString();
      fs.writeFileSync(homePath, JSON.stringify(homeData), "utf-8");
      console.log(`✓ Added Documentaries & Docuseries rail to home.json`);

      if (fs.existsSync(dataHomePath)) {
        fs.writeFileSync(dataHomePath, JSON.stringify(homeData), "utf-8");
      }
    }
  }

  console.log("\n====================================================");
  console.log("       Documentaries Indexing Completed!            ");
  console.log("====================================================");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
