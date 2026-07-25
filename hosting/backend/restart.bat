@echo off
cd /d "%~dp0"
echo.
echo ═══════════════════════════════════════════
echo   ERP MT Suite - Backend Production Restart
echo ═══════════════════════════════════════════
echo.

where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PM2 is not installed.
    pause
    exit /b 1
)

echo [INFO] Restarting ERP-Backend...
pm2 reload ecosystem.config.js --env production

if %ERRORLEVEL% EQU 0 (
    echo [INFO] Backend reloaded successfully (zero-downtime).
) else (
    echo [WARN] Reload failed. Trying restart...
    pm2 restart ERP-Backend
)

echo.
pause
