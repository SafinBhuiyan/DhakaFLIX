import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";

const VLC_CANDIDATES = [
  "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
  "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe"
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { streamUrl } = body;

    if (!streamUrl || typeof streamUrl !== "string") {
      return NextResponse.json({ ok: false, error: "Missing or invalid streamUrl" }, { status: 400 });
    }

    // Locate VLC on the host machine
    const vlcPath = VLC_CANDIDATES.find(p => fs.existsSync(p));

    if (!vlcPath) {
      return NextResponse.json({
        ok: false,
        error: "VLC was not found on this system. Please ensure VLC Media Player is installed."
      }, { status: 404 });
    }

    // Launch VLC with the stream URL
    // Flag "--network-caching=1000" can be used for optimal LAN buffering
    const vlcProcess = execFile(vlcPath, [streamUrl], (error) => {
      if (error) {
        console.error("VLC launch error:", error);
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Streaming directly in VLC",
      pid: vlcProcess.pid
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
