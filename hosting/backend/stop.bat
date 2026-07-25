@echo off
cd /d "%~dp0"
echo.
echo ═══════════════════════════════════════════
echo   ERP MT Suite - Backend Production Stop
echo ═══════════════════════════════════════════
echo.

:: Check if PM2 is available
where pm2 >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PM2 is not installed. Cannot manage the backend process.
    echo.
    echo   Try stopping manually:
    echo     Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000 -State Listen).OwningProcess -Force
    echo.
    pause
    exit /b 1
)

:: Stop the backend
echo [INFO] Stopping ERP-Backend...
pm2 stop ERP-Backend

if %ERRORLEVEL% EQU 0 (
    echo [INFO] Backend stopped successfully.
) else (
    echo [WARN] Could not stop via PM2. Trying force kill...
    Stop-Process -Id (Get-NetTCPConnection -LocalPort 5000 -State Listen).OwningProcess -Force 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo [INFO] Backend process killed.
    ) else (
        echo [INFO] No backend process found on port 5000.
    )
)

echo.
pause
