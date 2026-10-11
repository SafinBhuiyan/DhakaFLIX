"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Play,
  Loader2,
  Star,
  ExternalLink,
  ArrowLeft,
  ChevronDown,
  Film,
  Tv,
  Flame,
  Award,
  Sparkles,
  Globe,
  Clapperboard,
  Glasses,
  Video,
} from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";

export interface NavCategoryGroup {
  name: string;
  items: {
    id: string;
    label: string;
    server: string;
    icon: any;
  }[];
}

export const CATEGORY_GROUPS: NavCategoryGroup[] = [
  {
    name: "English Cinema",
    items: [
      { id: "movies1080p", label: "English Movies (1080p)", server: "Server 14", icon: Film },
      { id: "movies720p", label: "English Movies (720p)", server: "Server 7", icon: Video },
      { id: "movies3D", label: "3D Movies", server: "Server 7", icon: Glasses },
    ],
  },
  {
    name: "Series & TV",
    items: [
      { id: "tvSeries", label: "TV & Web Series", server: "Server 12", icon: Tv },
    ],
  },
  {
    name: "South Asian Cinema",
    items: [
      { id: "hindi", label: "Hindi Movies", server: "Server 14", icon: Flame },
      { id: "southMovies", label: "South Indian Movies", server: "Server 14", icon: Sparkles },
      { id: "southDubbed", label: "South Hindi Dubbed", server: "Server 14", icon: Sparkles },
      { id: "kolkata", label: "Kolkata Bangla Movies", server: "Server 7", icon: Sparkles },
    ],
  },
  {
    name: "Special Collections",
    items: [
      { id: "imdb250", label: "IMDb Top-250 Movies", server: "Server 14", icon: Award },
      { id: "animation1080p", label: "Animation Movies (1080p)", server: "Server 14", icon: Clapperboard },
      { id: "animation", label: "Animation Movies", server: "Server 14", icon: Clapperboard },
      { id: "foreign", label: "Foreign & Korean Movies", server: "Server 7", icon: Globe },
    ],
  },
];

interface SiteHeaderProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
  onSearch: (query: string) => void;
  onSelectMovie?: (movie: CatalogMovie) => void;
  onPlayVlc?: (streamUrl: string, title: string) => void;
  onHomeClick?: () => void;
}

export function SiteHeader({
  activeCategory = "home",
  onSelectCategory,
  onSearch,
  onSelectMovie,
  onPlayVlc,
  onHomeClick,
}: SiteHeaderProps) {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogMovie[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMobileSearchActive, setIsMobileSearchActive] = useState(false);
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const categoriesMenuRef = useRef<HTMLDivElement>(null);

  // Close categories menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(e.target as Node)) {
        setShowCategoriesMenu(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) && inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setShowCategoriesMenu(false);
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Debounced live search suggestions
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoadingSuggestions(true);
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`, {
          signal: controller.signal,
        });
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowDropdown(true);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Live search failed:", err);
        }
      } finally {
        setLoadingSuggestions(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchInput]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setShowDropdown(false);
    onSearch(searchInput.trim());
    inputRef.current?.blur();
  };

  const handleSelectSuggestion = (movie: CatalogMovie) => {
    setShowDropdown(false);
    setIsMobileSearchActive(false);
    if (onSelectMovie) {
      onSelectMovie(movie);
    }
  };

  const handleCategoryClick = (catId: string) => {
    setShowCategoriesMenu(false);
    setSearchInput("");
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  // Find active category label if it's in the dropdown
  const allDropdownItems = CATEGORY_GROUPS.flatMap((g) => g.items);
  const activeDropdownItem = allDropdownItems.find((i) => i.id === activeCategory);

  return (
    <header className="bg-[#121213]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-[1480px] mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-2.5 sm:gap-6">
        


        {/* Left Section: Brand Logo + Navigation Links */}
        <div className={`items-center gap-3 sm:gap-7 shrink-0 ${isMobileSearchActive ? "hidden sm:flex" : "flex"}`}>
          {/* Brand Logo */}
          <Link
            href="/"
            onClick={(e) => {
              if (onHomeClick) {
                e.preventDefault();
                setSearchInput("");
                setShowDropdown(false);
                setIsMobileSearchActive(false);
                onHomeClick();
              }
            }}
            className="flex items-center gap-2 group cursor-pointer shrink-0"
          >
            <span className="text-lg sm:text-2xl font-black tracking-tight text-white group-hover:text-neutral-200 transition">
              DHAKA<span className="text-[#e50914]">FLIX</span>
            </span>
            <span className="hidden xl:inline-block text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              BDIX 1Gbps
            </span>
          </Link>

          {/* Netflix-Style Top Navigation */}
          <nav className="hidden md:flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium">
            {/* 1. Home */}
            <button
              onClick={() => handleCategoryClick("home")}
              className={`px-2.5 py-1.5 rounded-lg transition-all ${
                activeCategory === "home"
                  ? "text-white font-bold bg-white/10 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Home
            </button>

            {/* 2. 1080p Movies */}
            <button
              onClick={() => handleCategoryClick("movies1080p")}
              className={`hidden md:inline-flex px-2.5 py-1.5 rounded-lg transition-all ${
                activeCategory === "movies1080p"
                  ? "text-white font-bold bg-white/10 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Movies
            </button>

            {/* 3. TV & Web Series */}
            <button
              onClick={() => handleCategoryClick("tvSeries")}
              className={`hidden md:inline-flex px-2.5 py-1.5 rounded-lg transition-all ${
                activeCategory === "tvSeries"
                  ? "text-white font-bold bg-white/10 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-white/5"
              }`}
            >
              TV Shows
            </button>

            {/* 4. Categories Dropdown Menu Button */}
            <div className="relative" ref={categoriesMenuRef}>
              <button
                type="button"
                onClick={() => setShowCategoriesMenu((prev) => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                  showCategoriesMenu || activeDropdownItem
                    ? "bg-[#e50914] text-white font-semibold shadow-md shadow-red-950/40"
                    : "bg-white/5 text-neutral-300 hover:text-white hover:bg-white/10 border border-white/5"
                }`}
              >
                <span>{activeDropdownItem ? activeDropdownItem.label : "Categories"}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    showCategoriesMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Mega Categories Popover Menu */}
              {showCategoriesMenu && (
                <div className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:top-11 sm:left-0 w-auto sm:w-[680px] md:w-[740px] bg-[#141416]/98 border border-white/10 rounded-2xl shadow-2xl p-4 sm:p-6 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
                    {CATEGORY_GROUPS.map((group) => (
                      <div key={group.name} className="space-y-2.5">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#e50914] border-b border-white/5 pb-1">
                          {group.name}
                        </h4>
                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const ItemIcon = item.icon;
                            const isSelected = activeCategory === item.id;
                            return (
                              <button
                                key={item.id}
                                onClick={() => handleCategoryClick(item.id)}
                                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all text-xs group ${
                                  isSelected
                                    ? "bg-[#e50914] text-white font-semibold shadow"
                                    : "text-neutral-300 hover:text-white hover:bg-white/10"
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <ItemIcon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-white" : "text-neutral-400 group-hover:text-red-400"}`} />
                                  <span className="truncate">{item.label}</span>
                                </div>
                                <span className={`text-[10px] shrink-0 font-mono pl-1.5 ${isSelected ? "text-white/80" : "text-neutral-500"}`}>
                                  {item.server.replace("Server ", "S")}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Footer in Dropdown */}
                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      All Storage Nodes Online (BDIX)
                    </span>
                    <button
                      onClick={() => handleCategoryClick("home")}
                      className="text-[#e50914] hover:underline font-semibold"
                    >
                      Browse Home Showcase →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </nav>
        </div>

        {/* Right Section: Polished Search Bar */}
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 justify-end relative">

          {/* Mobile: compact icon-only button */}
          {!isMobileSearchActive && (
            <button
              type="button"
              onClick={() => {
                setIsMobileSearchActive(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="sm:hidden flex items-center justify-center w-9 h-9 rounded-full bg-white/8 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/12 hover:border-white/20 transition-all active:scale-95"
              aria-label="Open search"
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Mobile expanded overlay search */}
          {isMobileSearchActive && (
            <div className="sm:hidden fixed inset-0 z-50 bg-[#0e0e0f]/95 backdrop-blur-lg flex flex-col">
              {/* Top bar */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileSearchActive(false);
                    setShowDropdown(false);
                    setSearchInput("");
                    onSearch("");
                    inputRef.current?.blur();
                  }}
                  className="p-2 rounded-full bg-white/8 text-neutral-300 hover:text-white transition active:scale-95 shrink-0"
                  aria-label="Close search"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                    placeholder="Search movies & series..."
                    autoFocus
                    className="w-full bg-white/8 border border-white/15 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914]/60 text-sm text-white placeholder-neutral-500 rounded-full pl-10 pr-10 h-9 outline-none transition shadow-inner"
                  />
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  {loadingSuggestions && (
                    <Loader2 className="w-4 h-4 animate-spin text-[#e50914] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  )}
                  {searchInput && !loadingSuggestions && (
                    <button
                      type="button"
                      onClick={() => { setSearchInput(""); setSuggestions([]); setShowDropdown(false); onSearch(""); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition"
                    >
                      <span className="text-sm leading-none">✕</span>
                    </button>
                  )}
                </form>
              </div>

              {/* Mobile suggestions list */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {showDropdown && suggestions.length > 0 && (
                  <div className="p-3 space-y-1">
                    {suggestions.map((m) => (
                      <SearchSuggestionRow
                        key={m.id}
                        movie={m}
                        onSelect={(movie) => { setIsMobileSearchActive(false); handleSelectSuggestion(movie); }}
                        onPlayVlc={onPlayVlc}
                        onSelectMovie={onSelectMovie}
                      />
                    ))}
                    <button
                      onClick={() => { handleSearchSubmit(); setIsMobileSearchActive(false); }}
                      className="w-full mt-2 py-2.5 px-4 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                    >
                      View all results for &ldquo;{searchInput}&rdquo;
                    </button>
                  </div>
                )}
                {showDropdown && suggestions.length === 0 && searchInput.length >= 2 && !loadingSuggestions && (
                  <div className="p-8 text-center text-sm text-neutral-500">No titles found for &ldquo;{searchInput}&rdquo;</div>
                )}
              </div>
            </div>
          )}

          {/* Desktop: sleek pill-shaped search input */}
          <div className="hidden sm:flex items-center gap-3 flex-1 min-w-0 max-w-xs lg:max-w-sm xl:max-w-md justify-end relative">
            <form onSubmit={handleSearchSubmit} className="relative w-full group">
              <input
                ref={inputRef}
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setShowDropdown(true); }}
                placeholder="Search movies, series…"
                className="w-full bg-white/[0.06] hover:bg-white/[0.09] focus:bg-[#1a1a1e] border border-white/10 hover:border-white/20 focus:border-[#e50914]/70 focus:ring-2 focus:ring-[#e50914]/20 text-sm text-white placeholder-neutral-500 rounded-full pl-10 pr-10 h-9 outline-none transition-all duration-200 shadow-inner"
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 group-focus-within:text-[#e50914]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {loadingSuggestions && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#e50914]" />}
                {searchInput && !loadingSuggestions && (
                  <button
                    type="button"
                    onClick={() => { setSearchInput(""); setSuggestions([]); setShowDropdown(false); onSearch(""); inputRef.current?.focus(); }}
                    className="text-neutral-400 hover:text-white p-0.5 rounded-full hover:bg-white/10 transition"
                    title="Clear"
                  >
                    <span className="text-xs leading-none">✕</span>
                  </button>
                )}
              </div>
            </form>

            {/* Desktop Suggestions Dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-11 left-0 right-0 w-full bg-[#161618]/98 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 max-h-[70vh] overflow-y-auto backdrop-blur-xl"
              >
                {suggestions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-neutral-400">
                    {loadingSuggestions ? "Searching across all servers…" : "No matching titles found"}
                  </div>
                ) : (
                  <>
                    <div className="p-2 space-y-1">
                      {suggestions.map((m) => (
                        <SearchSuggestionRow
                          key={m.id}
                          movie={m}
                          onSelect={handleSelectSuggestion}
                          onPlayVlc={onPlayVlc}
                          onSelectMovie={onSelectMovie}
                        />
                      ))}
                    </div>
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full py-2.5 px-4 bg-[#19191c] hover:bg-white/5 text-center text-xs font-semibold text-neutral-300 hover:text-white flex items-center justify-center gap-1.5 transition"
                    >
                      <span>View all results for &ldquo;{searchInput}&rdquo;</span>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Cluster Online Indicator */}
          <div className="hidden lg:flex items-center gap-2 shrink-0 text-xs text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-neutral-300">Cluster Online</span>
          </div>
        </div>

      </div>
    </header>
  );
}

function SearchSuggestionRow({
  movie,
  onSelect,
  onPlayVlc,
  onSelectMovie,
}: {
  movie: CatalogMovie;
  onSelect: (movie: CatalogMovie) => void;
  onPlayVlc?: (streamUrl: string, title: string) => void;
  onSelectMovie?: (movie: CatalogMovie) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const streamUrl = movie.videoUrl || movie.serverUrl;

  return (
    <div
      onClick={() => onSelect(movie)}
      className="flex items-center justify-between p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition gap-3"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-13 rounded-lg overflow-hidden bg-neutral-800 shrink-0 border border-white/5 relative">
          {movie.poster && !imgError ? (
            <img
              src={movie.poster}
              alt={movie.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <MoviePosterPlaceholder
              title={movie.title}
              year={movie.year}
              quality={movie.quality}
              size="card"
            />
          )}
        </div>

        <div className="min-w-0">
          <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#e50914] transition">
            {movie.title}
          </h4>
          <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
            <span>{movie.year}</span>
            <span>•</span>
            <span className="text-[#e50914] font-semibold">{movie.quality}</span>
            <span>•</span>
            <span>{movie.sourceServer}</span>
            {movie.rating ? (
              <>
                <span>•</span>
                <span className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3 h-3 fill-amber-400" />
                  {movie.rating.toFixed(1)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onPlayVlc && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPlayVlc(streamUrl, movie.title);
            }}
            className="p-2 rounded-lg bg-[#e50914]/20 hover:bg-[#e50914] text-[#e50914] hover:text-white transition"
            title="Play in VLC"
          >
            <VlcIcon className="w-3.5 h-3.5 fill-current" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onSelectMovie) onSelectMovie(movie);
          }}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition"
          title="Streams"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
