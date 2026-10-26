@echo off
title 3MGAMING Web Portal Server
cd /d "%~dp0"

echo =================================================================
echo             3MGAMING - THE ISLE EVRIMA WEB PORTAL
echo                 Chay truc tiep tren may chu
echo =================================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    set "PYCMD=python"
    goto :FOUND
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    set "PYCMD=py"
    goto :FOUND
)

echo [LOI] Khong tim thay Python tren may tinh nay!
echo.
echo May chu can cai dat Python de chay Web Portal.
echo Ban hay tai Python tai: https://www.python.org/downloads/
echo Luu y quan trong: Khi cai dat nho tich vao o "Add python.exe to PATH"
echo.
pause
exit /b 1

:FOUND
echo [OK] Phat hien Python:
%PYCMD% --version
echo.
echo Dang khoi dong Web Server tai cong 8000...
echo Mo trinh duyet truy cap: http://localhost:8000
echo =================================================================
echo.

%PYCMD% -u server.py
if %errorlevel% neq 0 (
    echo.
    echo [CANH BAO] Server da dung!
)
pause