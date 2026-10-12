import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";

import path from "path";

const VLC_CANDIDATES = [
  "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
  "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",
  path.join(process.env.LOCALAPPDATA || "", "Programs", "VLC", "vlc.exe"),
  path.join(process.env.ProgramW6432 || "C:\\Program Files", "VideoLAN", "VLC", "vlc.exe"),
  "/Applications/VLC.app/Contents/MacOS/VLC",
  "/usr/bin/vlc",
  "/usr/local/bin/vlc",
].filter(Boolean);

export async function POST(req: NextRequest) {
  try {
    const host = req.headers.get("host") || "";
    const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");
    if (!isLocal && process.env.NODE_ENV === "production") {
      return NextResponse.json({ ok: false, error: "Direct host process execution is restricted to local environment" }, { status: 403 });
    }

    const body = await req.json();
    const { streamUrl } = body;

    if (!streamUrl || typeof streamUrl !== "string" || !/^https?:\/\//i.test(streamUrl.trim())) {
      return NextResponse.json({ ok: false, error: "Missing or invalid streamUrl. Must be an HTTP/HTTPS stream URL." }, { status: 400 });
    }

    try {
      new URL(streamUrl.trim());
    } catch {
      return NextResponse.json({ ok: false, error: "Malformed streamUrl" }, { status: 400 });
    }

    // Locate VLC on the host machine
    const vlcPath = VLC_CANDIDATES.find(p => fs.existsSync(p));

    if (!vlcPath) {
      return NextResponse.json({
        ok: false,
        error: "VLC was not found on this system. Please ensure VLC Media Player is installed."
      }, { status: 404 });
    }

    // Sanitize stream URL for VLC (RFC 3986 compliance: encode spaces and brackets)
    let sanitizedUrl = streamUrl.trim();
    const protoIdx = sanitizedUrl.indexOf("://");
    if (protoIdx !== -1) {
      const proto = sanitizedUrl.substring(0, protoIdx);
      const rest = sanitizedUrl.substring(protoIdx + 3);
      const slashIdx = rest.indexOf("/");
      if (slashIdx !== -1) {
        const hostname = rest.substring(0, slashIdx);
        let pathStr = rest.substring(slashIdx);
        pathStr = pathStr
          .replace(/ /g, "%20")
          .replace(/\[/g, "%5B")
          .replace(/\]/g, "%5D")
          .replace(/"/g, "%22");
        sanitizedUrl = `${proto}://${hostname}${pathStr}`;
      }
    }

    // Launch VLC with the stream URL using "--" to prevent argument injection
    const vlcProcess = execFile(vlcPath, ["--", sanitizedUrl], (error) => {
      if (error) {
        console.error("VLC launch error:", error);
      }
    });

    return NextResponse.json({
      ok: true,
      message: "Streaming directly in VLC",
      pid: vlcProcess.pid
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ ok: false, error: errorMsg }, { status: 500 });
  }
}
