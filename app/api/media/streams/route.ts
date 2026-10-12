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

  // Detect TV series candidate from URL, title, or category
  const isSeriesCandidate =
    /tv|series|anime|cartoon|korean|show|drama/i.test(category) ||
    (url ? /\/TV-WEB-Series\/|\/TV%20Series\/|\/TV Series\/|\/Anime|\/Cartoon|Season/i.test(url) : false) ||
    (title ? /[\(\[]?(?:TV\s+(?:Mini\s+)?Series|Season|\bS\d+\b)[^\)\]]*[\)\]]?/i.test(title) : false);

  try {
    const isOnline = await checkBdixAvailability();

    if (isSeriesCandidate && (url || title)) {
      const seriesDetails = await getShowEpisodes(url || "", title || "", year, category);
      if (seriesDetails.isSeries && seriesDetails.seasons.length > 0) {
        let sourceServer = "Server 12";
        if (url) {
          if (url.includes("172.16.50.14") || url.includes("DHAKA-FLIX-14")) sourceServer = "Server 14";
          else if (url.includes("172.16.50.10") || url.includes("DHAKA-FLIX-10")) sourceServer = "Server 10";
          else if (url.includes("172.16.50.7") || url.includes("DHAKA-FLIX-7")) sourceServer = "Server 7";
          else if (url.includes("172.16.50.8") || url.includes("DHAKA-FLIX-8")) sourceServer = "Server 8";
        }

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
            sourceServer,
            category: category || "TV & Web Series",
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

      // If series candidate but no seasons discovered, keep isSeries: true
      return NextResponse.json(
        {
          isSeries: true,
          totalSeasons: 0,
          totalEpisodes: 0,
          seasons: [],
          streams: [],
        },
        { headers: CACHE_HEADERS }
      );
    }

    // 2. If in cloud (Vercel) without BDIX LAN, resolve from snapshot
    if (!isOnline) {
      const streams = await getSnapshotStreams(title || "", year, url);
      return NextResponse.json({ isSeries: false, streams }, { headers: CACHE_HEADERS });
    }

    // 3. For movies, inspect folder or locate media streams
    let streams = await findDhakaFlixStreams(title || "", year, url);
    if (streams.length === 0) {
      streams = await getSnapshotStreams(title || "", year, url);
    }

    return NextResponse.json({ isSeries: false, streams }, { headers: CACHE_HEADERS });
  } catch (err: any) {
    console.error("Streams API error:", err);
    if (isSeriesCandidate) {
      return NextResponse.json(
        {
          isSeries: true,
          totalSeasons: 0,
          totalEpisodes: 0,
          seasons: [],
          streams: [],
        },
        { headers: CACHE_HEADERS }
      );
    }
    const streams = await getSnapshotStreams(title || "", year, url);
    return NextResponse.json({ isSeries: false, streams }, { headers: CACHE_HEADERS });
  }
}
