@echo off
title Tao Shortcut Desktop ERP FMCG
chcp 65001 >nul
color 0B
echo =====================================================================
echo    TAO PHIM TAT (SHORTCUT) RA MAN HINH DESKTOP WINDOWS
echo =====================================================================
echo.
echo Dang tao bieu tuong tren Desktop...

powershell -Command "$ws = New-Object -ComObject WScript.Shell; $desktopPath = [Environment]::GetFolderPath('Desktop'); $s = $ws.CreateShortcut($desktopPath + '\ERP Banh Keo FMCG.lnk'); $s.TargetPath = '%~dp0Chay_App_Desktop.bat'; $s.WorkingDirectory = '%~dp0'; $s.IconLocation = '%~dp0apps\web-admin\electron\icon.png'; $s.Description = 'He Thong ERP & DMS Banh Keo FMCG'; $s.Save()"

echo.
echo [x] DA TAO THANH CONG!
echo Tu bay gio ban co the mo phan mem ngay tu man hinh Desktop cua may tinh.
echo.
pause

