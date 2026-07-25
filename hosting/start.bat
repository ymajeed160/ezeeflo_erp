@echo off
cd /d "%~dp0"
echo Installing dependencies...
call npm install
echo.
echo Starting ERP MT Suite Hosting Server...
echo.
node server.js
pause
