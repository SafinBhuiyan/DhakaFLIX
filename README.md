# DhakaFLIX 🍿

<p align="center">
  <img src="public/logo.svg" alt="DhakaFLIX Logo" width="110" />
</p>

<p align="center">
  <strong>Next-Gen High-Performance Streaming UI & Automated Media Catalog for BDIX Storage Clusters</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/VLC_Media_Player-1--Click-FF8800?style=for-the-badge&logo=vlc-media-player&logoColor=white" alt="VLC" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

---

## 📖 Overview

In Bangladesh, high-speed **BDIX (Bangladesh Internet Exchange)** FTP and media servers host petabytes of high-definition movies and television series at ultra-fast local intranet speeds (typically 50–100 Mbps+). However, traditional BDIX servers present raw, unindexed web directories (such as default `h5ai` or Apache folder indexes) with:
- ❌ No movie posters, synopses, or backdrop art
- ❌ Clunky filenames, obscure directory hierarchies, and no global search
- ❌ Cumbersome manual copy-pasting of stream URLs into media players
- ❌ Zero mobile responsiveness or episode navigation

**DhakaFLIX** bridges this gap. It turns disparate local BDIX storage servers into a **Netflix-grade, cinema-quality streaming platform**. With automated metadata enrichment, modular static catalogs for **0ms instant loads**, full TV series episode browsers, and universal **1-Click VLC playback** across desktop, Android, and iOS, DhakaFLIX delivers a seamless streaming experience.

---

## ✨ Features

- ⚡ **0ms Instant Load (Modular Static Architecture)**: The 35,000+ title catalog is split into category-based static JSON modules with a curated 274KB `home.json` payload, eliminating sluggish multi-megabyte bundle downloads.
- 🎨 **Netflix-Grade Cinema Interface**: Built with modern Tailwind CSS v4, dynamic hero spotlight carousel, smooth-scrolling media rails, interactive cards with hover overlays, and responsive mobile bottom navigation.
- 🚀 **1-Click Native VLC Playback**:
  - **Desktop (Localhost)**: Launches VLC directly via local subprocess execution.
  - **Desktop (Web / Production)**: Deep-links via custom `vlc://` protocol handler with RFC 3986 URL sanitization.
  - **Mobile (Android & iOS)**: Launches VLC Mobile app directly via intent schemes and protocol handlers.
  - **Universal Fallback**: On-the-fly `.m3u` playlist downloads compatible with VLC, PotPlayer, MPV, and IINA.
- 📺 **Full TV & Web Series Episode Browser**: Pre-indexed multi-season and multi-episode hierarchy with clean episode titles, file sizes, and direct streams.
- 🔍 **Instant Global Multi-Server Search**: Sub-millisecond title and keyword search across all connected storage nodes simultaneously with abort-guarded typeahead suggestions.
- 🎬 **TMDb Metadata Enrichment**: Automatically fetches official posters, high-resolution backdrops, IMDb/TMDb ratings, plot overviews, release years, and YouTube trailers.
- 🔄 **Automated Daily Sync Engine**: Scheduled incremental crawler (`scripts/sync-catalog.ts`) that scans connected storage nodes for fresh releases, enriches new entries, rebuilds the home catalog, and pushes updates to GitHub/Vercel.

---

## 🏗️ Storage Cluster Topology

DhakaFLIX connects to multiple dedicated high-speed BDIX storage nodes:

| Storage Node | Network Address | Primary Content |
| :--- | :--- | :--- |
| **Server 14** | `http://172.16.50.14` | English Movies (1080p), Hindi Cinema, South Movies, South Dubbed, Animation (1080p), IMDb Top 250 |
| **Server 7** | `http://172.16.50.7` | English Movies (720p), Kolkata Bangla Cinema, Foreign Language & Korean, 3D Movies |
| **Server 12** | `http://172.16.50.12` | TV & Web Series (Alphabetical & Numerical Buckets) |
| **Server 10** | `http://172.16.50.10` | Anime & Cartoon Series, Documentaries, WWE & AEW Wrestling |
| **Server 8** | `http://172.16.50.8` | PC Games, Software Distributions |

> **Note:** Streaming directly from BDIX IP addresses requires a network connection to a BDIX-peered ISP in Bangladesh. When deployed to public clouds like Vercel, metadata and catalog browsing function universally, while video playback routes to your BDIX connection.

---

## 📂 Project Structure

```plaintext
DhakaFLIX/
├── app/
│   ├── api/
│   │   ├── dhakaflix/catalog/   # Modular category catalog API with pagination
│   │   ├── media/streams/       # Direct stream & TV season/episode resolver
│   │   ├── media/trailer/       # Official YouTube trailer lookup
│   │   ├── search/              # Fast multi-server global search
│   │   └── vlc/                 # VLC 1-click play, playlist (.m3u), and setup script
│   ├── globals.css              # Tailwind CSS styles & dark theme definitions
│   ├── layout.tsx               # Root layout, fonts, and theme provider
│   ├── manifest.ts              # PWA web app manifest
│   └── page.tsx                 # Core streaming application interface
├── components/
│   ├── back-to-top.tsx          # Floating back-to-top button with scroll ring
│   ├── hero-slider.tsx          # Spotlight carousel with backdrops & quick actions
│   ├── home-media-rail.tsx      # Smooth-scrolling horizontal category media rails
│   ├── mobile-nav-bar.tsx       # Bottom navigation bar for mobile devices
│   ├── movie-grid-card.tsx      # Movie & show card with poster, badges & actions
│   ├── movie-poster-placeholder.tsx # Graceful poster placeholder fallback
│   ├── site-header.tsx          # Top navigation, category menus & live search
│   ├── stream-modal.tsx         # Media details, TV seasons/episodes & stream launcher
│   ├── theme-provider.tsx       # Next-themes dark mode provider
│   └── vlc-icon.tsx             # VLC media player vector icon
├── hooks/
│   └── use-scroll-lock.ts       # Body scroll locking utility for modals/drawers
├── lib/
│   ├── catalog-store.ts         # Modular catalog reader, search & memory cache
│   ├── dhakaflix.ts             # BDIX scraper, parser & stream extraction engine
│   ├── tmdb.ts                  # The Movie Database (TMDb) API client
│   └── utils.ts                 # Class variance authority & tailwind class merger
├── public/
│   ├── catalog/                 # Pre-indexed category JSON files & home.json
│   ├── icon.svg                 # Application favicons & vector assets
│   └── logo.svg                 # DhakaFLIX brand logomark
├── scripts/
│   ├── sync-catalog.ts          # Incremental BDIX crawler & TMDb enricher
│   ├── sync-daemon.mjs          # Background sync loop daemon
│   ├── run-daily-sync.bat       # Windows Task Scheduler batch runner
│   └── setup-daily-sync.ps1     # One-click Windows Task Scheduler installer
├── .env.example                 # Environment variable template
├── package.json                 # Project dependencies & automation scripts
└── tsconfig.json                # TypeScript compiler configuration
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 20.x or newer)
- [npm](https://www.npmjs.com/), [pnpm](https://pnpm.io/), or [bun](https://bun.sh/)
- [VLC Media Player](https://www.videolan.org/vlc/) installed on your playback device
- A free [TMDb API Key](https://www.themoviedb.org/settings/api)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/DhakaFLIX.git
cd DhakaFLIX
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Open `.env` and insert your TMDb API key:

```env
TMDB_API_KEY=your_tmdb_api_key_here
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key_here
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ⚡ 1-Click VLC Playback Setup

DhakaFLIX enables seamless 1-click video playback directly in VLC Media Player without needing to manually copy stream links.

### On Desktop (Windows):
1. **Automated Registration**: Download and run the one-time protocol registrar generated by DhakaFLIX at:
   ```
   http://localhost:3000/api/vlc/setup
   ```
   *(Or click "Setup 1-Click VLC" in the header navigation).*
2. This registers the lightweight `vlc://` protocol in Windows with RFC 3986 path encoding for BDIX streams.
3. Once installed, clicking **"Play in VLC"** on any title or episode instantly launches VLC and starts streaming.

### On Mobile (Android / iOS):
- **Android**: Clicking **"Play in VLC"** triggers the Android Intent directly to the VLC for Android app (`org.videolan.vlc`).
- **iOS**: Clicking **"Play in VLC"** invokes the `vlc://` mobile scheme.

### Universal Fallback (.m3u):
- If protocol handlers are unavailable, clicking **"M3U"** inside the modal downloads a ready-to-play `.m3u` playlist file that opens in any desktop or mobile media player (VLC, MPV, PotPlayer, IINA).

---

## 🔄 Automated Catalog Synchronization

DhakaFLIX features an automated incremental synchronization engine (`scripts/sync-catalog.ts`) that queries BDIX servers for new movie and episode releases, extracts direct video files, enriches them with TMDb data, and updates the static catalog files.

### Manual Sync

```bash
# Sync new releases locally
npm run sync

# Sync and automatically commit & push to GitHub (triggers cloud redeploy)
npm run sync:daily
```

### Windows Automated Task Scheduler (Daily at 4:00 AM)

Run the PowerShell setup script as Administrator:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-daily-sync.ps1
```

This schedules a silent daily task that checks for BDIX connectivity, fetches new releases, enriches metadata, and updates your repository automatically.

### Background Daemon (Long-running process)

```bash
npm run sync:daemon
```

---

## 🛠️ Available Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `dev` | `npm run dev` | Starts Next.js development server with Turbopack |
| `build` | `npm run build` | Builds optimized production bundle |
| `start` | `npm run start` | Runs the production build server |
| `lint` | `npm run lint` | Runs ESLint analysis across the codebase |
| `typecheck` | `npm run typecheck` | Runs TypeScript compiler checks without emitting files |
| `format` | `npm run format` | Formats all source code with Prettier and Tailwind plugin |
| `sync` | `npm run sync` | Runs incremental BDIX catalog synchronization |
| `sync:daily` | `npm run sync:daily` | Incremental sync with automatic Git commit & push |
| `sync:daemon` | `npm run sync:daemon` | Runs catalog sync daemon on a recurring interval |

---

## 🌐 Deployment

DhakaFLIX is fully compatible with [Vercel](https://vercel.com/) and containerized platforms:

1. Push this repository to GitHub.
2. Import the project into Vercel.
3. Add the `TMDB_API_KEY` and `NEXT_PUBLIC_TMDB_API_KEY` environment variables in Vercel Project Settings.
4. Deploy! The modular catalog JSON files in `public/catalog/` are served with static cache headers for blazing-fast responses worldwide.

---

## 🛡️ Disclaimer

- **Disclaimer**: DhakaFLIX does not host, store, or upload any media files. It is an open-source user interface that indexes publicly accessible intranet directory listings across local BDIX networks for personal, non-commercial use. All trademarks, movie titles, and metadata belong to their respective copyright holders.
