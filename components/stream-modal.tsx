"use client";

import { useState, useEffect } from "react";
import { Play, Download, Copy, Check, X, Server, ExternalLink, Loader2, HardDrive, Star } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { DhakaFlixStream } from "@/lib/dhakaflix";

interface StreamModalProps {
  movie: CatalogMovie | null;
  onClose: () => void;
  onPlayVlc: (streamUrl: string, title: string) => void;
}

export function StreamModal({ movie, onClose, onPlayVlc }: StreamModalProps) {
  const [streams, setStreams] = useState<DhakaFlixStream[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!movie) return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-xl overflow-hidden rounded-lg bg-[#141416] border border-white/10 shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#19191c]">
          <div className="flex items-center gap-2">
            <span className="bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {movie.quality}
            </span>
            <h2 className="text-sm font-bold text-white truncate max-w-md">{movie.title} ({movie.year})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Media Info snippet */}
          <div className="flex gap-4">
            <img
              src={movie.poster || "/placeholder-poster.png"}
              alt={movie.title}
              className="w-20 h-28 object-cover rounded bg-black shrink-0 border border-white/10"
            />
            <div className="space-y-1.5 min-w-0 flex-1">
              <h3 className="text-base font-bold text-white leading-tight">{movie.title}</h3>
              <div className="flex items-center gap-2 text-xs text-neutral-400">
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
                <p className="text-xs text-neutral-400 line-clamp-3 leading-relaxed">
                  {movie.overview}
                </p>
              )}
            </div>
          </div>

          {/* DhakaFlix Available Streams */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-300 flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-[#e50914]" />
                <span>Available Streams on DhakaFlix ({streams.length})</span>
              </h4>
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e50914]" />}
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-neutral-400 space-y-2 bg-[#18181b] rounded border border-white/5">
                <Loader2 className="w-4 h-4 animate-spin mx-auto text-[#e50914]" />
                <p>Scanning DhakaFlix servers...</p>
              </div>
            ) : streams.length === 0 ? (
              <div className="p-5 text-center text-xs text-neutral-400 space-y-2 bg-[#18181b] rounded border border-white/5">
                <p>Direct video file lookup in progress or folder moved.</p>
                <a
                  href={movie.serverUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white/10 hover:bg-white/15 text-white text-xs transition"
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
                    className="p-3 rounded bg-[#18181b] hover:bg-[#202024] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                  >
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#e50914]/20 text-red-400 text-[10px] font-bold px-1.5 py-0.5 rounded border border-[#e50914]/30">
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => onPlayVlc(stream.streamUrl, movie.title)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded bg-[#e50914] hover:bg-red-700 text-white text-xs font-bold shadow transition active:scale-95"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Play in VLC</span>
                      </button>

                      <a
                        href={`/api/vlc/playlist?url=${encodeURIComponent(stream.streamUrl)}&title=${encodeURIComponent(movie.title)}`}
                        download
                        className="p-1.5 rounded bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition"
                        title="Download .m3u playlist"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>

                      <button
                        onClick={() => handleCopy(stream.streamUrl)}
                        className="p-1.5 rounded bg-white/10 hover:bg-white/15 text-neutral-300 hover:text-white transition"
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
