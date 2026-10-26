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

export function HeroSlider({ movie, movies, onPlayVlc, onSelectMovie }: HeroSliderProps) {
  const slideList: CatalogMovie[] = movies && movies.length > 0 ? movies : movie ? [movie] : [];
  const count = slideList.length;

  // Infinite virtual looping: Clone last slide at head, first slide at tail
  const extendedSlides =
    count > 1 ? [slideList[count - 1], ...slideList, slideList[0]] : slideList;

  // Index 1 corresponds to slideList[0] when count > 1
  const [slideIndex, setSlideIndex] = useState(count > 1 ? 1 : 0);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Real 0-based index for dots & indicators
  const activeRealIndex =
    count > 1
      ? slideIndex === 0
        ? count - 1
        : slideIndex === count + 1
        ? 0
        : slideIndex - 1
      : 0;

  // Touch Swipe Gesture State
  const [touchDeltaX, setTouchDeltaX] = useState(0);
  const touchStartXRef = useRef<number | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const isHorizontalSwipeRef = useRef<boolean | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleNext = useCallback(() => {
    if (count <= 1) return;
    setIsTransitioning(true);
    setSlideIndex((prev) => prev + 1);
  }, [count]);

  const handlePrev = useCallback(() => {
    if (count <= 1) return;
    setIsTransitioning(true);
    setSlideIndex((prev) => prev - 1);
  }, [count]);

  // Handle seamless teleport on reaching clone boundaries
  const handleTransitionEnd = () => {
    if (count <= 1) return;
    if (slideIndex === count + 1) {
      // Slid past last slide -> silently reset to real first slide
      setIsTransitioning(false);
      setSlideIndex(1);
    } else if (slideIndex === 0) {
      // Slid before first slide -> silently reset to real last slide
      setIsTransitioning(false);
      setSlideIndex(count);
    }
  };

  // Re-enable CSS transitions after teleport
  useEffect(() => {
    if (!isTransitioning) {
      const raf = requestAnimationFrame(() => {
        setIsTransitioning(true);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [isTransitioning]);

  // Auto-advance slides every 7 seconds when not interacting
  useEffect(() => {
    if (count <= 1 || isHovered) return;

    timerRef.current = setInterval(() => {
      handleNext();
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, isHovered, handleNext]);

  // Mobile Touch Gestures (preserves natural vertical scrolling)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartYRef.current = e.touches[0].clientY;
    isHorizontalSwipeRef.current = null;
    setIsHovered(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null || touchStartYRef.current === null) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const diffX = currentX - touchStartXRef.current;
    const diffY = currentY - touchStartYRef.current;

    // Detect direction intent once after 8px of movement
    if (isHorizontalSwipeRef.current === null) {
      if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
        isHorizontalSwipeRef.current = Math.abs(diffX) >= Math.abs(diffY);
      }
    }

    // Only drag slide horizontally if horizontal swipe detected
    if (isHorizontalSwipeRef.current === true) {
      setTouchDeltaX(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsHovered(false);
    if (isHorizontalSwipeRef.current === true) {
      const threshold = 45; // 45px swipe threshold
      if (touchDeltaX < -threshold) {
        handleNext();
      } else if (touchDeltaX > threshold) {
        handlePrev();
      }
    }
    setTouchDeltaX(0);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalSwipeRef.current = null;
  };

  const handleTouchCancel = () => {
    setTouchDeltaX(0);
    touchStartXRef.current = null;
    touchStartYRef.current = null;
    isHorizontalSwipeRef.current = null;
    setIsHovered(false);
  };

  if (count === 0) return null;

  const isTouching = touchDeltaX !== 0;

  const trackStyle: React.CSSProperties = {
    transform: isTouching
      ? `translate3d(calc(-${slideIndex * 100}% + ${touchDeltaX}px), 0, 0)`
      : `translate3d(-${slideIndex * 100}%, 0, 0)`,
    transition: isTouching
      ? "none"
      : isTransitioning
      ? "transform 550ms cubic-bezier(0.22, 1, 0.36, 1)"
      : "none",
  };

  return (
    <div
      className="group relative w-full rounded-2xl overflow-hidden bg-[#18181b] border border-white/10 shadow-2xl min-h-[420px] sm:min-h-[440px] md:min-h-[480px] select-none touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Sliding Track */}
      <div
        className="flex w-full h-full will-change-transform"
        style={trackStyle}
        onTransitionEnd={handleTransitionEnd}
      >
        {extendedSlides.map((currentMovie, idx) => {
          const bgImage = currentMovie.backdrop || currentMovie.poster;
          const isActive = idx === slideIndex;

          return (
            <div
              key={`hero-slide-${currentMovie.id}-${idx}`}
              className="w-full shrink-0 min-w-full relative flex items-end min-h-[420px] sm:min-h-[440px] md:min-h-[480px] overflow-hidden"
            >
              {/* Background Backdrop Image */}
              {bgImage ? (
                <img
                  src={bgImage}
                  alt={currentMovie.title}
                  draggable={false}
                  className={`absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.55] transition-transform duration-1000 ease-out ${
                    isActive ? "scale-100" : "scale-105"
                  }`}
                  loading={idx <= 2 ? "eager" : "lazy"}
                />
              ) : (
                <MoviePosterPlaceholder
                  title={currentMovie.title}
                  year={currentMovie.year}
                  size="banner"
                />
              )}

              {/* Multi-Stop Cinematic Gradients */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/80 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0f] via-[#0e0e0f]/60 to-transparent pointer-events-none" />

              {/* Content Container */}
              <div className="relative z-10 p-5 sm:p-8 md:p-10 max-w-2xl space-y-3 sm:space-y-3.5">
                {/* Badges Row */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-[#e50914] text-white text-[10px] sm:text-[11px] font-black px-2.5 py-0.5 rounded shadow tracking-wider uppercase">
                    FEATURED
                  </span>
                  <span className="bg-black/70 text-white text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded border border-white/10">
                    {currentMovie.quality}
                  </span>
                  <span className="text-xs text-neutral-300 font-medium">
                    {currentMovie.year}
                  </span>
                  {currentMovie.rating ? (
                    <span className="flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                      <Star className="w-3 h-3 fill-amber-400" />
                      {currentMovie.rating.toFixed(1)} IMDb
                    </span>
                  ) : null}
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-lg line-clamp-2">
                  {currentMovie.title}
                </h1>

                {/* Overview */}
                {currentMovie.overview && (
                  <p className="text-xs sm:text-sm text-neutral-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow max-w-xl">
                    {currentMovie.overview}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 sm:gap-3.5 pt-1.5">
                  {/* 1-Click Play in VLC */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (currentMovie.videoUrl) {
                        onPlayVlc(currentMovie.videoUrl, currentMovie.title);
                      } else if (currentMovie.serverUrl && !currentMovie.serverUrl.endsWith("/")) {
                        onPlayVlc(currentMovie.serverUrl, currentMovie.title);
                      } else {
                        onSelectMovie(currentMovie);
                      }
                    }}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#e50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/50 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[42px] cursor-pointer"
                  >
                    <VlcIcon className="w-4 h-4 fill-white" />
                    <span>Play in VLC</span>
                  </button>

                  {/* Stream Selector / Details */}
                  <Link
                    href={`/movie/${encodeURIComponent(currentMovie.id)}`}
                    onClick={() => onSelectMovie?.(currentMovie)}
                    className="flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/10 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[42px] backdrop-blur-sm cursor-pointer"
                    title="Stream Details"
                    aria-label="Stream Details"
                  >
                    <Info className="w-4 h-4 text-neutral-300" />
                    <span className="hidden sm:inline">Stream Details</span>
                  </Link>

                  {/* Quick Watchlist Bookmark Button */}
                  <SlideWatchlistButton movie={currentMovie} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Slide Navigation Arrows (Desktop & Tablet) */}
      {count > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            aria-label="Previous featured title"
            className="hidden sm:flex items-center justify-center absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            aria-label="Next featured title"
            className="hidden sm:flex items-center justify-center absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Indicators & Visual Cues */}
      {count > 1 && (
        <>
          {/* Mobile Top-Right Slide Badge (e.g. 1 / 6) */}
          <div className="sm:hidden absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[10px] font-semibold text-neutral-300">
            <span className="text-white font-bold">{activeRealIndex + 1}</span>
            <span className="text-neutral-500">/</span>
            <span>{count}</span>
          </div>

          {/* Desktop Bottom-Right Interactive Dots */}
          <div className="hidden sm:flex absolute bottom-6 right-8 z-20 items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
            {slideList.map((_, idx) => (
              <button
                key={`dot-${idx}`}
                onClick={() => {
                  setIsTransitioning(true);
                  setSlideIndex(idx + 1);
                }}
                aria-label={`Jump to slide ${idx + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === activeRealIndex
                    ? "w-6 bg-[#e50914]"
                    : "w-1.5 bg-white/40 hover:bg-white/70"
                }`}
              />
            ))}
          </div>

          {/* Bottom Sleek Animated Progress Strip */}
          <div className="absolute bottom-0 left-0 right-0 z-20 flex h-1 bg-white/10">
            {slideList.map((_, idx) => (
              <div
                key={`progress-seg-${idx}`}
                className="flex-1 h-full relative overflow-hidden mx-0.5 first:ml-0 last:mr-0"
              >
                <div
                  className={`h-full transition-all duration-500 ${
                    idx === activeRealIndex
                      ? "bg-[#e50914] w-full"
                      : "bg-transparent w-0"
                  }`}
                />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
