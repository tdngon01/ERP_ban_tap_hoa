@echo off
title ERP & DMS Banh Keo FMCG (Desktop App)
color 0A
set ELECTRON_RUN_AS_NODE=
echo =====================================================================
echo    HE THONG ERP & DMS PHAN PHOI BANH KEO FMCG (PHIEN BAN DESKTOP)
echo    Chi phi van hanh: 0 DONG (Khong can VPS - Khong can Domain)
echo =====================================================================
echo.
echo [1/2] Dang kiem tra va khoi dong ung dung Desktop...
cd /d "%~dp0apps\web-admin"
call npx electron .
exit
