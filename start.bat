@echo off
title UklidSiTo - Development Server
cd /d "%~dp0"

echo.
echo ==========================================
echo          UklidSiTo - DEV
echo ==========================================
echo.

REM Check Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found.
    echo Install Node.js and try again.
    echo.
    pause
    exit /b 1
)

REM Check npm
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm was not found.
    echo.
    pause
    exit /b 1
)

REM Check project
if not exist "package.json" (
    echo [ERROR] package.json was not found.
    echo UklidSiTo has probably not been initialized yet.
    echo.
    pause
    exit /b 1
)

REM Install dependencies if needed
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    echo.
    call npm install

    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] npm install failed.
        pause
        exit /b 1
    )
)

REM Check local environment
if not exist ".env.local" (
    echo [WARNING] .env.local was not found.
    echo UklidSiTo may not work correctly without local configuration.
    echo.
    pause
)

echo [INFO] Starting UklidSiTo...
echo [INFO] URL: http://localhost:3000
echo [INFO] Application configuration: PRODUCTION
echo.
echo Press Ctrl+C to stop the server.
echo.

REM Open browser after a short delay
start "" cmd /c "timeout /t 3 /nobreak >nul && start http://localhost:3000"

REM Start Next.js development server
call npm run dev

echo.
echo UklidSiTo development server stopped.
pause