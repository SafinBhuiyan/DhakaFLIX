"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, Play, Loader2, Star, ExternalLink } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";

interface SiteHeaderProps {
  onSearch: (query: string) => void;
  onSelectMovie?: (movie: CatalogMovie) => void;
  onPlayVlc?: (streamUrl: string, title: string) => void;
}

export function SiteHeader({ onSearch, onSelectMovie, onPlayVlc }: SiteHeaderProps) {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<CatalogMovie[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced live search suggestions
  useEffect(() => {
    const q = searchInput.trim();
    if (q.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&limit=6`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowDropdown(true);
      } catch (err) {
        console.error("Live search failed:", err);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Global keyboard shortcut '/' to focus search & Escape to dismiss
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside to dismiss dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowDropdown(false);
    onSearch(searchInput.trim());
  };

  const handleSelectSuggestion = (movie: CatalogMovie) => {
    setShowDropdown(false);
    if (onSelectMovie) {
      onSelectMovie(movie);
    } else {
      onSearch(movie.title);
    }
  };

  return (
    <header className="bg-[#121213]/95 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-[1480px] mx-auto px-3 sm:px-8 h-14 sm:h-16 flex items-center justify-between gap-3 sm:gap-6">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer">
            <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-neutral-200 transition">
              DHAKA<span className="text-[#e50914]">FLIX</span>
            </span>
            <span className="hidden md:inline-block text-[10px] bg-red-600/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded font-mono font-bold tracking-wider">
              BDIX 1Gbps
            </span>
          </Link>
        </div>

        {/* Center / Right Search Bar with Live Suggestions Dropdown */}
        <div className="flex items-center gap-4 flex-1 max-w-lg justify-end relative">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input
              ref={inputRef}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowDropdown(true);
              }}
              placeholder="Search movies & series..."
              className="w-full bg-[#18181b] border border-white/10 focus:border-[#e50914] focus:ring-1 focus:ring-[#e50914] text-[16px] sm:text-sm text-white placeholder-neutral-500 rounded-xl pl-8 sm:pl-9 pr-12 sm:pr-14 py-1.5 sm:py-2.5 transition outline-none shadow-inner"
            />
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-500 absolute left-2.5 sm:left-3 top-2.5 sm:top-3.5 pointer-events-none" />

            <div className="absolute right-2.5 sm:right-3 top-2 sm:top-2.5 flex items-center gap-1.5">
              {loadingSuggestions && (
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin text-[#e50914]" />
              )}
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    setSuggestions([]);
                    setShowDropdown(false);
                    onSearch("");
                  }}
                  className="text-neutral-400 hover:text-white text-xs p-1 transition min-w-[24px] min-h-[24px] flex items-center justify-center rounded-full hover:bg-white/10"
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </form>

          {/* Floating Live Suggestions Dropdown Panel */}
          {showDropdown && (
            <div
              ref={dropdownRef}
              className="fixed inset-x-3 top-16 sm:absolute sm:inset-auto sm:top-12 sm:left-0 sm:right-0 sm:w-full bg-[#161618] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-white/5 animate-fade-in max-h-[75vh] overflow-y-auto custom-scrollbar"
            >
              {suggestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-400">
                  {loadingSuggestions ? "Searching across all servers..." : "No matching titles found on DhakaFlix"}
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

          {/* Cluster Online Indicator */}
          <div className="hidden md:flex items-center gap-2 shrink-0 text-xs text-neutral-400 pl-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-semibold text-neutral-300">Cluster Online</span>
          </div>
        </div>

      </div>
    </header>
  );
}

interface SearchSuggestionRowProps {
  movie: CatalogMovie;
  onSelect: (m: CatalogMovie) => void;
  onPlayVlc?: (streamUrl: string, title: string) => void;
  onSelectMovie?: (m: CatalogMovie) => void;
}

function SearchSuggestionRow({
  movie,
  onSelect,
  onPlayVlc,
  onSelectMovie,
}: SearchSuggestionRowProps) {
  const [imgError, setImgError] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  return (
    <div
      onClick={() => onSelect(movie)}
      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer group transition"
    >
      {!movie.poster || imgError ? (
        <MoviePosterPlaceholder
          title={movie.title}
          year={movie.year}
          quality={movie.quality}
          category={movie.category}
          size="thumb"
        />
      ) : (
        <img
          src={movie.poster}
          alt={movie.title}
          className="w-10 h-14 object-cover rounded-lg bg-black shrink-0 border border-white/10"
          onError={(e) => {
            const img = e.currentTarget;
            const fallback = `${movie.serverUrl}a_AL_.jpg`;
            if (!fallbackAttempted && img.src !== fallback) {
              setFallbackAttempted(true);
              img.src = fallback;
            } else {
              setImgError(true);
            }
          }}
        />
      )}

      <div className="min-w-0 flex-1 space-y-0.5">
        <h4 className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-[#e50914] transition">
          {movie.title}
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-neutral-400 flex-wrap">
          <span>{movie.year}</span>
          <span className="bg-red-950/60 text-red-400 text-[10px] font-bold px-1.5 py-0.2 rounded border border-red-500/30">
            {movie.quality}
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-[10px] text-neutral-400">{movie.category}</span>
          {movie.rating ? (
            <span className="flex items-center gap-0.5 text-amber-400 font-semibold ml-auto text-[11px]">
              <Star className="w-3 h-3 fill-amber-400" />
              {movie.rating.toFixed(1)}
            </span>
          ) : null}
        </div>
      </div>

      {/* Direct Play VLC Action in Dropdown */}
      {onPlayVlc && (
        <button
          onClick={async (e) => {
            e.stopPropagation();
            try {
              const res = await fetch(`/api/media/streams?title=${encodeURIComponent(movie.title)}&year=${movie.year}`);
              const data = await res.json();
              if (data.streams && data.streams.length > 0) {
                onPlayVlc(data.streams[0].streamUrl, movie.title);
              } else if (onSelectMovie) {
                onSelectMovie(movie);
              }
            } catch {
              if (onSelectMovie) onSelectMovie(movie);
            }
          }}
          className="p-2 rounded-lg bg-[#e50914] hover:bg-red-700 text-white shrink-0 shadow transition active:scale-95"
          title="Play in VLC"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
        </button>
      )}
    </div>
  );
}
