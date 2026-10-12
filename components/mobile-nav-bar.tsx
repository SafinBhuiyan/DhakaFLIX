"use client";

import { useState, useEffect } from "react";
import {
  Home,
  Film,
  Tv,
  LayoutGrid,
  Search,
  X,
  Sparkles,
  Flame,
  Award,
  Globe,
  Clapperboard,
  Glasses,
  Video,
  ChevronRight,
} from "lucide-react";
import { CATEGORY_GROUPS } from "@/components/site-header";
import { useScrollLock } from "@/hooks/use-scroll-lock";

interface MobileNavBarProps {
  activeCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onOpenSearch: () => void;
}

export function MobileNavBar({
  activeCategory,
  onSelectCategory,
  onOpenSearch,
}: MobileNavBarProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close sheet on Escape or navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setSheetOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when sheet is open
  useScrollLock(sheetOpen);

  const handleItemClick = (catId: string) => {
    setSheetOpen(false);
    onSelectCategory(catId);
  };

  const isHomeActive = activeCategory === "home";
  const isMoviesActive = activeCategory === "movies1080p";
  const isSeriesActive = activeCategory === "tvSeries";
  const isOtherCategory = !isHomeActive && !isMoviesActive && !isSeriesActive;

  return (
    <>
      {/* 1. Fixed Bottom Navigation Bar (Mobile & Tablet Only) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-[#121214]/95 backdrop-blur-xl border-t border-white/10 px-2 py-1 safe-area-pb shadow-2xl"
      >
        <div className="flex items-center justify-around max-w-md mx-auto">
          {/* Home Tab */}
          <button
            onClick={() => handleItemClick("home")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isHomeActive
                ? "text-[#e50914] font-bold scale-105"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          {/* Movies Tab */}
          <button
            onClick={() => handleItemClick("movies1080p")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isMoviesActive
                ? "text-[#e50914] font-bold scale-105"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Film className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Movies</span>
          </button>

          {/* Series Tab */}
          <button
            onClick={() => handleItemClick("tvSeries")}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              isSeriesActive
                ? "text-[#e50914] font-bold scale-105"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Series</span>
          </button>

          {/* Categories Tab (Opens Bottom Sheet) */}
          <button
            onClick={() => setSheetOpen(true)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${
              sheetOpen || isOtherCategory
                ? "text-[#e50914] font-bold scale-105"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <LayoutGrid className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Categories</span>
          </button>


        </div>
      </nav>

      {/* 2. Full Categorized Bottom Drawer / Sheet */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end overscroll-contain">
          {/* Backdrop */}
          <div
            onClick={() => setSheetOpen(false)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200 touch-none"
          />

          {/* Sheet Modal Container */}
          <div className="relative z-10 bg-[#161619] border-t border-white/15 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-250 overscroll-contain">
            {/* Sheet Handle & Header */}
            <div className="p-4 pb-2 border-b border-white/10 shrink-0">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-[#e50914]" />
                    Browse All Categories
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    DhakaFlix BDIX Storage Servers
                  </p>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition"
                  aria-label="Close categories sheet"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Category Grid */}
            <div className="p-4 space-y-6 overflow-y-auto overscroll-contain pb-10">
              {CATEGORY_GROUPS.map((group) => (
                <div key={group.name} className="space-y-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#e50914] flex items-center gap-1.5">
                    <span className="w-1 h-3 bg-[#e50914] rounded-sm" />
                    {group.name}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map((item) => {
                      const ItemIcon = item.icon;
                      const isSelected = activeCategory === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleItemClick(item.id)}
                          className={`flex items-center justify-between p-3 rounded-2xl border text-left transition-all active:scale-[0.98] ${
                            isSelected
                              ? "bg-[#e50914] border-[#e50914] text-white shadow-lg shadow-red-950/50"
                              : "bg-[#1f1f23] hover:bg-[#25252b] border-white/5 text-neutral-200"
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                isSelected ? "bg-white/20 text-white" : "bg-white/5 text-red-500"
                              }`}
                            >
                              <ItemIcon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold block truncate">
                                {item.label}
                              </span>
                              <span
                                className={`text-[10px] block mt-0.5 font-mono ${
                                  isSelected ? "text-white/80" : "text-neutral-400"
                                }`}
                              >
                                {item.server} • BDIX
                              </span>
                            </div>
                          </div>

                          <ChevronRight
                            className={`w-4 h-4 shrink-0 ${
                              isSelected ? "text-white" : "text-neutral-500"
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
