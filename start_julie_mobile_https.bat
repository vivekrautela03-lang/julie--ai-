@echo off
title Julie AI — Mobile Secure HTTPS (Full Mobile Mic & Voice)
color 0A
cls
echo =========================================================================
echo       PROJECT JULIE AI — SECURE HTTPS MOBILE MODE (FULL MIC & VOICE)
echo =========================================================================
echo.
echo [1/2] Starting Python AI Assistant Neural Core (Port 8000)...
start "Julie AI - Python Backend" /min cmd /c "cd /d \"D:\Astra mark 1\ai-assistant--main\" && python run_backend.py"

echo [2/2] Starting Julie with HTTPS Enabled for Mobile Microphone Access...
echo.
echo =========================================================================
echo  * MOBILE PHONE HTTPS LINK: https://10.108.54.190:5173/
echo    (On first load on phone: Click "Advanced" -> "Proceed" to allow mic)
echo  * DESKTOP PC HTTPS LINK:   https://localhost:5173/
echo =========================================================================
echo.
cd /d "d:\VARDAAN AI"
set VITE_HTTPS=true
npm run dev -- --host 0.0.0.0
pause
