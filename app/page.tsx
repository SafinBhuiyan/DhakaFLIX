"use client";

import { useState, useEffect, useMemo } from "react";
import { SiteHeader } from "@/components/site-header";
import { ServerNavBar } from "@/components/server-nav-bar";
import { HeroSlider } from "@/components/hero-slider";
import { MovieGridCard } from "@/components/movie-grid-card";
import { StreamModal } from "@/components/stream-modal";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { Play, Loader2, RefreshCw } from "lucide-react";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("movies1080p");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [seriesList, setSeriesList] = useState<CatalogMovie[]>([]);
  const [categoryLabel, setCategoryLabel] = useState<string>("English Movies (1080p)");
  const [serverName, setServerName] = useState<string>("Server 14");
  const [loading, setLoading] = useState<boolean>(true);

  // Modal & VLC Feedback
  const [selectedMovie, setSelectedMovie] = useState<CatalogMovie | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Switch category cleanly
  const handleSelectCategory = (cat: string) => {
    if (cat === activeCategory) return;
    setSearchQuery("");
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

  // 1-Click Native Play in VLC
  const handlePlayVlc = async (streamUrl: string, title: string) => {
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
      } else {
        window.location.href = `/api/vlc/playlist?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}`;
        setToastMessage({ text: `Opened stream in VLC playlist.`, type: "success" });
      }
    } catch {
      window.location.href = `/api/vlc/playlist?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}`;
      setToastMessage({ text: `Opened stream in VLC playlist.`, type: "success" });
    }

    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filter movies by search query
  const filteredMovies = useMemo(() => {
    if (!searchQuery.trim()) return movies;
    const q = searchQuery.toLowerCase();
    return movies.filter((m) => m.title.toLowerCase().includes(q));
  }, [movies, searchQuery]);

  const isHome = activeCategory === "movies1080p" && !searchQuery;
  const featuredBanners = filteredMovies.slice(0, 2);
  const featuredRow = filteredMovies.slice(0, 6);
  const mainGrid = isHome ? filteredMovies.slice(6) : filteredMovies;

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-neutral-200 flex flex-col font-sans">
      {/* 1. Clean Top Header */}
      <SiteHeader onSearch={setSearchQuery} />

      {/* 2. Servers & Categories Bar on Top of the Page */}
      <ServerNavBar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
      />

      {/* 2. Full-Width Main Content Layout */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-8 py-6 flex-1">
        <main className="space-y-8">
          
          {/* Top 2 Featured Banners (Home page only) */}
          {isHome && featuredBanners.length > 0 && (
            <HeroSlider
              movies={featuredBanners}
              onPlayVlc={handlePlayVlc}
              onSelectMovie={setSelectedMovie}
            />
          )}

          {/* Featured Row (Home page only) */}
          {isHome && featuredRow.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-[#e50914] rounded-sm"></span>
                  Featured Releases
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {featuredRow.map((movie, idx) => (
                  <MovieGridCard
                    key={`feat-${movie.id}-${idx}`}
                    movie={movie}
                    onPlayVlc={handlePlayVlc}
                    onSelectMovie={setSelectedMovie}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Main Media Grid */}
          <section className="space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <span className="w-1.5 h-3.5 bg-[#e50914] rounded-sm"></span>
                {searchQuery 
                  ? `Search Results for "${searchQuery}" (${filteredMovies.length})`
                  : isHome
                  ? "Latest 1080p Movies"
                  : `${categoryLabel} (${filteredMovies.length} Titles • ${serverName})`}
              </h2>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => loadData(activeCategory)}
                  className="text-xs text-neutral-400 hover:text-white flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-red-500" : ""}`} />
                  <span>Refresh</span>
                </button>
              </div>
            </div>

            {loading ? (
              <div className="p-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-3 bg-[#131315] rounded border border-white/5">
                <Loader2 className="w-7 h-7 animate-spin text-[#e50914]" />
                <span>Loading authentic files from DhakaFlix {serverName}...</span>
              </div>
            ) : filteredMovies.length === 0 ? (
              <div className="p-16 text-center text-xs text-neutral-400 bg-[#131315] rounded border border-white/5">
                No files found matching your criteria on DhakaFlix.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                {mainGrid.map((movie, idx) => (
                  <MovieGridCard
                    key={`main-${activeCategory}-${movie.id}-${idx}`}
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
            <section className="space-y-3 pt-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2">
                  <span className="w-1.5 h-3.5 bg-[#e50914] rounded-sm"></span>
                  Latest TV & Web Series (Server 12)
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

      {/* Footer */}
      <footer className="bg-[#121213] border-t border-white/10 py-6 mt-16 text-center text-xs text-neutral-400 space-y-1.5">
        <p className="max-w-2xl mx-auto px-4 leading-relaxed font-semibold text-white">
          DHAKAFLIX.COM • Local High-Speed BDIX Media Portal
        </p>
        <p className="text-[11px] text-neutral-400">
          Connected Storage Nodes: 172.16.50.7 (720p) • 172.16.50.14 (1080p / Hindi) • 172.16.50.12 (TV Series) • 172.16.50.8 (Games / Software)
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
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded bg-black/95 border border-[#e50914] text-white shadow-2xl backdrop-blur-md animate-bounce-short">
          <Play className="w-4 h-4 fill-[#e50914] text-[#e50914]" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
}
