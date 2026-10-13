@echo off
title DhakaFLIX Helper Server
color 0A

echo ===================================================
echo           DhakaFLIX Relay Helper Server
echo ===================================================
echo.

:: 1. Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    color 0C
    echo [ERROR] Node.js is not installed on this PC!
    echo.
    echo Please download and install Node.js (LTS) from:
    echo https://nodejs.org
    echo.
    echo Opening nodejs.org in your browser...
    start https://nodejs.org
    echo.
    pause
    exit /b
)

:: 2. Check if relay.js exists in the same folder
if not exist "%~dp0relay.js" (
    color 0C
    echo [ERROR] relay.js was not found in this folder!
    echo Please make sure relay.js is in the same folder as this file.
    echo.
    pause
    exit /b
)

:: 3. Start the relay server
cd /d "%~dp0"
echo [OK] Node.js detected!
echo [OK] Starting DhakaFLIX Relay Server on port 8080...
echo.
echo Do not close this window while you want mobile data users to watch!
echo ===================================================
echo.

node relay.js
pause
