"use client";

import { useState, useEffect } from "react";
import { Search, X, Play, Loader2, Film, Tv } from "lucide-react";
import { TMDBMedia, getPosterUrl, getMediaTitle, getMediaYear } from "@/lib/tmdb";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (item: TMDBMedia) => void;
  onPlayVlc: (streamUrl: string, title: string) => void;
}

export function SearchDialog({ isOpen, onClose, onSelectMedia, onPlayVlc }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TMDBMedia[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then((res) => res.json())
        .then((data) => setResults(data.results || []))
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-xl rounded-2xl bg-[#120e1f] border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search movies, TV shows on DhakaFlix (e.g. Jack Ryan, Resident Evil)..."
            className="w-full bg-transparent text-sm text-white placeholder-muted-foreground outline-none"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] bg-white/10 text-muted-foreground px-1.5 py-0.5 rounded font-mono">ESC</kbd>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Searching TMDb & DhakaFlix...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              {query ? "No movies or shows found." : "Type a movie or show name to search."}
            </div>
          ) : (
            results.map((item) => {
              const title = getMediaTitle(item);
              const year = getMediaYear(item);
              const poster = getPosterUrl(item.poster_path, "w342");

              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onSelectMedia(item);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={poster}
                      alt={title}
                      className="w-9 h-13 object-cover rounded-md bg-black/40 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-purple-300 transition">
                        {title}
                      </p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>{year}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          {item.media_type === "tv" ? <Tv className="w-3 h-3 text-purple-400" /> : <Film className="w-3 h-3 text-purple-400" />}
                          {item.media_type === "tv" ? "TV Show" : "Movie"}
                        </span>
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/20 shrink-0">
                    View Streams
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
