"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { SiteHeader } from "@/components/site-header";
import { MobileNavBar } from "@/components/mobile-nav-bar";
import { HeroSlider } from "@/components/hero-slider";
import { HomeMediaRail, HomeRailSection } from "@/components/home-media-rail";
import { MovieGridCard } from "@/components/movie-grid-card";
import { StreamModal } from "@/components/stream-modal";
import { BackToTop } from "@/components/back-to-top";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import {
  Play,
  Loader2,
  X,
  ArrowLeft,
  Sparkles,
  Film,
  Tv,
  Flame,
  Award,
  Globe,
  Clapperboard,
} from "lucide-react";

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Home Specific State
  const [homeSpotlight, setHomeSpotlight] = useState<CatalogMovie[]>([]);
  const [homeSections, setHomeSections] = useState<HomeRailSection[]>([]);

  // Category Grid State (when browsing a single category)
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [categoryLabel, setCategoryLabel] = useState<string>("Featured Releases");
  const [serverName, setServerName] = useState<string>("Server 14");
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination & Infinite Scroll State for Category View
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const loadingMoreRef = useRef<boolean>(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Global Multi-Server Search State
  const [searchResults, setSearchResults] = useState<CatalogMovie[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // Modal & VLC Feedback
  const [selectedMovie, setSelectedMovie] = useState<CatalogMovie | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const isSearching = !!searchQuery.trim();
  const isHome = activeCategory === "home" && !isSearching;

  // Switch category cleanly
  const handleSelectCategory = (cat: string) => {
    if (cat === activeCategory && !searchQuery) return;
    setSearchQuery("");
    setSearchResults([]);
    setPage(1);
    setHasMore(true);
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Load Data: Either Home Payload or Dedicated Category
  const loadData = async (cat: string) => {
    setLoading(true);
    setPage(1);

    try {
      if (cat === "home") {
        // Fetch curated Home multi-section catalog with spotlight
        const res = await fetch(`/api/dhakaflix/catalog?category=home`);
        const data = await res.json();
        setHomeSpotlight(data.spotlight || []);
        setHomeSections(data.sections || []);
        setCategoryLabel("Home");
        setServerName("All Storage Nodes");
        setHasMore(false);
      } else {
        // Fetch specific category paginated catalog
        const res = await fetch(`/api/dhakaflix/catalog?category=${cat}&page=1&limit=24`);
        const data = await res.json();
        setMovies(data.items || []);
        setCategoryLabel(data.category || "DhakaFlix Media");
        setServerName(data.server || "Server 14");
        setHasMore(Boolean(data.hasMore));
        setTotalCount(data.total || (data.items?.length ?? 0));
      }
    } catch (err) {
      console.error("Failed to load catalog data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Load next page for infinite scrolling (Category View only)
  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore || isSearching || activeCategory === "home") return;
    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = page + 1;
      const res = await fetch(`/api/dhakaflix/catalog?category=${activeCategory}&page=${nextPage}&limit=24`);
      const data = await res.json();
      const newItems: CatalogMovie[] = data.items || [];

      if (newItems.length > 0) {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filtered = newItems.filter((m) => !existingIds.has(m.id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
        setTotalCount(data.total || 0);
      }
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      console.error("Failed to load more movies:", err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, hasMore, isSearching, page, activeCategory]);

  useEffect(() => {
    loadData(activeCategory);
  }, [activeCategory]);

  // Set up IntersectionObserver on bottom sentinel (Category View only)
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading || loadingMore || isSearching || activeCategory === "home") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "350px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, isSearching, activeCategory, loadMore]);

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

  // 1-Click Native Play in VLC (Android, iOS & Desktop)
  const handlePlayVlc = async (streamUrl: string, title: string) => {
    // Sanitize stream URL for VLC (RFC 3986 compliance: encode spaces and brackets)
    let validUrl = streamUrl;
    const protoIdx = validUrl.indexOf("://");
    if (protoIdx !== -1) {
      const proto = validUrl.substring(0, protoIdx);
      const rest = validUrl.substring(protoIdx + 3);
      const slashIdx = rest.indexOf("/");
      if (slashIdx !== -1) {
        const host = rest.substring(0, slashIdx);
        let path = rest.substring(slashIdx);
        path = path
          .replace(/ /g, "%20")
          .replace(/\[/g, "%5B")
          .replace(/\]/g, "%5D")
          .replace(/"/g, "%22");
        validUrl = `${proto}://${host}${path}`;
      }
    }

    const isMobile = typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);

    if (isMobile) {
      setToastMessage({ text: `Opening "${title}" in VLC Mobile...`, type: "success" });

      if (isAndroid) {
        const cleanUrl = validUrl.replace(/^https?:\/\//i, "");
        const scheme = validUrl.startsWith("https") ? "https" : "http";
        const androidIntent = `intent://${cleanUrl}#Intent;package=org.videolan.vlc;type=video/*;scheme=${scheme};end`;

        try {
          window.location.href = androidIntent;
        } catch {
          window.location.href = `vlc://${validUrl}`;
        }
      } else {
        window.location.href = `vlc://${validUrl}`;
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

    // Desktop: Localhost Direct Process or Protocol
    const isLocalhost = typeof window !== "undefined" && (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "[::1]" ||
      window.location.hostname === "::1"
    );

    if (isLocalhost) {
      setToastMessage({ text: `Launching VLC Media Player for "${title}"...`, type: "success" });
      try {
        const res = await fetch("/api/vlc/play", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ streamUrl: validUrl }),
        });
        const data = await res.json();
        if (data.ok) {
          setToastMessage({ text: `Playing "${title}" in VLC!`, type: "success" });
          setTimeout(() => setToastMessage(null), 3500);
          return;
        }
      } catch {}
    }

    // Remote / Production Desktop: 1-Click Launch via VLC Protocol
    setToastMessage({ text: `Launching "${title}" in VLC Media Player...`, type: "success" });

    try {
      window.location.href = `vlc://${validUrl}`;
      setTimeout(() => {
        setToastMessage({ text: `Playing "${title}" in VLC!`, type: "success" });
      }, 1500);
      setTimeout(() => setToastMessage(null), 4500);
    } catch {
      const playlistUrl = `/api/vlc/playlist?url=${encodeURIComponent(validUrl)}&title=${encodeURIComponent(title)}`;
      const link = document.createElement("a");
      link.href = playlistUrl;
      link.download = `${title.replace(/[^a-zA-Z0-9_\-\. ]/g, "_")}.m3u`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const currentLoading = isSearching ? searching : loading;

  // Quick navigation chips for Home page
  const homeQuickChips = [
    { id: "movies1080p", label: "1080p Movies", icon: Film },
    { id: "tvSeries", label: "TV Series", icon: Tv },
    { id: "hindi", label: "Hindi Movies", icon: Flame },
    { id: "imdb250", label: "IMDb Top 250", icon: Award },
    { id: "southDubbed", label: "South Dubbed", icon: Sparkles },
    { id: "animation1080p", label: "Animation", icon: Clapperboard },
    { id: "foreign", label: "Foreign & Korean", icon: Globe },
  ];

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-neutral-200 flex flex-col font-sans">
      {/* 1. Top Header with Netflix-Style Navigation & Live Search Suggestions */}
      <SiteHeader
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onSelectMovie={setSelectedMovie}
        onPlayVlc={handlePlayVlc}
        onHomeClick={() => handleSelectCategory("home")}
      />
      {/* Mobile Bottom Navigation */}
      <MobileNavBar
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onOpenSearch={() => {
          // Focus the search input in SiteHeader if it exists
          const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement | null;
          if (searchInput) searchInput.focus();
        }}
      />

      {/* 3. Main Content Container */}
      <div className="max-w-[1480px] w-full mx-auto px-4 sm:px-8 py-6 flex-1">
        <main className="space-y-8">

          {/* ============================================================ */}
          {/* CASE A: LIVE GLOBAL SEARCH RESULTS                           */}
          {/* ============================================================ */}
          {isSearching && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-1.5 h-4 bg-[#e50914] rounded-sm"></span>
                  <h2 className="text-base font-bold text-white">
                    Search Results for &ldquo;{searchQuery}&rdquo; ({searchResults.length} Titles Found)
                  </h2>
                </div>

                <button
                  onClick={() => setSearchQuery("")}
                  className="inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg transition"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Clear Search</span>
                </button>
              </div>

              {searching ? (
                <div className="p-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-3 bg-[#131315] rounded-2xl border border-white/5">
                  <Loader2 className="w-8 h-8 animate-spin text-[#e50914]" />
                  <span className="text-sm">
                    Searching across all DhakaFlix storage servers for &ldquo;{searchQuery}&rdquo;...
                  </span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-16 text-center text-sm text-neutral-400 bg-[#131315] rounded-2xl border border-white/5 space-y-3">
                  <p>No titles found matching &ldquo;{searchQuery}&rdquo; across any connected DhakaFlix servers.</p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      handleSelectCategory("home");
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e50914] text-white text-xs font-bold hover:bg-red-700 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Home</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {searchResults.map((movie, idx) => (
                    <MovieGridCard
                      key={`search-${movie.id}-${idx}`}
                      movie={movie}
                      onPlayVlc={handlePlayVlc}
                      onSelectMovie={setSelectedMovie}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ============================================================ */}
          {/* CASE B: TRUE AUTHENTIC STREAMING HOME PAGE                   */}
          {/* ============================================================ */}
          {isHome && (
            <div className="space-y-8">
              {/* Dynamic Hero Spotlight Slider */}
              {homeSpotlight.length > 0 && (
                <HeroSlider
                  movies={homeSpotlight}
                  onPlayVlc={handlePlayVlc}
                  onSelectMovie={setSelectedMovie}
                />
              )}

              {/* Quick Category Jump Chips
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <span className="text-xs font-semibold text-neutral-400 whitespace-nowrap pr-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#e50914]" />
                  Jump to:
                </span>
                {homeQuickChips.map((chip) => {
                  const ChipIcon = chip.icon;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => handleSelectCategory(chip.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.04] hover:bg-white/[0.09] text-neutral-300 hover:text-white border border-white/5 hover:border-white/10 transition whitespace-nowrap active:scale-95"
                    >
                      <ChipIcon className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{chip.label}</span>
                    </button>
                  );
                })}
              </div> */}

              {/* Loading State for Home */}
              {loading ? (
                <div className="p-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-3 bg-[#131315] rounded-2xl border border-white/5">
                  <Loader2 className="w-8 h-8 animate-spin text-[#e50914]" />
                  <span className="text-sm">Loading authentic catalog from DhakaFlix storage cluster...</span>
                </div>
              ) : (
                /* Curated Horizontal Media Rails for each Section */
                <div className="space-y-8">
                  {homeSections.map((section) => (
                    <HomeMediaRail
                      key={section.id}
                      section={section}
                      onSelectCategory={handleSelectCategory}
                      onSelectMovie={setSelectedMovie}
                      onPlayVlc={handlePlayVlc}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* CASE C: DEDICATED CATEGORY VIEW (Grid with Infinite Scroll)  */}
          {/* ============================================================ */}
          {!isHome && !isSearching && (
            <section className="space-y-4">
              {/* Grid Loading or Empty or Movies */}
              {loading ? (
                <div className="p-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-3 bg-[#131315] rounded-2xl border border-white/5">
                  <Loader2 className="w-8 h-8 animate-spin text-[#e50914]" />
                  <span className="text-sm">Loading titles from DhakaFlix {serverName}...</span>
                </div>
              ) : movies.length === 0 ? (
                <div className="p-16 text-center text-sm text-neutral-400 bg-[#131315] rounded-2xl border border-white/5 space-y-3">
                  <p>No titles currently available in this section.</p>
                  <button
                    onClick={() => handleSelectCategory("home")}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e50914] text-white text-xs font-bold hover:bg-red-700 transition"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Return to Home</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
                  {movies.map((movie, idx) => (
                    <MovieGridCard
                      key={`${activeCategory}-${movie.id}-${idx}`}
                      movie={movie}
                      onPlayVlc={handlePlayVlc}
                      onSelectMovie={setSelectedMovie}
                    />
                  ))}
                </div>
              )}

              {/* Infinite Scroll Sentinel & Feedback for Category View */}
              {!loading && movies.length > 0 && (
                <div className="pt-6 pb-2 flex flex-col items-center justify-center gap-3 w-full">
                  {hasMore && <div ref={sentinelRef} className="h-6 w-full pointer-events-none" />}

                  {loadingMore ? (
                    <div className="flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 shadow-xl backdrop-blur-sm animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-[#e50914]" />
                      <span className="font-medium">Loading more titles from {serverName}...</span>
                    </div>
                  ) : hasMore ? (
                    <button
                      onClick={loadMore}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-xs font-semibold text-neutral-300 hover:text-white transition active:scale-95 shadow-sm"
                    >
                      <span>Load More Titles</span>
                    </button>
                  ) : (
                    <div className="text-center py-4 text-xs text-neutral-500 border-t border-white/5 w-full">
                      <span>
                        ✓ You have reached the end of {categoryLabel} ({movies.length} titles)
                      </span>
                    </div>
                  )}
                </div>
              )}
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
          Connected Storage: Server 7 • Server 14 • Server 12 • Server 10 • Server 8
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
          className="fixed bottom-20 right-4 sm:bottom-22 sm:right-8 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-900/95 border border-[#e50914]/50 text-white shadow-2xl backdrop-blur-md max-w-[calc(100vw-2rem)]"
        >
          <Play className="w-4 h-4 fill-[#e50914] text-[#e50914] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Floating Back to Top Button with Scroll Progress Indicator */}
      <BackToTop />
    </div>
  );
}
