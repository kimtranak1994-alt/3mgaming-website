@echo off
title 3MGAMING - Cap nhat Website
cd /d "%~dp0"
echo ===================================================
echo   DANG CAP NHAT WEB 3MGAMING TU MAY NGUON...
echo ===================================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -Command "Invoke-WebRequest -Uri 'http://192.168.1.3:8000/public/index.html' -OutFile 'public/index.html'; Invoke-WebRequest -Uri 'http://192.168.1.3:8000/public/js/app.js' -OutFile 'public/js/app.js'; Invoke-WebRequest -Uri 'http://192.168.1.3:8000/public/css/style.css' -OutFile 'public/css/style.css'"
echo.
echo ===================================================
echo   DA CAP NHAT XONG 100%! F5 LAI TRINH DUYET!
echo ===================================================
pause
