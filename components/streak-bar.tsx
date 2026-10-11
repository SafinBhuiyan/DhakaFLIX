"use client";

import { Flame, ArrowRight } from "lucide-react";

export function StreakBar() {
  return (
    <div className="rounded-xl bg-[#130f1e] border border-white/5 p-4 flex items-center justify-between shadow-md">
      {/* Left: Flame Icon + Streak Text */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
          <Flame className="w-5 h-5 fill-orange-500/20 text-orange-400" />
        </div>
        <div>
          <span className="font-bold text-sm text-white">0-day streak</span>
          <p className="text-[11px] text-muted-foreground hidden sm:block">Watch a movie or episode on DhakaFlix to start your streak</p>
        </div>
      </div>

      {/* Right: Activity Tracker Bars + Arrow (matching screenshot) */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-6 rounded-full bg-purple-500"></div>
          <div className="w-1.5 h-6 rounded-full bg-white/10"></div>
          <div className="w-1.5 h-6 rounded-full bg-white/10"></div>
          <div className="w-1.5 h-6 rounded-full bg-white/10"></div>
          <div className="w-1.5 h-6 rounded-full bg-white/10"></div>
          <div className="w-1.5 h-6 rounded-full bg-white/10"></div>
          <div className="w-1.5 h-6 rounded-full bg-white/10"></div>
        </div>

        <button className="p-1 rounded-md text-muted-foreground hover:text-white transition">
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
