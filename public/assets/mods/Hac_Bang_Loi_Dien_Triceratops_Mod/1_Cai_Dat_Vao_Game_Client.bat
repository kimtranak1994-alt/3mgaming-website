@echo off
chcp 65001 >nul
title Cài đặt Skin Hắc Băng Lôi Điện - 3M Gaming
echo ======================================================================
echo   CÀI ĐẶT PRESET SKIN HẮC BĂNG LÔI ĐIỆN VÀO THE ISLE EVRIMA
echo ======================================================================
echo.

set TARGET_DIR=%LOCALAPPDATA%\TheIsle\Saved\Config\WindowsClient
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%"
)

echo Đang nạp cấu hình Skin vào: %TARGET_DIR%\Skins.ini ...
type Skins.ini >> "%TARGET_DIR%\Skins.ini"

echo.
echo Đang copy mã Skin Code vào Clipboard...
echo|set /p="Triceratops10006080EFF06080EFF06080EFF00E5FFFF00F2FFFF00FFFFFF" | clip

echo.
echo ======================================================================
echo   ĐÃ CÀI ĐẶT THÀNH CÔNG!
echo   - Mã Skin Code đã được tự động Copy vào bộ nhớ tạm (Clipboard).
echo   - Khi vào Game The Isle Evrima, chọn loài Triceratops và nhấn Ctrl + V
echo     hoặc chọn preset HacBangLoiDien_Triceratops!
echo ======================================================================
pause
