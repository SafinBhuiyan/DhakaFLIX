"use client";

import { useRef } from "react";
import {
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  Tv,
  Film,
} from "lucide-react";
import { WatchHistoryItem } from "@/lib/user-store";
import { VlcIcon } from "@/components/vlc-icon";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";

interface ContinueWatchingRailProps {
  items: WatchHistoryItem[];
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diffMinutes = Math.floor((Date.now() - timestamp) / 60000);
  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function ContinueWatchingRail({
  items,
  onPlayVlc,
  onSelectMovie,
  onRemoveItem,
  onClearAll,
}: ContinueWatchingRailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!items || items.length === 0) return null;

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = direction === "left" ? -480 : 480;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  return (
    <section className="space-y-2.5 pt-1">
      {/* Header */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="w-1 h-4 bg-[#e50914] rounded-sm shrink-0" />
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
            Continue Watching
            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-white/10 text-neutral-300">
              {items.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear History Button */}
          <button
            onClick={onClearAll}
            title="Clear all watch history"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-neutral-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          {/* Left/Right Scroll Buttons */}
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-white/10">
            <button
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition active:scale-95 border border-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 hover:text-white transition active:scale-95 border border-white/5"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards Shelf */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden overscroll-x-contain touch-pan-x"
      >
        {items.map((item) => {
          const directStreamUrl = item.videoUrl || item.serverUrl || "";
          const isSeries = Boolean(item.isSeries || item.episodeNumber);

          // Convert to CatalogMovie for the Details Modal
          const asCatalogMovie: CatalogMovie = {
            id: item.id,
            title: item.title,
            rawName: item.title,
            year: item.year || new Date().getFullYear(),
            quality: item.quality || "1080p",
            serverUrl: item.serverUrl || "",
            sourceServer: item.sourceServer || "Server 14",
            category: item.category || (isSeries ? "TV & Web Series" : "Movies"),
            poster: item.poster || "",
            backdrop: item.backdrop,
            rating: item.rating,
            modifiedDate: "2026",
            videoUrl: item.videoUrl,
          };

          return (
            <div
              key={`continue-${item.id}`}
              className="group relative w-[220px] sm:w-[260px] shrink-0 bg-[#141416] border border-white/10 rounded-xl overflow-hidden hover:border-[#e50914]/60 transition-all shadow-lg flex flex-col justify-between"
            >
              {/* Media Preview Box */}
              <div className="relative aspect-video w-full bg-[#18181b] overflow-hidden">
                {item.backdrop || item.poster ? (
                  <img
                    src={item.backdrop || item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-neutral-900 text-neutral-500">
                    {isSeries ? <Tv className="w-8 h-8" /> : <Film className="w-8 h-8" />}
                  </div>
                )}

                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

                {/* Remove button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveItem(item.id);
                  }}
                  title="Remove from history"
                  className="absolute top-2 right-2 z-20 p-1 rounded-full bg-black/60 hover:bg-red-600 text-white/80 hover:text-white transition backdrop-blur-sm"
                >
                  <X className="w-3.5 h-3.5" />
                </button>

                {/* Episode / Quality Badge */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5">
                  {isSeries && item.seasonNumber ? (
                    <span className="bg-[#e50914] text-white text-[10px] font-black px-2 py-0.5 rounded shadow">
                      S{item.seasonNumber} · E{item.episodeNumber || 1}
                    </span>
                  ) : (
                    <span className="bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded border border-white/10">
                      {item.quality || "Movie"}
                    </span>
                  )}
                </div>

                {/* Relative timestamp */}
                <div className="absolute bottom-2 left-2 z-10 text-[10px] font-medium text-neutral-300">
                  {formatRelativeTime(item.watchedAt)}
                </div>
              </div>

              {/* Bottom Metadata & Play Bar */}
              <div className="p-3 space-y-2">
                <div
                  onClick={() => onSelectMovie(asCatalogMovie)}
                  className="cursor-pointer group/title"
                >
                  <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover/title:text-[#e50914] transition">
                    {item.title}
                  </h3>
                  {item.episodeTitle && (
                    <p className="text-[11px] text-neutral-400 truncate">
                      {item.episodeTitle}
                    </p>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (directStreamUrl) {
                        onPlayVlc(directStreamUrl, item.title);
                      } else {
                        onSelectMovie(asCatalogMovie);
                      }
                    }}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#e50914] hover:bg-red-700 text-white text-xs font-bold transition shadow-md active:scale-95"
                  >
                    <VlcIcon className="w-3.5 h-3.5 fill-white" />
                    <span>Resume</span>
                  </button>

                  <button
                    onClick={() => onSelectMovie(asCatalogMovie)}
                    className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-semibold border border-white/10 transition active:scale-95"
                  >
                    Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
