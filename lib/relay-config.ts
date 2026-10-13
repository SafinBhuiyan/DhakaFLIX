// DhakaFLIX Helper Relay Utilities
// Allows mobile data and off-network users to stream media via home BDIX helper server.

const DEFAULT_RELAY_URL = process.env.NEXT_PUBLIC_HELPER_RELAY_URL || "";
const STORAGE_KEY_URL = "dhakaflix_helper_url";
const STORAGE_KEY_ENABLED = "dhakaflix_helper_enabled";

export function getRelayUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(STORAGE_KEY_URL);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, "");
    }
  }
  return DEFAULT_RELAY_URL.replace(/\/+$/, "");
}

export function setRelayUrl(url: string): void {
  if (typeof window === "undefined") return;
  const clean = url.trim().replace(/\/+$/, "");
  if (!clean) {
    localStorage.removeItem(STORAGE_KEY_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_URL, clean);
  }
}

export function isRelayEnabled(): boolean {
  if (typeof window === "undefined") return Boolean(DEFAULT_RELAY_URL);
  const val = localStorage.getItem(STORAGE_KEY_ENABLED);
  if (val === null) {
    // Default to enabled if a relay URL is available
    return Boolean(getRelayUrl());
  }
  return val === "true";
}

export function setRelayEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
}

export async function checkRelayHealth(url?: string): Promise<boolean> {
  const target = (url || getRelayUrl()).trim().replace(/\/+$/, "");
  if (!target) return false;

  try {
    const res = await fetch(`${target}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === "online";
  } catch {
    return false;
  }
}

/**
 * Transforms direct BDIX URLs (172.16.50.x) to route via the helper relay
 * when the relay is enabled.
 */
export function formatStreamUrl(streamUrl: string, forceRelay?: boolean): string {
  if (!streamUrl || typeof streamUrl !== "string") return "";

  // 1. If already proxied by relay or contains a tunnel, NEVER re-proxy it!
  if (streamUrl.includes("/stream/") || streamUrl.includes("trycloudflare.com")) {
    return streamUrl;
  }

  // 2. Must be a direct BDIX URL (starts with http://172.16.50. or https://172.16.50.)
  const isDirectBdix = /^https?:\/\/172\.16\.50\./i.test(streamUrl.trim());
  if (!isDirectBdix) return streamUrl;

  const relay = getRelayUrl();
  if (relay && streamUrl.startsWith(relay)) {
    return streamUrl;
  }

  const shouldUse = forceRelay !== undefined ? forceRelay : isRelayEnabled();
  if (!shouldUse || !relay) {
    return streamUrl;
  }

  // Extract clean file name with extension (e.g. "movie.mp4" or "video.mkv")
  let fileName = "video.mp4";
  try {
    const cleanUrl = streamUrl.split("?")[0];
    const lastSlash = cleanUrl.lastIndexOf("/");
    if (lastSlash !== -1) {
      const extracted = decodeURIComponent(cleanUrl.substring(lastSlash + 1));
      if (extracted && extracted.trim()) {
        fileName = extracted.trim();
      }
    }
  } catch {}

  // Ensure clean formatting
  const sanitizedFileName = fileName
    .replace(/ /g, "%20")
    .replace(/\[/g, "%5B")
    .replace(/\]/g, "%5D");

  return `${relay}/stream/${sanitizedFileName}?url=${encodeURIComponent(streamUrl)}`;
}
