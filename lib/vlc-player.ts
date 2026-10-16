"use client";

import { formatStreamUrl, checkDirectBdixAccess, getNetworkMode } from "@/lib/relay-config";
import { addToWatchHistory, WatchHistoryItem } from "@/lib/user-store";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";

export interface VlcPlayOptions {
  streamUrl: string;
  title: string;
  movie?: CatalogMovie | null;
  seasonNumber?: number;
  seasonName?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  onToast?: (message: { text: string; type: "success" | "error" }) => void;
}

let isPlayInProgress = false;

export async function playInVlc({
  streamUrl,
  title,
  movie,
  seasonNumber,
  seasonName,
  episodeNumber,
  episodeTitle,
  onToast,
}: VlcPlayOptions): Promise<void> {
  if (isPlayInProgress) return;
  isPlayInProgress = true;
  setTimeout(() => {
    isPlayInProgress = false;
  }, 1500);

  if (!streamUrl || !streamUrl.trim()) {
    onToast?.({ text: `No direct stream URL available for "${title}"`, type: "error" });
    return;
  }

  // If URL is a directory, never open raw BDIX server in browser
  if (streamUrl.endsWith("/")) {
    onToast?.({ text: `Please select an episode from "${title}" to play in VLC.`, type: "error" });
    return;
  }

  // If in Auto mode, test if direct BDIX (172.16.50.x) is reachable on current network
  if (getNetworkMode() === "auto") {
    await checkDirectBdixAccess();
  }

  // Format URL through Helper Relay if enabled (for mobile data / off-network access)
  let validUrl = formatStreamUrl(streamUrl);

  // If not using relay, sanitize stream URL for VLC (RFC 3986 compliance: encode spaces and brackets)
  if (validUrl === streamUrl) {
    const protoIdx = validUrl.indexOf("://");
    if (protoIdx !== -1) {
      const proto = validUrl.substring(0, protoIdx);
      const rest = validUrl.substring(protoIdx + 3);
      const slashIdx = rest.indexOf("/");
      if (slashIdx !== -1) {
        const host = rest.substring(0, slashIdx);
        let path = rest.substring(slashIdx);
        path = path
          .replace(/ /g, "%20")
          .replace(/\[/g, "%5B")
          .replace(/\]/g, "%5D")
          .replace(/"/g, "%22");
        validUrl = `${proto}://${host}${path}`;
      }
    }
  }

  // Automatically record into user's client-side watch history
  const isTvCandidate =
    Boolean(movie?.category && /tv|series|anime|cartoon|korean/i.test(movie.category)) ||
    Boolean(episodeNumber !== undefined) ||
    /tv|series|episode|season/i.test(title);

  addToWatchHistory({
    id: movie?.id || encodeURIComponent(validUrl),
    title: movie?.title || title,
    year: movie?.year,
    quality: movie?.quality,
    poster: movie?.poster,
    backdrop: movie?.backdrop,
    rating: movie?.rating,
    serverUrl: movie?.serverUrl,
    videoUrl: streamUrl,
    category: movie?.category,
    sourceServer: movie?.sourceServer,
    isSeries: isTvCandidate,
    seasonNumber,
    seasonName,
    episodeNumber,
    episodeTitle,
  });

  const isMobile =
    typeof navigator !== "undefined" &&
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isAndroid =
    typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

  // Mobile launch: Android Intent or iOS VLC URL Scheme
  if (isMobile) {
    onToast?.({ text: `Opening "${title}" in VLC Mobile...`, type: "success" });

    if (isAndroid) {
      const cleanUrl = validUrl.replace(/^https?:\/\//i, "");
      const scheme = validUrl.startsWith("https") ? "https" : "http";
      const androidIntent = `intent://${cleanUrl}#Intent;package=org.videolan.vlc;type=video/*;scheme=${scheme};end`;

      try {
        window.location.href = androidIntent;
      } catch {
        window.location.href = `vlc://${validUrl}`;
      }
    } else {
      window.location.href = `vlc://${validUrl}`;
    }

    setTimeout(() => {
      onToast?.({
        text: `Opened in VLC. If VLC didn't open automatically, download the .m3u playlist.`,
        type: "success",
      });
    }, 2500);

    return;
  }

  // Desktop: Localhost Direct Process or Protocol
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]" ||
      window.location.hostname === "::1");

  if (isLocalhost) {
    onToast?.({ text: `Launching VLC Media Player for "${title}"...`, type: "success" });
    try {
      const res = await fetch("/api/vlc/play", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamUrl: validUrl, title }),
      });
      const data = await res.json();
      if (data.ok || data.success) {
        onToast?.({ text: `Streaming "${title}" in VLC Media Player!`, type: "success" });
        return;
      }
    } catch {
      // Fall through to protocol handler
    }
  }

  // Non-localhost or fallback desktop: Trigger vlc:// protocol handler
  onToast?.({ text: `Opening "${title}" in VLC Media Player...`, type: "success" });
  try {
    window.location.href = `vlc://${validUrl}`;
    setTimeout(() => {
      onToast?.({
        text: `If VLC didn't start automatically, use the .m3u download button.`,
        type: "success",
      });
    }, 1500);
  } catch {
    const playlistUrl = `/api/vlc/playlist?url=${encodeURIComponent(validUrl)}&title=${encodeURIComponent(title)}`;
    const link = document.createElement("a");
    link.href = playlistUrl;
    link.download = `${title.replace(/[^a-zA-Z0-9_\-\. ]/g, "_")}.m3u`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
