"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Download,
  Copy,
  Check,
  Star,
  ExternalLink,
  HardDrive,
  Loader2,
  Film,
  Tv,
  ListVideo,
  Play,
  Folder,
  Bookmark,
  BookmarkCheck,
  X,
  Zap,
  Shield,
} from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { DhakaFlixStream, DhakaEpisode, DhakaSeason } from "@/lib/dhakaflix";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";
import { SiteHeader } from "@/components/site-header";
import { MobileNavBar } from "@/components/mobile-nav-bar";
import { playInVlc } from "@/lib/vlc-player";
import { isInWatchlist, toggleWatchlist } from "@/lib/user-store";
import {
  formatStreamUrl,
  getNetworkMode,
  setNetworkMode,
  checkDirectBdixAccess,
  NetworkMode,
} from "@/lib/relay-config";

function YoutubeIcon({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface MovieDetailsViewProps {
  initialMovie: CatalogMovie | null;
  id: string;
}

export function MovieDetailsView({ initialMovie, id }: MovieDetailsViewProps) {
  const router = useRouter();
  const [movie, setMovie] = useState<CatalogMovie | null>(initialMovie);
  const [movieLoading, setMovieLoading] = useState(!initialMovie);

  const [streams, setStreams] = useState<DhakaFlixStream[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [backdropError, setBackdropError] = useState(false);
  const [isSavedInWatchlist, setIsSavedInWatchlist] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // TV & Web Series Episode Collection State
  const [isSeries, setIsSeries] = useState(false);
  const [seasons, setSeasons] = useState<DhakaSeason[]>([]);
  const [activeSeasonNumber, setActiveSeasonNumber] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState<DhakaEpisode | null>(null);

  // YouTube Web Player State
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [trailerData, setTrailerData] = useState<{
    embedUrl: string;
    trailerTitle: string;
    youtubeUrl?: string;
  } | null>(null);

  // Smart Network Mode State (Auto, Direct BDIX, or Relay)
  const [networkMode, setNetworkModeState] = useState<NetworkMode>("auto");
  const [isBdixDirect, setIsBdixDirect] = useState<boolean>(true);

  // Sync Network Mode and probe direct BDIX reachability on mount
  useEffect(() => {
    setNetworkModeState(getNetworkMode());
    checkDirectBdixAccess().then((direct) => {
      setIsBdixDirect(direct);
    });
  }, [id]);

  const toggleNetworkMode = () => {
    const next: NetworkMode =
      networkMode === "auto" ? "direct" : networkMode === "direct" ? "relay" : "auto";
    setNetworkMode(next);
    setNetworkModeState(next);
  };

  const isEffectiveRelay =
    networkMode === "relay" || (networkMode === "auto" && !isBdixDirect);

  const getFormattedUrl = (url: string) => {
    return formatStreamUrl(url, isEffectiveRelay);
  };

  const showToast = useCallback((msg: { text: string; type: "success" | "error" }) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  }, []);

  // Sync Watchlist state on mount or movie change
  useEffect(() => {
    if (movie?.id) {
      setIsSavedInWatchlist(isInWatchlist(movie.id));
    }
  }, [movie]);

  // Fetch movie if initialMovie was null
  useEffect(() => {
    if (initialMovie) {
      setMovie(initialMovie);
      setMovieLoading(false);
      return;
    }

    let isMounted = true;
    setMovieLoading(true);

    fetch(`/api/media/movie?id=${encodeURIComponent(id)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        if (isMounted && data.movie) {
          setMovie(data.movie);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch movie details:", err);
      })
      .finally(() => {
        if (isMounted) setMovieLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id, initialMovie]);

  // Fetch Streams & Seasons once movie is resolved
  useEffect(() => {
    if (!movie) return;
    setImgError(false);
    setBackdropError(false);
    setCopiedUrl(null);
    setTrailerOpen(false);
    setTrailerData(null);

    const isLikelySeries =
      Boolean(movie.category && /tv|series|anime|cartoon|korean|show|drama/i.test(movie.category)) ||
      Boolean(movie.serverUrl && /\/TV-WEB-Series\/|\/TV%20Series\/|\/TV Series\/|\/Anime|\/Cartoon|Season/i.test(movie.serverUrl)) ||
      Boolean(movie.rawName && /[\(\[]?(?:TV\s+(?:Mini\s+)?Series|Season|\bS\d+\b)[^\)\]]*[\)\]]?/i.test(movie.rawName)) ||
      Boolean(movie.title && /[\(\[]?(?:TV\s+(?:Mini\s+)?Series|Season|\bS\d+\b)[^\)\]]*[\)\]]?/i.test(movie.title));

    if (isLikelySeries) {
      setLoadingStreams(true);
      setStreams([]);
      setIsSeries(true);
      setSeasons([]);
      setSelectedEpisode(null);
    } else {
      setIsSeries(false);
      setSeasons([]);
      setSelectedEpisode(null);

      // Instant direct stream resolution (0ms) for standalone movies
      const directUrl = movie.videoUrl || movie.serverUrl;
      const hasDirectVideo =
        Boolean(movie.videoUrl) ||
        Boolean(movie.serverUrl && /\.(mkv|mp4|avi)$/i.test(movie.serverUrl));

      if (hasDirectVideo && directUrl) {
        setStreams([
          {
            title: movie.title,
            year: movie.year,
            quality: movie.quality,
            fileName: movie.videoFileName || `${movie.title}.mkv`,
            streamUrl: directUrl,
            folderUrl: movie.serverUrl,
            fileSizeBytes: 0,
            fileSizeFormatted: movie.videoFileSize || "",
            sourceServer: movie.sourceServer || "Server 14",
            category: movie.category,
            modifiedDate: movie.modifiedDate || "2026",
          },
        ]);
        setLoadingStreams(false);
      } else {
        setStreams([]);
        setLoadingStreams(true);
      }
    }

    const controller = new AbortController();
    const queryUrl = `/api/media/streams?title=${encodeURIComponent(movie.title)}&year=${movie.year}&url=${encodeURIComponent(movie.serverUrl || "")}&category=${encodeURIComponent(movie.category || "")}`;

    fetch(queryUrl, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (controller.signal.aborted) return;
        if (data.isSeries && data.seasons && data.seasons.length > 0) {
          setIsSeries(true);
          setSeasons(data.seasons);
          const firstSeason = data.seasons[0];
          setActiveSeasonNumber(firstSeason.seasonNumber);
          if (firstSeason.episodes.length > 0) {
            setSelectedEpisode(firstSeason.episodes[0]);
          }
          if (data.streams) setStreams(data.streams);
        } else if (data.isSeries || isLikelySeries) {
          setIsSeries(true);
          setSeasons(data.seasons || []);
          if (data.streams) setStreams(data.streams);
        } else {
          setIsSeries(false);
          if (data.streams && data.streams.length > 0) {
            setStreams(data.streams);
          }
        }
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === "AbortError") return;
        console.error("Error finding streams:", err);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoadingStreams(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [movie]);

  // Handle escape key for trailer modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && trailerOpen) {
        setTrailerOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [trailerOpen]);

  const handleCopy = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedUrl(url);
          showToast({ text: "Stream URL copied to clipboard", type: "success" });
          setTimeout(() => setCopiedUrl(null), 2000);
        })
        .catch(() => {
          showToast({ text: "Failed to copy link", type: "error" });
        });
    }
  };

  const handleToggleWatchlist = () => {
    if (!movie) return;
    const added = toggleWatchlist(movie);
    setIsSavedInWatchlist(added);
    showToast({
      text: added ? `Added "${movie.title}" to Watchlist` : `Removed "${movie.title}" from Watchlist`,
      type: "success",
    });
  };

  const handleOpenTrailer = async () => {
    if (!movie) return;
    if (trailerData) {
      setTrailerOpen(true);
      return;
    }

    setTrailerLoading(true);
    try {
      const cleanTitle = movie.title.replace(/[\(\[]?TV\s+(?:Mini\s+)?Series[^\)\]]*[\)\]]?/i, "").trim();
      const res = await fetch(
        `/api/media/trailer?title=${encodeURIComponent(cleanTitle || movie.title)}&year=${movie.year}&type=${isSeries ? "tv" : "movie"}`
      );
      const data = await res.json();
      if (data.embedUrl) {
        setTrailerData(data);
        setTrailerOpen(true);
      } else if (data.youtubeSearchUrl) {
        window.open(data.youtubeSearchUrl, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("Failed to load trailer:", err);
      showToast({ text: "Failed to load trailer", type: "error" });
    } finally {
      setTrailerLoading(false);
    }
  };

  const handlePlayActiveVlc = () => {
    if (!movie) return;
    if (isSeries) {
      if (activeEpisode) {
        playInVlc({
          streamUrl: activeEpisode.streamUrl,
          title: `${movie.title} S${activeSeasonNumber}E${activeEpisode.episodeNumber} - ${activeEpisode.title}`,
          movie,
          seasonNumber: activeSeasonNumber,
          seasonName: currentSeason?.seasonName,
          episodeNumber: activeEpisode.episodeNumber,
          episodeTitle: activeEpisode.title,
          onToast: showToast,
        });
      } else {
        const el = document.getElementById("episodes-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
        showToast({ text: "Please select an episode below to stream.", type: "error" });
      }
    } else {
      const streamUrl = primaryStreamUrl;
      playInVlc({
        streamUrl,
        title: primaryTitle,
        movie,
        onToast: showToast,
      });
    }
  };

  // Resolve currently active season & episode
  const currentSeason =
    seasons.find((s) => s.seasonNumber === activeSeasonNumber) || seasons[0] || null;
  const currentEpisodes = currentSeason?.episodes || [];
  const activeEpisode = selectedEpisode || currentEpisodes[0] || null;
  const totalEpisodeCount = seasons.reduce((acc, s) => acc + s.episodes.length, 0);

  const primaryStream = streams.length > 0 ? streams[0] : null;
  const primaryStreamUrl = activeEpisode
    ? activeEpisode.streamUrl
    : primaryStream?.streamUrl || movie?.videoUrl || (movie?.serverUrl && !movie.serverUrl.endsWith("/") ? movie.serverUrl : "");
  const primaryTitle = activeEpisode
    ? `${movie?.title} S${activeSeasonNumber}E${activeEpisode.episodeNumber} - ${activeEpisode.title}`
    : movie?.title || "DhakaFlix Media";
  const fileSize = !isSeries
    ? movie?.videoFileSize || primaryStream?.fileSizeFormatted || primaryStream?.fileSize
    : null;
  const backdropSource = movie?.backdrop || movie?.poster;

  // Header navigation handlers (route to homepage with category or query)
  const handleSelectCategory = (cat: string) => {
    if (cat === "home") {
      router.push("/");
    } else {
      router.push(`/?category=${encodeURIComponent(cat)}`);
    }
  };

  const handleSearch = (q: string) => {
    if (q.trim()) {
      router.push(`/?search=${encodeURIComponent(q.trim())}`);
    }
  };

  // Back navigation: prefer browser history, fallback to home
  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  if (movieLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] text-neutral-200 flex flex-col font-sans">
        <SiteHeader
          activeCategory="home"
          onSelectCategory={handleSelectCategory}
          onSearch={handleSearch}
          onSelectMovie={(m) => router.push(`/movie/${encodeURIComponent(m.id)}`)}
          onHomeClick={() => router.push("/")}
        />
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-[#e50914]" />
          <p className="text-sm text-neutral-400">Loading title details...</p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#0e0e0f] text-neutral-200 flex flex-col font-sans">
        <SiteHeader
          activeCategory="home"
          onSelectCategory={handleSelectCategory}
          onSearch={handleSearch}
          onSelectMovie={(m) => router.push(`/movie/${encodeURIComponent(m.id)}`)}
          onHomeClick={() => router.push("/")}
        />
        <div className="flex-1 max-w-xl mx-auto px-4 py-20 text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-neutral-500">
            <Film className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white">Title Not Found</h1>
          <p className="text-sm text-neutral-400">
            The requested movie or series directory could not be located in the current DhakaFlix catalog index.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Go Back</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-red-700 text-white text-xs font-bold transition shadow-lg shadow-red-950/40"
            >
              <span>Explore Home</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0f] text-neutral-200 flex flex-col font-sans relative pb-28 md:pb-16 selection:bg-[#e50914] selection:text-white">
      {/* 1. Global Site Header */}
      <SiteHeader
        activeCategory="home"
        onSelectCategory={handleSelectCategory}
        onSearch={handleSearch}
        onSelectMovie={(m) => router.push(`/movie/${encodeURIComponent(m.id)}`)}
        onPlayVlc={(streamUrl, title) =>
          playInVlc({ streamUrl, title, movie, onToast: showToast })
        }
        onHomeClick={() => router.push("/")}
      />

      {/* 2. Floating Mobile Navigation Bar */}
      <MobileNavBar
        activeCategory="home"
        onSelectCategory={handleSelectCategory}
        onOpenSearch={() => {
          const searchInput = document.querySelector('input[name="search"]') as HTMLInputElement | null;
          if (searchInput) searchInput.focus();
        }}
      />

      {/* 3. Toast Notifications */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#1a1a1e] border border-white/15 shadow-2xl text-xs sm:text-sm font-medium animate-fade-in text-white backdrop-blur-md">
          <span
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === "success" ? "bg-emerald-400" : "bg-red-500"
            }`}
          />
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 4. Cinematic Ambient Backdrop Banner */}
      <div className="relative w-full h-[340px] sm:h-[460px] md:h-[520px] overflow-hidden select-none">
        {backdropSource && !backdropError ? (
          <img
            src={backdropSource}
            alt=""
            className="w-full h-full object-cover object-top opacity-35 scale-105 filter blur-xs sm:blur-none"
            onError={() => setBackdropError(true)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-red-950/25 via-[#18181b]/50 to-transparent" />
        )}

        {/* Ambient Gradient Masks (Top, Side, Bottom) */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0f] via-transparent to-[#0e0e0f]/80 hidden md:block" />
        <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />
      </div>

      {/* 5. Main Content Container (Overlapping Backdrop) */}
      <div className="relative z-10 max-w-[1400px] w-full mx-auto px-4 sm:px-8 -mt-44 sm:-mt-64 md:-mt-72 flex-1 pb-36 sm:pb-24">
        {/* Hero Card: 2-Column Poster + Details Header */}
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr] gap-5 sm:gap-8 items-start">
          
          {/* Column 1: Poster Frame */}
          <div className="w-36 sm:w-52 md:w-full mx-auto md:mx-0 aspect-[2/3] rounded-2xl overflow-hidden bg-black/60 shadow-2xl border border-white/15 ring-1 ring-white/10 relative shrink-0">
            {!movie.poster || imgError ? (
              <MoviePosterPlaceholder
                title={movie.title}
                year={movie.year}
                quality={movie.quality}
                category={movie.category}
                size="modal"
              />
            ) : (
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            )}

            {/* Quality Badge Overlay */}
            <div className="absolute top-2.5 left-2.5 pointer-events-none">
              <span className="bg-[#e50914] text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-wider">
                {movie.quality}
              </span>
            </div>
          </div>

          {/* Column 2: Title, Metadata, Actions, and Overview */}
          <div className="space-y-4 sm:space-y-5 text-center md:text-left">
            {/* Title */}
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                {movie.title}
              </h1>

              {movie.rawName && movie.rawName !== movie.title && (
                <p className="hidden sm:block text-xs font-mono text-neutral-400 truncate max-w-2xl" title={movie.rawName}>
                  {movie.rawName}
                </p>
              )}
            </div>

            {/* Rich Metadata Badges Row */}
            <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-2.5 flex-wrap text-xs sm:text-sm text-neutral-300">
              <span className="bg-[#e50914] text-white text-[10px] sm:text-[11px] font-black px-2 py-0.5 rounded uppercase">
                {movie.quality}
              </span>

              <span className="font-semibold text-white">{movie.year}</span>

              {movie.category && (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="text-neutral-300">{movie.category}</span>
                </>
              )}

              {isSeries && totalEpisodeCount > 0 ? (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="bg-purple-600/30 text-purple-300 text-xs font-bold px-2.5 py-0.5 rounded-md border border-purple-500/20">
                    {seasons.length > 1 ? `${seasons.length} Seasons • ` : ""}{totalEpisodeCount} Episodes
                  </span>
                </>
              ) : !isSeries && fileSize ? (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="font-mono text-neutral-300">{fileSize}</span>
                </>
              ) : null}

              {movie.rating ? (
                <>
                  <span className="text-neutral-600">•</span>
                  <span className="text-amber-400 font-bold flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {movie.rating.toFixed(1)}
                  </span>
                </>
              ) : null}

              <span className="text-neutral-600">•</span>
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium bg-emerald-950/30 border border-emerald-500/20 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {movie.sourceServer || "Server 14"}
              </span>

              <span className="text-neutral-600">•</span>
              <button
                type="button"
                onClick={toggleNetworkMode}
                className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold transition cursor-pointer active:scale-95 bg-white/5 hover:bg-white/10 border border-white/10"
                title={`Streaming Mode: ${networkMode.toUpperCase()} (Click to toggle: Auto -> Direct BDIX -> Relay)`}
              >
                {isEffectiveRelay ? (
                  <>
                    <Shield className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="text-purple-300">
                      {networkMode === "relay" ? "Forced Relay" : "Relay (Mobile)"}
                    </span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-amber-300">
                      {networkMode === "direct" ? "Direct BDIX" : "Direct (Wi-Fi)"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile-Friendly Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-1">
              {/* Primary 1-Click Play in VLC */}
              <button
                onClick={handlePlayActiveVlc}
                disabled={isSeries && loadingStreams}
                className={`w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 sm:px-8 py-3.5 rounded-xl text-white text-sm font-bold shadow-xl active:scale-95 transition min-h-[48px] cursor-pointer ${
                  isSeries && loadingStreams
                    ? "bg-neutral-800 text-neutral-400 cursor-not-allowed opacity-75"
                    : "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 shadow-orange-950/50"
                }`}
                title={
                  isSeries
                    ? activeEpisode
                      ? `Stream S${activeSeasonNumber}:E${activeEpisode.episodeNumber} directly in VLC`
                      : "Select an episode below to stream"
                    : "Stream directly in VLC (Mobile & Desktop)"
                }
              >
                {isSeries && loadingStreams ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white shrink-0" />
                    <span className="font-bold tracking-wide">Loading Episodes...</span>
                  </>
                ) : (
                  <>
                    <VlcIcon size={20} fill="#FFFFFF" className="shrink-0" />
                    <span className="font-bold tracking-wide">
                      {isSeries
                        ? activeEpisode
                          ? `Play E${activeEpisode.episodeNumber} in VLC`
                          : "Select Episode Below"
                        : "Play in VLC"}
                    </span>
                  </>
                )}
              </button>

              {/* Direct Download Video Button */}
              {primaryStreamUrl && (!isSeries || activeEpisode) && (
                <a
                  href={`${getFormattedUrl(primaryStreamUrl)}${isEffectiveRelay ? "&download=1" : ""}`}
                  download
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 sm:px-6 py-3.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-white text-sm font-bold border border-white/10 hover:border-white/20 transition min-h-[48px] active:scale-95 shadow-lg shadow-black/40 cursor-pointer shrink-0"
                  title={
                    isSeries && activeEpisode
                      ? `Download S${activeSeasonNumber}:E${activeEpisode.episodeNumber} (${activeEpisode.fileSize || "Video"})`
                      : `Download ${movie.title} directly`
                  }
                >
                  <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold tracking-wide">
                    {isSeries && activeEpisode ? `Download E${activeEpisode.episodeNumber}` : "Download"}
                  </span>
                </a>
              )}

              {/* Secondary Actions Bar */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {/* Watchlist Toggle Button */}
                <button
                  onClick={handleToggleWatchlist}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-xl border text-xs sm:text-sm font-semibold transition active:scale-95 min-h-[46px] cursor-pointer ${
                    isSavedInWatchlist
                      ? "bg-red-600/20 text-[#e50914] border-red-500/40"
                      : "bg-white/10 hover:bg-white/15 text-neutral-200 border-white/10"
                  }`}
                  title={isSavedInWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
                >
                  {isSavedInWatchlist ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-[#e50914]" />
                      <span>In Watchlist</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-neutral-300" />
                      <span>Watchlist</span>
                    </>
                  )}
                </button>

                {/* YouTube Trailer Button */}
                <button
                  onClick={handleOpenTrailer}
                  disabled={trailerLoading}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-3 sm:py-3.5 rounded-xl bg-white/10 hover:bg-red-950/40 hover:border-red-500/40 border border-white/10 text-neutral-200 hover:text-red-400 transition min-h-[46px] active:scale-95 cursor-pointer text-xs sm:text-sm font-semibold"
                  title="Watch Official YouTube Trailer in Web Player"
                >
                  {trailerLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-red-500" />
                  ) : (
                    <YoutubeIcon className="w-4 h-4 text-red-500" />
                  )}
                  <span>Trailer</span>
                </button>

                {/* If TV Series: Season Playlist button */}
                {isSeries && currentSeason && (
                  <a
                    href={`/api/vlc/playlist?seasonUrl=${encodeURIComponent(currentSeason.folderUrl)}&title=${encodeURIComponent(`${movie.title} ${currentSeason.seasonName}`)}`}
                    download
                    className="flex-1 sm:flex-initial px-4 py-3 sm:py-3.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold min-h-[46px] active:scale-95 whitespace-nowrap"
                    title={`Download full ${currentSeason.seasonName} M3U playlist for VLC`}
                  >
                    <ListVideo className="w-4 h-4" />
                    <span>Playlist</span>
                  </a>
                )}

                {/* Movie-only: Download M3U & Copy Link */}
                {!isSeries && (
                  <>
                    <a
                      href={`/api/vlc/playlist?url=${encodeURIComponent(getFormattedUrl(primaryStreamUrl))}&title=${encodeURIComponent(primaryTitle)}`}
                      download
                      className="flex-1 sm:flex-initial p-3 sm:px-4 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition flex items-center justify-center min-h-[46px] text-xs font-semibold gap-1.5"
                      title="Download .m3u playlist file"
                    >
                      <Download className="w-4 h-4" />
                      <span>Playlist</span>
                    </a>

                    <button
                      onClick={() => handleCopy(getFormattedUrl(primaryStreamUrl))}
                      className="flex-1 sm:flex-initial p-3 sm:px-4 sm:py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white border border-white/10 transition flex items-center justify-center min-h-[46px] text-xs font-semibold gap-1.5 cursor-pointer"
                      title="Copy direct stream link"
                    >
                      {copiedUrl === getFormattedUrl(primaryStreamUrl) || copiedUrl === primaryStreamUrl ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Storyline / Synopsis */}
            {movie.overview && (
              <div className="space-y-1.5 pt-3 border-t border-white/10 text-left">
                <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                  Storyline Synopsis
                </h2>
                <p className="text-xs sm:text-sm md:text-base text-neutral-300 leading-relaxed max-w-3xl font-normal">
                  {movie.overview}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* EPISODE COLLECTION SECTION (for TV & Web Series)             */}
        {/* ============================================================ */}
        {isSeries && (
          <section id="episodes-section" className="space-y-4 pt-8 mt-8 border-t border-white/10">
            {/* Episodes Header + Season Tabs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-[#e50914]/15 border border-[#e50914]/30 text-[#e50914]">
                  <Tv className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                      Episodes Collection
                    </h2>
                    <span className="text-xs font-bold text-neutral-400 bg-white/5 border border-white/10 px-2.5 py-0.5 rounded-full">
                      {currentEpisodes.length} Episodes
                    </span>
                  </div>
                </div>
              </div>

              {/* Season Selector Tabs */}
              {seasons.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                  {seasons.map((s) => {
                    const isSelected = s.seasonNumber === activeSeasonNumber;
                    return (
                      <button
                        key={s.seasonNumber}
                        onClick={() => {
                          setActiveSeasonNumber(s.seasonNumber);
                          if (s.episodes.length > 0) {
                            setSelectedEpisode(s.episodes[0]);
                          }
                        }}
                        className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition active:scale-95 whitespace-nowrap cursor-pointer ${
                          isSelected
                            ? "bg-[#e50914] text-white shadow-lg shadow-red-950/40"
                            : "bg-[#18181b] text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5"
                        }`}
                      >
                        {s.seasonName} ({s.episodes.length})
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Scanning Loader */}
            {loadingStreams && (
              <div className="p-12 text-center text-sm text-neutral-400 space-y-3 bg-[#141416] rounded-2xl border border-white/5">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#e50914]" />
                <p>Scanning DhakaFlix storage servers for seasons and episodes...</p>
              </div>
            )}

            {/* Empty State */}
            {!loadingStreams && currentEpisodes.length === 0 && (
              <div className="p-10 text-center text-sm text-neutral-400 space-y-2 bg-[#141416] rounded-2xl border border-white/5">
                <Film className="w-8 h-8 text-neutral-500 mx-auto" />
                <p className="font-semibold text-neutral-300">No playable episodes discovered in this season.</p>
                <p className="text-xs text-neutral-500">Please try another season tab above or explore other titles.</p>
              </div>
            )}

            {/* Episode Cards Grid: 2 cols mobile, 3 cols tablet, 4 cols desktop */}
            {!loadingStreams && currentEpisodes.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {currentEpisodes.map((ep) => {
                  const isPlaying = activeEpisode?.id === ep.id;
                  const epThumb = ep.still || movie.backdrop || movie.poster;

                  const playCurrentEpisode = () => {
                    setSelectedEpisode(ep);
                    playInVlc({
                      streamUrl: ep.streamUrl,
                      title: `${movie.title} S${activeSeasonNumber}E${ep.episodeNumber} - ${ep.title}`,
                      movie,
                      seasonNumber: activeSeasonNumber,
                      seasonName: currentSeason?.seasonName,
                      episodeNumber: ep.episodeNumber,
                      episodeTitle: ep.title,
                      onToast: showToast,
                    });
                  };

                  return (
                    <div
                      key={ep.id}
                      onClick={playCurrentEpisode}
                      className={`group relative rounded-2xl border overflow-hidden flex flex-col transition cursor-pointer select-none ${
                        isPlaying
                          ? "bg-[#1f192b] border-purple-500/70 shadow-xl shadow-purple-950/40 ring-1 ring-purple-500/40"
                          : "bg-[#151518] hover:bg-[#1c1c20] border-white/5 hover:border-white/20"
                      }`}
                    >
                      {/* 16:9 Thumbnail Header */}
                      <div className="relative aspect-video w-full overflow-hidden bg-black/60 shrink-0">
                        {epThumb ? (
                          <img
                            src={epThumb}
                            alt={ep.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <Film className="w-6 h-6 text-neutral-600" />
                          </div>
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent pointer-events-none" />

                        {/* Episode Number Pill */}
                        <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-black text-amber-400 font-mono tracking-tight shadow border border-white/10">
                          EP {ep.episodeNumber}
                        </div>

                        {/* File Size Badge */}
                        {ep.fileSize && (
                          <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-mono text-neutral-300 shadow border border-white/10">
                            {ep.fileSize}
                          </div>
                        )}

                        {/* Playing Indicator */}
                        {isPlaying && (
                          <div className="absolute bottom-2 left-2 bg-purple-600/95 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                            <span>Playing</span>
                          </div>
                        )}

                        {/* Hover Play Button */}
                        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-xl transform group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 fill-white ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Episode Content */}
                      <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                        <div className="space-y-1 min-w-0">
                          <h3
                            className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-400 transition truncate leading-snug"
                            title={`${ep.episodeNumber}. ${ep.title}`}
                          >
                            {ep.episodeNumber}. {ep.title}
                          </h3>

                          {ep.overview ? (
                            <p
                              className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed"
                              title={ep.overview}
                            >
                              {ep.overview}
                            </p>
                          ) : (
                            <p className="text-[11px] text-neutral-500 font-medium">
                              BDIX Fast Stream
                            </p>
                          )}
                        </div>

                        {/* Episode Actions Footer */}
                        <div className="flex items-center gap-1.5 pt-2 border-t border-white/5 mt-auto">
                          {/* Play in VLC */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              playCurrentEpisode();
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold shadow-sm transition active:scale-95 cursor-pointer"
                            title={`Play Episode ${ep.episodeNumber} in VLC`}
                          >
                            <VlcIcon size={12} fill="#FFFFFF" />
                            <span>Play</span>
                          </button>

                          {/* Direct Video Download */}
                          <a
                            href={`${getFormattedUrl(ep.streamUrl)}${isEffectiveRelay ? "&download=1" : ""}`}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition flex items-center justify-center min-w-[30px] min-h-[30px] cursor-pointer"
                            title={`Download Episode ${ep.episodeNumber} (${ep.fileSize || "Video"})`}
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>

                          {/* Download M3U */}
                          <a
                            href={`/api/vlc/playlist?url=${encodeURIComponent(getFormattedUrl(ep.streamUrl))}&title=${encodeURIComponent(`${movie.title} S${activeSeasonNumber}E${ep.episodeNumber} - ${ep.title}`)}`}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition flex items-center justify-center min-w-[30px] min-h-[30px] cursor-pointer"
                            title={`Download .m3u playlist for Episode ${ep.episodeNumber}`}
                          >
                            <ListVideo className="w-3.5 h-3.5" />
                          </a>

                          {/* Copy Link */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(getFormattedUrl(ep.streamUrl));
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition flex items-center justify-center min-w-[30px] min-h-[30px] cursor-pointer"
                            title="Copy direct stream link"
                          >
                            {copiedUrl === getFormattedUrl(ep.streamUrl) || copiedUrl === ep.streamUrl ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================ */}
        {/* MULTIPLE EDITIONS SECTION (for Standalone Movies)             */}
        {/* ============================================================ */}
        {!isSeries && streams.length > 1 && (
          <section className="space-y-3 pt-8 mt-8 border-t border-white/10">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-[#e50914]" />
              <span>Other Available Editions & Qualities ({streams.length})</span>
            </h2>

            <div className="space-y-2">
              {streams.slice(1).map((stream, idx) => (
                <div
                  key={idx}
                  className="p-3 sm:p-4 rounded-xl bg-[#151518] hover:bg-[#1c1c20] border border-white/5 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-[#e50914]/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                        {stream.quality}
                      </span>
                      {(stream.fileSizeFormatted || stream.fileSize) && (
                        <span className="text-xs text-neutral-400 font-mono">
                          {stream.fileSizeFormatted || stream.fileSize}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-neutral-200 truncate" title={stream.fileName}>
                      {stream.fileName}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        playInVlc({
                          streamUrl: stream.streamUrl,
                          title: movie.title,
                          movie,
                          onToast: showToast,
                        })
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition active:scale-95 cursor-pointer"
                    >
                      <VlcIcon size={14} fill="#FFFFFF" />
                      <span>Play</span>
                    </button>

                    <button
                      onClick={() => handleCopy(stream.streamUrl)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition cursor-pointer"
                      title="Copy stream URL"
                    >
                      {copiedUrl === stream.streamUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 6. YouTube Official Trailer Modal Overlay */}
      {trailerOpen && trailerData && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in"
          onClick={() => setTrailerOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#111114] border border-white/15 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#17171a] border-b border-white/10">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-white truncate pr-2">
                <YoutubeIcon className="w-5 h-5 text-red-500 shrink-0" />
                <span className="truncate">{trailerData.trailerTitle}</span>
              </div>

              <button
                onClick={() => setTrailerOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Embedded 16:9 Iframe */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`${trailerData.embedUrl}?autoplay=1&rel=0&modestbranding=1`}
                title={trailerData.trailerTitle}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
