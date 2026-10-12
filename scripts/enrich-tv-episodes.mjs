import fs from "fs";
import path from "path";

const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i;

function parseEpisodeNumber(fileName, defaultIdx) {
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

function formatBytes(input) {
  const kbMatch = String(input || "").match(/([\d\.]+)\s*KB/i);
  if (kbMatch) {
    const kb = parseFloat(kbMatch[1]);
    if (kb >= 1024 * 1024) return (kb / (1024 * 1024)).toFixed(2) + " GB";
    return (kb / 1024).toFixed(0) + " MB";
  }
  return input || "";
}

async function scrapeTvItem(folderUrl) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(folderUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    const matches = [...html.matchAll(/<td class="fb-n"><a href="([^"]+)">([^<]+)<\/a><\/td><td class="fb-d">([^<]*)<\/td><td class="fb-s">([^<]*)<\/td>/g)];

    const items = matches
      .filter((m) => m[2] !== "Parent Directory")
      .map((m) => {
        const href = new URL(m[1], folderUrl).href;
        const name = m[2];
        const date = m[3];
        const size = m[4];
        const isFolder = !size && href.endsWith("/");
        return { href, name, date, size, isFolder };
      });

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

        try {
          const sCtrl = new AbortController();
          const sTimer = setTimeout(() => sCtrl.abort(), 3500);
          const sRes = await fetch(sf.href, { signal: sCtrl.signal });
          clearTimeout(sTimer);
          if (!sRes.ok) continue;
          const sHtml = await sRes.text();
          const sMatches = [...sHtml.matchAll(/<td class="fb-n"><a href="([^"]+)">([^<]+)<\/a><\/td><td class="fb-d">([^<]*)<\/td><td class="fb-s">([^<]*)<\/td>/g)];
          const videoFiles = sMatches
            .filter((m) => m[2] !== "Parent Directory" && VIDEO_EXTENSIONS.test(m[2]))
            .map((m) => ({
              href: new URL(m[1], sf.href).href,
              name: m[2],
              date: m[3],
              size: formatBytes(m[4]),
            }));

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
              fileSize: vf.size,
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
        } catch {}
      }

      if (seasons.length > 0) return seasons;
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

      return [{
        seasonNumber: 1,
        seasonName: "Season 1",
        folderUrl,
        episodes,
      }];
    }
  } catch {}
  return null;
}

async function main() {
  const tvPath = path.join(process.cwd(), "data", "catalog", "tvSeries.json");
  console.log("Loading data/catalog/tvSeries.json...");
  const tvData = JSON.parse(fs.readFileSync(tvPath, "utf-8"));

  const limit = tvData.items.length;
  const batchSize = 25;
  let enriched = 0;

  console.log(`Enriching up to ${limit} TV series...`);
  for (let i = 0; i < limit; i += batchSize) {
    const batch = tvData.items.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (item) => {
        if (!item.serverUrl || (item.seasons && item.seasons.length > 0)) {
          if (item.seasons && item.seasons.length > 0) enriched++;
          return;
        }
        const seasons = await scrapeTvItem(item.serverUrl);
        if (seasons && seasons.length > 0) {
          item.seasons = seasons;
          item.totalSeasons = seasons.length;
          item.totalEpisodes = seasons.reduce((acc, s) => acc + s.episodes.length, 0);
          enriched++;
        }
      })
    );
    process.stdout.write(`  Processed ${Math.min(i + batchSize, limit)}/${limit} (enriched ${enriched})\r`);
  }

  console.log(`\nEnrichment complete! Total enriched: ${enriched}`);
  fs.writeFileSync(tvPath, JSON.stringify(tvData), "utf-8");
  console.log("Updated data/catalog/tvSeries.json saved successfully.");

  // Also sync to public/catalog/tvSeries.json
  const publicTvPath = path.join(process.cwd(), "public", "catalog", "tvSeries.json");
  if (fs.existsSync(publicTvPath)) {
    fs.writeFileSync(publicTvPath, JSON.stringify(tvData), "utf-8");
    console.log("Synced to public/catalog/tvSeries.json.");
  }

  // Update home.json in both data/ and public/
  const homePath = path.join(process.cwd(), "data", "catalog", "home.json");
  const publicHomePath = path.join(process.cwd(), "public", "catalog", "home.json");
  if (fs.existsSync(homePath)) {
    const home = JSON.parse(fs.readFileSync(homePath, "utf-8"));
    const tvSec = home.sections?.find((s) => s.id === "tvSeries");
    if (tvSec) {
      tvSec.items = tvData.items.slice(0, 24);
      fs.writeFileSync(homePath, JSON.stringify(home), "utf-8");
      if (fs.existsSync(publicHomePath)) {
        fs.writeFileSync(publicHomePath, JSON.stringify(home), "utf-8");
      }
      console.log("Updated home.json with enriched TV series.");
    }
  }
}

main().catch(console.error);
