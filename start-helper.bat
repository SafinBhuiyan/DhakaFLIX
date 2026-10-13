@echo off
title DhakaFLIX Helper Server
color 0A

echo ===================================================
echo           DhakaFLIX Relay Helper Server
echo ===================================================
echo.

cd /d "%~dp0"

:loop
echo [STARTING] DhakaFLIX Relay Server...
node relay.js
echo.
echo [WARNING] Relay process exited. Auto-restarting in 2 seconds...
timeout /t 2 >nul
goto loop
