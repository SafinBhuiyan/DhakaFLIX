"use client";

import { useRef } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { MediaCard } from "./media-card";
import { TMDBMedia } from "@/lib/tmdb";

interface MediaRailProps {
  title: string;
  items: TMDBMedia[];
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMedia: (item: TMDBMedia) => void;
}

export function MediaRail({ title, items, onPlayVlc, onSelectMedia }: MediaRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const offset = direction === "left" ? -480 : 480;
    scrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  };

  return (
    <section className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <button className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-purple-400 transition group">
          <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">▶</span>
          <span>{title}</span>
          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
        </button>

        {/* Scroll Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleScroll("left")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll("right")}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition"
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Carousel */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pt-1 scroll-smooth"
      >
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            onPlayVlc={onPlayVlc}
            onSelectMedia={onSelectMedia}
          />
        ))}
      </div>
    </section>
  );
}
