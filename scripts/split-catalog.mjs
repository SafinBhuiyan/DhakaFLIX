import fs from "fs";
import path from "path";

const snapshotPath = path.join(process.cwd(), "lib", "catalog-snapshot.json");
const outDir = path.join(process.cwd(), "data", "catalog");

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

console.log("Loading catalog snapshot...");
const raw = JSON.parse(fs.readFileSync(snapshotPath, "utf-8"));

// 1. Generate home.json (Spotlight + top 24 items of each rail)
console.log("Generating home.json...");
const HOME_SECTIONS_CONFIG = [
  { key: "movies1080p", label: "Trending 1080p Movies", server: "Server 14" },
  { key: "tvSeries", label: "TV & Web Series", server: "Server 12" },
  { key: "hindi", label: "Hindi & Bollywood Hits", server: "Server 14" },
  { key: "imdb250", label: "IMDb Top-250 Masterpieces", server: "Server 14" },
  { key: "southDubbed", label: "South-Movie Hindi Dubbed", server: "Server 14" },
  { key: "animation1080p", label: "Animation & Anime (1080p)", server: "Server 14" },
  { key: "foreign", label: "Foreign Language Cinema", server: "Server 7" },
  { key: "kolkata", label: "Kolkata Bangla Movies", server: "Server 7" },
  { key: "movies720p", label: "English Movies (720p)", server: "Server 7" },
];

const homeSections = HOME_SECTIONS_CONFIG.map((secDef) => {
  const data = raw[secDef.key];
  const items = (data?.items || []).slice(0, 24);
  return {
    id: secDef.key,
    label: secDef.label,
    server: data?.server || secDef.server,
    total: data?.items?.length || items.length,
    items,
  };
});

const spotlightCandidates = [
  ...(raw.movies1080p?.items || []).slice(0, 8),
  ...(raw.imdb250?.items || []).slice(0, 6),
  ...(raw.tvSeries?.items || []).slice(0, 6),
];
const spotlight = spotlightCandidates
  .filter((m) => m.backdrop && m.overview)
  .slice(0, 5);

const homeData = {
  isHome: true,
  category: "Home",
  server: "All Storage Nodes",
  spotlight,
  sections: homeSections,
};

fs.writeFileSync(path.join(outDir, "home.json"), JSON.stringify(homeData), "utf-8");
console.log(`Saved home.json: ${(fs.statSync(path.join(outDir, "home.json")).size / 1024).toFixed(1)} KB`);

// 2. Save individual category files
for (const [key, section] of Object.entries(raw)) {
  const filePath = path.join(outDir, `${key}.json`);
  fs.writeFileSync(filePath, JSON.stringify(section), "utf-8");
  console.log(`Saved ${key}.json: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB`);
}

console.log("All categories split successfully into data/catalog/!");
