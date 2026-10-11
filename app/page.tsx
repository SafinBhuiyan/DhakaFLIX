"use client";

import { useState, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { ServerNavBar } from "@/components/server-nav-bar";
import { HeroSlider } from "@/components/hero-slider";
import { MovieGridCard } from "@/components/movie-grid-card";
import { StreamModal } from "@/components/stream-modal";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { Play, Loader2, RefreshCw, X } from "lucide-react";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("movies1080p");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [seriesList, setSeriesList] = useState<CatalogMovie[]>([]);
  const [categoryLabel, setCategoryLabel] = useState<string>("English Movies (1080p)");
  const [serverName, setServerName] = useState<string>("Server 14");
  const [loading, setLoading] = useState<boolean>(true);

  // Global Multi-Server Search State
  const [searchResults, setSearchResults] = useState<CatalogMovie[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Modal & VLC Feedback
  const [selectedMovie, setSelectedMovie] = useState<CatalogMovie | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Switch category cleanly
  const handleSelectCategory = (cat: string) => {
    if (cat === activeCategory && !searchQuery) return;
    setSearchQuery("");
    setSearchResults([]);
    setMovies([]);
    setActiveCategory(cat);
  };

  // Load Real Movies and Real TV Series from DhakaFlix
  const loadData = async (cat: string) => {
    setLoading(true);
    try {
      const [moviesRes, seriesRes] = await Promise.all([
        fetch(`/api/dhakaflix/catalog?category=${cat}&limit=50`),
        fetch(`/api/dhakaflix/catalog?category=tvSeries&limit=12`),
      ]);

      const [moviesData, seriesData] = await Promise.all([
        moviesRes.json(),
        seriesRes.json(),
      ]);

      setMovies(moviesData.items || []);
      setCategoryLabel(moviesData.category || "DhakaFlix Media");
      setServerName(moviesData.server || "Server 14");
      setSeriesList(seriesData.items || []);
    } catch (err) {
      console.error("Failed to load catalog:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(activeCategory);
  }, [activeCategory]);

  // Global multi-server search effect
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const controller = new AbortController();

    fetch(`/api/search?q=${encodeURIComponent(q)}&limit=36`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        setSearchResults(data.results || []);
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Search error:", err);
      })
      .finally(() => setSearching(false));

    return () => controller.abort();
  }, [searchQuery]);

  // 1-Click Native Play in VLC (with full Android & iOS mobile support)
  const handlePlayVlc = async (streamUrl: string, title: string) => {
    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

    if (isMobile) {
      setToastMessage({ text: `Opening "${title}" in VLC Mobile...`, type: "success" });

      if (isAndroid) {
        // Android Intent specifically invoking VLC for Android
        const cleanUrl = streamUrl.replace(/^https?:\/\//i, "");
        const scheme = streamUrl.startsWith("https") ? "https" : "http";
        const androidIntent = `intent://${cleanUrl}#Intent;package=org.videolan.vlc;type=video/*;scheme=${scheme};end`;

        try {
          window.location.href = androidIntent;
        } catch {
          window.location.href = `vlc://${streamUrl}`;
        }
      } else {
        // iOS / iPadOS universal VLC URL scheme
        window.location.href = `vlc://${streamUrl}`;
      }

      setTimeout(() => {
        setToastMessage({
          text: `Opened in VLC. If VLC didn't open automatically, download the .m3u playlist in the modal.`,
          type: "success",
        });
      }, 2500);

      setTimeout(() => setToastMessage(null), 5500);
      return;
    }

    // Desktop
    const isLocalhost = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

    if (isLocalhost) {
      setToastMessage({ text: `Launching VLC Media Player for "${title}"...`, type: "success" });
      try {
        const res = await fetch("/api/vlc/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamUrl }),
        });
        const data = await res.json();
        if (data.ok) {
          setToastMessage({ text: `Playing "${title}" in VLC!`, type: "success" });
          setTimeout(() => setToastMessage(null), 3500);
          return;
        }
      } catch {}
    }

    // Remote / Vercel Production Desktop
    setToastMessage({ text: `Opening "${title}" in VLC Media Player...`, type: "success" });
    window.location.href = `vlc://${streamUrl}`;

    setTimeout(() => {
      setToastMessage({
        text: `Launched in VLC. If it didn't open, click the Download Playlist icon in the streams modal.`,
        type: "success",
      });
    }, 2500);
    setTimeout(() => setToastMessage(null), 5500);
  };

  const isSearching = !!searchQuery.trim();
  const isHome = activeCategory === "movies1080p" && !isSearching;
  const spotlightMovie = isHome && movies.length > 0 ? movies[0] : null;

  // Decide which movies to display in the grid
  const displayedMovies = isSearching
    ? searchResults
    : isHome && spotlightMovie
    ? movies.slice(1)
    : movies;

  const currentLoading = isSearching ? searching : loading;

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-neutral-200 flex flex-col font-sans">
      {/* 1. Top Header with Live Search Suggestions */}
      <SiteHeader
        onSearch={setSearchQuery}
        onSelectMovie={setSelectedMovie}
        onPlayVlc={handlePlayVlc}
      />

      {/* 2. Accessible Category Navigation Bar */}
      <ServerNavBar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* 3. Full-Width Main Content Layout */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-8 py-6 flex-1">
        <main className="space-y-8">
          
          {/* Top Spotlight Banner (Home page only) */}
          {spotlightMovie && (
            <HeroSlider
              movie={spotlightMovie}
              onPlayVlc={handlePlayVlc}
              onSelectMovie={setSelectedMovie}
            />
          )}

          {/* Main Media Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#e50914] rounded-sm"></span>
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  {isSearching ? (
                    <span>
                      Search Results for &ldquo;{searchQuery}&rdquo; ({searchResults.length} Titles Found)
                    </span>
                  ) : isHome ? (
                    "Latest 1080p Releases"
                  ) : (
                    `${categoryLabel} (${displayedMovies.length} Titles)`
                  )}
                </h2>

                {isSearching && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1 rounded-md transition ml-2"
                  >
                    <X className="w-3 h-3" />
                    <span>Clear Search</span>
                  </button>
                )}
              </div>

              {!isSearching && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadData(activeCategory)}
                    aria-label="Refresh list"
                    className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded p-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-500" : ""}`} />
                    <span>Refresh</span>
                  </button>
                </div>
              )}
            </div>

            {currentLoading ? (
              <div className="p-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-3 bg-[#131315] rounded-2xl border border-white/5">
                <Loader2 className="w-8 h-8 animate-spin text-[#e50914]" />
                <span className="text-sm">
                  {isSearching
                    ? `Searching across all DhakaFlix storage nodes for "${searchQuery}"...`
                    : `Loading authentic files from DhakaFlix ${serverName}...`}
                </span>
              </div>
            ) : displayedMovies.length === 0 ? (
              <div className="p-16 text-center text-sm text-neutral-400 bg-[#131315] rounded-2xl border border-white/5 space-y-2">
                <p>No titles found matching &ldquo;{searchQuery}&rdquo; across any DhakaFlix storage servers.</p>
                {isSearching && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#e50914] text-white text-xs font-bold hover:bg-red-700 transition"
                  >
                    <span>Back to Browsing</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {displayedMovies.map((movie, idx) => (
                  <MovieGridCard
                    key={`${isSearching ? "search" : activeCategory}-${movie.id}-${idx}`}
                    movie={movie}
                    onPlayVlc={handlePlayVlc}
                    onSelectMovie={setSelectedMovie}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Real TV & Web Series from Server 12 (Home page only) */}
          {isHome && seriesList.length > 0 && (
            <section className="space-y-3 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-[#e50914] rounded-sm"></span>
                  TV & Web Series
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {seriesList.map((series, idx) => (
                  <MovieGridCard
                    key={`series-${series.id}-${idx}`}
                    movie={series}
                    onPlayVlc={handlePlayVlc}
                    onSelectMovie={setSelectedMovie}
                  />
                ))}
              </div>
            </section>
          )}
        </main>
      </div>

      {/* Clean Footer */}
      <footer className="bg-[#121213] border-t border-white/10 py-6 mt-16 text-center text-xs text-neutral-400 space-y-1">
        <p className="font-semibold text-white tracking-wide">
          DHAKA<span className="text-[#e50914]">FLIX</span> • Local High-Speed BDIX Media
        </p>
        <p className="text-[11px] text-neutral-400">
          Connected Storage: Server 7 • Server 14 • Server 12
        </p>
      </footer>

      {/* Stream Selector Modal with direct VLC Play */}
      <StreamModal
        movie={selectedMovie}
        onClose={() => setSelectedMovie(null)}
        onPlayVlc={handlePlayVlc}
      />

      {/* Floating VLC Launch Feedback Toast */}
      {toastMessage && (
        <div 
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900/95 border border-[#e50914]/50 text-white shadow-2xl backdrop-blur-md"
        >
          <Play className="w-4 h-4 fill-[#e50914] text-[#e50914] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
