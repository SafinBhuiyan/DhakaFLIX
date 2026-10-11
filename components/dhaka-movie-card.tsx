"use client";

import { useState } from "react";
import { Play, Loader2, Star, Sparkles, HardDrive } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";

interface DhakaMovieCardProps {
  movie: CatalogMovie;
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

export function DhakaMovieCard({ movie, onSelectMovie }: DhakaMovieCardProps) {
  const [imgError, setImgError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const showPlaceholder = !movie.poster || imgError;

  return (
    <div
      onClick={() => onSelectMovie(movie)}
      className="group relative flex flex-col rounded-2xl bg-[#130f1e] hover:bg-[#1a1428] border border-white/5 hover:border-purple-500/40 p-2.5 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-purple-900/20"
    >
      {/* Poster Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl bg-black/40">
        {showPlaceholder ? (
          <MoviePosterPlaceholder
            title={movie.title}
            year={movie.year}
            quality={movie.quality}
            category={movie.category}
            size="card"
          />
        ) : (
          <img
            src={movie.poster}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              const img = e.currentTarget;
              const fallback = `${movie.serverUrl}a_AL_.jpg`;
              if (!fallbackAttempted && img.src !== fallback) {
                setFallbackAttempted(true);
                img.src = fallback;
              } else {
                setImgError(true);
              }
            }}
          />
        )}

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

        {/* Subtle hover tint */}
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
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
