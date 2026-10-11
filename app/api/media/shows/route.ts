import { NextResponse } from "next/server";
import { getPopularShows } from "@/lib/tmdb";

export async function GET() {
  try {
    const results = await getPopularShows();
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
