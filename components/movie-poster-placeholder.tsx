"use client";

import { Film, Clapperboard, Video } from "lucide-react";

interface MoviePosterPlaceholderProps {
  title: string;
  year?: number | string;
  quality?: string;
  category?: string;
  size?: "card" | "thumb" | "modal" | "banner";
  className?: string;
}

export function MoviePosterPlaceholder({
  title,
  year,
  quality,
  category,
  size = "card",
  className = "",
}: MoviePosterPlaceholderProps) {
  // Small thumbnail (e.g. Search Suggestions dropdown: 40x56px)
  if (size === "thumb") {
    return (
      <div
        className={`w-10 h-14 rounded-lg bg-gradient-to-b from-[#242429] via-[#161619] to-[#0c0c0e] border border-white/10 flex flex-col items-center justify-center p-1 text-center shrink-0 select-none ${className}`}
        title={title}
      >
        <Film className="w-4 h-4 text-red-500/80 mb-0.5" />
        <span className="text-[8px] font-bold text-neutral-400 line-clamp-2 leading-tight uppercase font-mono">
          {year || "DF"}
        </span>
      </div>
    );
  }

  // Medium thumbnail for Stream Modal (e.g. 80x112px)
  if (size === "modal") {
    return (
      <div
        className={`w-20 h-28 rounded-lg bg-gradient-to-b from-[#25252b] via-[#17171a] to-[#0c0c0e] border border-white/10 flex flex-col items-center justify-between p-2 text-center shrink-0 select-none shadow-md ${className}`}
        title={title}
      >
        <div className="w-full flex justify-end">
          {quality && (
            <span className="text-[8px] font-bold bg-[#e50914] text-white px-1 py-0.2 rounded">
              {quality}
            </span>
          )}
        </div>
        <div className="flex flex-col items-center gap-1">
          <Clapperboard className="w-5 h-5 text-red-500/80" />
          <span className="text-[9px] font-bold text-neutral-300 line-clamp-2 uppercase">
            {title}
          </span>
        </div>
        <span className="text-[8px] text-neutral-500 font-mono tracking-wider">
          {year || "DHAKAFLIX"}
        </span>
      </div>
    );
  }

  // Wide banner placeholder for HeroSlider
  if (size === "banner") {
    return (
      <div
        className={`absolute inset-0 w-full h-full bg-gradient-to-br from-[#2a1215] via-[#16161a] to-[#0a0a0c] flex items-center justify-center p-8 select-none ${className}`}
      >
        <div className="flex flex-col items-center text-center max-w-md gap-3 opacity-40">
          <Film className="w-16 h-16 text-red-500" />
          <span className="text-xl font-black text-white tracking-widest uppercase">
            DHAKAFLIX MEDIA
          </span>
        </div>
      </div>
    );
  }

  // Standard 2:3 Card Placeholder for Grid Cards
  return (
    <div
      className={`relative w-full h-full rounded-xl overflow-hidden bg-gradient-to-b from-[#232328] via-[#161619] to-[#0c0c0e] border border-white/5 flex flex-col items-center justify-between p-4 text-center select-none shadow-inner transition-transform duration-300 ${className}`}
      title={title}
    >
      {/* Ambient background glow & film texture */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(229,9,20,0.18)_0%,_transparent_65%)] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-[#e50914]/40 to-transparent pointer-events-none" />

      {/* Top Header in placeholder: category or indicator */}
      <div className="w-full flex items-center justify-between z-10 text-[9px] font-mono uppercase tracking-wider text-neutral-400">
        <span className="truncate max-w-[85px]">{category || "DhakaFlix"}</span>
        <span>{year || ""}</span>
      </div>

      {/* Centerpiece: Stylized Film Icon + Title */}
      <div className="my-auto flex flex-col items-center gap-2.5 z-10 max-w-full px-1">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-[#e50914] shadow-lg group-hover:scale-110 group-hover:border-[#e50914]/50 transition-all duration-300">
          <Clapperboard className="w-6 h-6 stroke-[1.75]" />
        </div>

        <div className="space-y-1">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-200 line-clamp-3 uppercase tracking-wide leading-snug drop-shadow group-hover:text-white transition">
            {title}
          </h4>
          <span className="inline-block text-[10px] text-neutral-400 font-medium">
            No Poster Available
          </span>
        </div>
      </div>

      {/* Bottom Footer: DhakaFlix Watermark */}
      <div className="w-full pt-2 border-t border-white/5 z-10 flex items-center justify-center gap-1.5 text-[9px] font-mono tracking-widest text-neutral-400 uppercase">
        <Video className="w-2.5 h-2.5 text-red-500/70" />
        <span>BDIX MEDIA</span>
      </div>
    </div>
  );
}
