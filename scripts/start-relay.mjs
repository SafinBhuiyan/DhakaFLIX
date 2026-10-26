import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// 1. Locate cloudflared binary
function findCloudflared() {
  const possiblePaths = [
    "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
    "C:\\Program Files\\cloudflared\\cloudflared.exe",
    path.join(os.homedir(), "AppData\\Local\\Microsoft\\WinGet\\Links\\cloudflared.exe"),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return "cloudflared"; // fallback to PATH
}

// 2. Detect local Wi-Fi / LAN IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const net of interfaces[name] || []) {
      if (net.family === "IPv4" && !net.internal && (net.address.startsWith("192.168.") || net.address.startsWith("10."))) {
        return net.address;
      }
    }
  }
  return "localhost";
}

const cloudflaredBin = findCloudflared();
const localIp = getLocalIpAddress();

console.log("==============================================================");
console.log(" 🚀 Starting DhakaFLIX Unified Web & Streaming Relay...");
console.log("==============================================================");

// 3. Start relay.js
const relayProc = spawn("node", ["relay.js"], {
  stdio: ["ignore", "pipe", "pipe"],
  env: { ...process.env, NEXTJS_HOST: "127.0.0.1", PORT: "8080" },
});

relayProc.stdout.on("data", (data) => {
  const str = data.toString().trim();
  if (str) console.log(`[Relay Engine] ${str}`);
});

relayProc.stderr.on("data", (data) => {
  const str = data.toString().trim();
  if (str) console.error(`[Relay Warning] ${str}`);
});

// 4. Start cloudflared tunnel
console.log("⏳ Spawning Cloudflare Quick Tunnel for Mobile Data access...");

const tunnelProc = spawn(cloudflaredBin, ["tunnel", "--url", "http://localhost:8080"], {
  stdio: ["ignore", "pipe", "pipe"],
});

let tunnelUrlFound = false;

function scanForTunnelUrl(chunk) {
  const text = chunk.toString();
  const match = text.match(/https:\/\/[a-z0-9\-]+\.trycloudflare\.com/i);
  if (match && !tunnelUrlFound) {
    tunnelUrlFound = true;
    const publicUrl = match[0];

    try {
      fs.writeFileSync("active-mobile-url.txt", publicUrl, "utf8");
    } catch {}

    console.log("\n==============================================================");
    console.log(" 🎉 DHAKAFLIX MOBILE DATA STREAMING RELAY IS ONLINE!");
    console.log("==============================================================");
    console.log("\n📲 OVER MOBILE DATA (Anywhere outside home):");
    console.log(`   👉 Open this link on your phone: ${publicUrl}`);
    console.log("   • Full website + VLC streaming routes through your home BDIX.");
    console.log("   • Zero manual setup needed!\n");
    console.log("📶 OVER HOME WI-FI (Fastest 100+ Mbps direct BDIX speed):");
    console.log(`   👉 Open on your phone: http://${localIp}:3000`);
    console.log("   • Native VLC plays directly from BDIX servers without relay.");
    console.log("\n💡 Press Ctrl+C in this terminal to stop the relay.");
    console.log("==============================================================\n");
  }
}

tunnelProc.stdout.on("data", scanForTunnelUrl);
tunnelProc.stderr.on("data", scanForTunnelUrl);

function cleanup() {
  console.log("\n🛑 Stopping DhakaFLIX Relay and Cloudflare Tunnel...");
  try {
    relayProc.kill();
  } catch {}
  try {
    tunnelProc.kill();
  } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
