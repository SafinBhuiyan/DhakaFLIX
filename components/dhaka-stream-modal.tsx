"use client";

import { useState, useEffect } from "react";
import { Play, Download, Copy, Check, X, Server, ExternalLink, Loader2, HardDrive, Star } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { DhakaFlixStream } from "@/lib/dhakaflix";

interface DhakaStreamModalProps {
  movie: CatalogMovie | null;
  onClose: () => void;
  onPlayVlc: (streamUrl: string, title: string) => void;
}

export function DhakaStreamModal({ movie, onClose, onPlayVlc }: DhakaStreamModalProps) {
  const [streams, setStreams] = useState<DhakaFlixStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!movie) return;
    setLoading(true);

    fetch(`/api/media/streams?title=${encodeURIComponent(movie.title)}&year=${movie.year}`)
      .then((res) => res.json())
      .then((data) => {
        setStreams(data.streams || []);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-[#120d20] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Backdrop Header */}
        <div className="relative h-48 w-full bg-black/40 overflow-hidden shrink-0">
          {movie.backdrop && (
            <img 
              src={movie.backdrop} 
              alt={movie.title} 
              className="w-full h-full object-cover opacity-35"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#120d20] via-[#120d20]/70 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/90 transition"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Title Header */}
          <div className="absolute bottom-4 left-6 right-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-950/70 px-2.5 py-0.5 rounded-full border border-purple-500/20">
              {movie.category}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate mt-1.5">{movie.title}</h2>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
              <span>{movie.year}</span>
              <span>•</span>
              <span>{movie.quality}</span>
              {movie.rating ? (
                <>
                  <span>•</span>
                  <span className="text-amber-400 font-semibold flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400" /> {movie.rating.toFixed(1)}
                  </span>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          {/* Overview */}
          {movie.overview && (
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {movie.overview}
            </p>
          )}

          {/* DhakaFlix Available Streams */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>Available Streams on DhakaFlix ({streams.length})</span>
              </h3>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />}
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2 bg-white/[0.02] rounded-2xl border border-white/5">
                <Loader2 className="w-5 h-5 animate-spin mx-auto text-purple-400" />
                <p>Scanning DhakaFlix servers for video files...</p>
              </div>
            ) : streams.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground space-y-3 bg-white/[0.02] rounded-2xl border border-white/5">
                <p>Could not locate the direct video stream file for &ldquo;{movie.title}&rdquo;.</p>
                <a
                  href={movie.serverUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs border border-purple-500/30 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Folder on DhakaFlix</span>
                </a>
              </div>
            ) : (
              <div className="space-y-2.5">
                {streams.map((stream, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="bg-purple-600/30 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-md border border-purple-500/20">
                          {stream.quality}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Server className="w-3 h-3" /> {stream.sourceServer} ({stream.category})
                        </span>
                        {(stream.fileSizeFormatted || stream.fileSize) && (
                          <span className="text-[10px] text-white/60 bg-black/40 px-2 py-0.5 rounded">
                            {stream.fileSizeFormatted || stream.fileSize}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white font-medium truncate" title={stream.fileName}>
                        {stream.fileName}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* Play in VLC */}
                      <button
                        onClick={() => onPlayVlc(stream.streamUrl, movie.title)}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold shadow-lg shadow-orange-900/40 transition active:scale-95"
                        title="Stream in VLC"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Play in VLC</span>
                      </button>

                      {/* Download M3U for mobile */}
                      <a
                        href={`/api/vlc/playlist?url=${encodeURIComponent(stream.streamUrl)}&title=${encodeURIComponent(movie.title)}`}
                        download
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition"
                        title="Download .m3u playlist"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      {/* Copy Stream Link */}
                      <button
                        onClick={() => handleCopy(stream.streamUrl)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition"
                        title="Copy direct stream URL"
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
