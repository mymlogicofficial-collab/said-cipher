@echo off
title S.A.I.D. Cipher — Startup
color 0A

echo.
echo  ==========================================
echo   S.A.I.D. CIPHER — MYM LOGIC LLC
echo  ==========================================
echo.

:: Check if .env exists
if not exist .env (
    echo  [!] No .env file found.
    echo  [!] Copy .env.example to .env and add your OPENROUTER_API_KEY
    echo.
    pause
    exit /b 1
)

:: Check node
where node >nul 2>&1
if errorlevel 1 (
    echo  [!] Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

:: Always ensure dependencies are installed and complete
echo  Checking dependencies...
call npm install
if errorlevel 1 (
    echo  [!] npm install failed. Check your internet connection.
    pause
    exit /b 1
)

echo.
echo  Launching Cipher...
echo.
npm start
