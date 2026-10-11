"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Download, Copy, Check, X, HardDrive, Star, Loader2, ExternalLink } from "lucide-react";
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
    setLoading(true);

    fetch(`/api/media/streams?title=${encodeURIComponent(movie.title)}&year=${movie.year}`)
      .then((res) => res.json())
      .then((data) => setStreams(data.streams || []))
      .catch((err) => console.error("Error finding streams:", err))
      .finally(() => setLoading(false));
  }, [movie]);

  if (!movie) return null;

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="relative w-full max-w-xl overflow-hidden rounded-t-3xl sm:rounded-2xl bg-[#141416] border-t sm:border border-white/10 shadow-2xl flex flex-col max-h-[88vh] sm:max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden" />

        {/* Top Header */}
        <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#19191c]">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {movie.quality}
            </span>
            <h2 id="modal-title" className="text-xs sm:text-sm font-bold text-white truncate">
              {movie.title} ({movie.year})
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-w-[32px] min-h-[32px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 space-y-3.5 sm:space-y-4 overflow-y-auto custom-scrollbar flex-1 pb-8 sm:pb-5">
          {/* Media Info snippet */}
          <div className="flex gap-3 sm:gap-4">
            {!movie.poster || imgError ? (
              <MoviePosterPlaceholder
                title={movie.title}
                year={movie.year}
                quality={movie.quality}
                category={movie.category}
                size="modal"
                className="w-16 h-24 sm:w-20 sm:h-28"
              />
            ) : (
              <img
                src={movie.poster}
                alt={movie.title}
                className="w-16 h-24 sm:w-20 sm:h-28 object-cover rounded-lg bg-black shrink-0 border border-white/10 shadow"
                onError={() => setImgError(true)}
              />
            )}
            <div className="space-y-1 sm:space-y-1.5 min-w-0 flex-1">
              <h3 className="text-sm sm:text-base font-bold text-white leading-tight">{movie.title}</h3>
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-400 flex-wrap">
                <span>{movie.year}</span>
                <span>•</span>
                <span>{movie.category}</span>
                {movie.rating ? (
                  <>
                    <span>•</span>
                    <span className="text-amber-400 font-semibold flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400" /> {movie.rating.toFixed(1)}
                    </span>
                  </>
                ) : null}
              </div>
              {movie.overview && (
                <p className="text-[11px] sm:text-xs text-neutral-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>

          {/* DhakaFlix Available Streams */}
          <div className="space-y-2.5 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Available Streams on DhakaFlix ({streams.length})</span>
              </h4>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e50914]" />}
            </div>

            {/* Mobile & Desktop Tip */}
            <div className="p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/20 flex items-center gap-2.5 text-[11px] text-orange-200/90">
              <VlcIcon size={16} fill="#FF8800" className="shrink-0" />
              <div className="leading-tight">
                <span className="font-semibold text-white">VLC 1Gbps Streaming:</span> Tap <strong className="text-orange-400">Play in VLC</strong> to stream directly (supports mobile & desktop), or download the <strong className="text-orange-400">.m3u</strong> playlist.
              </div>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-neutral-400 space-y-2 bg-[#18181b] rounded-xl border border-white/5">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#e50914]" />
                <p>Scanning DhakaFlix servers for video files...</p>
              </div>
            ) : streams.length === 0 ? (
              <div className="p-5 text-center text-xs text-neutral-400 space-y-2.5 bg-[#18181b] rounded-xl border border-white/5">
                <p>Direct video file lookup in progress or folder moved.</p>
                <a
                  href={movie.serverUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs transition"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Browse Folder on DhakaFlix</span>
                </a>
              </div>
            ) : (
              <div className="space-y-2">
                {streams.map((stream, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-[#18181b] hover:bg-[#202024] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-[#e50914]/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded border border-[#e50914]/30">
                          {stream.quality}
                        </span>
                        <span className="text-[11px] text-neutral-400">
                          {stream.sourceServer}
                        </span>
                        {(stream.fileSizeFormatted || stream.fileSize) && (
                          <span className="text-[10px] text-neutral-500 font-mono">
                            {stream.fileSizeFormatted || stream.fileSize}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-200 font-medium truncate" title={stream.fileName}>
                        {stream.fileName}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onPlayVlc(stream.streamUrl, movie.title)}
                        className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-bold shadow-md shadow-orange-950/40 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                        title="Play in VLC Media Player (Desktop & Mobile)"
                      >
                        <VlcIcon size={14} fill="#FFFFFF" />
                        <span>Play in VLC</span>
                      </button>

                      <a
                        href={stream.streamUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[32px] min-h-[32px]"
                        title="Stream directly in browser"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <a
                        href={`/api/vlc/playlist?url=${encodeURIComponent(stream.streamUrl)}&title=${encodeURIComponent(movie.title)}`}
                        download
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[32px] min-h-[32px]"
                        title="Download .m3u playlist"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleCopy(stream.streamUrl)}
                        className="p-2 rounded-lg bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition flex items-center justify-center min-w-[32px] min-h-[32px]"
                        title="Copy direct stream link"
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
