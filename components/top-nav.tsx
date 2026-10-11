"use client";

import { Tv, Film, Clapperboard, Filter, Sparkles, User, Wifi } from "lucide-react";

interface TopNavProps {
  activeTab: "media" | "shows" | "movies";
  onTabChange: (tab: "media" | "shows" | "movies") => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <header className="h-16 px-6 border-b border-white/5 bg-[#09070f]/80 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
      
      {/* Left empty spacer for layout balance */}
      <div className="w-12 hidden md:block"></div>

      {/* Center Filter Switcher Pills (Matching Trakt screenshot) */}
      <div className="flex items-center p-1 bg-[#151022] rounded-full border border-white/10 shadow-inner">
        <button
          onClick={() => onTabChange("media")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "media"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Clapperboard className="w-3.5 h-3.5" />
          <span>Media</span>
        </button>

        <button
          onClick={() => onTabChange("shows")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "shows"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Tv className="w-3.5 h-3.5" />
          <span>Shows</span>
        </button>

        <button
          onClick={() => onTabChange("movies")}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
            activeTab === "movies"
              ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
              : "text-muted-foreground hover:text-white"
          }`}
        >
          <Film className="w-3.5 h-3.5" />
          <span>Movies</span>
        </button>
      </div>

      {/* Right Action Cluster (Matching screenshot) */}
      <div className="flex items-center gap-3">
        {/* Avatars Cluster & Today Badge */}
        <div className="hidden sm:flex items-center bg-[#151022] px-2.5 py-1 rounded-full border border-white/10 gap-2">
          <div className="flex -space-x-1.5 overflow-hidden">
            <div className="inline-block h-5 w-5 rounded-full ring-1 ring-purple-900 bg-purple-500 text-[9px] flex items-center justify-center font-bold text-white">S</div>
            <div className="inline-block h-5 w-5 rounded-full ring-1 ring-purple-900 bg-indigo-500 text-[9px] flex items-center justify-center font-bold text-white">D</div>
            <div className="inline-block h-5 w-5 rounded-full ring-1 ring-purple-900 bg-pink-500 text-[9px] flex items-center justify-center font-bold text-white">V</div>
          </div>
          <span className="text-xs font-medium text-white flex items-center gap-1">
            Today <span className="bg-purple-500/20 text-purple-300 text-[10px] px-1.5 py-0.2 rounded-full font-bold">24</span>
          </span>
        </div>

        {/* Filter Icon Button */}
        <button 
          className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full border border-white/5 transition"
          title="Filter releases"
        >
          <Filter className="w-4 h-4" />
        </button>

        {/* BDIX LAN Status Badge */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[11px] font-medium text-emerald-400">
          <Wifi className="w-3.5 h-3.5" />
          <span>172.16.50.x Online</span>
        </div>

        {/* VIP / Pro Pill Button */}
        <button className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-full text-xs font-semibold shadow-md shadow-purple-900/30 transition">
          <Sparkles className="w-3.5 h-3.5 fill-current" />
          <span>GET VIP</span>
        </button>
      </div>
    </header>
  );
}
