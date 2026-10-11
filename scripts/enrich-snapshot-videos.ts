import fs from "fs";
import path from "path";

const snapshotPath = path.join(process.cwd(), "lib", "catalog-snapshot.json");
const rawData = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));

const VIDEO_REGEX = /href="([^"]+\.(mkv|mp4|avi|mov|m4v))"/i;
const SIZE_REGEX = /<td class="fb-s">([^<]+)<\/td>/i;

async function fetchVideoInfo(folderUrl: string): Promise<{ videoUrl: string; fileName: string; fileSize?: string } | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(folderUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();

    // Look for table row with video
    const rows = [...html.matchAll(/<td class="fb-n"><a href="([^"]+\.(mkv|mp4|avi|mov|m4v))">([^<]+)<\/a><\/td><td class="fb-d">[^<]*<\/td><td class="fb-s">([^<]*)<\/td>/gi)];
    if (rows.length > 0) {
      const match = rows[0];
      const videoHref = match[1];
      const fileName = match[3] || path.basename(videoHref);
      const rawSize = match[4] || "";
      const fullUrl = new URL(videoHref, folderUrl).href;

      let fileSizeFormatted = rawSize;
      const kbMatch = rawSize.match(/(\d+)\s*KB/i);
      if (kbMatch) {
        const kb = parseInt(kbMatch[1], 10);
        if (kb > 1024 * 1024) {
          fileSizeFormatted = (kb / (1024 * 1024)).toFixed(2) + " GB";
        } else {
          fileSizeFormatted = (kb / 1024).toFixed(0) + " MB";
        }
      }

      return {
        videoUrl: fullUrl,
        fileName: decodeURIComponent(fileName),
        fileSize: fileSizeFormatted.trim(),
      };
    }

    // Fallback: general regex
    const m = html.match(VIDEO_REGEX);
    if (m) {
      const fullUrl = new URL(m[1], folderUrl).href;
      return {
        videoUrl: fullUrl,
        fileName: decodeURIComponent(path.basename(m[1])),
      };
    }
  } catch {}
  return null;
}

async function main() {
  console.log("Starting video file discovery for all snapshot titles...");
  let totalUpdated = 0;
  let totalScanned = 0;

  for (const categoryKey of Object.keys(rawData)) {
    const section = rawData[categoryKey];
    if (!section.items || !Array.isArray(section.items)) continue;

    console.log(`Processing category: ${categoryKey} (${section.items.length} items)...`);

    // Process in batches of 10 concurrent requests
    const batchSize = 10;
    for (let i = 0; i < section.items.length; i += batchSize) {
      const batch = section.items.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (item: any) => {
          totalScanned++;
          if (item.videoUrl && item.videoUrl.match(/\.(mkv|mp4|avi)$/i)) {
            return; // Already has videoUrl
          }
          const info = await fetchVideoInfo(item.serverUrl);
          if (info) {
            item.videoUrl = info.videoUrl;
            item.videoFileName = info.fileName;
            if (info.fileSize) item.videoFileSize = info.fileSize;
            totalUpdated++;
          }
        })
      );
      process.stdout.write(`  Processed ${Math.min(i + batchSize, section.items.length)}/${section.items.length}\r`);
    }
    console.log(`\nCompleted ${categoryKey}`);
  }

  console.log(`\nDone! Scanned ${totalScanned} items, resolved ${totalUpdated} video files.`);
  fs.writeFileSync(snapshotPath, JSON.stringify(rawData, null, 2), "utf-8");
  console.log("Updated catalog-snapshot.json saved successfully.");
}

main().catch(console.error);
