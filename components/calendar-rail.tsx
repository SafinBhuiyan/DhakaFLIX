"use client";

import { ChevronRight, Film, Tv, Calendar as CalendarIcon, MoreVertical } from "lucide-react";
import { TMDBMedia, getBackdropUrl } from "@/lib/tmdb";

interface CalendarRailProps {
  items: TMDBMedia[];
  onSelectMedia: (item: TMDBMedia) => void;
}

export function CalendarRail({ items, onSelectMedia }: CalendarRailProps) {
  // Take up to 3 upcoming items
  const calendarItems = [
    {
      title: "VisionQuest",
      sub: "S1 · E1-2",
      badge: "In 3 days",
      extraBadge: "Premiere",
      backdrop: "https://image.tmdb.org/t/p/w780/cn0feYcDvVzVjUDoXa1O8sRgzz.jpg",
    },
    {
      title: "Street Fighter",
      sub: "Movie",
      badge: "In 4 days",
      backdrop: "https://image.tmdb.org/t/p/w780/wJjnJbVUwPz0GADAgpFt9nWtzUu.jpg",
    },
    {
      title: "VisionQuest",
      sub: "S1 · E3-4",
      badge: "Next week",
      backdrop: "https://image.tmdb.org/t/p/w780/qu9epTZh29fGUkY7ZYc9PVsv0Ig.jpg",
    }
  ];

  return (
    <section id="calendar" className="space-y-3">
      {/* Header with Switcher Icons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-purple-400 transition group">
            <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">▶</span>
            <span>Calendar</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
          </button>

          {/* Sub Switcher Pills (Matching Trakt) */}
          <div className="flex items-center bg-[#151022] p-0.5 rounded-lg border border-white/10 text-xs">
            <button className="px-2.5 py-1 rounded-md bg-purple-600 text-white font-medium">All</button>
            <button className="p-1 px-2 text-muted-foreground hover:text-white" title="Episodes">
              <Tv className="w-3.5 h-3.5" />
            </button>
            <button className="p-1 px-2 text-muted-foreground hover:text-white" title="Movies">
              <Film className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {calendarItems.map((item, idx) => (
          <div
            key={idx}
            className="group relative rounded-xl overflow-hidden bg-[#130f1e] border border-white/5 hover:border-purple-500/30 transition-all cursor-pointer shadow-lg"
          >
            {/* Backdrop image */}
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-black/40">
              <img
                src={item.backdrop}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Release Badges on Top/Bottom Left */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <span className="bg-black/80 backdrop-blur-md text-[10px] font-bold text-white px-2 py-0.5 rounded-md border border-white/10">
                  {item.badge}
                </span>
                {item.extraBadge && (
                  <span className="bg-purple-600/90 text-[10px] font-bold text-white px-2 py-0.5 rounded-md">
                    {item.extraBadge}
                  </span>
                )}
              </div>

              {/* Three dots menu */}
              <div className="absolute top-2 right-2">
                <button className="p-1 rounded-full bg-black/50 text-white/80 hover:text-white">
                  <MoreVertical className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Title & Episode info */}
            <div className="p-3">
              <h4 className="text-xs font-semibold text-white truncate">{item.title}</h4>
              <p className="text-[11px] text-muted-foreground">{item.sub}</p>
            </div>
          </div>
        ))}

        {/* Promo Card ("Your timeline. See what's dropping next...") */}
        <div className="relative rounded-xl overflow-hidden bg-gradient-to-br from-[#1a122e] via-[#150f24] to-[#100b1c] border border-purple-500/20 p-5 flex flex-col justify-between shadow-lg">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-white leading-relaxed">
              Your timeline. See what&apos;s dropping next with a full list of upcoming episodes and movies you care about.
            </h4>
          </div>

          <div className="pt-4">
            <button className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/10 transition">
              Discover more
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
