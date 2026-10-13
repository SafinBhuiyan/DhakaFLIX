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
import { ContinueWatchingRail } from "@/components/continue-watching-rail";
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
  const [activeCategory, setActiveCategory] = useState<string>("home");
  const [searchQuery, setSearchQuery] = useState<string>("");

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
  const handlePlayVlc = async (streamUrl: string, title: string) => {
    if (!streamUrl || !streamUrl.trim()) {
      setToastMessage({ text: `No direct stream URL available for "${title}"`, type: "error" });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    if (streamUrl.endsWith("/")) {
      window.open(streamUrl, "_blank");
      setToastMessage({ text: `Opening directory for "${title}" on BDIX server...`, type: "success" });
      setTimeout(() => setToastMessage(null), 3500);
      return;
    }

    // Format URL through Helper Relay if enabled (for mobile data / off-network access)
    let validUrl = formatStreamUrl(streamUrl);

    // If not using relay, sanitize stream URL for VLC (RFC 3986 compliance: encode spaces and brackets)
    if (validUrl === streamUrl) {
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
    }

    // Automatically record into user's client-side watch history
    const matched =
      selectedMovie ||
      homeSpotlight.find((m) => m.title === title || (m.videoUrl && m.videoUrl === streamUrl)) ||
      movies.find((m) => m.title === title || (m.videoUrl && m.videoUrl === streamUrl));

    const isTvCandidate =
      Boolean(matched?.category && /tv|series/i.test(matched.category)) ||
      /tv|series|episode|season/i.test(title);

    const updatedHistory = addToWatchHistory({
      id: matched?.id || encodeURIComponent(validUrl),
      title: matched?.title || title,
      year: matched?.year,
      quality: matched?.quality,
      poster: matched?.poster,
      backdrop: matched?.backdrop,
      rating: matched?.rating,
      serverUrl: matched?.serverUrl,
      videoUrl: validUrl,
      category: matched?.category,
      sourceServer: matched?.sourceServer,
      isSeries: isTvCandidate,
    });
    setWatchHistory(updatedHistory);

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

              {/* Dynamic Continue Watching Rail (Stored in client-side localStorage) */}
              {watchHistory.length > 0 && (
                <ContinueWatchingRail
                  items={watchHistory}
                  onPlayVlc={handlePlayVlc}
                  onSelectMovie={setSelectedMovie}
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
