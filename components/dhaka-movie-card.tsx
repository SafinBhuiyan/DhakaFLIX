"use client";

import { useState } from "react";
import { Play, Loader2, Star, Sparkles, HardDrive } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";

interface DhakaMovieCardProps {
  movie: CatalogMovie;
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

export function DhakaMovieCard({ movie, onPlayVlc, onSelectMovie }: DhakaMovieCardProps) {
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
      className="group relative flex flex-col rounded-2xl bg-[#130f1e] hover:bg-[#1a1428] border border-white/5 hover:border-purple-500/40 p-2.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-purple-900/20"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-black/40">
        <img
          src={movie.poster || "/placeholder-poster.png"}
          alt={movie.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // fallback to local a_AL_.jpg or placeholder
            (e.target as HTMLImageElement).src = `${movie.serverUrl}a_AL_.jpg`;
          }}
        />

        {/* Quality Badge (Top Left) */}
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1">
          <span className="bg-black/70 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-md border border-white/10 shadow">
            {movie.quality}
          </span>
        </div>

        {/* Server Badge (Top Right) */}
        <div className="absolute top-2 right-2 z-10">
          <span className="bg-purple-950/80 backdrop-blur-md text-[10px] font-semibold text-purple-300 px-1.5 py-0.5 rounded-md border border-purple-500/20 shadow flex items-center gap-1">
            <HardDrive className="w-2.5 h-2.5" />
            {movie.sourceServer}
          </span>
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 gap-2">
          <button
            onClick={handleVlcClick}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-900/50 transition-transform active:scale-95"
            title="Play Stream directly in VLC"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4 fill-current" />
            )}
            <span>Play in VLC</span>
          </button>

          <span className="text-[11px] text-white/80 hover:text-white transition underline underline-offset-2">
            View All Streams
          </span>
        </div>
      </div>

      {/* Info Section */}
      <div className="pt-2.5 px-1 space-y-1">
        <h3 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-purple-300 transition" title={movie.title}>
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{movie.year}</span>
          {movie.rating ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Star className="w-3 h-3 fill-amber-400" />
              {movie.rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-purple-400 text-[10px] font-medium">BDIX Fast</span>
          )}
        </div>
      </div>
    </div>
  );
}
