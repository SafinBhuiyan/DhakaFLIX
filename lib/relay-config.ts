// DhakaFLIX Smart Network & Helper Relay Configuration
// Intelligently detects whether user has direct BDIX access (Home Wi-Fi)
// or requires Helper Relay (Mobile Data / Off-network).

const DEFAULT_RELAY_URL = "https://homelab-1.tail4054ff.ts.net";
const STORAGE_KEY_URL = "dhakaflix_helper_url";
const STORAGE_KEY_MODE = "dhakaflix_network_mode"; // "auto" | "direct" | "relay"

export type NetworkMode = "auto" | "direct" | "relay";

// In-memory cache for BDIX reachability check (avoids redundant network probes)
let cachedDirectBdixStatus: { reachable: boolean; timestamp: number } | null = null;
const CACHE_TTL_MS = 30 * 1000; // 30 seconds cache

// In-memory dynamic relay URL synced from server heartbeat
let dynamicRelayUrl: string | null = null;

// Background auto-sync of live active relay from server heartbeat
if (typeof window !== "undefined") {
  fetch('/api/relay/active')
    .then((r) => r.json())
    .then((data) => {
      if (data.ok && data.relayUrl) {
        dynamicRelayUrl = data.relayUrl.trim().replace(/\/+$/, "");
      }
    })
    .catch(() => {});
}

// Listen to network interface changes (e.g. switching between Wi-Fi and Cellular)
if (typeof window !== "undefined") {
  try {
    const nav = navigator as any;
    const connection = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    if (connection && typeof connection.addEventListener === "function") {
      connection.addEventListener("change", () => {
        cachedDirectBdixStatus = null;
      });
    }
  } catch {}
}

export async function syncActiveRelay(): Promise<string> {
  if (dynamicRelayUrl) return dynamicRelayUrl;
  if (typeof window !== "undefined") {
    try {
      const res = await fetch('/api/relay/active');
      const data = await res.json();
      if (data && data.ok && typeof data.relayUrl === "string" && data.relayUrl) {
        const clean = data.relayUrl.trim().replace(/\/+$/, "");
        dynamicRelayUrl = clean;
        return clean;
      }
    } catch {}
  }
  return getRelayUrl();
}

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
  // If dynamic relay has been discovered from server heartbeat, prioritize it
  if (dynamicRelayUrl) {
    return dynamicRelayUrl;
  }

  if (typeof window !== "undefined") {
    // 0. Auto-capture relay parameter from query string if user clicked an active relay link:
    // e.g. https://dhaka-flix-green.vercel.app/?relay=https://xxxx.trycloudflare.com
    if (window.location.search && window.location.search.includes("relay=")) {
      try {
        const params = new URLSearchParams(window.location.search);
        const urlParam = params.get("relay");
        if (urlParam && /^https?:\/\//i.test(urlParam)) {
          const cleanParam = urlParam.trim().replace(/\/+$/, "");
          if (!cleanParam.includes("trycloudflare.com") && !cleanParam.includes("pole-mean-rent-pursuit")) {
            localStorage.setItem(STORAGE_KEY_URL, cleanParam);
            // Cleanly remove ?relay= from browser address bar
            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("relay");
            window.history.replaceState({}, "", cleanUrl.pathname + (cleanUrl.search || ""));
            return cleanParam;
          }
        }
      } catch {}
    }

    // 1. If currently loaded through a Cloudflare tunnel or ngrok,
    // the current browser origin IS automatically the active relay!
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith("trycloudflare.com") || host.includes("ngrok")) {
      return window.location.origin.replace(/\/+$/, "");
    }

    // 2. Custom override from localStorage
    const custom = localStorage.getItem(STORAGE_KEY_URL);
    if (custom && custom.trim()) {
      const clean = custom.trim().replace(/\/+$/, "");
      // Purge old expired quick tunnels
      if (clean.includes("trycloudflare.com") || clean.includes("pole-mean-rent-pursuit")) {
        localStorage.removeItem(STORAGE_KEY_URL);
      } else {
        return clean;
      }
    }
  }

  // 3. Environment variable fallback or permanent homelab relay
  const envUrl = (process.env.NEXT_PUBLIC_HELPER_RELAY_URL || DEFAULT_RELAY_URL).trim().replace(/\/+$/, "");
  if (envUrl.includes("trycloudflare.com") || envUrl.includes("pole-mean-rent-pursuit")) {
    return DEFAULT_RELAY_URL;
  }
  return envUrl || DEFAULT_RELAY_URL;
}

export function setRelayUrl(url: string): void {
  if (typeof window === "undefined") return;
  const clean = url.trim().replace(/\/+$/, "");
  if (!clean || clean.includes("trycloudflare.com") || clean.includes("pole-mean-rent-pursuit")) {
    localStorage.removeItem(STORAGE_KEY_URL);
  } else {
    localStorage.setItem(STORAGE_KEY_URL, clean);
  }
}

export function getNetworkMode(): NetworkMode {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_MODE);
      if (saved === "direct" || saved === "relay" || saved === "auto") {
        return saved as NetworkMode;
      }
    } catch {}
  }
  return "auto";
}

export function setNetworkMode(mode: NetworkMode): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_MODE, mode);
  } catch {}
  // Reset cache on manual change
  cachedDirectBdixStatus = null;
}

// Backwards-compatible relay enabled checker
export function isRelayEnabled(): boolean {
  const mode = getNetworkMode();
  if (mode === "direct") return false;
  if (mode === "relay") return true;

  // In auto mode, if we're on a tunnel domain, relay is active
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host.endsWith("trycloudflare.com") || host.includes("ngrok")) {
      return true;
    }
  }

  // In auto mode, if direct BDIX is reachable or we're on LAN, relay is NOT enabled
  if (cachedDirectBdixStatus && cachedDirectBdixStatus.reachable) {
    return false;
  }

  return Boolean(getRelayUrl());
}

export function setRelayEnabled(enabled: boolean): void {
  setNetworkMode(enabled ? "relay" : "direct");
}

/**
 * Checks if the client has direct local access to BDIX storage nodes (172.16.50.x).
 * Runs an intelligent network probe.
 * On local LAN, returns true.
 * On public internet (Vercel) / Mobile Data / foreign Wi-Fi, routes via Relay tunnel
 * so all devices and phones worldwide can stream & download without error.
 */
export async function checkDirectBdixAccess(forceCheck = false): Promise<boolean> {
  if (typeof window === "undefined") return false;

  const mode = getNetworkMode();
  if (mode === "direct") return true;
  if (mode === "relay") return false;

  const now = Date.now();
  if (!forceCheck && cachedDirectBdixStatus && (now - cachedDirectBdixStatus.timestamp) < CACHE_TTL_MS) {
    return cachedDirectBdixStatus.reachable;
  }

  const host = window.location.hostname.toLowerCase();
  const isLocalNetwork =
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "[::1]" ||
    host.startsWith("192.168.") ||
    host.startsWith("10.") ||
    host.startsWith("172.16.");

  // 1. If running via a public tunnel (trycloudflare/ngrok), the user is accessing remotely via Mobile Data
  if (host.endsWith("trycloudflare.com") || host.includes("ngrok")) {
    cachedDirectBdixStatus = { reachable: false, timestamp: Date.now() };
    return false;
  }

  // 2. If accessed via local LAN IP (e.g. http://192.168.10.112:3000), client is on Home Wi-Fi
  if (isLocalNetwork) {
    cachedDirectBdixStatus = { reachable: true, timestamp: Date.now() };
    return true;
  }

  // 3. Network Information API (Android Chrome, Edge, Samsung Internet, Brave)
  try {
    const nav = navigator as any;
    const connection = nav?.connection || nav?.mozConnection || nav?.webkitConnection;
    if (connection && typeof connection.type === "string") {
      if (connection.type === "cellular") {
        // Active 4G/5G Mobile Data: BDIX is unroutable, automatically use Relay!
        cachedDirectBdixStatus = { reachable: false, timestamp: Date.now() };
        return false;
      }
    }
  } catch {}

  // 4. On public HTTPS deployment (e.g. https://dhaka-flix-green.vercel.app):
  // Private IP 172.16.50.14 is unroutable on external Wi-Fi networks (and blocked as mixed content on Chrome).
  // If a public helper relay is configured, default to Relay so EVERY phone on any Wi-Fi works!
  // Supported BDIX ISP users can tap the Wi-Fi badge to switch to Direct mode anytime.
  const hasRelay = Boolean(getRelayUrl());
  if (hasRelay) {
    cachedDirectBdixStatus = { reachable: false, timestamp: Date.now() };
    return false;
  }

  cachedDirectBdixStatus = { reachable: true, timestamp: Date.now() };
  return true;
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

function buildRelayUrl(relay: string, canonicalUrl: string): string {
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
  const cleanRelay = relay.replace(/\/+$/, "");
  return `${cleanRelay}/stream/${safeFileName}?url=${encodeURIComponent(canonicalUrl)}`;
}

/**
 * Transforms direct BDIX URLs (172.16.50.x) to route via the helper relay
 * only when required (on mobile data, off-network, or forced relay).
 * In Auto or Wi-Fi mode, direct BDIX URLs are preserved for maximum speed.
 */
export function formatStreamUrl(streamUrl: string, forceRelay?: boolean): string {
  if (!streamUrl || typeof streamUrl !== "string") return "";

  // 0. Unwrap any existing tunneled/proxied URL to get the canonical BDIX target
  const canonicalUrl = unwrapStreamUrl(streamUrl);

  // 1. Must be a direct BDIX URL (starts with http://172.16.50. or https://172.16.50.)
  const isDirectBdix = /^https?:\/\/172\.16\.50\./i.test(canonicalUrl.trim());
  if (!isDirectBdix) return canonicalUrl;

  // If forceRelay is explicitly false, return canonical BDIX
  if (forceRelay === false) {
    return canonicalUrl;
  }

  const mode = getNetworkMode();
  if (mode === "direct" && forceRelay !== true) {
    return canonicalUrl;
  }

  const relay = getRelayUrl();

  // If no relay is available, fallback to canonical direct BDIX
  if (!relay) {
    return canonicalUrl;
  }

  // Explicit relay mode
  if (mode === "relay" || forceRelay === true) {
    return buildRelayUrl(relay, canonicalUrl);
  }

  // In auto mode:
  if (mode === "auto") {
    // If currently running through a tunnel, we are on mobile data / off-network:
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.endsWith("trycloudflare.com") || host.includes("ngrok")) {
        return buildRelayUrl(relay, canonicalUrl);
      }
      // If client is on local LAN (localhost or 192.168.x.x), direct BDIX works!
      if (host === "localhost" || host === "127.0.0.1" || host.startsWith("192.168.") || host.startsWith("10.")) {
        return canonicalUrl;
      }
    }

    // If direct BDIX status was probed and verified reachable, use direct BDIX!
    if (cachedDirectBdixStatus && cachedDirectBdixStatus.reachable) {
      return canonicalUrl;
    }
  }

  // Fallback: if relay is configured and BDIX is unreachable, wrap with relay
  return buildRelayUrl(relay, canonicalUrl);
}

/**
 * Generates a direct browser download URL that triggers an immediate file download
 * without being blocked by Chrome mixed-content security policies.
 * 
 * On HTTPS sites (e.g. https://dhaka-flix-green.vercel.app), raw http://172.16.50.x downloads
 * are strictly blocked by modern mobile browsers. This function routes through the secure HTTPS relay
 * with download=1 and attachment headers so the browser downloads the file directly to the device.
 */
export function getDirectDownloadUrl(streamUrl: string): string {
  if (!streamUrl || typeof streamUrl !== "string") return "";
  const canonicalUrl = unwrapStreamUrl(streamUrl);
  if (!canonicalUrl) return "";

  const isDirectBdix = /^https?:\/\/172\.16\.50\./i.test(canonicalUrl.trim());
  if (!isDirectBdix) return canonicalUrl;

  const relay = getRelayUrl();
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";

  // On HTTPS web deployments (or when relay is active):
  // Chrome blocks http:// file downloads from https:// origins.
  // We route through the secure HTTPS relay to ensure the browser actually downloads the file.
  if (relay && (isHttps || isRelayEnabled())) {
    const formatted = buildRelayUrl(relay, canonicalUrl);
    return `${formatted}${formatted.includes("?") ? "&" : "?"}download=1`;
  }

  return canonicalUrl;
}
