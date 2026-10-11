"use client";

import {
  Film,
  Video,
  Tv,
  Flame,
  Zap,
  Sparkles,
  Clapperboard,
  Globe,
  Award,
  Layers,
} from "lucide-react";

export interface ServerSection {
  id: string;
  label: string;
  serverNode: string;
  ip: string;
  icon: any;
}

export const SERVER_SECTIONS: ServerSection[] = [
  { id: "movies1080p", label: "English (1080p)", serverNode: "Server 14", ip: "172.16.50.14", icon: Film },
  { id: "movies720p", label: "English (720p)", serverNode: "Server 7", ip: "172.16.50.7", icon: Video },
  { id: "hindi", label: "Hindi Movies", serverNode: "Server 14", ip: "172.16.50.14", icon: Flame },
  { id: "southDubbed", label: "South (Hindi Dubbed)", serverNode: "Server 14", ip: "172.16.50.14", icon: Zap },
  { id: "tvSeries", label: "TV & Web Series", serverNode: "Server 12", ip: "172.16.50.12", icon: Tv },
  { id: "kolkata", label: "Bangla Movies", serverNode: "Server 7", ip: "172.16.50.7", icon: Sparkles },
  { id: "animation1080p", label: "Animation (1080p)", serverNode: "Server 14", ip: "172.16.50.14", icon: Clapperboard },
  { id: "foreign", label: "Foreign Language", serverNode: "Server 7", ip: "172.16.50.7", icon: Globe },
  { id: "imdb250", label: "IMDb Top-250", serverNode: "Server 14", ip: "172.16.50.14", icon: Award },
];

interface ServerNavBarProps {
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
}

export function ServerNavBar({ activeCategory, onSelectCategory }: ServerNavBarProps) {
  return (
    <div className="w-full bg-[#111113] border-b border-white/5 py-3">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 pr-2 border-r border-white/10 mr-1">
            <Layers className="w-3.5 h-3.5 text-[#e50914]" />
            <span>Servers</span>
          </div>

          {SERVER_SECTIONS.map((sec) => {
            const isSelected = activeCategory === sec.id;
            const Icon = sec.icon;

            return (
              <button
                key={sec.id}
                onClick={() => onSelectCategory(sec.id)}
                className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all select-none shrink-0 ${
                  isSelected
                    ? "bg-[#e50914] text-white shadow-md shadow-red-950/40 ring-1 ring-red-500/50"
                    : "bg-[#18181b] text-neutral-300 hover:text-white hover:bg-[#222226] border border-white/5"
                }`}
                title={`${sec.label} - ${sec.serverNode} (${sec.ip})`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 transition ${
                    isSelected ? "text-white" : "text-neutral-400 group-hover:text-red-400"
                  }`}
                />
                <span>{sec.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono transition ${
                    isSelected
                      ? "bg-black/35 text-white/90"
                      : "bg-white/5 text-neutral-400 group-hover:text-neutral-300"
                  }`}
                >
                  {sec.serverNode}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
