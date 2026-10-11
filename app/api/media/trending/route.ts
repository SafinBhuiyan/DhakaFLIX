import { NextResponse } from "next/server";
import { getTrendingMedia } from "@/lib/tmdb";

export async function GET() {
  try {
    const results = await getTrendingMedia("all", "day");
    return NextResponse.json({ results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, results: [] }, { status: 500 });
  }
}
