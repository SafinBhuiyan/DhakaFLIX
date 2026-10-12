/**
 * scripts/sync-daemon.mjs
 *
 * Background Node daemon that runs the catalog sync every 24 hours.
 * Useful if running inside PM2 or as a continuous background process.
 *
 * Usage:
 *   node scripts/sync-daemon.mjs
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

function runSync() {
  console.log(`[${new Date().toISOString()}] Launching daily catalog sync...`);

  const child = spawn("npm.cmd", ["run", "sync:daily"], {
    cwd: rootDir,
    stdio: "inherit",
    shell: true,
  });

  child.on("close", (code) => {
    console.log(`[${new Date().toISOString()}] Sync job finished with exit code ${code}.`);
    console.log(`Next sync scheduled in 24 hours.`);
  });
}

// Run immediately on launch
console.log("DhakaFLIX Daily Sync Daemon started.");
console.log(`Sync interval: 24 hours.`);
runSync();

// Schedule recurring 24-hour interval
setInterval(runSync, INTERVAL_MS);
