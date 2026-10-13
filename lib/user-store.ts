"use client";

import { CatalogMovie } from "@/app/api/dhakaflix/catalog/route";

export interface WatchHistoryItem {
  id: string;
  title: string;
  year?: number;
  quality?: string;
  poster?: string;
  backdrop?: string;
  rating?: number;
  serverUrl?: string;
  videoUrl?: string;
  category?: string;
  sourceServer?: string;
  isSeries?: boolean;
  seasonNumber?: number;
  seasonName?: string;
  episodeNumber?: number;
  episodeTitle?: string;
  watchedAt: number;
}

const STORAGE_KEY_HISTORY = "dhakaflix_watch_history_v1";
const STORAGE_KEY_WATCHLIST = "dhakaflix_watchlist_v1";

export function getWatchHistory(): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToWatchHistory(item: {
  id: string;
  title: string;
  year?: number;
  quality?: string;
  poster?: string;
  backdrop?: string;
  rating?: number;
  serverUrl?: string;
  videoUrl?: string;
  category?: string;
  sourceServer?: string;
  isSeries?: boolean;
  seasonNumber?: number;
  seasonName?: string;
  episodeNumber?: number;
  episodeTitle?: string;
}): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const history = getWatchHistory();
    const existingIndex = history.findIndex((h) => h.id === item.id);

    const newItem: WatchHistoryItem = {
      ...item,
      watchedAt: Date.now(),
    };

    if (existingIndex !== -1) {
      history.splice(existingIndex, 1);
    }

    history.unshift(newItem);

    // Keep up to 20 recent items
    const trimmed = history.slice(0, 20);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(trimmed));
    return trimmed;
  } catch {
    return [];
  }
}

export function removeFromWatchHistory(id: string): WatchHistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    const history = getWatchHistory().filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
    return history;
  } catch {
    return [];
  }
}

export function clearWatchHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch {}
}

export function getWatchlist(): CatalogMovie[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_WATCHLIST);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function toggleWatchlist(movie: CatalogMovie): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getWatchlist();
    const index = list.findIndex((m) => m.id === movie.id);
    let added = false;

    if (index !== -1) {
      list.splice(index, 1);
      added = false;
    } else {
      list.unshift(movie);
      added = true;
    }

    localStorage.setItem(STORAGE_KEY_WATCHLIST, JSON.stringify(list.slice(0, 50)));
    return added;
  } catch {
    return false;
  }
}

export function isInWatchlist(id: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const list = getWatchlist();
    return list.some((m) => m.id === id);
  } catch {
    return false;
  }
}
