"use client";

import { ChevronRight, Search, Play } from "lucide-react";
import Image from "next/image";

interface HeroBannerProps {
  onDiscoverClick: () => void;
  continueItem?: {
    title: string;
    progress: number;
    backdropUrl?: string;
    streamUrl?: string;
  };
  onPlayVlc?: (streamUrl: string, title: string) => void;
}

export function HeroBanner({ onDiscoverClick, continueItem, onPlayVlc }: HeroBannerProps) {
  return (
    <section id="continue-watching" className="space-y-3">
      {/* Section Header with arrow */}
      <button 
        onClick={onDiscoverClick}
        className="flex items-center gap-1.5 text-sm font-bold text-white hover:text-purple-400 transition group"
      >
        <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px]">▶</span>
        <span>Continue Watching</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition" />
      </button>

      {/* Main Banner Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#120e1f] via-[#161126] to-[#120d20] border border-white/5 min-h-[170px] flex items-center p-6 sm:p-8 shadow-xl">
        
        {/* Subtle Right Background Cinematic Image */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-35 pointer-events-none mask-fade-left">
          <img 
            src="https://image.tmdb.org/t/p/w1280/cn0feYcDvVzVjUDoXa1O8sRgzz.jpg"
            alt="Backdrop"
            className="w-full h-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#120e1f] via-[#120e1f]/80 to-transparent"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="space-y-1">
            <h2 className="text-base sm:text-lg font-semibold text-white">
              Your shows and movies. Your pace.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Jump back in exactly where you left off. Direct BDIX network streaming with 1-click VLC playback. What are you currently watching?
            </p>
          </div>

          <div className="pt-1 flex items-center gap-3">
            <button
              onClick={onDiscoverClick}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-200 border border-purple-500/30 text-xs font-semibold shadow-md transition"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Discover media</span>
            </button>

            {continueItem?.streamUrl && onPlayVlc && (
              <button
                onClick={() => onPlayVlc(continueItem.streamUrl!, continueItem.title)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/40 transition"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Resume in VLC</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
