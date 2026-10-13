# DhakaFLIX 🍿

<p align="center">
  <img src="public/logo.svg" alt="DhakaFLIX Logo" width="110" />
</p>

<p align="center">
  <strong>An open-source user interface for enhancing the media browsing experience for users whose ISP provides access to DhakaFLIX BDIX servers.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/VLC_Media_Player-1--Click-FF8800?style=for-the-badge&logo=vlc-media-player&logoColor=white" alt="VLC" />
</p>

---

> [!IMPORTANT]
> **What this project is:** DhakaFLIX is **strictly a client-side frontend / user interface**. It does **not** host, store, mirror, distribute, or stream any copyrighted media. It was created purely to enhance the viewing and browsing experience for users whose local Internet Service Provider (ISP) in Bangladesh already provides direct access to the local DhakaFLIX BDIX media servers (`172.16.50.x`).

---

## 📖 Why DhakaFLIX?

Many internet service providers in Bangladesh connect to high-speed **BDIX (Bangladesh Internet Exchange)** intranet servers (such as DhakaFLIX at `172.16.50.x`). While these servers offer high-speed intranet bandwidth, the default user experience is barebones:

| Default ISP Server Experience | With DhakaFLIX Frontend |
| :--- | :--- |
| Raw Apache / `h5ai` directory tables | 🎬 Modern, Netflix-style cinematic interface |
| Cryptic folder names (`Movie.Name.2025.1080p.x264...`) | ✨ Clean titles, release years, and quality badges |
| No posters, synopsis, or cast info | 🖼️ High-res TMDb posters, backdrops, and ratings |
| No search functionality across servers | 🔍 Instant sub-millisecond global multi-server search |
| Manual copy-pasting of stream URLs into media players | 🚀 1-Click native playback in VLC (Desktop, Android, iOS) |
| Hard to follow multi-season TV episodes | 📺 Organized TV series browser with season/episode breakdown |

DhakaFLIX acts as a **presentation and navigation layer** on top of your existing ISP access. It crawls the directory structure, organizes items into modular catalogs, fetches official metadata via The Movie Database (TMDb) API, and gives you a modern, enjoyable way to browse what's available on your local network.

---

## ⚡ Network Access Requirement

```
                  ┌───────────────────────────────┐
                  │    DhakaFLIX Web Interface    │ (Hosted on Vercel / Localhost)
                  │   (Metadata, Posters, Search) │
                  └───────────────┬───────────────┘
                                  │
          ┌───────────────────────┴───────────────────────┐
          │                                               │
   [Your ISP has BDIX Access]                  [No BDIX ISP Access]
          │                                               │
          ▼                                               ▼
✅ Videos stream directly at high speed         ⚠️ UI & metadata load normally,
   from local DhakaFLIX storage IPs               but video streams will not play
   (e.g., 172.16.50.14)                           (Requires connection to a peered ISP)
```

> **Direct playback requires that your current internet connection is routed through an ISP that peers with the DhakaFLIX BDIX network.** If you are on an unpeered ISP, mobile data, or outside Bangladesh, you can explore the catalog and metadata, but the video files themselves will not load.

---

## ✨ Features

- 🎨 **Modern Cinema UI**: Built with Next.js 16 (Turbopack) and Tailwind CSS v4, featuring a dynamic hero spotlight carousel, horizontal media rails, and responsive mobile bottom navigation.
- ⚡ **Instant 0ms Catalog**: The catalog is organized into lightweight, modular JSON files with a 274KB curated `home.json` payload, ensuring the interface opens instantly without loading huge data blobs.
- 🚀 **1-Click VLC Playback**:
  - **Desktop (Localhost)**: Launches VLC directly via local process runner.
  - **Desktop (Production)**: Deep-links via custom `vlc://` protocol handler with RFC 3986 path encoding.
  - **Mobile (Android & iOS)**: Launches VLC Mobile app directly via native intent schemes and protocol links.
  - **Universal Fallback**: Generates dynamic `.m3u` playlist files compatible with VLC, MPV, PotPlayer, and IINA.
- 📺 **TV & Web Series Browser**: Pre-indexed seasons and episodes with clean episode numbering, file sizes, and direct streams.
- 🔍 **Instant Global Search**: Search titles and categories across all connected storage servers with real-time autocomplete suggestions.
- 🎬 **TMDb Metadata**: Automatically pulls official artwork, backdrops, ratings, overviews, and official YouTube trailers.
- 🔄 **Automated Daily Sync**: Built-in script (`scripts/sync-catalog.ts`) to crawl connected BDIX servers for new uploads, enrich them with TMDb data, and keep the catalog up to date.

---

## 🏗️ Storage Server Topology

DhakaFLIX indexes the following local BDIX storage nodes:

| Storage Node | Network Address | Indexed Sections |
| :--- | :--- | :--- |
| **Server 14** | `http://172.16.50.14` | English Movies (1080p), Hindi Cinema, South Movies, South Dubbed, Animation (1080p), IMDb Top 250 |
| **Server 7** | `http://172.16.50.7` | English Movies (720p), Kolkata Bangla Cinema, Foreign Language, 3D Movies |
| **Server 12** | `http://172.16.50.12` | TV & Web Series (Alphabetical & Numerical Folders) |
| **Server 10** | `http://172.16.50.10` | Anime & Cartoon Series, Documentaries, WWE & AEW Wrestling |
| **Server 8** | `http://172.16.50.8` | PC Games, Software Distributions |

---

## 📂 Project Structure

```plaintext
DhakaFLIX/
├── app/
│   ├── api/
│   │   ├── dhakaflix/catalog/   # Modular category catalog API with pagination
│   │   ├── media/streams/       # Direct stream & TV season/episode resolver
│   │   ├── media/trailer/       # Official YouTube trailer lookup
│   │   ├── search/              # Multi-server global search endpoint
│   │   └── vlc/                 # VLC 1-click play, .m3u playlist, and setup script
│   ├── globals.css              # Tailwind CSS styles & theme
│   ├── layout.tsx               # Root layout & theme provider
│   ├── manifest.ts              # PWA web app manifest
│   └── page.tsx                 # Main application page
├── components/
│   ├── back-to-top.tsx          # Smooth back-to-top button
│   ├── hero-slider.tsx          # Spotlight banner slider
│   ├── home-media-rail.tsx      # Horizontal scrolling media rails
│   ├── mobile-nav-bar.tsx       # Bottom navigation for mobile
│   ├── movie-grid-card.tsx      # Media card with poster, badges & hover actions
│   ├── movie-poster-placeholder.tsx # Graceful poster placeholder
│   ├── site-header.tsx          # Header with category dropdowns & live search
│   ├── stream-modal.tsx         # Details modal, season/episode list & VLC launcher
│   ├── theme-provider.tsx       # Dark mode provider
│   └── vlc-icon.tsx             # VLC icon component
├── hooks/
│   └── use-scroll-lock.ts       # Body scroll lock hook for modal/drawers
├── lib/
│   ├── catalog-store.ts         # Modular catalog loader & search engine
│   ├── dhakaflix.ts             # BDIX scraper, parser & stream resolution logic
│   ├── tmdb.ts                  # The Movie Database (TMDb) client
│   └── utils.ts                 # Styling utilities
├── public/
│   ├── catalog/                 # Pre-indexed category JSON catalogs & home.json
│   ├── icon.svg                 # Vector favicons
│   └── logo.svg                 # DhakaFLIX logomark
├── scripts/
│   ├── sync-catalog.ts          # Incremental BDIX crawler & TMDb enricher
│   ├── sync-daemon.mjs          # Sync background daemon
│   ├── run-daily-sync.bat       # Windows Task Scheduler batch runner
│   └── setup-daily-sync.ps1     # Windows Task Scheduler installer
├── .env.example                 # Environment variable template
├── package.json                 # Project dependencies & scripts
└── tsconfig.json                # TypeScript compiler config
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20 or newer)
- [npm](https://www.npmjs.com/) or [bun](https://bun.sh/)
- [VLC Media Player](https://www.videolan.org/vlc/)
- A free [TMDb API Key](https://www.themoviedb.org/settings/api) (for posters, ratings, and synopses)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SafinBhuiyan/DhakaFLIX.git
   cd DhakaFLIX
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Add your TMDb API key to `.env`:
   ```env
   TMDB_API_KEY=your_tmdb_api_key_here
   NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
   ```

4. **Run the local development server:**
   ```bash
   npm run dev
   ```
   Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## ⚡ 1-Click VLC Playback Setup

To avoid manually copying stream links into media players, DhakaFLIX supports direct 1-click playback:

### Desktop (Windows)
1. Run the one-time helper script generated by DhakaFLIX:
   ```
   http://localhost:3000/api/vlc/setup
   ```
   *(Or click "Setup 1-Click VLC" in the header navigation).*
2. This registers the `vlc://` custom protocol handler in Windows to launch VLC with RFC 3986-sanitized URLs.
3. Clicking **"Play in VLC"** on any title will immediately open the video in VLC Media Player.

### Mobile (Android & iOS)
- On Android, clicking **"Play in VLC"** invokes an Android Intent directly into the VLC app (`org.videolan.vlc`).
- On iOS, it uses the `vlc://` mobile scheme.

### Universal Playlist (.m3u)
- You can always click **"M3U"** in the stream modal to download an `.m3u` playlist file that opens in any desktop or mobile media player (VLC, MPV, PotPlayer, IINA).

---

## 🔄 Daily Catalog Synchronization

To update the catalog with new releases uploaded to the DhakaFLIX storage servers:

```bash
# Sync new releases locally
npm run sync

# Sync and push changes to GitHub
npm run sync:daily
```

### Windows Automated Task (Runs Daily at 4:00 AM)

Run the setup script in an Administrator PowerShell window:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-daily-sync.ps1
```

---

## 🛠️ Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts Next.js development server with Turbopack |
| `npm run build` | Builds optimized production bundle |
| `npm run start` | Runs production server |
| `npm run lint` | Runs ESLint |
| `npm run typecheck` | Checks TypeScript types |
| `npm run sync` | Runs incremental BDIX catalog synchronization |
| `npm run sync:daily` | Syncs catalog and pushes to GitHub |
| `npm run sync:daemon` | Runs catalog synchronization daemon |

---

## 🛡️ Disclaimer

- **DhakaFLIX is an independent, open-source user interface.**
- **No media hosting:** This project does not host, store, stream, or distribute any video, audio, or binary media files.
- **Access dependency:** All stream links point to internal BDIX intranet IP addresses (`172.16.50.x`) operated by local network providers. Streaming is only possible if your ISP already routes traffic to these servers.
- **Copyright & Trademarks:** All movie titles, descriptions, and poster artwork are provided by The Movie Database (TMDb) via their public API. All copyrights belong to their respective owners.
