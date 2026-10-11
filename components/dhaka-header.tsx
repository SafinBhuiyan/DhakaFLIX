"use client";

import { Play, Wifi, Film, Sparkles, Tv, Layers } from "lucide-react";

interface DhakaHeaderProps {
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
}

export function DhakaHeader({ activeCategory, onSelectCategory }: DhakaHeaderProps) {
  const categories = [
    { id: "latest-1080p", label: "2026 Releases (1080p)" },
    { id: "latest-720p", label: "2026 Releases (720p)" },
    { id: "hindi", label: "Hindi & South" },
    { id: "animation", label: "Animation" }
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0a0812]/90 backdrop-blur-md border-b border-white/10 px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Brand & BDIX Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5 cursor-pointer">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1 leading-none">
              Dhaka<span className="text-purple-400">FLIX</span>
            </h1>
            <span className="text-[10px] text-muted-foreground font-medium">BDIX Media Hub</span>
          </div>
        </div>

        {/* BDIX Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>172.16.50.x Online</span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelectCategory(cat.id)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "bg-white/[0.04] text-muted-foreground hover:text-white hover:bg-white/[0.08] border border-white/5"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>
    </header>
  );
}
