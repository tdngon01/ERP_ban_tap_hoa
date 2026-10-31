@echo off
title Tao Shortcut Desktop ERP FMCG
chcp 65001 >nul
color 0B
echo =====================================================================
echo    TAO PHIM TAT (SHORTCUT) RA MAN HINH DESKTOP WINDOWS
echo =====================================================================
echo.
echo Dang tao bieu tuong tren Desktop...

powershell -ExecutionPolicy Bypass -File "%~dp0Tao_Shortcut.ps1"

echo.
echo [x] DA TAO THANH CONG!
echo Tu bay gio ban co the mo phan mem ngay tu man hinh Desktop cua may tinh.
echo Khi mo se KHONG con cua so console den nua ma vao thang app Desktop.
echo.
pause
