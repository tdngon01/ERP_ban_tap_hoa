@echo off
chcp 65001 > nul
title CHUYỂN ĐỔI DATABASE SANG SUPABASE CLOUD POSTGRESQL - ERP BÁNH KẸO
color 0A

echo ==============================================================================
echo       HỆ THỐNG ERP & SFA: CHUYỂN ĐỔI DATABASE SANG SUPABASE CLOUD (POSTGRESQL)
echo ==============================================================================
echo.
echo Công cụ này sẽ giúp bạn:
echo   1. Sao lưu cấu hình SQLite hiện tại (schema.sqlite.prisma)
echo   2. Kích hoạt cấu hình PostgreSQL kết nối Supabase (schema.postgresql.prisma)
echo   3. Sinh Prisma Client tương thích PostgreSQL
echo   4. Hỗ trợ tự động đẩy bảng (db push) và nạp dữ liệu mẫu lên Supabase
echo.
echo ==============================================================================
echo [BƯỚC 1]: Kiểm tra cấu hình .env trong apps\backend
echo ==============================================================================
echo.
echo Hãy chắc chắn rằng bạn đã điền chuỗi kết nối DATABASE_URL của Supabase
echo vào file: apps\backend\.env
echo (Mẫu xem tại: apps\backend\.env.supabase.example)
echo.
pause

cd /d "%~dp0apps\backend"

echo.
echo [BƯỚC 2]: Sao lưu schema.prisma cũ và chuyển sang PostgreSQL schema...
if not exist "prisma\schema.sqlite.prisma" (
    copy /y "prisma\schema.prisma" "prisma\schema.sqlite.prisma" > nul
    echo   - Đã tạo bản sao lưu: prisma\schema.sqlite.prisma
)

copy /y "prisma\schema.postgresql.prisma" "prisma\schema.prisma" > nul
echo   - Đã kích hoạt schema PostgreSQL (Supabase) thành công!

echo.
echo [BƯỚC 3]: Sinh Prisma Client (npx prisma generate)...
call npx prisma generate
if %errorlevel% neq 0 (
    echo [LỖI]: Không thể sinh Prisma Client. Vui lòng kiểm tra Node.js / Prisma.
    pause
    exit /b %errorlevel%
)

echo.
echo ==============================================================================
echo BẠN CÓ MUỐN TỰ ĐỘNG ĐẨY CẤU TRÚC BẢNG LÊN SUPABASE NGAY BÂY GIỜ?
echo (Yêu cầu file apps\backend\.env đã có chuỗi DATABASE_URL Supabase thật)
echo ==============================================================================
set /p PUSH_CHOICE="Chạy 'prisma db push' lên Supabase ngay? (Y/N, mặc định N): "
if /i "%PUSH_CHOICE%"=="Y" (
    echo.
    echo Đang kết nối và đẩy bảng dữ liệu lên Supabase...
    call npx prisma db push
    if %errorlevel% neq 0 (
        echo [CẢNH BÁO]: Chưa thể kết nối tới Supabase. Bạn có thể dán file 'prisma\supabase_schema.sql'
        echo trực tiếp vào Supabase SQL Editor trên trình duyệt để tạo bảng.
    ) else (
        echo.
        echo [THÀNH CÔNG]: Đã tạo toàn bộ 15 bảng FMCG trên Supabase!
        echo.
        set /p SEED_CHOICE="Bạn có muốn nạp dữ liệu mẫu (Sản phẩm, Kho, Tuyến MCP) lên Supabase? (Y/N): "
        if /i "%SEED_CHOICE%"=="Y" (
            echo Đang nạp dữ liệu mẫu lên Supabase...
            call npm run seed
            echo [HOÀN TẤT]: Đã nạp dữ liệu mẫu thành công!
        )
    )
)

echo.
echo ==============================================================================
echo     HOÀN TẤT CHUYỂN ĐỔI DATABASE SANG SUPABASE!
echo ==============================================================================
echo Nếu muốn chuyển lại về SQLite, hãy chạy file 'Chuyen_Doi_Sang_SQLite.bat'.
echo.
pause

