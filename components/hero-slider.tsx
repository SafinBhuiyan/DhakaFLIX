"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Info, ChevronLeft, ChevronRight, Star, HardDrive } from "lucide-react";
import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";
import { MoviePosterPlaceholder } from "@/components/movie-poster-placeholder";
import { VlcIcon } from "@/components/vlc-icon";

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

  const streamUrl = currentMovie.videoUrl || currentMovie.serverUrl;

  return (
    <div
      className="group relative w-full rounded-2xl overflow-hidden bg-[#18181b] border border-white/10 shadow-2xl min-h-[420px] sm:min-h-[420px] md:min-h-[480px] flex items-end select-none transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next featured title"
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-black/50 hover:bg-black/80 text-white/80 hover:text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-200 active:scale-95 shadow-xl backdrop-blur-sm"
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
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20">
            <HardDrive className="w-3 h-3" />
            {currentMovie.sourceServer}
          </span>
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
            onClick={() => onPlayVlc(streamUrl, currentMovie.title)}
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
