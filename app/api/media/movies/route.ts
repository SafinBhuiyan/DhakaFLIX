import { NextResponse } from "next/server";
import { getPopularMovies } from "@/lib/tmdb";

export async function GET() {
  try {
    const results = await getPopularMovies();
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
