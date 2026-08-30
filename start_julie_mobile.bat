@echo off
title Julie AI — Mobile & Desktop Neural Core
color 0B
cls
echo =========================================================================
echo       PROJECT JULIE AI — MOBILE & DESKTOP MULTI-DEVICE LAUNCHER
echo =========================================================================
echo.
echo [1/2] Launching Python AI Assistant Neural Core (Port 8000)...
start "Julie AI - Python Backend" /min cmd /c "cd /d \"D:\Astra mark 1\ai-assistant--main\" && python run_backend.py"

echo [2/2] Launching Julie Vite Server with Mobile LAN Access...
echo.
echo =========================================================================
echo  * ACCESS ON YOUR DESKTOP PC:   http://localhost:5173/
echo  * ACCESS ON YOUR MOBILE PHONE: http://10.108.54.190:5173/
echo  * SECURE HTTPS (MOBILE MIC):   https://10.108.54.190:5173/
echo =========================================================================
echo.
cd /d "d:\VARDAAN AI"
npm run dev -- --host 0.0.0.0
pause
