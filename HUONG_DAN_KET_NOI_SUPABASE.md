# HƯỚNG DẪN KẾT NỐI VÀ SỬ DỤNG SUPABASE CHO HỆ THỐNG ERP BÁNH KẸO

Tài liệu này hướng dẫn chi tiết cách thiết lập và kết nối dự án ERP Bán Hàng FMCG sang nền tảng cơ sở dữ liệu đám mây **Supabase (PostgreSQL)**.

---

## 1. TẠI SAO CHUYỂN SANG SUPABASE LÀ LỰA CHỌN TỐI ƯU?

| Tiêu Chí | Hệ Thống Cũ (Local SQLite) | Hệ Thống Mới (Supabase Cloud PostgreSQL) |
|---|---|---|
| **Truy cập ngoài đường (4G/5G)** | Không kết nối được nếu máy tính tắt | Truy cập đám mây 24/7 từ bất cứ đâu |
| **Độ tin cậy & Sao lưu** | Dễ hỏng file `dev.db` nếu tắt đột ngột | Sao lưu tự động hàng ngày (Point-in-Time Recovery) |
| **Xử lý đồng thời (Concurrency)** | Khóa file (database locked) khi nhiều Sale gửi đơn | Hàng nghìn kết nối đồng thời với Connection Pooler |
| **Realtime Dashboard** | Phải bấm F5 tải lại trang | Tự động nhảy đơn mới tức thì qua WebSocket |
| **Lưu trữ hình ảnh** | Lưu chuỗi ảnh base64 nặng máy | Supabase Storage với CDN tối ưu hóa ảnh quầy kệ |

---

## 2. CÁC BƯỚC KHỞI TẠO DỰ ÁN TRÊN SUPABASE (2 PHÚT)

### Bước 1: Tạo tài khoản và Project trên Supabase
1. Truy cập: [https://supabase.com](https://supabase.com) và đăng nhập (hoặc đăng ký bằng GitHub / Google miễn phí).
2. Bấm nút **"New Project"**.
3. Điền các thông tin:
   - **Name**: `erp-banh-keo` (hoặc tên NPP của bạn).
   - **Database Password**: Nhập mật khẩu CSDL mạnh (hãy lưu lại mật khẩu này).
   - **Region**: Chọn `Singapore (ap-southeast-1)` để có tốc độ truy cập nhanh nhất từ Việt Nam.
4. Bấm **"Create new project"** và chờ khoảng 1-2 phút để Supabase chuẩn bị máy chủ CSDL.

---

### Bước 2: Tạo toàn bộ 15 bảng dữ liệu bằng SQL Editor
1. Trong menu bên trái của Supabase Dashboard, bấm vào **"SQL Editor"** (biểu tượng `>_`).
2. Bấm nút **"New query"**.
3. Mở file sau trong thư mục dự án của bạn:
   👉 [`apps/backend/prisma/supabase_schema.sql`](file:///d:/ERP_BanHang/apps/backend/prisma/supabase_schema.sql)
4. Sao chép (Copy) toàn bộ nội dung file và dán (Paste) vào khung soạn thảo trên Supabase.
5. Bấm nút **"Run"** (hoặc phím tắt `Ctrl + Enter`).
6. Supabase sẽ thông báo **"Success. No rows returned"** — Toàn bộ 15 bảng FMCG, chỉ mục tối ưu, Storage buckets và Realtime replication đã được kích hoạt thành công!

---

### Bước 3: Lấy chuỗi kết nối Database URL
1. Trong Supabase Dashboard, vào menu bánh răng **Project Settings** (dưới cùng bên trái).
2. Chọn mục **Database**.
3. Kéo xuống phần **Connection string**:
   - Chọn tab **URI**.
   - Chọn chế độ **Transaction pooler** (Cổng `6543`) để dùng làm `DATABASE_URL`.
     > Dạng: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Chọn chế độ **Session pooler** (Cổng `5432`) để dùng làm `DIRECT_URL`.
     > Dạng: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
   *(Nhớ thay `[PASSWORD]` bằng mật khẩu bạn đã tạo ở Bước 1)*.

---

### Bước 4: Cập nhật cấu hình vào file `.env`
Mở file [`apps/backend/.env`](file:///d:/ERP_BanHang/apps/backend/.env) và cập nhật:

```env
PORT=5000

# Chuỗi kết nối Supabase
DATABASE_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.xxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# Thông tin API Supabase
SUPABASE_URL="https://xxx.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOi..."
```

---

## 3. KÍCH HOẠT VÀ NẠP DỮ LIỆU TỰ ĐỘNG

Dự án đã được tích hợp sẵn 2 công cụ chuyển đổi 1-click tại thư mục gốc:

1. **Chuyển sang Supabase**:
   👉 Nhấp đúp vào file: [`Chuyen_Doi_Sang_Supabase.bat`](file:///d:/ERP_BanHang/Chuyen_Doi_Sang_Supabase.bat)
   - Tự động chuyển Prisma schema sang PostgreSQL.
   - Sinh mã Prisma Client mới.
   - Hỏi bạn có muốn nạp dữ liệu mẫu (Sản phẩm bánh kẹo, Kho, Tuyến đường, Tiệm tạp hóa) lên Supabase không.

2. **Chuyển lại về SQLite nội bộ (khi cần chạy offline không mạng)**:
   👉 Nhấp đúp vào file: [`Chuyen_Doi_Sang_SQLite.bat`](file:///d:/ERP_BanHang/Chuyen_Doi_Sang_SQLite.bat)

---

## 4. HƯỚNG DẪN KẾT NỐI TỪ ĐIỆN THOẠI MOBILE SFA

Khi CSDL đã nằm trên Supabase:
1. Bạn có thể triển khai Backend NestJS lên các dịch vụ đám mây miễn phí như **Render.com**, **Railway.app**, hoặc **Fly.io**.
2. Trên ứng dụng Mobile Flutter ([`api_constants.dart`](file:///d:/ERP_BanHang/apps/mobile-flutter/lib/core/constants/api_constants.dart)), chỉ cần cập nhật `baseUrl` sang địa chỉ server cloud (hoặc địa chỉ Cloudflare Tunnel / Ngrok nếu chạy máy tính bàn):
   ```dart
   static const String baseUrl = 'https://erp-api-cua-ban.onrender.com/api';
   ```
3. Giờ đây, nhân viên Sale đi ngoài thị trường dù ở bất kỳ đâu chỉ cần bật 4G là có thể:
   - Xem lộ trình tuyến viếng thăm hôm nay.
   - Check-in GPS vệ tinh.
   - Mở thêm tiệm tạp hóa mới (tiệm tự lưu ngay lên Supabase).
   - Lên đơn xuất bánh kẹo trên xe van.
   - Quét mã VietQR nhận tiền thanh toán trực tiếp.

