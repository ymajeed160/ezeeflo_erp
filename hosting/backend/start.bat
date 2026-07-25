@echo off
cd /d "%~dp0"
echo.
echo ═══════════════════════════════════════════
echo   ERP MT Suite - Backend Production Start
echo ═══════════════════════════════════════════
echo.

:: Check if PM2 is installed
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [INFO] PM2 not found. Installing globally...
    npm install -g pm2
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install PM2. Try running as Administrator.
        pause
        exit /b 1
    )
    echo [INFO] PM2 installed successfully.
)

:: Check if the backend app is already running
pm2 show ERP-Backend >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] ERP-Backend is already running under PM2.
    echo.
    echo   To restart: pm2 restart ERP-Backend
    echo   To view logs: pm2 logs ERP-Backend
    echo.
    pause
    exit /b 0
)

:: Create logs directory
if not exist "logs" mkdir logs

:: Start the backend with PM2
echo [INFO] Starting ERP-Backend with PM2 (production mode)...
pm2 start ecosystem.config.js --env production

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ═══════════════════════════════════════════
    echo   Backend is now running!
    echo   URL : http://localhost:5000
    echo   API : http://localhost:5000/api
    echo   Health : http://localhost:5000/api/health
    echo ═══════════════════════════════════════════
    echo.
    echo   Management commands:
    echo     pm2 status           - View all processes
    pm2 status
) else (
    echo [ERROR] Failed to start backend.
)

echo.
pause
