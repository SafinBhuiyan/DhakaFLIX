@echo off
title DhakaFLIX Mobile Data Streaming Relay
cd /d "%~dp0"
node scripts/start-relay.mjs
pause
