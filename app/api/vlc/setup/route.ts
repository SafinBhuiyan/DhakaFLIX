import { NextResponse } from "next/server";

export async function GET() {
  const batScript = `@echo off
set "APP_DIR=%LOCALAPPDATA%\\DhakaFlix"
if not exist "%APP_DIR%" mkdir "%APP_DIR%"
(
echo var shell = new ActiveXObject("WScript.Shell"^);
echo var fso = new ActiveXObject("Scripting.FileSystemObject"^);
echo if (WScript.Arguments.Length ^> 0^) {
echo   var raw = WScript.Arguments(0^);
echo   var url = raw.replace(^^/^vlc:\\/\\//i, ""^).replace(^^/^vlc:/i, ""^);
echo   var vlc = "C:\\\\Program Files\\\\VideoLAN\\\\VLC\\\\vlc.exe";
echo   if (!fso.FileExists(vlc^)^) {
echo     vlc = "C:\\\\Program Files (x86)\\\\VideoLAN\\\\VLC\\\\vlc.exe";
echo   }
echo   if (fso.FileExists(vlc^)^) {
echo     shell.Run('"' + vlc + '" "' + url + '"', 1, false^);
echo   }
echo }
) > "%APP_DIR%\\vlc-handler.js"

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
