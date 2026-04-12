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

:: Wipe bad node_modules if express is missing (catches broken installs)
if exist node_modules (
    if not exist node_modules\express (
        echo  [!] Incomplete install detected. Cleaning node_modules...
        if exist node_modules\* (
            for /d %%i in (node_modules\*) do rd /s /q "%%i" 2>nul
            del /q node_modules\* 2>nul
            rd /s /q node_modules 2>nul
        )
    )
)

:: Install deps
if not exist node_modules (
    echo  Installing dependencies...
    call npm install --ignore-scripts
    if errorlevel 1 (
        echo  [!] npm install failed.
        pause
        exit /b 1
    )
)

echo.
echo  Launching Cipher...
echo.
npm start
