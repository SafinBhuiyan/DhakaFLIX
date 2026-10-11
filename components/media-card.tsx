"use client";

import { useState } from "react";
import { Play, MoreVertical, Check, Copy, ExternalLink, Loader2 } from "lucide-react";
import { TMDBMedia, getPosterUrl, getMediaTitle, formatMediaDuration, getMediaYear } from "@/lib/tmdb";

interface MediaCardProps {
  item: TMDBMedia;
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMedia: (item: TMDBMedia) => void;
}

export function MediaCard({ item, onPlayVlc, onSelectMedia }: MediaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [loadingStream, setLoadingStream] = useState(false);
  const [copied, setCopied] = useState(false);

  const title = getMediaTitle(item);
  const duration = formatMediaDuration(item);
  const year = getMediaYear(item);
  const poster = getPosterUrl(item.poster_path, "w500");

  const handleQuickPlay = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingStream(true);
    try {
      const res = await fetch(`/api/media/streams?title=${encodeURIComponent(title)}&year=${year}`);
      const data = await res.json();
      if (data.streams && data.streams.length > 0) {
        onPlayVlc(data.streams[0].streamUrl, title);
      } else {
        // Fallback directly to DhakaFlix search or show details
        onSelectMedia(item);
      }
    } catch {
      onSelectMedia(item);
    } finally {
      setLoadingStream(false);
    }
  };

  return (
    <div 
      className="group relative flex flex-col w-[160px] sm:w-[172px] shrink-0 cursor-pointer select-none transition-transform duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelectMedia(item)}
    >
      {/* 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-[#171224] border border-white/10 shadow-lg group-hover:border-purple-500/40 group-hover:shadow-purple-900/20 group-hover:shadow-xl transition-all">
        
        {/* Poster Image */}
        <img
          src={poster}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Top-Right Three-Dots Menu */}
        <div className="absolute top-2 right-2 z-10">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelectMedia(item);
            }}
            className="p-1 rounded-full bg-black/60 backdrop-blur-md text-white/80 hover:text-white hover:bg-black/80 transition"
            title="Options"
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hover Action Overlay with "Play in VLC" Button */}
        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-center p-3 transition-opacity duration-200 ${
          isHovered ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}>
          <button
            onClick={handleQuickPlay}
            disabled={loadingStream}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs shadow-lg shadow-purple-900/50 transition-transform active:scale-95"
            title="Instant Stream in VLC"
          >
            {loadingStream ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Play className="w-4 h-4 fill-current text-white" />
            )}
            <span>Play in VLC</span>
          </button>

          <span className="text-[10px] text-purple-300 font-medium mt-2 bg-purple-950/60 px-2 py-0.5 rounded-full border border-purple-500/20">
            BDIX Stream
          </span>
        </div>
      </div>

      {/* Card Info Details */}
      <div className="pt-2 space-y-1">
        <h3 className="text-xs font-semibold text-white truncate leading-tight group-hover:text-purple-300 transition" title={title}>
          {title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{duration}</span>
          
          {/* Watched Checkmark Icon inside Purple Ring */}
          <div className="w-4 h-4 rounded-full border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/20 transition">
            <Check className="w-2.5 h-2.5 stroke-[2.5]" />
          </div>
        </div>

        {/* Bottom Purple Progress Line (as seen in Trakt screenshot) */}
        <div className="w-full h-[2.5px] bg-white/10 rounded-full overflow-hidden mt-1">
          <div 
            className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full" 
            style={{ width: `${Math.max(15, (Math.abs(item.id) % 85))}%` }}
          />
        </div>
      </div>
    </div>
  );
}
