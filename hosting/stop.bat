@echo off
cd /d "%~dp0"
echo Stopping ERP MT Suite Hosting Server...
node stop.js
pause
