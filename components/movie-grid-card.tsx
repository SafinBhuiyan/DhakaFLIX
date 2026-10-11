"use client";

import { useState } from "react";
import { Play, Star, Loader2 } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";

interface MovieGridCardProps {
  movie: CatalogMovie;
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

export function MovieGridCard({ movie, onPlayVlc, onSelectMovie }: MovieGridCardProps) {
  const [loading, setLoading] = useState(false);

  const handleVlcClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoading(true);
    try {
      const res = await fetch(`/api/media/streams?title=${encodeURIComponent(movie.title)}&year=${movie.year}`);
      const data = await res.json();
      if (data.streams && data.streams.length > 0) {
        onPlayVlc(data.streams[0].streamUrl, movie.title);
      } else {
        onSelectMovie(movie);
      }
    } catch {
      onSelectMovie(movie);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => onSelectMovie(movie)}
      className="group relative flex flex-col cursor-pointer select-none"
    >
      {/* 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full rounded overflow-hidden bg-[#18181a] border border-white/5 group-hover:border-[#e50914]/50 transition-all shadow">
        
        {/* Poster Image */}
        <img
          src={movie.poster || "/placeholder-poster.png"}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = `${movie.serverUrl}a_AL_.jpg`;
            if (img.src !== fallback) {
              img.src = fallback;
            }
          }}
        />

        {/* Red Quality Badge (Exact style from screenshot) */}
        <div className="absolute top-1.5 left-1.5 z-10">
          <span className="bg-[#e50914] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
            {movie.quality}
          </span>
        </div>

        {/* Hover Action Overlay with Play in VLC */}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-1.5">
          <button
            onClick={handleVlcClick}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#e50914] hover:bg-red-700 text-white font-bold text-[11px] shadow-lg transition active:scale-95"
            title="Stream in VLC"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>Play in VLC</span>
          </button>
        </div>
      </div>

      {/* Info Section Below Poster */}
      <div className="pt-1.5 space-y-0.5">
        <h3 
          className="text-xs font-semibold text-neutral-200 truncate group-hover:text-[#e50914] transition" 
          title={movie.title}
        >
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-neutral-400">
          <span>{movie.year}</span>
          {movie.rating ? (
            <span className="flex items-center gap-0.5 text-amber-400 font-medium">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              {movie.rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-[10px] text-neutral-500 font-mono">BDIX</span>
          )}
        </div>
      </div>
    </div>
  );
}
