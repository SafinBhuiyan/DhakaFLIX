"use client";

import { useState, useEffect, useRef } from "react";
import { Info, ChevronLeft, ChevronRight, Star, Bookmark, Check } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";
import { toggleWatchlist } from "@/lib/user-store";

interface HeroSliderProps {
  movie?: CatalogMovie | null;
  movies?: CatalogMovie[];
  onPlayVlc: (streamUrl: string, title: string) => void;
  onSelectMovie: (movie: CatalogMovie) => void;
}

export function HeroSlider({ movie, movies, onPlayVlc, onSelectMovie }: HeroSliderProps) {
  const slideList: CatalogMovie[] = movies && movies.length > 0 ? movies : movie ? [movie] : [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-advance slides every 7 seconds when not hovered
  useEffect(() => {
    if (slideList.length <= 1 || isHovered) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slideList.length);
    }, 7000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slideList.length, isHovered]);

  // Reset img error on slide change
  useEffect(() => {
    setImgError(false);
  }, [currentIndex]);

  const [bookmarked, setBookmarked] = useState(false);

  // Mobile touch swipe gestures
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

    const endX = e.changedTouches[0].clientX;
    const endY = e.changedTouches[0].clientY;
    const deltaX = endX - touchStartXRef.current;
    const deltaY = endY - touchStartYRef.current;

    // Minimum swipe distance: 40px, and horizontal dominant
    const minSwipeDistance = 40;
    if (Math.abs(deltaX) >= minSwipeDistance && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        // Swipe Left -> Next Slide
        setCurrentIndex((prev) => (prev + 1) % slideList.length);
      } else {
        // Swipe Right -> Previous Slide
        setCurrentIndex((prev) => (prev === 0 ? slideList.length - 1 : prev - 1));
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

  if (slideList.length === 0) return null;

  const currentMovie = slideList[currentIndex] || slideList[0];
  const bgImage = currentMovie.backdrop || currentMovie.poster;
  const showPlaceholder = !bgImage || imgError;

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? slideList.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slideList.length);
  };

  return (
    <div
      className="group relative w-full rounded-2xl overflow-hidden bg-[#18181b] border border-white/10 shadow-2xl min-h-[420px] sm:min-h-[420px] md:min-h-[480px] flex items-end select-none transition-all touch-pan-y"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
    >
      {/* Background Backdrop Image or Placeholder */}
      {showPlaceholder ? (
        <MoviePosterPlaceholder title={currentMovie.title} year={currentMovie.year} size="banner" />
      ) : (
        <img
          key={`hero-bg-${currentMovie.id}-${currentIndex}`}
          src={bgImage}
          alt={currentMovie.title}
          className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.6] transition-opacity duration-700 ease-in-out"
          onError={() => setImgError(true)}
        />
      )}

      {/* Multi-Stop Cinematic Gradients */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0f] via-[#0e0e0f]/80 to-transparent"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-[#0e0e0f] via-[#0e0e0f]/60 to-transparent"></div>

      {/* Slide Navigation Arrows (Desktop & Tablet) */}
      {slideList.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous featured title"
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next featured title"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/60 hover:bg-black/80 text-white/90 hover:text-white border border-white/10 opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

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
            onClick={() => {
              if (currentMovie.videoUrl) {
                onPlayVlc(currentMovie.videoUrl, currentMovie.title);
              } else if (currentMovie.serverUrl && !currentMovie.serverUrl.endsWith("/")) {
                onPlayVlc(currentMovie.serverUrl, currentMovie.title);
              } else {
                onSelectMovie(currentMovie);
              }
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-[#e50914] hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-red-950/50 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white min-h-[42px]"
          >
            <VlcIcon className="w-4 h-4 fill-white" />
            <span>Play in VLC</span>
          </button>

          {/* Stream Selector / Details */}
          <button
            onClick={() => onSelectMovie(currentMovie)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs sm:text-sm border border-white/10 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 min-h-[42px] backdrop-blur-sm"
          >
            <Info className="w-4 h-4 text-neutral-300" />
            <span>Stream Details</span>
          </button>

          {/* Quick Watchlist Bookmark Button */}
          <button
            onClick={() => {
              if (currentMovie) {
                const isSaved = toggleWatchlist(currentMovie);
                setBookmarked(isSaved);
              }
            }}
            className={`flex items-center justify-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-xl border transition active:scale-95 min-h-[42px] backdrop-blur-sm ${
              bookmarked
                ? "bg-red-600/20 text-[#e50914] border-red-500/40"
                : "bg-white/10 hover:bg-white/15 text-white border-white/10"
            }`}
            title={bookmarked ? "Saved in Watchlist" : "Add to Watchlist"}
          >
            {bookmarked ? (
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
        </div>
      </div>

      {/* Slide Indicators — top-center on mobile, bottom-right on sm+ */}
      {slideList.length > 1 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:left-auto sm:top-auto sm:bottom-6 sm:right-8 z-20 flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-sm">
          {slideList.map((_, idx) => (
            <button
              key={`dot-${idx}`}
              onClick={() => setCurrentIndex(idx)}
              aria-label={`Jump to slide ${idx + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-6 bg-[#e50914]" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
