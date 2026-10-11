"use client";

import {
  Home,
  Film,
  Video,
  Tv,
  Flame,
  Zap,
  Sparkles,
  Clapperboard,
  Globe,
  Award,
  Glasses,
} from "lucide-react";

export interface ServerSection {
  id: string;
  label: string;
  icon: any;
}

export const SERVER_SECTIONS: ServerSection[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "movies1080p", label: "English Movies -1080p", icon: Film },
  { id: "movies720p", label: "English Movies", icon: Video },
  { id: "hindi", label: "Hindi Movies", icon: Flame },
  { id: "southMovies", label: "South Indian Movies", icon: Sparkles },
  { id: "southDubbed", label: "South-Movie Hindi Dubbed", icon: Zap },
  { id: "kolkata", label: "Kolkata Bangla Movies", icon: Sparkles },
  { id: "animation1080p", label: "Animation Movies -1080p", icon: Clapperboard },
  { id: "animation", label: "Animation Movies", icon: Clapperboard },
  { id: "foreign", label: "Foreign Language Movies", icon: Globe },
  { id: "imdb250", label: "IMDb Top-250 Movies", icon: Award },
  { id: "movies3D", label: "3D Movies", icon: Glasses },
  { id: "tvSeries", label: "TV & Web Series", icon: Tv },
];

interface ServerNavBarProps {
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
}

export function ServerNavBar({ activeCategory, onSelectCategory }: ServerNavBarProps) {
  return (
    <nav 
      aria-label="Movie and Series Categories" 
      className="w-full bg-[#111113]/90 backdrop-blur-md border-b border-white/5 py-2 sm:py-3 sticky top-14 sm:top-16 z-40 transition-all"
    >
      <div className="max-w-[1480px] mx-auto px-3 sm:px-8">
        <div 
          role="tablist" 
          className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto pb-0.5 sm:pb-0 scroll-smooth touch-pan-x overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SERVER_SECTIONS.map((sec) => {
            const isSelected = activeCategory === sec.id;
            const Icon = sec.icon;

            return (
              <button
                key={sec.id}
                role="tab"
                aria-selected={isSelected}
                onClick={() => onSelectCategory(sec.id)}
                className={`group flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all select-none shrink-0 min-h-[36px] sm:min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 active:scale-95 ${
                  isSelected
                    ? "bg-[#e50914] text-white shadow-lg shadow-red-950/50"
                    : "bg-[#18181b] text-neutral-300 hover:text-white hover:bg-[#232328] border border-white/5"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition ${
                    isSelected ? "text-white" : "text-neutral-400 group-hover:text-red-400"
                  }`}
                  aria-hidden="true"
                />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
