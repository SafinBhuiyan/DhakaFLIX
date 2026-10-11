"use client";

import { Play, Info, Sparkles, HardDrive, Wifi } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";

interface DhakaSpotlightProps {
  movie: CatalogMovie | null;
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

export function DhakaSpotlight({ movie, onPlayVlc, onSelectMovie }: DhakaSpotlightProps) {
  if (!movie) return null;

  return (
    <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#140e24] via-[#161028] to-[#120d20] border border-white/10 p-6 sm:p-10 shadow-2xl flex flex-col justify-end min-h-[260px] sm:min-h-[320px]">
      {/* Backdrop Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={movie.backdrop || movie.poster || "https://image.tmdb.org/t/p/w1280/cn0feYcDvVzVjUDoXa1O8sRgzz.jpg"}
          alt={movie.title}
          className="w-full h-full object-cover object-top opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0a1a] via-[#0e0a1a]/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e0a1a] via-[#0e0a1a]/70 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-2xl space-y-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="bg-purple-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-md shadow-purple-900/40">
            Featured 2026 Release
          </span>
          <span className="bg-white/10 text-white text-[11px] font-medium px-2 py-0.5 rounded-full border border-white/10">
            {movie.quality}
          </span>
          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <HardDrive className="w-3 h-3" /> {movie.sourceServer}
          </span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          {movie.title}
        </h2>

        {movie.overview && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 max-w-xl leading-relaxed">
            {movie.overview}
          </p>
        )}

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={() => onPlayVlc(`${movie.serverUrl}`, movie.title)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-orange-900/50 transition-transform active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Play in VLC</span>
          </button>

          <button
            onClick={() => onSelectMovie(movie)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/10 transition"
          >
            <Info className="w-4 h-4" />
            <span>Stream Details</span>
          </button>
        </div>
      </div>
    </div>
  );
}
