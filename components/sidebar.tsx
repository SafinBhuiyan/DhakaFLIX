"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  Compass, 
  ListOrdered, 
  Clock, 
  Film, 
  Settings, 
  CheckSquare, 
  Sparkles,
  Bookmark,
  Calendar,
  ThumbsUp,
  Flame,
  Menu
} from "lucide-react";
import { useState } from "react";

interface SidebarProps {
  onOpenSearch: () => void;
}

export function Sidebar({ onOpenSearch }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => pathname === path;

  return (
    <aside 
      className={`fixed top-0 left-0 h-screen z-40 bg-[#0c0914] border-r border-white/5 flex flex-col transition-all duration-300 ${
        collapsed ? "w-18" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 text-muted-foreground hover:text-white rounded-md hover:bg-white/5 transition"
            title="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-700 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-900/30">
                <CheckSquare className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
              <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
                Dhaka<span className="text-purple-400">FLIX</span>
              </span>
            </Link>
          )}
        </div>
      </div>

      {/* Navigation Links Scrollable Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-6">
        
        {/* Search Bar / Ctrl+K */}
        <div>
          <button
            onClick={onOpenSearch}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-white rounded-lg bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition group ${
              collapsed ? "justify-center px-0" : "justify-between"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Search className="w-4 h-4 text-purple-400" />
              {!collapsed && <span>Search</span>}
            </div>
            {!collapsed && (
              <kbd className="text-[10px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded font-mono group-hover:text-white">
                Ctrl K
              </kbd>
            )}
          </button>
        </div>

        {/* Section: Home */}
        <div className="space-y-1">
          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition ${
              isActive("/") 
                ? "bg-purple-600/15 text-purple-300 border border-purple-500/20" 
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            } ${collapsed ? "justify-center" : ""}`}
          >
            <Home className="w-4 h-4" />
            {!collapsed && <span>Home</span>}
          </Link>

          {!collapsed && (
            <div className="pl-9 pr-2 space-y-1 text-xs text-muted-foreground">
              <Link href="#continue-watching" className="block py-1 hover:text-purple-300 transition">Continue Watching</Link>
              <Link href="#calendar" className="block py-1 hover:text-purple-300 transition">Calendar</Link>
              <Link href="#recommended" className="block py-1 hover:text-purple-300 transition">Recommended</Link>
            </div>
          )}
        </div>

        {/* Section: Discover */}
        <div className="space-y-1">
          <div className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 ${collapsed ? "justify-center" : ""}`}>
            <Compass className="w-4 h-4 text-purple-400" />
            {!collapsed && <span>Discover</span>}
          </div>
          {!collapsed && (
            <div className="pl-9 pr-2 space-y-1 text-xs text-muted-foreground">
              <Link href="/trending" className="block py-1 hover:text-purple-300 transition">Trending</Link>
              <Link href="/releases" className="block py-1 hover:text-purple-300 transition">Releases (2026)</Link>
              <Link href="/anticipated" className="block py-1 hover:text-purple-300 transition">Anticipated</Link>
              <Link href="/popular" className="block py-1 hover:text-purple-300 transition">Popular</Link>
            </div>
          )}
        </div>

        {/* Section: Lists */}
        <div className="space-y-1">
          <div className={`flex items-center gap-2 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 ${collapsed ? "justify-center" : ""}`}>
            <ListOrdered className="w-4 h-4 text-purple-400" />
            {!collapsed && <span>Lists</span>}
          </div>
          {!collapsed && (
            <div className="pl-9 pr-2 space-y-1 text-xs text-muted-foreground">
              <Link href="/watchlist" className="block py-1 hover:text-purple-300 transition">Watchlist</Link>
              <Link href="/smart-lists" className="block py-1 hover:text-purple-300 transition">Smart Lists</Link>
              <Link href="/my-lists" className="block py-1 hover:text-purple-300 transition">My Lists</Link>
              <Link href="/liked" className="block py-1 hover:text-purple-300 transition">Liked</Link>
            </div>
          )}
        </div>

        {/* Utilities */}
        <div className="space-y-1 pt-2 border-t border-white/5">
          <Link
            href="/history"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition ${collapsed ? "justify-center" : ""}`}
          >
            <Clock className="w-4 h-4" />
            {!collapsed && <span>History</span>}
          </Link>
          <Link
            href="/library"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition ${collapsed ? "justify-center" : ""}`}
          >
            <Film className="w-4 h-4" />
            {!collapsed && <span>Library</span>}
          </Link>
          <Link
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-white hover:bg-white/5 transition ${collapsed ? "justify-center" : ""}`}
          >
            <Settings className="w-4 h-4" />
            {!collapsed && <span>Settings</span>}
          </Link>
        </div>
      </div>

      {/* User Profile Pill at Bottom (Matching safin_bhuiyan in screenshot) */}
      <div className="p-3 border-t border-white/5 bg-black/20">
        <div className={`flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-white/5 transition cursor-pointer ${collapsed ? "justify-center" : ""}`}>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center font-bold text-xs text-white ring-2 ring-purple-500/30">
            S
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">safin_bhuiyan_4b9969</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected to DhakaFlix
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
