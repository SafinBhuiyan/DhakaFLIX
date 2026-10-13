"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopProps {
  /** Distance in pixels scrolled before button appears */
  threshold?: number;
  className?: string;
}

export function BackToTop({ threshold = 400, className = "" }: BackToTopProps) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const calculateScroll = useCallback(() => {
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    
    // Toggle visibility based on threshold
    setVisible(scrollY > threshold);

    // Calculate scroll percentage (0 to 100)
    if (docHeight > 0) {
      const currentProgress = Math.min(100, Math.max(0, (scrollY / docHeight) * 100));
      setProgress(currentProgress);
    }
  }, [threshold]);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          calculateScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    calculateScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [calculateScroll]);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // SVG Progress Ring calculations
  const size = 44;
  const strokeWidth = 2.5;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div
      className={`fixed bottom-24 right-4 md:bottom-8 md:right-8 z-40 transition-all duration-300 ease-out ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      } ${className}`}
    >
      <button
        onClick={scrollToTop}
        aria-label="Scroll back to top"
        title={`Scroll to top (${Math.round(progress)}%)`}
        className="group relative flex items-center justify-center w-11 h-11 rounded-full bg-[#161619]/90 hover:bg-[#202024] text-neutral-300 hover:text-white border border-white/10 hover:border-[#e50914]/60 shadow-xl backdrop-blur-md transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e50914]"
      >
        {/* Circular Progress SVG Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none select-none"
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />
          {/* Animated active progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#e50914"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-150 ease-out"
          />
        </svg>

        {/* Up Arrow Icon with tactile hover micro-interaction */}
        <ArrowUp className="w-4 h-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-white" />

        {/* Subtle tooltip indicator on desktop hover */}
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded bg-black/90 text-[10px] font-medium text-neutral-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none border border-white/10 shadow-lg hidden sm:block">
          Top
        </span>
      </button>
    </div>
  );
}
