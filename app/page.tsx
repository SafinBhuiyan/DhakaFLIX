"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { MobileNavBar } from "@/components/mobile-nav-bar";
import { HeroSlider } from "@/components/hero-slider";
import { HomeMediaRail, HomeRailSection } from "@/components/home-media-rail";
import { MovieGridCard } from "@/components/movie-grid-card";
import { BackToTop } from "@/components/back-to-top";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { ContinueWatchingRail } from "@/components/continue-watching-rail";
import { playInVlc } from "@/lib/vlc-player";
import {
  getWatchHistory,
  addToWatchHistory,
  removeFromWatchHistory,
  clearWatchHistory,
  WatchHistoryItem,
} from "@/lib/user-store";
import { formatStreamUrl } from "@/lib/relay-config";
import {
  Play,
  Loader2,
  X,
  ArrowLeft,
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Read URL query params on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      const q = params.get("search");
      if (cat && cat !== "home") {
        setActiveCategory(cat);
      }
      if (q) {
        setSearchQuery(q);
      }
    }
  }, []);

  const handleSelectMovie = (movie: CatalogMovie) => {
    router.push(`/movie/${encodeURIComponent(movie.id)}`);
  };

  // Home Specific State
  const [homeSpotlight, setHomeSpotlight] = useState<CatalogMovie[]>([]);
  const [homeSections, setHomeSections] = useState<HomeRailSection[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistoryItem[]>([]);

  // Load watch history on client mount
  useEffect(() => {
    setWatchHistory(getWatchHistory());
  }, []);

  const handleRemoveHistoryItem = (id: string) => {
    const updated = removeFromWatchHistory(id);
    setWatchHistory(updated);
  };

  const handleClearHistory = () => {
    clearWatchHistory();
    setWatchHistory([]);
  };

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
  const pageRef = useRef<number>(1);
  const loadingMoreRef = useRef<boolean>(false);
  const lastFetchTimeRef = useRef<number>(0);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Global Multi-Server Search State
  const [searchResults, setSearchResults] = useState<CatalogMovie[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

  // VLC Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const isSearching = !!searchQuery.trim();
  const isHome = activeCategory === "home" && !isSearching;

  // Switch category cleanly
  const handleSelectCategory = (cat: string) => {
    if (cat === activeCategory && !searchQuery) return;
    setSearchQuery("");
    setSearchResults([]);
    pageRef.current = 1;
    setPage(1);
    setHasMore(true);
    setMovies([]);
    setActiveCategory(cat);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Load Data with AbortController to prevent race conditions on fast category switching
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    pageRef.current = 1;
    setPage(1);

    const fetchData = async () => {
      try {
        if (activeCategory === "home") {
          const res = await fetch(`/api/dhakaflix/catalog?category=home`, { signal: controller.signal });
          const data = await res.json();
          if (!controller.signal.aborted) {
            setHomeSpotlight(data.spotlight || []);
            setHomeSections(data.sections || []);
            setCategoryLabel("Home");
            setServerName("All Storage Nodes");
            setHasMore(false);
          }
        } else {
          const res = await fetch(`/api/dhakaflix/catalog?category=${activeCategory}&page=1&limit=24`, { signal: controller.signal });
          const data = await res.json();
          if (!controller.signal.aborted) {
            setMovies(data.items || []);
            setCategoryLabel(data.category || "DhakaFlix Media");
            setServerName(data.server || "Server 14");
            setHasMore(Boolean(data.hasMore) && (data.items?.length ?? 0) > 0);
            setTotalCount(data.total || (data.items?.length ?? 0));
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Failed to load catalog data:", err);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      controller.abort();
    };
  }, [activeCategory]);

  // Load next page for infinite scrolling (Category View only) with cooldown guard
  const loadMore = useCallback(async () => {
    if (loading || loadingMoreRef.current || !hasMore || isSearching || activeCategory === "home") return;

    const now = Date.now();
    if (now - lastFetchTimeRef.current < 500) return;
    lastFetchTimeRef.current = now;

    loadingMoreRef.current = true;
    setLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      const res = await fetch(`/api/dhakaflix/catalog?category=${activeCategory}&page=${nextPage}&limit=24`);
      const data = await res.json();
      const newItems: CatalogMovie[] = data.items || [];

      if (newItems.length > 0) {
        setMovies((prev) => {
          const existingIds = new Set(prev.map((m) => m.id));
          const filtered = newItems.filter((m) => !existingIds.has(m.id));
          return [...prev, ...filtered];
        });
        pageRef.current = nextPage;
        setPage(nextPage);
        setTotalCount(data.total || 0);
        setHasMore(Boolean(data.hasMore));
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Failed to load more movies:", err);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [loading, hasMore, isSearching, activeCategory]);

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
      { rootMargin: "150px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, isSearching, activeCategory, loadMore]);

  // Global multi-server search effect with AbortController guard
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
        if (!controller.signal.aborted) {
          setSearchResults(data.results || []);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") console.error("Search error:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      });

    return () => controller.abort();
  }, [searchQuery]);

  // 1-Click Native Play in VLC (Android, iOS & Desktop)
  const handlePlayVlc = (streamUrl: string, title: string) => {
    const matched =
      homeSpotlight.find((m) => m.title === title || (m.videoUrl && m.videoUrl === streamUrl)) ||
      movies.find((m) => m.title === title || (m.videoUrl && m.videoUrl === streamUrl));

    playInVlc({
      streamUrl,
      title,
      movie: matched,
      onToast: (msg) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 3500);
      },
    }).then(() => {
      setWatchHistory(getWatchHistory());
    });
  };

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-neutral-200 flex flex-col font-sans">
      {/* 1. Top Header with Netflix-Style Navigation & Live Search Suggestions */}
      <SiteHeader
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onSelectMovie={handleSelectMovie}
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
                      onSelectMovie={handleSelectMovie}
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
                  onSelectMovie={handleSelectMovie}
                />
              )}

              {/* Dynamic Continue Watching Rail (Stored in client-side localStorage) */}
              {watchHistory.length > 0 && (
                <ContinueWatchingRail
                  items={watchHistory}
                  onPlayVlc={handlePlayVlc}
                  onSelectMovie={handleSelectMovie}
                  onRemoveItem={handleRemoveHistoryItem}
                  onClearAll={handleClearHistory}
                />
              )}

              {/* Loading State for Home */}
              {loading ? (
                <div className="p-20 text-center text-xs text-neutral-400 flex flex-col items-center justify-center gap-3 bg-[#131315] rounded-2xl border border-white/5">
                  <Loader2 className="w-8 h-8 animate-spin text-[#e50914]" />
                  <span className="text-sm">Loading authentic catalog from DhakaFlix storage cluster...</span>
                </div>
              ) : (
                /* Curated Horizontal Media Rails for all Categories */
                <div className="space-y-6 sm:space-y-8">
                  {homeSections.map((section) => (
                    <HomeMediaRail
                      key={section.id}
                      section={section}
                      onSelectCategory={handleSelectCategory}
                      onSelectMovie={handleSelectMovie}
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
                      onSelectMovie={handleSelectMovie}
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
      <footer className="bg-[#121213] border-t border-white/10 py-6 pb-28 sm:pb-6 mt-16 text-center text-xs text-neutral-400 space-y-1">
        <p className="font-semibold text-white tracking-wide">
          DHAKA<span className="text-[#e50914]">FLIX</span> • Local High-Speed BDIX Media
        </p>
        <p className="text-[11px] text-neutral-400">
          Connected Storage: Server 7 • Server 14 • Server 12 • Server 10 • Server 8
        </p>
      </footer>

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
