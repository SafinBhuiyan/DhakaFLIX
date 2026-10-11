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
} from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { DhakaFlixStream } from "@/lib/dhakaflix";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";

interface StreamModalProps {
  movie: CatalogMovie | null;
  onClose: () => void;
  onPlayVlc: (streamUrl: string, title: string) => void;
}

export function StreamModal({ movie, onClose, onPlayVlc }: StreamModalProps) {
  const [streams, setStreams] = useState<DhakaFlixStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);
  const [backdropError, setBackdropError] = useState(false);

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
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

    // Instant direct stream resolution (0ms)
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

    // Scan for additional file versions (e.g. alternate audio/qualities)
    const queryUrl = `/api/media/streams?title=${encodeURIComponent(movie.title)}&year=${movie.year}&url=${encodeURIComponent(movie.serverUrl || "")}`;
    fetch(queryUrl)
      .then((res) => res.json())
      .then((data) => {
        if (data.streams && data.streams.length > 0) {
          setStreams(data.streams);
        }
      })
      .catch((err) => console.error("Error finding streams:", err))
      .finally(() => setLoading(false));
  }, [movie]);

  if (!movie) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  const primaryStream = streams.length > 0 ? streams[0] : null;
  const primaryStreamUrl = primaryStream?.streamUrl || movie.videoUrl || movie.serverUrl;
  const fileSize = movie.videoFileSize || primaryStream?.fileSizeFormatted || primaryStream?.fileSize;
  const fileName = movie.videoFileName || primaryStream?.fileName;
  const backdropSource = movie.backdrop || movie.poster;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="relative w-full max-w-2xl lg:max-w-3xl overflow-hidden rounded-t-[28px] sm:rounded-2xl bg-[#131316] border-t sm:border border-white/10 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh]"
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
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-30 p-2 rounded-full bg-black/40 hover:bg-black/70 text-neutral-400 hover:text-white border border-white/10 transition shadow-lg active:scale-95 min-w-[34px] min-h-[34px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Scroll Body */}
        <div className="relative z-10 overflow-y-auto custom-scrollbar flex-1 p-4 sm:p-6 space-y-4 sm:space-y-5">
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

              {/* Clean Meta Pills */}
              <div className="flex items-center gap-2 flex-wrap text-xs text-neutral-300">
                <span className="bg-[#e50914] text-white text-[10px] font-black px-1.5 py-0.5 rounded">
                  {movie.quality}
                </span>
                <span>{movie.year}</span>
                <span>•</span>
                <span className="truncate max-w-[130px] sm:max-w-none text-neutral-400">
                  {movie.category}
                </span>

                {movie.rating ? (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {movie.rating.toFixed(1)}
                    </span>
                  </>
                ) : null}
              </div>

              {/* Server & File Specs Pill */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] text-neutral-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {movie.sourceServer || "Server 14"}
                </span>
                {fileSize && (
                  <>
                    <span>•</span>
                    <span className="font-mono text-neutral-300">{fileSize}</span>
                  </>
                )}
                <span>•</span>
                <span className="text-neutral-400">1Gbps BDIX</span>
              </div>

              {/* Clean File Name (Single Line) */}
              {fileName && (
                <p
                  className="text-[11px] text-neutral-400 font-mono truncate hidden sm:block"
                  title={fileName}
                >
                  {fileName}
                </p>
              )}
            </div>
          </div>

          {/* Primary Action Buttons (Single Row, No Duplication!) */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onPlayVlc(primaryStreamUrl, movie.title)}
              className="group flex-1 flex items-center justify-center gap-2 px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-orange-950/40 active:scale-95 transition min-h-[42px] cursor-pointer"
              title="Stream directly in VLC (Mobile & Desktop)"
            >
              <VlcIcon size={18} fill="#FFFFFF" className="shrink-0 group-hover:scale-105 transition-transform" />
              <span>Play in VLC</span>
            </button>

            <a
              href={primaryStreamUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 sm:px-3 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[42px] min-h-[42px]"
              title="Watch directly in browser"
            >
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href={`/api/vlc/playlist?url=${encodeURIComponent(primaryStreamUrl)}&title=${encodeURIComponent(movie.title)}`}
              download
              className="p-2.5 sm:px-3 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[42px] min-h-[42px]"
              title="Download .m3u playlist"
            >
              <Download className="w-4 h-4" />
            </a>

            <button
              onClick={() => handleCopy(primaryStreamUrl)}
              className="p-2.5 sm:px-3 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[42px] min-h-[42px]"
              title="Copy direct stream link"
            >
              {copiedUrl === primaryStreamUrl ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
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

          {/* Multiple File Editions (Only shown if more than 1 file exists!) */}
          {streams.length > 1 && (
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
                      className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition active:scale-95"
                    >
                      <VlcIcon size={12} fill="#FFFFFF" />
                      <span>Play</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading indicator if scanning additional versions */}
          {loading && streams.length === 0 && (
            <div className="p-4 text-center text-xs text-neutral-400 space-y-2 bg-[#17171a] rounded-xl border border-white/5">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#e50914]" />
              <p>Scanning DhakaFlix servers for video streams...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
