import { NextRequest, NextResponse } from "next/server";
import { findDhakaFlixStreams } from "@/lib/dhakaflix";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title");
  const yearStr = searchParams.get("year");
  const year = yearStr ? parseInt(yearStr, 10) : undefined;

  if (!title) {
    return NextResponse.json({ error: "Missing title parameter" }, { status: 400 });
  }

  try {
    const streams = await findDhakaFlixStreams(title, year);
    return NextResponse.json({ streams });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
