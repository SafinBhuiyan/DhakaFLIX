"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";

interface SiteHeaderProps {
  onSearch: (query: string) => void;
}

export function SiteHeader({ onSearch }: SiteHeaderProps) {
  const [searchInput, setSearchInput] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput.trim());
  };

  return (
    <header className="bg-[#121213]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-[1480px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <span className="text-2xl font-black tracking-tight text-white group-hover:text-neutral-200 transition">
              DHAKA<span className="text-[#e50914]">FLIX</span>
            </span>
            <span className="hidden sm:inline-block text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              BDIX 1Gbps
            </span>
          </Link>
        </div>

        {/* Clean Center/Right Search Bar */}
        <div className="flex items-center gap-4 flex-1 max-w-lg justify-end">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                onSearch(e.target.value);
              }}
              placeholder="Search movies, series, or files on DhakaFlix..."
              className="w-full bg-[#18181b] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-xs text-white placeholder-neutral-500 rounded-xl pl-9 pr-8 py-2.5 transition outline-none shadow-inner"
            />
            <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput("");
                  onSearch("");
                }}
                className="absolute right-3 top-2.5 text-neutral-500 hover:text-white text-xs p-0.5 transition"
              >
                ✕
              </button>
            )}
          </form>

          {/* Cluster Status Badge */}
          <div className="hidden md:flex items-center gap-2 shrink-0 text-xs text-neutral-400 pl-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-neutral-300">Cluster Online</span>
          </div>
        </div>

      </div>
    </header>
  );
}
