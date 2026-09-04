@echo off
title Julie AI — Desktop Native Shell (UU-ERP Integration)
color 0B
cls
echo =========================================================================
echo       PROJECT JULIE AI — DESKTOP NATIVE APPLICATION WITH REAL UU-ERP
echo =========================================================================
echo.
echo [1/2] Starting Vite Dev Server...
start "Julie AI - Vite Dev Server" /min cmd /c "npm run dev"

echo [2/2] Launching Julie Native Desktop Shell (with UU-ERP Session Vault)...
timeout /t 3 /nobreak >nul
node node_modules/electron/cli.js electron/main.cjs
