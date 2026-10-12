import { NextRequest, NextResponse } from "next/server";
import { fetchH5aiDirectory, checkBdixAvailability } from "@/lib/dhakaflix";
import { findTvSeriesItem, findCatalogStreamItem } from "@/lib/catalog-store";

const VIDEO_EXTENSIONS = /\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i;

function sanitizeUrl(urlStr: string): string {
  const protoIdx = urlStr.indexOf("://");
  if (protoIdx === -1) return urlStr;
  const proto = urlStr.substring(0, protoIdx);
  const rest = urlStr.substring(protoIdx + 3);
  const slashIdx = rest.indexOf("/");
  if (slashIdx === -1) return urlStr;
  const host = rest.substring(0, slashIdx);
  let path = rest.substring(slashIdx);
  path = path
    .replace(/ /g, "%20")
    .replace(/\[/g, "%5B")
    .replace(/\]/g, "%5D")
    .replace(/"/g, "%22");
  return `${proto}://${host}${path}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let streamUrl = searchParams.get("url");
  const title = searchParams.get("title") || "DhakaFlix Stream";
  const seasonUrl = searchParams.get("seasonUrl");

  const targetFolder = seasonUrl || (streamUrl && streamUrl.endsWith("/") ? streamUrl : null);

  // If a directory or season URL is requested, generate a full multi-track playlist
  if (targetFolder) {
    try {
      const isOnline = await checkBdixAvailability();
      if (isOnline) {
        const items = await fetchH5aiDirectory(targetFolder);
        const videoFiles = items.filter((i) => !i.isFolder && VIDEO_EXTENSIONS.test(i.name));

        if (videoFiles.length > 0) {
          videoFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

          let m3u = "#EXTM3U\n";
          for (const vf of videoFiles) {
            const cleanName = vf.name.replace(/\.(mkv|mp4|avi|mov|wmv|m4v|webm)$/i, "");
            m3u += `#EXTINF:-1,${title} - ${cleanName}\n${sanitizeUrl(vf.href)}\n`;
          }

          const sanitizedTitle = `${title}_Playlist`.replace(/[^a-zA-Z0-9_\-\. ]/g, "_");
          return new NextResponse(m3u, {
            status: 200,
            headers: {
              "Content-Type": "audio/x-mpegurl; charset=utf-8",
              "Content-Disposition": `attachment; filename="${encodeURIComponent(sanitizedTitle)}.m3u"`,
              "Cache-Control": "no-cache",
            },
          });
        }
      } else {
        // Cloud / Vercel: Lookup verified episodes from tvSeries.json
        const tvItem = await findTvSeriesItem(targetFolder, title);
        if (tvItem?.seasons) {
          const matchedSeason =
            tvItem.seasons.find((s: any) =>
              targetFolder.toLowerCase().includes(s.folderUrl?.toLowerCase()) ||
              (s.folderUrl && s.folderUrl.toLowerCase().includes(targetFolder.toLowerCase()))
            ) || tvItem.seasons[0];

          if (matchedSeason?.episodes?.length > 0) {
            let m3u = "#EXTM3U\n";
            for (const ep of matchedSeason.episodes) {
              m3u += `#EXTINF:-1,${title} - ${ep.title} (${ep.fileName})\n${sanitizeUrl(ep.streamUrl)}\n`;
            }

            const sanitizedTitle = `${title}_${matchedSeason.seasonName || "Season"}`.replace(/[^a-zA-Z0-9_\-\. ]/g, "_");
            return new NextResponse(m3u, {
              status: 200,
              headers: {
                "Content-Type": "audio/x-mpegurl; charset=utf-8",
                "Content-Disposition": `attachment; filename="${encodeURIComponent(sanitizedTitle)}.m3u"`,
                "Cache-Control": "no-cache",
              },
            });
          }
        }
      }
    } catch (err) {
      console.error("Error creating directory playlist:", err);
    }
  }

  // Single stream playback resolution
  if (!streamUrl) {
    return new NextResponse("Missing stream URL", { status: 400 });
  }

  if (streamUrl.endsWith("/")) {
    const match = await findCatalogStreamItem(streamUrl, title);
    if (match && match.videoUrl) {
      streamUrl = match.videoUrl;
    }
  }

  const validStreamUrl = sanitizeUrl(streamUrl || "");
  const m3uContent = `#EXTM3U\n#EXTINF:-1,${title}\n${validStreamUrl}\n`;
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\-\. ]/g, "_");

  return new NextResponse(m3uContent, {
    status: 200,
    headers: {
      "Content-Type": "audio/x-mpegurl; charset=utf-8",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(sanitizedTitle)}.m3u"`,
      "Cache-Control": "no-cache",
    },
  });
}
