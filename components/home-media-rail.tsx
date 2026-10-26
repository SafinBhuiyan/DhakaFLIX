"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MovieGridCard } from "@/components/movie-grid-card";

export interface HomeRailSection {
  id: string;
  title?: string;
  label?: string;
  subtitle?: string;
  server?: string;
  total?: number;
  items: CatalogMovie[];
}

interface HomeMediaRailProps {
  section: HomeRailSection;
  onSelectCategory: (categoryId: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
  onPlayVlc: (streamUrl: string, title: string) => void;
}

export function HomeMediaRail({
  section,
  onSelectCategory,
  onSelectMovie,
  onPlayVlc,
}: HomeMediaRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionTitle = section.title || section.label || "Featured Collection";

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -550 : 550;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!section.items || section.items.length === 0) return null;

  return (
    <section id={`rail-${section.id}`} className="space-y-2.5 pt-1 scroll-mt-24">
      {/* Section Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 bg-[#e50914] rounded-sm shrink-0" />
          <h2
            onClick={() => onSelectCategory(section.id)}
            className="text-base sm:text-lg font-bold tracking-tight text-white hover:text-[#e50914] cursor-pointer transition-colors"
          >
            {sectionTitle}
          </h2>
        </div>

        {/* Right Header Navigation & Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSelectCategory(section.id)}
            className="group inline-flex items-center gap-1 text-xs font-semibold text-neutral-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition"
          >
            <span>Explore All</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#e50914]" />
          </button>

          <div className="hidden sm:flex items-center gap-1 pl-1">
            <button
              onClick={() => handleScroll("left")}
              aria-label={`Scroll ${sectionTitle} left`}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition active:scale-95"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label={`Scroll ${sectionTitle} right`}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition active:scale-95"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Carousel Shelf */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                View All {section.total || ""}+
              </span>
              <span className="text-[11px] text-neutral-400 mt-0.5 block line-clamp-1">
                in {sectionTitle}
              </span>
            </div>
          </button>
        </div>
      </div>
    </section>
  );
}
