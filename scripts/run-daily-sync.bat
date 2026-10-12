@echo off
REM =========================================================================
REM  DhakaFLIX - Daily Catalog Sync & Push
REM  Runs incremental scan against BDIX servers, enriches new releases,
REM  updates public/catalog/*.json, and pushes to GitHub to deploy to Vercel.
REM =========================================================================

cd /d "%~dp0\.."
echo [%DATE% %TIME%] Starting DhakaFLIX Daily Catalog Sync >> "%~dp0\sync.log"

npm run sync:daily >> "%~dp0\sync.log" 2>&1

echo [%DATE% %TIME%] Sync finished with exit code %ERRORLEVEL% >> "%~dp0\sync.log"
echo ------------------------------------------------------------- >> "%~dp0\sync.log"
