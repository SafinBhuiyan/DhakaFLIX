"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Play, Loader2, Film, Tv, Sparkles, ExternalLink } from "lucide-react";
import { TMDBMedia, getPosterUrl, getMediaTitle, getMediaYear } from "@/lib/tmdb";

interface DhakaHeroSearchProps {
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMedia: (item: TMDBMedia) => void;
}

export function DhakaHeroSearch({ onPlayVlc, onSelectMedia }: DhakaHeroSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => {
          setResults(data.results || []);
          setIsOpen(true);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full max-w-3xl mx-auto z-30">
      {/* Search Input Box */}
      <div className="relative flex items-center bg-[#141022] hover:bg-[#181329] focus-within:bg-[#181329] rounded-2xl border border-white/10 focus-within:border-purple-500/50 shadow-xl transition-all">
        <div className="pl-4 pr-2 text-purple-400">
          <Search className="w-5 h-5" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search movies & series on DhakaFlix (e.g. Jack Ryan, Spider-Man, Pushpa, Batman)..."
          className="w-full bg-transparent py-4 text-sm sm:text-base text-white placeholder-muted-foreground outline-none pr-4"
        />

        {query && (
          <button
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="p-2 mr-2 text-muted-foreground hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Live Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl bg-[#120d20] border border-white/10 shadow-2xl overflow-hidden max-h-[460px] overflow-y-auto custom-scrollbar animate-fade-in">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Searching TMDb and DhakaFlix BDIX cluster...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No matching titles found. Try checking the spelling.
            </div>
          ) : (
            <div className="p-2 space-y-1">
              <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Search Results ({results.length})
              </div>

              {results.slice(0, 8).map((item) => {
                const title = getMediaTitle(item);
                const year = getMediaYear(item);
                const poster = getPosterUrl(item.poster_path, "w342");

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      onSelectMedia(item);
                      setIsOpen(false);
                    }}
                    className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.07] border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={poster}
                        alt={title}
                        className="w-10 h-14 object-cover rounded-lg bg-black/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-white truncate group-hover:text-purple-300 transition">
                          {title}
                        </p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                          <span>{year}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            {item.media_type === "tv" ? <Tv className="w-3 h-3 text-purple-400" /> : <Film className="w-3 h-3 text-purple-400" />}
                            {item.media_type === "tv" ? "TV Show" : "Movie"}
                          </span>
                          {item.vote_average ? (
                            <>
                              <span>•</span>
                              <span className="text-amber-400 font-semibold">★ {item.vote_average.toFixed(1)}</span>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectMedia(item);
                          setIsOpen(false);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-900/30 transition flex items-center gap-1.5"
                      >
                        <Play className="w-3 h-3 fill-current" />
                        <span>Streams</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
