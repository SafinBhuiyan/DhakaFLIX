import { NextRequest, NextResponse } from "next/server";
import { findDhakaFlixStreams, getSnapshotStreams, checkBdixAvailability } from "@/lib/dhakaflix";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const yearStr = searchParams.get("year");
  const url = searchParams.get("url") || undefined;
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!title && !url) {
    return NextResponse.json({ error: "Missing title or url parameter" }, { status: 400 });
  }

  try {
    const isOnline = await checkBdixAvailability();

    // 1. If in cloud (Vercel), resolve stream from snapshot instantly (0ms)
    if (!isOnline) {
      const streams = getSnapshotStreams(title || "", year, url);
      return NextResponse.json({ streams });
    }

    // 2. If on local BDIX LAN, inspect folders
    let streams = title ? await findDhakaFlixStreams(title, year) : [];
    if (streams.length === 0) {
      streams = getSnapshotStreams(title || "", year, url);
    }

    return NextResponse.json({ streams });
  } catch {
    const streams = getSnapshotStreams(title || "", year, url);
    return NextResponse.json({ streams });
  }
}
