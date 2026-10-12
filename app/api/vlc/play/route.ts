import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import fs from "fs";

import path from "path";

const VLC_CANDIDATES = [
  "C:\\Program Files\\VideoLAN\\VLC\\vlc.exe",
  "C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe",
  path.join(process.env.LOCALAPPDATA || "", "Programs", "VLC", "vlc.exe")
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

    // Sanitize stream URL for VLC (RFC 3986 compliance: encode spaces and brackets)
    let sanitizedUrl = streamUrl;
    const protoIdx = sanitizedUrl.indexOf("://");
    if (protoIdx !== -1) {
      const proto = sanitizedUrl.substring(0, protoIdx);
      const rest = sanitizedUrl.substring(protoIdx + 3);
      const slashIdx = rest.indexOf("/");
      if (slashIdx !== -1) {
        const host = rest.substring(0, slashIdx);
        let path = rest.substring(slashIdx);
        path = path
          .replace(/ /g, "%20")
          .replace(/\[/g, "%5B")
          .replace(/\]/g, "%5D")
          .replace(/"/g, "%22");
        sanitizedUrl = `${proto}://${host}${path}`;
      }
    }

    // Launch VLC with the stream URL
    // Flag "--network-caching=1000" can be used for optimal LAN buffering
    const vlcProcess = execFile(vlcPath, [sanitizedUrl], (error) => {
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
