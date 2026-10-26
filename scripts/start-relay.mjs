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

    const unifiedUrl = `https://dhaka-flix-green.vercel.app/?relay=${publicUrl}`;

    try {
      fs.writeFileSync("active-mobile-url.txt", unifiedUrl, "utf8");
    } catch {}

    console.log("\n==============================================================");
    console.log(" 🎉 DHAKAFLIX 4G MOBILE RELAY IS ONLINE!");
    console.log("==============================================================");
    console.log("\n📲 ONE UNIFIED LINK FOR EVERYTHING (Open on your phone):");
    console.log(`   👉 ${unifiedUrl}`);
    console.log("   • Works on both Wi-Fi and 4G Mobile Data seamlessly.");
    console.log("   • Your phone automatically saves the relay connection.");
    console.log("   • On Home Wi-Fi, streams direct from BDIX at full 100+ Mbps!\n");
    console.log("💡 Press Ctrl+C in this terminal to stop the relay.");
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
