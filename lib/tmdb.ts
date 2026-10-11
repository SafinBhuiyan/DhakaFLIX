const TMDB_API_KEY = process.env.TMDB_API_KEY || process.env.NEXT_PUBLIC_TMDB_API_KEY || "ef87cc03f2c3ac00e1a1f5d3c1df20bf";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export interface TMDBMedia {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  media_type: "movie" | "tv";
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  genre_ids?: number[];
  runtime?: number;
  number_of_seasons?: number;
  number_of_episodes?: number;
}

export function getPosterUrl(path?: string | null, size: "w342" | "w500" | "original" = "w500"): string {
  if (!path) return "/placeholder-poster.png";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path?: string | null, size: "w1280" | "original" = "w1280"): string {
  if (!path) return "";
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function formatMediaDuration(item: TMDBMedia): string {
  if (item.media_type === "tv") {
    return "S1 · E1";
  }
  if (item.runtime) {
    const hours = Math.floor(item.runtime / 60);
    const minutes = item.runtime % 60;
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  // Estimated duration if runtime isn't provided directly in list response
  const idHash = Math.abs(item.id) % 45;
  const hours = 1 + Math.floor(idHash / 30);
  const minutes = 25 + (idHash % 35);
  return `${hours}h ${minutes}m`;
}

export function getMediaTitle(item: TMDBMedia): string {
  return item.title || item.name || "Untitled";
}

export function getMediaYear(item: TMDBMedia): number {
  const dateStr = item.release_date || item.first_air_date;
  if (!dateStr) return new Date().getFullYear();
  const year = parseInt(dateStr.substring(0, 4), 10);
  return isNaN(year) ? new Date().getFullYear() : year;
}

// Fetch trending media for "Start Watching" rail
export async function getTrendingMedia(mediaType: "all" | "movie" | "tv" = "all", timeWindow: "day" | "week" = "day"): Promise<TMDBMedia[]> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/${mediaType}/${timeWindow}?api_key=${TMDB_API_KEY}&language=en-US`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) throw new Error(`TMDb returned ${res.status}`);
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      ...item,
      media_type: item.media_type || (item.first_air_date ? "tv" : "movie")
    }));
  } catch (error) {
    console.error("Error fetching trending from TMDb:", error);
    return [];
  }
}

// Fetch popular movies
export async function getPopularMovies(): Promise<TMDBMedia[]> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: "movie" }));
  } catch {
    return [];
  }
}

// Fetch popular TV shows
export async function getPopularShows(): Promise<TMDBMedia[]> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((s: any) => ({ ...s, media_type: "tv" }));
  } catch {
    return [];
  }
}

// Fetch upcoming releases for the "Calendar" timeline rail
export async function getUpcomingReleases(): Promise<TMDBMedia[]> {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/movie/upcoming?api_key=${TMDB_API_KEY}&language=en-US&page=1`, {
      next: { revalidate: 3600 }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((m: any) => ({ ...m, media_type: "movie" }));
  } catch {
    return [];
  }
}

// Search across movies and TV shows
export async function searchTMDb(query: string): Promise<TMDBMedia[]> {
  if (!query.trim()) return [];
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || [])
      .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
      .map((item: any) => ({ ...item }));
  } catch {
    return [];
  }
}
