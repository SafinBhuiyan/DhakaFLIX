"use client";

import { useState } from "react";
import { Play, Info, Loader2 } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";

interface HeroSliderProps {
  movie: CatalogMovie | null;
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

export function HeroSlider({ movie, onPlayVlc, onSelectMovie }: HeroSliderProps) {
  const [loading, setLoading] = useState(false);
  const [imgError, setImgError] = useState(false);
  if (!movie) return null;

  const handlePlay = async () => {
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

  const bgImage = movie.backdrop || movie.poster;
  const showPlaceholder = !bgImage || imgError;

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-[#18181b] border border-white/10 shadow-2xl min-h-[260px] sm:min-h-[360px] md:min-h-[420px] flex items-end">
      {/* Background Backdrop Image or Placeholder */}
      {showPlaceholder ? (
        <MoviePosterPlaceholder title={movie.title} year={movie.year} size="banner" />
      ) : (
        <img
          src={bgImage}
          alt={movie.title}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.65]"
          onError={() => setImgError(true)}
        />
      )}

      {/* Multi-Stop Dark Gradient for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/70 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0f] via-[#0e0e0f]/50 to-transparent"></div>

      {/* Content Container */}
      <div className="relative z-10 p-4 sm:p-8 md:p-10 max-w-2xl space-y-2.5 sm:space-y-3">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="bg-[#e50914] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded shadow">
            SPOTLIGHT
          </span>
          <span className="bg-black/60 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded border border-white/10">
            {movie.quality}
          </span>
          <span className="text-xs text-neutral-300 font-medium">
            {movie.year}
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight drop-shadow-md line-clamp-2">
          {movie.title}
        </h1>

        {movie.overview && (
          <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow">
            {movie.overview}
          </p>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 pt-1">
          <button
            onClick={() => onSelectMovie(movie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#e50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/40 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[40px]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>View Streams</span>
          </button>
        </div>
      </div>
    </div>
  );
}
