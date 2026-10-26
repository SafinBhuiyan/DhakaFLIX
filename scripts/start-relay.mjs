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
    const qrImage = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(unifiedUrl)}`;

    try {
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>DhakaFLIX Mobile 4G Quick Connect</title>
  <style>
    body { background: #0f0f12; color: #fff; font-family: system-ui, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .card { background: #1a1a20; padding: 32px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 20px 40px rgba(0,0,0,0.5); max-width: 400px; }
    h2 { margin: 0 0 8px 0; color: #e50914; font-size: 22px; }
    p { color: #888; font-size: 14px; margin-bottom: 24px; }
    img { border-radius: 16px; background: white; padding: 12px; }
    .url { word-break: break-all; margin-top: 20px; font-size: 12px; color: #aaa; background: rgba(255,255,255,0.05); padding: 10px; border-radius: 10px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>DhakaFLIX 4G High-Speed Stream</h2>
    <p>Scan with your phone camera to stream over 4G Mobile Data:</p>
    <img src="${qrImage}" width="260" height="260" alt="Scan with Phone Camera" />
    <div class="url"><a href="${unifiedUrl}" target="_blank" style="color: #e50914;">${unifiedUrl}</a></div>
  </div>
</body>
</html>`;
      fs.writeFileSync("scan-to-stream.html", htmlContent, "utf8");
      // Open in default browser on PC
      spawn("cmd", ["/c", "start", "scan-to-stream.html"], { stdio: "ignore" });
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
