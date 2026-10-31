@echo off
title ERP & DMS Banh Keo FMCG (Desktop App)
color 0A
chcp 65001 >nul
set ELECTRON_RUN_AS_NODE=

echo =====================================================================
echo    HE THONG ERP & DMS PHAN PHOI BANH KEO FMCG (PHIEN BAN DESKTOP)
echo    Chi phi van hanh: 0 DONG (Khong can VPS - Khong can Domain)
echo =====================================================================
echo.

set ROOT_DIR=%~dp0
cd /d "%ROOT_DIR%"

:: Kiem tra neu dist cua backend chua co thi build
if not exist "%ROOT_DIR%apps\backend\dist\src\main.js" (
    echo [1/3] Bien dich Backend Engine noi bo...
    cd /d "%ROOT_DIR%apps\backend"
    call npm run build
)

:: Kiem tra neu dist cua web-admin chua co thi build
if not exist "%ROOT_DIR%apps\web-admin\dist\index.html" (
    echo [2/3] Bien dich Giao dien Desktop App...
    cd /d "%ROOT_DIR%apps\web-admin"
    call npm run build
)

echo [3/3] Dang mo Cua So Desktop ERP FMCG...
cd /d "%ROOT_DIR%apps\web-admin"
start "" npx electron .
exit
