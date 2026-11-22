# HƯỚNG DẪN TRIỂN KHAI HỆ THỐNG ERP BÁNH KẸO LÊN VERCEL & SUPABASE
### Tối ưu hóa chi phí vận hành: 0 VNĐ / Tháng (Hoàn toàn Miễn phí trọn đời)

---

## 1. TẠI SAO BỘ ĐÔI NEXT.JS + SUPABASE + VERCEL LÀ TỐI ƯU CHI PHÍ NHẤT?

- **Vercel Hobby Plan (0đ/tháng)**: Máy chủ Serverless tự động khởi động khi có truy cập và tắt khi không dùng, băng thông 100GB/tháng, Edge CDN toàn cầu, tự động cấp phát SSL/HTTPS miễn phí. Không cần thuê VPS tốn 200.000đ – 500.000đ/tháng.
- **Supabase Free Tier (0đ/tháng)**: Cơ sở dữ liệu đám mây PostgreSQL 500MB (đủ cho 100.000+ đơn hàng FMCG), 1GB Supabase Storage để lưu ảnh chụp trưng bày tiệm tạp hóa, tính năng Realtime WebSocket cập nhật đơn mới tức thì.
- **Kiến trúc Fullstack gọn gàng**: Cả Giao diện Web Admin và Toàn bộ API Backend đều nằm trong dự án `apps/web-next`. Ứng dụng **Mobile Flutter** của Sales ngoài đường chỉ cần trỏ API về URL Vercel là chạy 4G mượt mà.

---

## 2. BƯỚC 1: THIẾT LẬP SUPABASE CLOUD (2 PHÚT)

### 2.1. Tạo Project trên Supabase
1. Truy cập [https://supabase.com](https://supabase.com) và đăng nhập bằng GitHub hoặc Google.
2. Bấm **"New Project"**.
3. Điền thông tin:
   - **Name**: `erp-banh-keo` (hoặc tên NPP của bạn).
   - **Database Password**: Nhập mật khẩu CSDL (hãy lưu lại mật khẩu này).
   - **Region**: Chọn `Singapore (ap-southeast-1)` để có tốc độ truy cập nhanh nhất tại Việt Nam.
4. Bấm **"Create new project"** và chờ khoảng 1 phút.

### 2.2. Khởi tạo 16 bảng dữ liệu bằng SQL Editor
1. Trong menu bên trái của Supabase Dashboard, bấm vào **"SQL Editor"** (biểu tượng `>_`).
2. Bấm nút **"New query"**.
3. Mở file sau trong thư mục dự án của bạn:
   👉 [`apps/backend/prisma/supabase_schema.sql`](file:///d:/ERP_BanHang/apps/backend/prisma/supabase_schema.sql)
4. Sao chép toàn bộ nội dung file và dán vào ô SQL Editor.
5. Bấm nút **"Run"** (hoặc nhấn `Ctrl + Enter`).
6. Supabase sẽ tạo thành công: 16 bảng FMCG, chỉ mục tìm kiếm nhanh `pg_trgm`, kích hoạt Supabase Realtime cho đơn hàng và các kho lưu trữ ảnh (`store-photos`, `display-photos`, `product-images`).

### 2.3. Lấy chuỗi kết nối Database & API Keys
1. Vào mục bánh răng **Project Settings** (góc dưới bên trái).
2. Vào tab **Database** -> Kéo xuống mục **Connection string**:
   - Chọn tab **URI**.
   - Chọn chế độ **Transaction pooler** (Cổng `6543`) 👉 Đây là `DATABASE_URL` (Tối ưu cho Serverless Vercel).
     > Dạng: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Chọn chế độ **Session pooler** (Cổng `5432`) 👉 Đây là `DIRECT_URL`.
     > Dạng: `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`
   *(Nhớ thay `[PASSWORD]` bằng mật khẩu bạn đã tạo)*.
3. Vào tab **API** (trong Project Settings):
   - **Project URL** 👉 Đây là `NEXT_PUBLIC_SUPABASE_URL` (dạng `https://xxx.supabase.co`).
   - **Project API keys (anon / public)** 👉 Đây là `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

---

## 3. BƯỚC 2: TRIỂN KHAI LÊN VERCEL TRONG 1 CLICK (1 PHÚT)

### 3.1. Đẩy mã nguồn lên GitHub
1. Tạo một repository mới trên GitHub (chọn chế độ Private để bảo mật mã nguồn).
2. Đẩy toàn bộ thư mục dự án lên repository của bạn.

### 3.2. Import vào Vercel
1. Truy cập [https://vercel.com](https://vercel.com) và đăng nhập bằng GitHub.
2. Bấm **"Add New..."** -> Chọn **"Project"**.
3. Chọn repository dự án `ERP_BanHang` vừa đẩy lên.
4. Tại màn hình **Configure Project**:
   - **Framework Preset**: Chọn `Next.js`.
   - **Root Directory**: Bấm nút **Edit** và chọn thư mục: `apps/web-next`.
5. Mở phần **Environment Variables** (Biến môi trường) và thêm các biến sau:

| Tên biến (Key) | Giá trị (Value) | Ghi chú |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres.xxx:[PASS]@...pooler.supabase.com:6543/postgres?pgbouncer=true` | Chuỗi kết nối cổng 6543 |
| `DIRECT_URL` | `postgresql://postgres.xxx:[PASS]@...pooler.supabase.com:5432/postgres` | Chuỗi kết nối cổng 5432 |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | URL Supabase Project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi...` | Khóa Anon Supabase |
| `JWT_SECRET` | `fmcg_erp_dms_jwt_secret_anphat_2026_super_key_security` | Khóa ký phiên đăng nhập |
| `VIETQR_BANK_ID` | `970422` | Mã ngân hàng (MBBank: 970422) |
| `VIETQR_ACCOUNT_NO` | `0988889999` | Số tài khoản nhận tiền |
| `VIETQR_ACCOUNT_NAME` | `NPP BANH KEO AN PHAT` | Tên chủ tài khoản nhận tiền |

6. Bấm nút **"Deploy"**!
7. Vercel sẽ tự động cài đặt gói, sinh Prisma Client và đóng gói hệ thống Next.js. Sau khoảng 1-2 phút, bạn sẽ nhận được địa chỉ truy cập công khai có dạng:
   👉 `https://ten-du-an-cua-ban.vercel.app`

---

## 4. BƯỚC 3: KẾT NỐI ỨNG DỤNG MOBILE FLUTTER CỦA SALES NGOÀI ĐƯỜNG

Khi Web Next.js đã được triển khai lên Vercel:
1. Mở file: [`apps/mobile-flutter/lib/core/constants/api_constants.dart`](file:///d:/ERP_BanHang/apps/mobile-flutter/lib/core/constants/api_constants.dart).
2. Cập nhật `baseUrl` trỏ tới URL Vercel của bạn:
   ```dart
   static const String baseUrl = 'https://ten-du-an-cua-ban.vercel.app/api';
   ```
3. Giờ đây nhân viên Sales đi ngoài đường dù ở bất cứ đâu có mạng 4G/5G đều có thể:
   - Check-in GPS vệ tinh tại các tiệm tạp hóa.
   - Chụp ảnh quầy kệ tải trực tiếp lên Supabase Storage.
   - Lên đơn xuất hàng nhanh và cho khách quét mã VietQR tự động.

---

## 5. CHẠY THỬ NGHIỆM LOCALHOST TRÊN MÁY TÍNH CỦA BẠN

Nếu bạn muốn chạy thử nghiệm Next.js trên máy tính trước khi deploy:
1. Mở terminal tại thư mục gốc:
   ```bash
   npm run start:next
   ```
2. Mở trình duyệt và truy cập:
   👉 `http://localhost:3000`
3. Đăng nhập với các tài khoản mặc định (Mật khẩu: `123456`):
   - **Chủ NPP (Toàn quyền)**: `admin`
   - **Kế Toán / Thu Ngân**: `ketoan`
   - **Thủ Kho / Điều Phối**: `thukho`
   - **Giám Sát Bán Hàng**: `giamsat`
   - **Sale Thị Trường**: `sale01`
