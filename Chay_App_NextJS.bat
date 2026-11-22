@echo off
chcp 65001 > nul
title HỆ THỐNG ERP & SFA FMCG - NEXT.JS & SUPABASE CLOUD
color 0B

echo ==============================================================================
echo        KHỞI ĐỘNG HỆ THỐNG ERP BÁN HÀNG FMCG (NEXT.JS + SUPABASE CLOUD)
echo ==============================================================================
echo.
echo Hệ thống đang khởi động trên nền tảng Next.js Fullstack Serverless...
echo - Web Admin URL: http://localhost:3000
echo - Serverless API: http://localhost:3000/api
echo.
echo Tự động mở trình duyệt sau 3 giây...
start "" http://localhost:3000

cd /d "%~dp0apps\web-next"
npm run dev
pause
