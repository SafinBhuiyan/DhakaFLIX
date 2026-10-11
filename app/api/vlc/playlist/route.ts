import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const streamUrl = searchParams.get("url");
  const title = searchParams.get("title") || "MovieFLIX Stream";

  if (!streamUrl) {
    return new NextResponse("Missing stream URL", { status: 400 });
  }

  // Generate standard M3U playlist file content
  const m3uContent = `#EXTM3U\n#EXTINF:-1,${title}\n${streamUrl}\n`;
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9_\-\. ]/g, "_");

  return new NextResponse(m3uContent, {
    status: 200,
    headers: {
      "Content-Type": "audio/x-mpegurl",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(sanitizedTitle)}.m3u"`,
      "Cache-Control": "no-cache",
    },
  });
}
