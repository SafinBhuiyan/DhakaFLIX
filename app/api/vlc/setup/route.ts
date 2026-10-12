import { NextResponse } from "next/server";

const VLC_HANDLER_JS = `var shell = new ActiveXObject("WScript.Shell");
var fso = new ActiveXObject("Scripting.FileSystemObject");

function safeDecode(str) {
  try {
    return decodeURIComponent(str);
  } catch (e1) {
    try {
      return unescape(str);
    } catch (e2) {
      return str;
    }
  }
}

function resolveVlcPath() {
  var vlc = "";
  try {
    vlc = shell.RegRead("HKLM\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\vlc.exe\\\\");
    if (vlc && fso.FileExists(vlc)) return vlc;
  } catch (e) {}
  try {
    vlc = shell.RegRead("HKCU\\\\SOFTWARE\\\\Microsoft\\\\Windows\\\\CurrentVersion\\\\App Paths\\\\vlc.exe\\\\");
    if (vlc && fso.FileExists(vlc)) return vlc;
  } catch (e) {}

  var candidates = [
    "C:\\\\Program Files\\\\VideoLAN\\\\VLC\\\\vlc.exe",
    "C:\\\\Program Files (x86)\\\\VideoLAN\\\\VLC\\\\vlc.exe"
  ];
  try {
    var localApp = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%");
    candidates.push(localApp + "\\\\Programs\\\\VLC\\\\vlc.exe");
  } catch (e) {}

  for (var i = 0; i < candidates.length; i++) {
    if (fso.FileExists(candidates[i])) {
      return candidates[i];
    }
  }
  return "";
}

if (WScript.Arguments.Length > 0) {
  var raw = WScript.Arguments(0);
  if (raw) {
    // 1. Strip surrounding quotes and whitespace
    var url = raw.replace(/^[\\s"']+|[\\s"']+$/g, "");

    // 2. Strip vlc protocol scheme prefixes
    url = url.replace(/^vlc:\\/\\//i, "").replace(/^vlc:/i, "");

    // 3. Extract query param if passed as ?url=...
    var qMatch = url.match(/[?&]url=([^&]+)/i);
    if (qMatch) {
      url = qMatch[1];
    }

    // 4. Safe URL decoding for Chromium percent-encoded protocol params
    url = safeDecode(url);

    // If still contains percent-encoded slashes or double-encoded characters (%2F, %2520, etc.)
    if (/^https?%2F%2F/i.test(url) || /%2F/i.test(url) || /%3A/i.test(url)) {
      url = safeDecode(url);
    }

    // 5. Restore protocol scheme if Chromium stripped the colon (e.g. http// -> http://)
    url = url.replace(/^http\\/\\//i, "http://");
    url = url.replace(/^https\\/\\//i, "https://");
    url = url.replace(/^http\\/([^\\/])/i, "http://$1");
    url = url.replace(/^https\\/([^\\/])/i, "https://$1");

    // 6. If scheme is missing entirely, prepend http://
    if (!/^[a-zA-Z][a-zA-Z0-9+\\-.]*:\\/\\//.test(url)) {
      url = "http://" + url;
    }

    // 7. RFC 3986 Path Sanitation for VLC:
    // VLC's HTTP access module fails with "http error: invalid URL" if path contains raw spaces or brackets []
    var protoIdx = url.indexOf("://");
    var proto = url.substring(0, protoIdx);
    var rest = url.substring(protoIdx + 3);
    var slashIdx = rest.indexOf("/");
    var host = slashIdx !== -1 ? rest.substring(0, slashIdx) : rest;
    var path = slashIdx !== -1 ? rest.substring(slashIdx) : "/";

    path = path.replace(/ /g, "%20");
    path = path.replace(/\\[/g, "%5B");
    path = path.replace(/\\]/g, "%5D");
    path = path.replace(/"/g, "%22");
    path = path.replace(/</g, "%3C");
    path = path.replace(/>/g, "%3E");
    path = path.replace(/\\\\/g, "%5C");
    path = path.replace(/\\^/g, "%5E");
    path = path.replace(/\\x60/g, "%60");
    path = path.replace(/\\{/g, "%7B");
    path = path.replace(/\\|/g, "%7C");
    path = path.replace(/\\}/g, "%7D");

    url = proto + "://" + host + path;

    // 8. Find VLC and launch
    var vlcExe = resolveVlcPath();
    if (vlcExe) {
      shell.Run('"' + vlcExe + '" "' + url + '"', 1, false);
    } else {
      shell.Popup("VLC Media Player was not found. Please ensure VLC is installed.", 0, "DhakaFlix", 16);
    }
  }
}
`;

export async function GET() {
  const b64 = Buffer.from(VLC_HANDLER_JS, "utf-8").toString("base64");

  const batScript = `@echo off
set "APP_DIR=%LOCALAPPDATA%\\DhakaFlix"
if not exist "%APP_DIR%" mkdir "%APP_DIR%"

powershell -NoProfile -ExecutionPolicy Bypass -Command "[System.IO.File]::WriteAllText('%APP_DIR%\\vlc-handler.js', [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String('${b64}')), (New-Object System.Text.UTF8Encoding($false)))" 2>nul

if not exist "%APP_DIR%\\vlc-handler.js" (
  (
    echo -----BEGIN CERTIFICATE-----
    echo ${b64}
    echo -----END CERTIFICATE-----
  ) > "%TEMP%\\vlc_b64.tmp"
  certutil -decode "%TEMP%\\vlc_b64.tmp" "%APP_DIR%\\vlc-handler.js" >nul 2>&1
  if exist "%TEMP%\\vlc_b64.tmp" del "%TEMP%\\vlc_b64.tmp"
)

reg add "HKCU\\Software\\Classes\\vlc" /ve /d "URL:VLC Protocol" /f >nul
reg add "HKCU\\Software\\Classes\\vlc" /v "URL Protocol" /d "" /f >nul
reg add "HKCU\\Software\\Classes\\vlc\\shell\\open\\command" /ve /d "wscript.exe \\"%APP_DIR%\\vlc-handler.js\\" \\"%%%%1\\"" /f >nul

echo ---------------------------------------------------
echo [SUCCESS] VLC 1-Click Desktop Playback is activated!
echo You can now click "Play in VLC" on DhakaFlix.
echo ---------------------------------------------------
pause
`;

  return new NextResponse(batScript, {
    headers: {
      "Content-Type": "application/x-bat",
      "Content-Disposition": 'attachment; filename="setup-vlc-desktop.bat"',
    },
  });
}
