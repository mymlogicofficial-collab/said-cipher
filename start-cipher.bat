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

:: Check for Visual Studio Build Tools (required for native modules)
where cl >nul 2>&1
if errorlevel 1 (
    echo  [!] WARNING: Visual Studio Build Tools not detected.
    echo  [!] If Cipher fails to start, install from:
    echo  [!] https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo  [!] Select "Desktop development with C++" during install.
    echo.
)

:: Install deps if needed
if not exist node_modules (
    echo  Installing dependencies...
    call npm install
    echo.
    echo  Rebuilding native modules for Electron...
    call npx electron-rebuild -f -w node-pty,better-sqlite3
) else (
    :: Check if native rebuild is needed
    if not exist node_modules\node-pty\build\Release\pty.node (
        echo  Rebuilding native modules for Electron...
        call npx electron-rebuild -f -w node-pty,better-sqlite3
    )
)

echo.
echo  Launching Cipher...
echo.
npm start
