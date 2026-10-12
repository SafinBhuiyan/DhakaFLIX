import { NextResponse } from "next/server";
import { getPopularMovies } from "@/lib/tmdb";

export async function GET() {
  try {
    const results = await getPopularMovies();
    return NextResponse.json(
      { results },
      { headers: { "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
