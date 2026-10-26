"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { Info, ChevronLeft, ChevronRight, Star, Bookmark, Check } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";
import { toggleWatchlist, isInWatchlist } from "@/lib/user-store";

interface HeroSliderProps {
  movie?: CatalogMovie | null;
  movies?: CatalogMovie[];
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

function SlideWatchlistButton({ movie }: { movie: CatalogMovie }) {
  const [isSaved, setIsSaved] = useState(() => isInWatchlist(movie.id));

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const saved = toggleWatchlist(movie);
    setIsSaved(saved);
  };

  return (
    <button
      onClick={handleToggle}
      className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition active:scale-95 min-h-[42px] backdrop-blur-sm cursor-pointer ${
        isSaved
          ? "bg-red-600/20 text-[#e50914] border-red-500/40"
          : "bg-white/10 hover:bg-white/15 text-white border-white/10"
      }`}
      title={isSaved ? "Saved in Watchlist" : "Add to Watchlist"}
      aria-label={isSaved ? "Saved in Watchlist" : "Add to Watchlist"}
    >
      {isSaved ? (
        <>
          <Check className="w-4 h-4 text-[#e50914]" />
          <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Saved</span>
        </>
      ) : (
        <>
          <Bookmark className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-semibold hidden sm:inline">Watchlist</span>
        </>
      )}
    </button>
  );
}

function SlideItem({
  movie,
  style,
  isIncoming = false,
  onPlayVlc,
  onSelectMovie,
}: {
  movie: CatalogMovie;
  style?: React.CSSProperties;
  isIncoming?: boolean;
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}) {
  const bgImage = movie.backdrop || movie.poster;

  return (
    <div
      style={style}
      className="absolute inset-0 w-full h-full flex items-end overflow-hidden will-change-transform"
    >
      {/* Background Image */}
      {bgImage ? (
        <img
          src={bgImage}
          alt={movie.title}
          draggable={false}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.55] select-none"
        />
      ) : (
        <MoviePosterPlaceholder title={movie.title} year={movie.year} size="banner" />
      )}

      {/* Multi-Stop Cinematic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/80 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0f] via-[#0e0e0f]/60 to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 p-5 sm:p-8 md:p-10 max-w-2xl space-y-3 sm:space-y-3.5">
        {/* Badges Row */}
        <div
          className="flex items-center gap-2 flex-wrap"
          style={isIncoming ? { animation: "heroTextSlideIn 500ms cubic-bezier(0.16, 1, 0.3, 1) 40ms both" } : undefined}
        >
          <span className="bg-[#e50914] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded shadow tracking-wider uppercase">
            FEATURED
          </span>
          <span className="bg-black/70 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded border border-white/10">
            {movie.quality}
          </span>
          <span className="text-xs text-neutral-300 font-medium">
            {movie.year}
          </span>
          {movie.rating ? (
            <span className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
              <Star className="w-3 h-3 fill-amber-400" />
              {movie.rating.toFixed(1)} IMDb
            </span>
          ) : null}
        </div>

        {/* Title */}
        <h1
          className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg line-clamp-2"
          style={isIncoming ? { animation: "heroTextSlideIn 600ms cubic-bezier(0.16, 1, 0.3, 1) 90ms both" } : undefined}
        >
          {movie.title}
        </h1>

        {/* Overview */}
        {movie.overview && (
          <p
            className="text-xs sm:text-sm text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl"
            style={isIncoming ? { animation: "heroTextSlideIn 700ms cubic-bezier(0.16, 1, 0.3, 1) 140ms both" } : undefined}
          >
            {movie.overview}
          </p>
        )}

        {/* Action Buttons */}
        <div
          className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3.5 pt-1.5"
          style={isIncoming ? { animation: "heroTextSlideIn 750ms cubic-bezier(0.16, 1, 0.3, 1) 190ms both" } : undefined}
        >
          {/* 1-Click Play in VLC */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (movie.videoUrl) {
                onPlayVlc(movie.videoUrl, movie.title);
              } else if (movie.serverUrl && !movie.serverUrl.endsWith("/")) {
                onPlayVlc(movie.serverUrl, movie.title);
              } else {
                onSelectMovie(movie);
              }
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#e50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/50 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[42px] cursor-pointer"
          >
            <VlcIcon className="w-4 h-4 fill-white" />
            <span>Play in VLC</span>
          </button>

          {/* Stream Selector / Details */}
          <Link
            href={`/movie/${encodeURIComponent(movie.id)}`}
            onClick={() => onSelectMovie?.(movie)}
            className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/10 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[42px] backdrop-blur-sm cursor-pointer"
            title="Stream Details"
            aria-label="Stream Details"
          >
            <Info className="w-4 h-4 text-neutral-300" />
            <span className="hidden sm:inline">Stream Details</span>
          </Link>

          {/* Quick Watchlist Bookmark Button */}
          <SlideWatchlistButton movie={movie} />
        </div>
      </div>
    </div>
  );
}

export function HeroSlider({ movie, movies, onPlayVlc, onSelectMovie }: HeroSliderProps) {
  const slideList: CatalogMovie[] = movies && movies.length > 0 ? movies : movie ? [movie] : [];
  const count = slideList.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback(
    (newIndex: number, dir: "next" | "prev") => {
      if (count <= 1 || isAnimating || newIndex === currentIndex) return;

      setPrevIndex(currentIndex);
      setCurrentIndex(newIndex);
      setDirection(dir);
      setIsAnimating(true);

      if (animationTimeoutRef.current) clearTimeout(animationTimeoutRef.current);
      animationTimeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        setPrevIndex(null);
      }, 550);
    },
    [count, isAnimating, currentIndex]
  );

  const goToNext = useCallback(() => {
    if (count <= 1) return;
    const nextIdx = (currentIndex + 1) % count;
    goToSlide(nextIdx, "next");
  }, [count, currentIndex, goToSlide]);

  const goToPrev = useCallback(() => {
    if (count <= 1) return;
    const prevIdx = (currentIndex - 1 + count) % count;
    goToSlide(prevIdx, "prev");
  }, [count, currentIndex, goToSlide]);

  // Auto-advance slides every 7 seconds when not interacting
  useEffect(() => {
    if (count <= 1 || isHovered) return;

    timerRef.current = setInterval(() => {
      goToNext();
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isHovered, goToNext]);

  // Mobile Touch Gestures
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    setIsHovered(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsHovered(false);
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const diffX = e.changedTouches[0].clientX - touchStartXRef.current;
    const diffY = e.changedTouches[0].clientY - touchStartYRef.current;

    // Minimum swipe threshold 35px, horizontal dominant
    if (Math.abs(diffX) >= 35 && Math.abs(diffX) > Math.abs(diffY)) {
      if (diffX < 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartXRef.current = null;
    touchStartYRef.current = null;
  };

  const handleTouchCancel = () => {
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    setIsHovered(false);
  };

  if (count === 0) return null;

  const currentMovie = slideList[currentIndex];
  const prevMovie = prevIndex !== null ? slideList[prevIndex] : null;

  return (
    <div
      className="group relative w-full rounded-2xl overflow-hidden bg-[#18181b] border border-white/10 shadow-2xl min-h-[420px] sm:min-h-[440px] md:min-h-[480px] select-none touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      <style>{`
        @keyframes heroSlideInRight {
          0% { transform: translate3d(100%, 0, 0); opacity: 0.6; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes heroSlideOutLeft {
          0% { transform: translate3d(0, 0, 0); opacity: 1; }
          100% { transform: translate3d(-100%, 0, 0); opacity: 0.3; }
        }
        @keyframes heroSlideInLeft {
          0% { transform: translate3d(-100%, 0, 0); opacity: 0.6; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }
        @keyframes heroSlideOutRight {
          0% { transform: translate3d(0, 0, 0); opacity: 1; }
          100% { transform: translate3d(100%, 0, 0); opacity: 0.3; }
        }
        @keyframes heroTextSlideIn {
          0% { transform: translate3d(35px, 0, 0); opacity: 0; }
          100% { transform: translate3d(0, 0, 0); opacity: 1; }
        }
      `}</style>

      {/* Outgoing Slide (visible only during animation) */}
      {isAnimating && prevMovie && (
        <SlideItem
          key={`hero-prev-${prevMovie.id}-${prevIndex}`}
          movie={prevMovie}
          style={{
            animation:
              direction === "next"
                ? "heroSlideOutLeft 550ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
                : "heroSlideOutRight 550ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
          onPlayVlc={onPlayVlc}
          onSelectMovie={onSelectMovie}
        />
      )}

      {/* Active / Incoming Slide */}
      {currentMovie && (
        <SlideItem
          key={`hero-curr-${currentMovie.id}-${currentIndex}`}
          movie={currentMovie}
          isIncoming={isAnimating}
          style={
            isAnimating
              ? {
                  animation:
                    direction === "next"
                      ? "heroSlideInRight 550ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
                      : "heroSlideInLeft 550ms cubic-bezier(0.22, 1, 0.36, 1) forwards",
                }
              : undefined
          }
          onPlayVlc={onPlayVlc}
          onSelectMovie={onSelectMovie}
        />
      )}

      {/* Slide Navigation Arrows (Desktop & Tablet) */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrev();
            }}
            aria-label="Previous featured title"
            className="hidden sm:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="Next featured title"
            className="hidden sm:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Minimal Sleek Dots (NO NUMBERS ANYWHERE) */}
      {count > 1 && (
        <div className="absolute bottom-4 sm:bottom-6 right-5 sm:right-8 z-20 flex items-center gap-1.5 bg-black/50 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
          {slideList.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              onClick={(e) => {
                e.stopPropagation();
                if (idx === currentIndex) return;
                goToSlide(idx, idx > currentIndex ? "next" : "prev");
              }}
              aria-label={`Jump to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                idx === currentIndex
                  ? "w-5 bg-[#e50914] shadow-sm shadow-red-500/50"
                  : "w-1.5 bg-white/35 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
