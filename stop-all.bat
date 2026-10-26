@echo off
title Stop DhakaFLIX
echo Stopping DhakaFLIX and Relay servers...

:: Find and kill process listening on port 3000
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Find and kill process listening on port 8080
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    taskkill /F /PID %%a >nul 2>&1
)

:: Terminate cloudflared if running
taskkill /F /IM cloudflared.exe >nul 2>&1

echo All DhakaFLIX servers stopped successfully.
timeout /t 2 >nul
