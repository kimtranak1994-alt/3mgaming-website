@echo off
chcp 65001 >nul
title CÀI ĐẶT MOD SKIN HẮC BĂNG LÔI ĐIỆN (KHÔNG CẦN ISLEPILOT)
echo ============================================================================
echo   👑 MOD SKIN ĐỘC QUYỀN: HẮC BĂNG LÔI ĐIỆN (100%% ĐỘC LẬP - NO ISLEPILOT)
echo   Hỗ trợ toàn bộ 26 loài khủng long trong The Isle Evrima
echo ============================================================================
echo.

set "TARGET_DIR=%LOCALAPPDATA%\TheIsle\Saved\Config\WindowsClient"
if not exist "%TARGET_DIR%" (
    mkdir "%TARGET_DIR%" 2>nul
)

if exist "%TARGET_DIR%\Skins.ini" (
    copy /Y "%TARGET_DIR%\Skins.ini" "%TARGET_DIR%\Skins.ini.bak" >nul
    echo [✓] Đã sao lưu file Skins.ini cũ thành Skins.ini.bak
)

copy /Y "%~dp0Skins.ini" "%TARGET_DIR%\Skins.ini" >nul
echo [✓] Đã cài đặt thành công bảng màu Hắc Băng Lôi Điện cho 26 loài vào:
echo     %TARGET_DIR%\Skins.ini
echo.
echo [MÃ SKIN CODE COPY NHANH VÀO GAME]:
echo Diabloceratops10006080EFF06080EFF00D9FFFFD1FAFFFF00F2FFFF00FFFFFF
echo.
echo Diabloceratops10006080EFF06080EFF00D9FFFFD1FAFFFF00F2FFFF00FFFFFF | clip
echo [✓] Đã tự động copy mã Skin Code vào bộ nhớ tạm (Clipboard)!
echo     Bạn có thể vào thẳng game The Isle Evrima và nhấn Ctrl+V vào ô Skin Code!
echo ============================================================================
pause
