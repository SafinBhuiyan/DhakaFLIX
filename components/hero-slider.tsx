"use client";

import { Play, Info } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";

interface HeroSliderProps {
  movies: CatalogMovie[];
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

export function HeroSlider({ movies, onPlayVlc, onSelectMovie }: HeroSliderProps) {
  const featured = movies.slice(0, 2);
  if (featured.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* 2 Side-by-Side Featured Banners (as shown in screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {featured.map((m, idx) => (
          <div
            key={idx}
            onClick={() => onSelectMovie(m)}
            className="group relative aspect-[16/9] w-full rounded-lg overflow-hidden bg-black/60 border border-white/10 cursor-pointer shadow-md"
          >
            {/* Backdrop */}
            <img
              src={m.backdrop || m.poster || "/placeholder-poster.png"}
              alt={m.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

            {/* Badges on Top */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="bg-[#e50914] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                Featured
              </span>
              <span className="bg-black/70 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded border border-white/10">
                {m.quality}
              </span>
            </div>

            {/* Bottom Info Overlay */}
            <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-white truncate drop-shadow-md group-hover:text-red-400 transition">
                  {m.title}
                </h3>
                <p className="text-[11px] text-neutral-300 drop-shadow">
                  {m.year} • {m.category}
                </p>
              </div>

              {/* Quick Play in VLC button */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  try {
                    const res = await fetch(`/api/media/streams?title=${encodeURIComponent(m.title)}&year=${m.year}`);
                    const data = await res.json();
                    if (data.streams && data.streams.length > 0) {
                      onPlayVlc(data.streams[0].streamUrl, m.title);
                    } else {
                      onSelectMovie(m);
                    }
                  } catch {
                    onSelectMovie(m);
                  }
                }}
                className="shrink-0 p-2 rounded bg-[#e50914] hover:bg-red-700 text-white shadow-lg transition active:scale-95"
                title="Play in VLC"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Slider dots (as shown in screenshot) */}
      <div className="flex items-center justify-center gap-1.5 py-1">
        <span className="w-4 h-1 rounded-full bg-[#e50914]"></span>
        <span className="w-1.5 h-1 rounded-full bg-white/20"></span>
        <span className="w-1.5 h-1 rounded-full bg-white/20"></span>
      </div>
    </div>
  );
}
