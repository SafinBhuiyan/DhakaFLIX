"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Film,
  Tv,
  Flame,
  Award,
  Sparkles,
  Globe,
  Clapperboard,
  Video,
} from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MovieGridCard } from "@/components/movie-grid-card";

export interface HomeRailSection {
  id: string;
  label: string;
  server: string;
  total: number;
  items: CatalogMovie[];
}

interface HomeMediaRailProps {
  section: HomeRailSection;
  onSelectCategory: (categoryId: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
  onPlayVlc: (streamUrl: string, title: string) => void;
}

function getSectionIcon(id: string) {
  switch (id) {
    case "movies1080p":
      return Film;
    case "tvSeries":
      return Tv;
    case "hindi":
      return Flame;
    case "imdb250":
      return Award;
    case "southDubbed":
    case "southMovies":
      return Sparkles;
    case "animation":
    case "animation1080p":
      return Clapperboard;
    case "foreign":
      return Globe;
    case "movies720p":
      return Video;
    default:
      return Film;
  }
}

export function HomeMediaRail({
  section,
  onSelectCategory,
  onSelectMovie,
  onPlayVlc,
}: HomeMediaRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const Icon = getSectionIcon(section.id);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -550 : 550;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!section.items || section.items.length === 0) return null;

  return (
    <section className="space-y-3.5 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2.5">
          <span className="w-1.5 h-4 bg-[#e50914] rounded-sm shrink-0" />
          <Icon className="w-4 h-4 text-[#e50914] shrink-0" aria-hidden="true" />
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-white">
              {section.label}
            </h2>
            <span className="text-[11px] font-medium text-neutral-400">
              {section.server} • {section.total > 0 ? `${section.total}+ Titles` : "Instant BDIX"}
            </span>
          </div>
        </div>

        {/* Right Header Navigation & Actions */}
        <div className="flex items-center gap-2">
          {/* "Explore All" Category Switch Button */}
          <button
            onClick={() => onSelectCategory(section.id)}
            className="group inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-white/5 transition"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#e50914]" />
          </button>

          {/* Left/Right Carousel Controls (Desktop) */}
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              onClick={() => handleScroll("left")}
              aria-label={`Scroll ${section.label} left`}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition active:scale-95 border border-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label={`Scroll ${section.label} right`}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition active:scale-95 border border-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Shelf */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain touch-pan-x"
      >
        {section.items.map((movie, idx) => (
          <div
            key={`rail-${section.id}-${movie.id}-${idx}`}
            className="w-[145px] sm:w-[170px] md:w-[185px] shrink-0"
          >
            <MovieGridCard
              movie={movie}
              onPlayVlc={onPlayVlc}
              onSelectMovie={onSelectMovie}
            />
          </div>
        ))}

        {/* End-of-Rail "View Entire Catalog" Card */}
        <div className="w-[145px] sm:w-[170px] md:w-[185px] shrink-0 flex flex-col">
          <button
            onClick={() => onSelectCategory(section.id)}
            className="group aspect-[2/3] w-full rounded-xl border border-dashed border-white/15 hover:border-[#e50914] bg-[#141416]/50 hover:bg-[#1c1c20] transition-all flex flex-col items-center justify-center p-4 text-center gap-2.5 active:scale-95 shadow-sm"
          >
            <div className="w-10 h-10 rounded-full bg-white/5 group-hover:bg-[#e50914] flex items-center justify-center text-white transition-all shadow">
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div>
              <span className="block text-xs font-bold text-white group-hover:text-red-400 transition">
                View All {section.total}+
              </span>
              <span className="text-[11px] text-neutral-400 mt-0.5 block line-clamp-1">
                in {section.label}
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
