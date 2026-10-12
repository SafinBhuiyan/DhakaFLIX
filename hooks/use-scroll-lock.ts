"use client";

import { useEffect } from "react";

// Global reference counter to support nested modals and overlays gracefully
let lockCount = 0;
let originalBodyOverflow = "";
let originalHtmlOverflow = "";
let originalBodyPaddingRight = "";

export function lockBodyScroll() {
  if (typeof document === "undefined") return;

  lockCount++;
  if (lockCount === 1) {
    const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;

    originalBodyOverflow = document.body.style.overflow;
    originalHtmlOverflow = document.documentElement.style.overflow;
    originalBodyPaddingRight = document.body.style.paddingRight;

    document.documentElement.classList.add("scroll-locked");
    document.body.classList.add("scroll-locked");

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    // Prevent layout shift on desktop when scrollbar disappears
    if (scrollBarWidth > 0) {
      document.body.style.paddingRight = `${scrollBarWidth}px`;
    }
  }
}

export function unlockBodyScroll() {
  if (typeof document === "undefined") return;

  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.classList.remove("scroll-locked");
    document.body.classList.remove("scroll-locked");

    document.documentElement.style.overflow = originalHtmlOverflow;
    document.body.style.overflow = originalBodyOverflow;
    document.body.style.paddingRight = originalBodyPaddingRight;
  }
}

export function useScrollLock(isLocked: boolean) {
  useEffect(() => {
    if (!isLocked) return;

    lockBodyScroll();

    return () => {
      unlockBodyScroll();
    };
  }, [isLocked]);
}
