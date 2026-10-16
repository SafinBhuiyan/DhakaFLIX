// DhakaFLIX Smart Network & Helper Relay Configuration
// Intelligently detects whether user has direct BDIX access (Home Wi-Fi)
// or requires Helper Relay (Mobile Data / Off-network).

const DEFAULT_RELAY_URL = "https://pole-mean-rent-pursuit.trycloudflare.com";
const STORAGE_KEY_URL = "dhakaflix_helper_url";
const STORAGE_KEY_MODE = "dhakaflix_network_mode"; // "auto" | "direct" | "relay"

export type NetworkMode = "auto" | "direct" | "relay";

// In-memory cache for BDIX reachability check (avoids redundant network probes)
let cachedDirectBdixStatus: { reachable: boolean; timestamp: number } | null = null;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

export function unwrapStreamUrl(url: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // If URL contains a query param 'url=http%3A%2F%2F172...' or 'url=http://172...'
  if (trimmed.includes("url=")) {
    try {
      const u = new URL(trimmed);
      const inner = u.searchParams.get("url");
      if (inner && /^https?:\/\/172\.16\.50\./i.test(inner)) {
        return decodeURIComponent(inner);
      }
    } catch {
      const match = trimmed.match(/[?&]url=([^&]+)/);
      if (match && match[1]) {
        const decoded = decodeURIComponent(match[1]);
        if (/^https?:\/\/172\.16\.50\./i.test(decoded)) {
          return decoded;
        }
      }
    }
  }

  return trimmed;
}

export function getRelayUrl(): string {
  if (typeof window !== "undefined") {
    const custom = localStorage.getItem(STORAGE_KEY_URL);
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/+$/, "");
      if (clean === DEFAULT_RELAY_URL) {
        return clean;
      }
      localStorage.removeItem(STORAGE_KEY_URL);
    }
  }
  return DEFAULT_RELAY_URL.replace(/\/+$/, "");
}

export function setRelayUrl(url: string): void {
  if (typeof window === "undefined") return;
  const clean = url.trim().replace(/\/+$/, "");
  if (!clean || clean.includes("trycloudflare.com")) {
    localStorage.removeItem(STORAGE_KEY_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_URL, clean);
  }
}

export function getNetworkMode(): NetworkMode {
  if (typeof window === "undefined") return "auto";
  const mode = localStorage.getItem(STORAGE_KEY_MODE) as NetworkMode | null;
  if (mode === "direct" || mode === "relay" || mode === "auto") {
    return mode;
  }
  return "auto";
}

export function setNetworkMode(mode: NetworkMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY_MODE, mode);
  // Reset cache on manual change
  cachedDirectBdixStatus = null;
}

// Backwards-compatible relay enabled checker
export function isRelayEnabled(): boolean {
  const mode = getNetworkMode();
  if (mode === "direct") return false;
  if (mode === "relay") return true;
  // In auto mode, if direct BDIX is cached as reachable, relay is NOT enabled
  if (cachedDirectBdixStatus && cachedDirectBdixStatus.reachable) {
    return false;
  }
  return Boolean(getRelayUrl());
}

export function setRelayEnabled(enabled: boolean): void {
  setNetworkMode(enabled ? "relay" : "direct");
}

/**
 * Checks if the client browser has direct local access to BDIX storage nodes (172.16.50.x).
 * Runs a strict 1.2-second probe. Only resolves true if BDIX is reachable on the local network.
 */
export async function checkDirectBdixAccess(forceCheck = false): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const now = Date.now();
  if (!forceCheck && cachedDirectBdixStatus && (now - cachedDirectBdixStatus.timestamp) < CACHE_TTL_MS) {
    return cachedDirectBdixStatus.reachable;
  }

  // If frontend is served over HTTPS, mixed-content prevents direct HTTP to 172.16.50.4
  if (window.location.protocol === "https:") {
    cachedDirectBdixStatus = { reachable: false, timestamp: Date.now() };
    return false;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);

    // Strict no-cors fetch probe:
    // On Wi-Fi: 172.16.50.4 responds in <50ms, fetch resolves opaque response.
    // On Mobile Data: 172.16.50.x is not routed, carrier rejects or times out, fetch throws.
    await fetch("http://172.16.50.4/favicon.ico", {
      mode: "no-cors",
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timer);

    cachedDirectBdixStatus = { reachable: true, timestamp: Date.now() };
    return true;
  } catch {
    cachedDirectBdixStatus = { reachable: false, timestamp: Date.now() };
    return false;
  }
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
 * only when required (on mobile data, off-network, or forced relay).
 */
export function formatStreamUrl(streamUrl: string, forceRelay?: boolean): string {
  if (!streamUrl || typeof streamUrl !== "string") return "";

  // 0. Unwrap any existing tunneled/proxied URL to get the canonical BDIX target
  const canonicalUrl = unwrapStreamUrl(streamUrl);

  // 1. Must be a direct BDIX URL (starts with http://172.16.50. or https://172.16.50.)
  const isDirectBdix = /^https?:\/\/172\.16\.50\./i.test(canonicalUrl.trim());
  if (!isDirectBdix) return canonicalUrl;

  const relay = getRelayUrl();

  // If forceRelay is explicitly false, return canonical BDIX
  if (forceRelay === false) {
    return canonicalUrl;
  }

  const mode = getNetworkMode();
  if (mode === "direct" && forceRelay !== true) {
    return canonicalUrl;
  }

  // In auto mode, if direct BDIX is verified reachable, use the blazing-fast direct stream!
  if (mode === "auto" && forceRelay !== true) {
    if (cachedDirectBdixStatus && cachedDirectBdixStatus.reachable) {
      return canonicalUrl;
    }
  }

  // If relay is needed and available, wrap it
  if (!relay) {
    return canonicalUrl;
  }

  // Extract clean file name with extension
  let ext = "mp4";
  const lower = canonicalUrl.toLowerCase();
  if (lower.includes(".mkv")) ext = "mkv";
  else if (lower.includes(".webm")) ext = "webm";
  else if (lower.includes(".avi")) ext = "avi";

  let baseName = "video";
  try {
    const rawName = canonicalUrl.split("?")[0].split("/").pop() || "";
    const clean = decodeURIComponent(rawName)
      .replace(/\.[^/.]+$/, "") // strip extension
      .replace(/[^a-zA-Z0-9_\-]/g, "_") // clean out spaces, parentheses, brackets
      .replace(/_+/g, "_")
      .replace(/^_+|_+$/g, "")
      .substring(0, 60);
    if (clean) baseName = clean;
  } catch {}

  const safeFileName = `${baseName}.${ext}`;
  return `${relay}/stream/${safeFileName}?url=${encodeURIComponent(canonicalUrl)}`;
}
