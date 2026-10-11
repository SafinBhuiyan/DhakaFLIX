import fs from "fs";
import path from "path";

const CATEGORIES = [
  "movies1080p",
  "movies720p",
  "hindi",
  "southDubbed",
  "tvSeries",
  "kolkata",
  "animation1080p",
  "foreign",
  "imdb250",
];

async function main() {
  console.log("Fetching DhakaFlix catalog snapshot from local cluster...");
  const snapshot: Record<string, any> = {};

  for (const cat of CATEGORIES) {
    try {
      console.log(`Fetching category: ${cat}...`);
      const res = await fetch(`http://localhost:3000/api/dhakaflix/catalog?category=${cat}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        snapshot[cat] = {
          category: data.category,
          server: data.server,
          items: data.items || [],
        };
        console.log(`-> ${cat}: ${data.items?.length || 0} items`);
      } else {
        console.error(`Failed ${cat}: HTTP ${res.status}`);
      }
    } catch (err: any) {
      console.error(`Error ${cat}:`, err.message);
    }
  }

  const outPath = path.join(process.cwd(), "lib", "catalog-snapshot.json");
  fs.writeFileSync(outPath, JSON.stringify(snapshot, null, 2), "utf-8");
  console.log(`Snapshot saved to ${outPath}!`);
}

main();
