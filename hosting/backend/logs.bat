@echo off
cd /d "%~dp0"
echo.
echo ═══════════════════════════════════════════
echo   ERP MT Suite - Backend Logs
echo ═══════════════════════════════════════════
echo.
echo   Press Ctrl+C to stop tailing logs
echo.

where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PM2 is not installed.
    pause
    exit /b 1
)

pm2 logs ERP-Backend
