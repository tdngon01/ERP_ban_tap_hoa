@echo off
title Build APK Android SFA DMS Banh Keo
color 0A
chcp 65001 >nul

echo =====================================================================
echo    DONG GOI FILE CAI DAT ANDROID APK (SFA DMS BANH KEO)
echo =====================================================================
echo.

where flutter >nul 2>nul
if %errorlevel% neq 0 (
    echo [LỖI] Khong tim thay Flutter SDK trong bien moi truong PATH.
    echo Vui long cai dat Flutter SDK hoac mo tren may co san Flutter de chay file nay.
    echo Huong dan: https://docs.flutter.dev/get-started/install/windows
    pause
    exit /b 1
)

echo [1/3] Dang lay thu vien dependencies (flutter pub get)...
call flutter pub get

echo.
echo [2/3] Dang bien dich ban phat hanh (flutter build apk --release)...
call flutter build apk --release

echo.
echo [3/3] HOAN TAT!
echo File APK duoc luu tai:
echo build\app\outputs\flutter-apk\app-release.apk
echo.
pause
