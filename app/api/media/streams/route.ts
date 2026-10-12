import { NextRequest, NextResponse } from "next/server";
import {
  findDhakaFlixStreams,
  getSnapshotStreams,
  checkBdixAvailability,
  getShowEpisodes,
} from "@/lib/dhakaflix";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=600",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const yearStr = searchParams.get("year");
  const url = searchParams.get("url") || undefined;
  const category = searchParams.get("category") || "";
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!title && !url) {
    return NextResponse.json({ error: "Missing title or url parameter" }, { status: 400 });
  }

  try {
    const isOnline = await checkBdixAvailability();

    // 1. If URL, title, or category indicates a TV series, inspect seasons & episodes
    const isSeriesCandidate =
      /tv|series|anime|cartoon/i.test(category) ||
      (url ? /\/TV-WEB-Series\/|\/TV%20Series\/|\/TV Series\/|Season/i.test(url) : false) ||
      (title ? /\(TV (Mini )?Series/i.test(title) : false);

    if (isSeriesCandidate && (url || title)) {
      const seriesDetails = await getShowEpisodes(url || "", title || "", year);
      if (seriesDetails.isSeries && seriesDetails.seasons.length > 0) {
        const allEpisodesStreams = seriesDetails.seasons.flatMap((s) =>
          s.episodes.map((ep) => ({
            title: `${title} - ${s.seasonName} E${ep.episodeNumber}`,
            year,
            quality: "1080p",
            fileName: ep.fileName,
            streamUrl: ep.streamUrl,
            folderUrl: s.folderUrl,
            fileSizeBytes: 0,
            fileSizeFormatted: ep.fileSize || "",
            sourceServer: "Server 12",
            category: "TV & Web Series",
            modifiedDate: ep.date || "2026",
          }))
        );

        return NextResponse.json(
          {
            isSeries: true,
            totalSeasons: seriesDetails.totalSeasons,
            totalEpisodes: seriesDetails.totalEpisodes,
            seasons: seriesDetails.seasons,
            streams: allEpisodesStreams,
          },
          { headers: CACHE_HEADERS }
        );
      }
    }

    // 2. If in cloud (Vercel) without BDIX LAN, resolve from snapshot
    if (!isOnline) {
      const streams = getSnapshotStreams(title || "", year, url);
      return NextResponse.json({ isSeries: false, streams }, { headers: CACHE_HEADERS });
    }

    // 3. For movies, inspect folder or locate media streams
    let streams = await findDhakaFlixStreams(title || "", year, url);
    if (streams.length === 0) {
      streams = getSnapshotStreams(title || "", year, url);
    }

    return NextResponse.json({ isSeries: false, streams }, { headers: CACHE_HEADERS });
  } catch (err: any) {
    console.error("Streams API error:", err);
    const streams = getSnapshotStreams(title || "", year, url);
    return NextResponse.json({ isSeries: false, streams }, { headers: CACHE_HEADERS });
  }
}
