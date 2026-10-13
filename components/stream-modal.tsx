"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Download,
  Copy,
  Check,
  X,
  Star,
  ExternalLink,
  HardDrive,
  Loader2,
  Film,
  Tv,
  ListVideo,
  Play,
  Folder,
} from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { DhakaFlixStream, DhakaEpisode, DhakaSeason } from "@/lib/dhakaflix";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";
import { useScrollLock } from "@/hooks/use-scroll-lock";
import { formatStreamUrl } from "@/lib/relay-config";

function YoutubeIcon({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

interface StreamModalProps {
  movie: CatalogMovie | null;
  onClose: () => void;
  onPlayVlc: (streamUrl: string, title: string) => void;
}

export function StreamModal({ movie, onClose, onPlayVlc }: StreamModalProps) {
  // Prevent background page scrolling while modal is open
  useScrollLock(Boolean(movie));

  const [streams, setStreams] = useState<DhakaFlixStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [backdropError, setBackdropError] = useState(false);

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

  // Close on Escape key (trailer first, then modal)
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (trailerOpen) {
          setTrailerOpen(false);
        } else {
          onClose();
        }
      }
    },
    [onClose, trailerOpen]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

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
      setLoading(true);
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
        setLoading(false);
      } else {
        setStreams([]);
        setLoading(true);
      }
    }

    const controller = new AbortController();

    // Query stream API for live folder contents / seasons & episodes
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
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [movie]);

  if (!movie) return null;

  const handleCopy = (url: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(url)
        .then(() => {
          setCopiedUrl(url);
          setTimeout(() => setCopiedUrl(null), 2000);
        })
        .catch((err) => {
          console.warn("Failed to copy stream link to clipboard:", err);
        });
    }
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
        `/api/media/trailer?title=${encodeURIComponent(cleanTitle || movie.title)}&year=${movie.year}`
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
    } finally {
      setTrailerLoading(false);
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
    : primaryStream?.streamUrl || movie.videoUrl || (movie.serverUrl && !movie.serverUrl.endsWith("/") ? movie.serverUrl : "");
  const primaryTitle = activeEpisode
    ? `${movie.title} S${activeSeasonNumber}E${activeEpisode.episodeNumber} - ${activeEpisode.title}`
    : movie.title;
  const fileSize = !isSeries
    ? movie.videoFileSize || primaryStream?.fileSizeFormatted || primaryStream?.fileSize
    : null;
  const backdropSource = movie.backdrop || movie.poster;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overscroll-contain"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl lg:max-w-4xl overflow-hidden rounded-t-[28px] sm:rounded-2xl bg-[#131316] border-t sm:border border-white/10 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh] overscroll-contain"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Blurred Backdrop */}
        <div className="absolute inset-0 h-44 sm:h-56 overflow-hidden pointer-events-none select-none">
          {backdropSource && !backdropError ? (
            <img
              src={backdropSource}
              alt=""
              className="w-full h-full object-cover blur-2xl opacity-25 scale-110"
              onError={() => setBackdropError(true)}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-b from-red-950/20 to-transparent" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-[#131316]/80 to-[#131316]" />
        </div>

        {/* Mobile Drag Indicator */}
        <div className="relative z-20 w-10 h-1 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-neutral-400 hover:text-white border border-white/10 transition shadow-lg active:scale-95 min-w-[34px] min-h-[34px] flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Scroll Body */}
        <div className="relative z-10 overflow-y-auto overscroll-contain custom-scrollbar flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Hero: Poster & Core Metadata */}
          <div className="flex gap-3.5 sm:gap-5 items-start">
            {/* Poster Image */}
            <div className="w-24 sm:w-36 md:w-40 aspect-[2/3] shrink-0 rounded-xl overflow-hidden bg-black/60 shadow-xl border border-white/10 ring-1 ring-white/5 relative">
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
            </div>

            {/* Details Strip */}
            <div className="flex-1 space-y-2 min-w-0 pr-6 sm:pr-0">
              <h2
                id="modal-title"
                className="text-base sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-2"
              >
                {movie.title}
              </h2>

              {/* Unified Clean Meta Row */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-300">
                <span className="bg-[#e50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded uppercase">
                  {movie.quality}
                </span>

                <span>{movie.year}</span>

                {movie.category && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="truncate max-w-[130px] sm:max-w-none text-neutral-400">
                      {movie.category}
                    </span>
                  </>
                )}

                {isSeries && totalEpisodeCount > 0 ? (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="bg-purple-600/30 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-500/20">
                      {seasons.length > 1 ? `${seasons.length} Seasons • ` : ""}{totalEpisodeCount} Episodes
                    </span>
                  </>
                ) : !isSeries && fileSize ? (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="font-mono text-neutral-300 text-[11px]">{fileSize}</span>
                  </>
                ) : null}

                {movie.rating ? (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {movie.rating.toFixed(1)}
                    </span>
                  </>
                ) : null}

                <span className="text-neutral-600">•</span>
                <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {movie.sourceServer || "Server 12"}
                </span>
              </div>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex items-center gap-2 pt-1 flex-wrap sm:flex-nowrap">
            {/* 1. Play in VLC Button */}
            <button
              onClick={() => {
                if (isSeries && !activeEpisode) {
                  if (movie.serverUrl) window.open(movie.serverUrl, "_blank");
                  return;
                }
                onPlayVlc(primaryStreamUrl, primaryTitle);
              }}
              className="group flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-950/40 active:scale-95 transition min-h-[42px] cursor-pointer"
              title={isSeries ? (activeEpisode ? `Stream S${activeSeasonNumber}:E${activeEpisode.episodeNumber} directly in VLC` : "Browse Series Directory on BDIX") : "Stream directly in VLC (Mobile & Desktop)"}
            >
              <VlcIcon size={18} fill="#FFFFFF" className="shrink-0 group-hover:scale-105 transition-transform" />
              <span>
                {isSeries
                  ? activeEpisode
                    ? `Play E${activeEpisode.episodeNumber} in VLC`
                    : "Browse Series Files"
                  : "Play in VLC"}
              </span>
            </button>

            {/* If TV Series: Play Season Playlist button */}
            {isSeries && currentSeason && (
              <a
                href={`/api/vlc/playlist?seasonUrl=${encodeURIComponent(currentSeason.folderUrl)}&title=${encodeURIComponent(`${movie.title} ${currentSeason.seasonName}`)}`}
                download
                className="px-3 py-2.5 sm:py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 transition flex items-center justify-center gap-1.5 text-xs font-semibold min-h-[42px] active:scale-95 whitespace-nowrap"
                title={`Download full ${currentSeason.seasonName} M3U playlist for VLC`}
              >
                <ListVideo className="w-4 h-4" />
                <span className="hidden sm:inline">Season Playlist</span>
              </a>
            )}

            {/* 2. YouTube Trailer in Web Player Button */}
            <button
              onClick={handleOpenTrailer}
              disabled={trailerLoading}
              className="p-2.5 sm:px-3 sm:py-3 rounded-xl bg-white/10 hover:bg-red-950/40 hover:border-red-500/40 border border-white/10 text-neutral-300 hover:text-red-400 transition flex items-center justify-center min-w-[42px] min-h-[42px] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 cursor-pointer group"
              title="Watch Official YouTube Trailer in Web Player"
            >
              {trailerLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              ) : (
                <YoutubeIcon className="w-4 h-4 text-red-500 group-hover:scale-110 transition-transform" />
              )}
            </button>

            {/* Movie-only actions: Download .m3u & Copy Link (omitted for TV series to eliminate clutter) */}
            {!isSeries && (
              <>
                <a
                  href={`/api/vlc/playlist?url=${encodeURIComponent(formatStreamUrl(primaryStreamUrl))}&title=${encodeURIComponent(primaryTitle)}`}
                  download
                  className="p-2.5 sm:px-3 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[42px] min-h-[42px]"
                  title="Download .m3u playlist file"
                >
                  <Download className="w-4 h-4" />
                </a>

                <button
                  onClick={() => handleCopy(formatStreamUrl(primaryStreamUrl))}
                  className="p-2.5 sm:px-3 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[42px] min-h-[42px]"
                  title="Copy direct stream link"
                >
                  {copiedUrl === formatStreamUrl(primaryStreamUrl) || copiedUrl === primaryStreamUrl ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>

          {/* Storyline Synopsis */}
          {movie.overview && (
            <div className="space-y-1 pt-1 border-t border-white/5">
              <h4 className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider">
                Synopsis
              </h4>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed max-h-24 sm:max-h-28 overflow-y-auto custom-scrollbar pr-1">
                {movie.overview}
              </p>
            </div>
          )}

          {/* ============================================================ */}
          {/* EPISODE COLLECTION SECTION (for TV & Web Series)             */}
          {/* ============================================================ */}
          {isSeries && (
            <div className="space-y-3 pt-3 border-t border-white/10">
              {/* Episodes Header + Season Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Tv className="w-4 h-4 text-[#e50914]" />
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide uppercase">
                      Episode Collection
                    </h3>
                    <span className="text-[10px] font-bold text-neutral-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                      {currentEpisodes.length} Episodes
                    </span>
                  </div>
                  {movie.serverUrl && (
                    <a
                      href={movie.serverUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-medium text-neutral-300 hover:text-white transition active:scale-95 cursor-pointer ml-auto sm:ml-0"
                      title="Open folder directly on DhakaFlix BDIX server"
                    >
                      <Folder className="w-3.5 h-3.5 text-amber-400" />
                      <span>Browse Folder</span>
                      <ExternalLink className="w-3 h-3 text-neutral-400" />
                    </a>
                  )}
                </div>

                {/* Season Selector Tabs (if multiple seasons) */}
                {seasons.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
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
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition active:scale-95 whitespace-nowrap cursor-pointer ${
                            isSelected
                              ? "bg-[#e50914] text-white shadow-md shadow-red-950/40"
                              : "bg-white/5 text-neutral-400 hover:text-white hover:bg-white/10 border border-white/5"
                          }`}
                        >
                          {s.seasonName} ({s.episodes.length})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Loading Skeleton */}
              {loading && (
                <div className="p-8 text-center text-xs text-neutral-400 space-y-2 bg-[#17171a] rounded-xl border border-white/5">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#e50914]" />
                  <p>Scanning DhakaFlix servers for seasons & episodes...</p>
                </div>
              )}

              {/* Empty State */}
              {!loading && currentEpisodes.length === 0 && (
                <div className="p-6 text-center text-xs text-neutral-400 space-y-2 bg-[#17171a] rounded-xl border border-white/5">
                  <p>No episodes discovered in this season directory.</p>
                  {movie.serverUrl && (
                    <a
                      href={movie.serverUrl.endsWith("/") ? movie.serverUrl : movie.serverUrl.substring(0, movie.serverUrl.lastIndexOf("/") + 1)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Browse folder on DhakaFlix</span>
                    </a>
                  )}
                </div>
              )}

              {/* Episode Cards Grid: 2 columns mobile, 3 columns desktop */}
              {!loading && currentEpisodes.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3 max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar pr-1">
                  {currentEpisodes.map((ep) => {
                    const isPlaying = activeEpisode?.id === ep.id;
                    const epThumb = ep.still || movie.backdrop || movie.poster;

                    const playCurrentEpisode = () => {
                      setSelectedEpisode(ep);
                      onPlayVlc(
                        ep.streamUrl,
                        `${movie.title} S${activeSeasonNumber}E${ep.episodeNumber} - ${ep.title}`
                      );
                    };

                    return (
                      <div
                        key={ep.id}
                        onClick={playCurrentEpisode}
                        className={`group relative rounded-xl border overflow-hidden flex flex-col transition cursor-pointer select-none ${
                          isPlaying
                            ? "bg-[#1f192b] border-purple-500/70 shadow-lg shadow-purple-950/40 ring-1 ring-purple-500/40"
                            : "bg-[#161619] hover:bg-[#1c1c22] border-white/5 hover:border-white/15"
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

                          {/* Gradient shadow */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />

                          {/* Episode Number Pill */}
                          <div className="absolute top-2 left-2 bg-black/85 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-black text-amber-400 font-mono tracking-tight shadow border border-white/10">
                            EP {ep.episodeNumber}
                          </div>

                          {/* File Size Badge */}
                          {ep.fileSize && (
                            <div className="absolute top-2 right-2 bg-black/85 backdrop-blur-sm px-1.5 py-0.5 rounded text-[9px] font-mono text-neutral-300 shadow border border-white/10">
                              {ep.fileSize}
                            </div>
                          )}

                          {/* Playing / Selected Badge */}
                          {isPlaying && (
                            <div className="absolute bottom-1.5 left-2 bg-purple-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                              <span>Playing</span>
                            </div>
                          )}

                          {/* Hover Play Overlay */}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform">
                              <Play className="w-4 h-4 fill-white ml-0.5" />
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between space-y-1.5">
                          <div className="space-y-0.5 min-w-0">
                            <h4
                              className="text-xs font-bold text-white group-hover:text-amber-400 transition truncate leading-snug"
                              title={`${ep.episodeNumber}. ${ep.title}`}
                            >
                              {ep.episodeNumber}. {ep.title}
                            </h4>

                            {ep.overview ? (
                              <p
                                className="text-[10px] text-neutral-400 line-clamp-1 leading-snug"
                                title={ep.overview}
                              >
                                {ep.overview}
                              </p>
                            ) : (
                              <p className="text-[10px] text-neutral-500 font-medium">
                                BDIX Fast Stream
                              </p>
                            )}
                          </div>

                          {/* Card Actions Footer */}
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5 mt-auto">
                            {/* Play in VLC */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                playCurrentEpisode();
                              }}
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold shadow-sm shadow-orange-950/30 transition active:scale-95 cursor-pointer"
                              title={`Play Episode ${ep.episodeNumber} in VLC`}
                            >
                              <VlcIcon size={12} fill="#FFFFFF" />
                              <span>Play</span>
                            </button>

                            {/* Download M3U for this episode */}
                            <a
                              href={`/api/vlc/playlist?url=${encodeURIComponent(ep.streamUrl)}&title=${encodeURIComponent(`${movie.title} S${activeSeasonNumber}E${ep.episodeNumber} - ${ep.title}`)}`}
                              download
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition flex items-center justify-center min-w-[28px] min-h-[28px] cursor-pointer"
                              title={`Download .m3u playlist for Episode ${ep.episodeNumber}`}
                            >
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            {/* Copy Link */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(ep.streamUrl);
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition flex items-center justify-center min-w-[28px] min-h-[28px] cursor-pointer"
                              title="Copy direct stream link"
                            >
                              {copiedUrl === ep.streamUrl ? (
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
            </div>
          )}

          {/* Multiple File Editions (for Movies only) */}
          {!isSeries && streams.length > 1 && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Other Available Editions ({streams.length})</span>
              </h4>

              <div className="space-y-1.5">
                {streams.slice(1).map((stream, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 sm:p-3 rounded-xl bg-[#17171a] hover:bg-[#1e1e22] border border-white/5 flex items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-[#e50914]/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                          {stream.quality}
                        </span>
                        {(stream.fileSizeFormatted || stream.fileSize) && (
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {stream.fileSizeFormatted || stream.fileSize}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-200 truncate" title={stream.fileName}>
                        {stream.fileName}
                      </p>
                    </div>

                    <button
                      onClick={() => onPlayVlc(stream.streamUrl, movie.title)}
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition active:scale-95 cursor-pointer"
                    >
                      <VlcIcon size={12} fill="#FFFFFF" />
                      <span>Play</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator if scanning additional versions for movies */}
          {!isSeries && loading && streams.length === 0 && (
            <div className="p-4 text-center text-xs text-neutral-400 space-y-2 bg-[#17171a] rounded-xl border border-white/5">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#e50914]" />
              <p>Scanning DhakaFlix servers for video streams...</p>
            </div>
          )}
        </div>
      </div>

      {/* YouTube Trailer Web Player Overlay */}
      {trailerOpen && trailerData && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-fade-in overscroll-contain touch-none"
          onClick={() => setTrailerOpen(false)}
        >
          <div
            className="relative w-full max-w-4xl rounded-2xl bg-[#111114] border border-white/15 shadow-2xl overflow-hidden flex flex-col animate-scale-up touch-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Player Top Bar */}
            <div className="p-3 sm:p-3.5 bg-[#17171a] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded flex items-center gap-1 shrink-0">
                  <YoutubeIcon className="w-3.5 h-3.5" />
                  <span>TRAILER</span>
                </span>
                <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                  {movie.title} • {trailerData.trailerTitle}
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                {trailerData.youtubeUrl && (
                  <a
                    href={trailerData.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition text-xs flex items-center gap-1"
                    title="Open in YouTube"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">YouTube</span>
                  </a>
                )}
                <button
                  onClick={() => setTrailerOpen(false)}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition min-w-[32px] min-h-[32px] flex items-center justify-center cursor-pointer"
                  aria-label="Close trailer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 16:9 Responsive Video Frame */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={trailerData.embedUrl}
                title={`${movie.title} Trailer`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
