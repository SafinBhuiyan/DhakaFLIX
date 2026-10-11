import { NextRequest, NextResponse } from "next/server";
import catalogSnapshot from "@/lib/catalog-snapshot.json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let streamUrl = searchParams.get("url");
  const title = searchParams.get("title") || "DhakaFlix Stream";

  if (!streamUrl) {
    return new NextResponse("Missing stream URL", { status: 400 });
  }

  // If streamUrl is a directory (ends with /), resolve direct videoUrl from snapshot
  if (streamUrl.endsWith("/")) {
    const allSnapshotItems: any[] = Object.values(catalogSnapshot).flatMap(
      (cat: any) => cat.items || []
    );
    const match = allSnapshotItems.find(
      (m: any) => m.serverUrl === streamUrl || m.title?.toLowerCase() === title.toLowerCase()
    );
    if (match && match.videoUrl) {
      streamUrl = match.videoUrl;
    }
  }

  // Generate standard M3U playlist file content
  const m3uContent = `#EXTM3U\n#EXTINF:-1,${title}\n${streamUrl}\n`;
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
