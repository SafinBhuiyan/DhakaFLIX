import { NextRequest, NextResponse } from "next/server";
import { findDhakaFlixStreams } from "@/lib/dhakaflix";
import catalogSnapshot from "@/lib/catalog-snapshot.json";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!title) {
    return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
  }

  try {
    let streams = await findDhakaFlixStreams(title, year);

    // If running in cloud (Vercel) where direct BDIX inspection fails, provide stream link from snapshot
    if (streams.length === 0) {
      const allSnapshotItems: any[] = Object.values(catalogSnapshot).flatMap(
        (cat: any) => cat.items || []
      );
      const match = allSnapshotItems.find(
        (m: any) =>
          m.title?.toLowerCase() === title.toLowerCase() ||
          m.rawName?.toLowerCase().includes(title.toLowerCase())
      );
      if (match) {
        streams.push({
          title: match.title,
          quality: match.quality || "1080p",
          fileName: `${match.rawName || match.title}.mkv`,
          streamUrl: match.serverUrl,
          folderUrl: match.serverUrl,
          fileSizeBytes: 0,
          fileSizeFormatted: "Direct BDIX Stream",
          sourceServer: match.sourceServer || "DhakaFlix",
          category: match.category || "Movies",
          modifiedDate: match.modifiedDate || "2026",
        });
      }
    }

    return NextResponse.json({ streams });
  } catch (err: any) {
    const allSnapshotItems: any[] = Object.values(catalogSnapshot).flatMap(
      (cat: any) => cat.items || []
    );
    const match = allSnapshotItems.find(
      (m: any) =>
        m.title?.toLowerCase() === title.toLowerCase() ||
        m.rawName?.toLowerCase().includes(title.toLowerCase())
    );
    if (match) {
      return NextResponse.json({
        streams: [
          {
            title: match.title,
            quality: match.quality || "1080p",
            fileName: `${match.rawName || match.title}.mkv`,
            streamUrl: match.serverUrl,
            folderUrl: match.serverUrl,
            fileSizeBytes: 0,
            fileSizeFormatted: "Direct BDIX Stream",
            sourceServer: match.sourceServer || "DhakaFlix",
            category: match.category || "Movies",
            modifiedDate: match.modifiedDate || "2026",
          },
        ],
      });
    }

    return NextResponse.json({ error: err.message, streams: [] }, { status: 500 });
  }
}
