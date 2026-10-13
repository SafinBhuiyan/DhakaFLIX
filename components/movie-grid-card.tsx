"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Info } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";

interface MovieGridCardProps {
  movie: CatalogMovie;
  onPlayVlc?: (streamUrl: string, title: string) => void;
  onSelectMovie?: (movie: CatalogMovie) => void;
}

export function MovieGridCard({ movie, onSelectMovie, onPlayVlc }: MovieGridCardProps) {
  const [imgError, setImgError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  const showPlaceholder = !movie.poster || imgError;
  const streamUrl = movie.videoUrl || movie.serverUrl;
  const canQuickPlay = Boolean(onPlayVlc && streamUrl && !streamUrl.endsWith("/"));

  return (
    <Link
      href={`/movie/${encodeURIComponent(movie.id)}`}
      aria-label={`${movie.title} (${movie.year})`}
      onClick={() => {
        if (onSelectMovie) {
          onSelectMovie(movie);
        }
      }}
      className="group relative flex flex-col cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 rounded-xl transition-all duration-200 block"
    >
      {/* 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#18181a] border border-white/5 group-hover:border-[#e50914]/70 transition-all shadow-md group-hover:shadow-xl group-hover:shadow-red-950/20">
        {/* Render Poster Image or Empty Placeholder */}
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
              const folderUrl = movie.serverUrl.endsWith("/")
                ? movie.serverUrl
                : movie.serverUrl.substring(0, movie.serverUrl.lastIndexOf("/") + 1);
              const fallback = `${folderUrl}a_AL_.jpg`;
              if (!fallbackAttempted && img.src !== fallback) {
                setFallbackAttempted(true);
                img.src = fallback;
              } else {
                setImgError(true);
              }
            }}
          />
        )}

        {/* Quality Badge */}
        <div className="absolute top-2 left-2 z-10 pointer-events-none">
          <span className="bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md">
            {movie.quality}
          </span>
        </div>

        {/* Interactive Hover Action Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-2.5 justify-between z-10">
          {canQuickPlay ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onPlayVlc && streamUrl) {
                  onPlayVlc(streamUrl, movie.title);
                }
              }}
              title="Quick Play in VLC"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#e50914] hover:bg-red-700 text-white text-[11px] font-bold shadow-lg transition active:scale-90"
            >
              <VlcIcon className="w-3.5 h-3.5 fill-white" />
              <span>Play</span>
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-1 text-[11px] font-semibold text-neutral-300 hover:text-white bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
            <Info className="w-3 h-3" />
            <span>Details</span>
          </div>
        </div>
      </div>

      {/* Info Section Below Poster */}
      <div className="pt-2 px-0.5 space-y-0.5">
        <h3
          className="text-xs sm:text-sm font-semibold text-neutral-200 truncate group-hover:text-[#e50914] transition"
          title={movie.title}
        >
          {movie.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-neutral-400">
          <span>{movie.year}</span>
          {movie.rating ? (
            <span className="flex items-center gap-1 text-amber-400 font-medium">
              <Star className="w-3 h-3 fill-amber-400" />
              {movie.rating.toFixed(1)}
            </span>
          ) : (
            <span className="text-[10px] text-neutral-500 font-mono">BDIX</span>
          )}
        </div>
      </div>
    </Link>
  );
}
