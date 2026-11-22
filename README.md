# Hệ Thống Web ERP & DMS Ngành Phân Phối Bánh Kẹo & Tạp Hóa (FMCG)
> **Kiến trúc Cloud-Native Hiện Đại:** Next.js 14 App Router (Fullstack Serverless) • Supabase (PostgreSQL) • Triển khai Vercel 0đ/tháng • Mobile Flutter SFA.

Hệ thống chuyên biệt cho **Nhà Phân Phối (NPP)** và **Đội ngũ Sale Thị Trường (General Trade - GT)** với quy mô phân phối bánh kẹo, giải quyết triệt để 6 bài toán cốt lõi:
1. **Đa đơn vị tính & Quy cách đóng gói linh hoạt**: Thùng -> Hộp/Dây/Lốc -> Gói/Thanh, tự động quy đổi và hạch toán tồn kho theo Đơn vị cơ sở (Base UoM).
2. **Quản trị Lô & Hạn sử dụng theo FEFO (First Expired, First Out)**: Tự động đề xuất xuất hàng cận date trước, cảnh báo đỏ $\le 30$ ngày, tách biệt Tồn thực tế / Tồn giữ chỗ (Soft Reservation) / Tồn khả dụng.
3. **Bộ máy Khuyến mãi & Chiết khấu phức tạp (Promotion Engine)**: Tự động kích hoạt Mua X tặng Y (hàng tặng đơn giá 0đ), chiết khấu theo giá trị đơn hàng.
4. **Lịch trình tuyến MCP (Master Call Plan T2 - T7) & GPS Check-in**: Tích hợp HTML5 Geolocation độ chính xác cao, kiểm soát vị trí viếng thăm trong bán kính $\le 100\text{m}$, chống gian lận.
5. **Công nợ gối đầu & Sinh mã VietQR động**: Tự động sinh mã VietQR Napas kèm nội dung chuyển khoản để chủ tạp hóa quét thanh toán tức thì và tự động gạch nợ.
6. **Đồng bộ hai chiều Google Sheets API**: Kết nối trực tiếp với bảng Google Sheets của Nhà phân phối, kéo sản phẩm & điểm bán về ERP, đẩy đơn hàng và tồn kho FEFO lên Google Sheet.
7. **In Phiếu Giao Hàng & Hóa Đơn kèm mã VietQR**: Hỗ trợ in khổ A4/A5 hoặc máy in nhiệt; tự động sinh mã VietQR Napas với số tiền còn nợ và nội dung chuyển khoản để chủ tạp hóa quét thanh toán.
8. **Bảng Kê Soạn Hàng Tổng Cho Xe Tải (Consolidated Warehouse Picking List)**: Tự động gom toàn bộ đơn hàng trong ngày, bốc hàng theo chuẩn lô cận date FEFO, tiết kiệm thời gian gom hàng cho đội ngũ thủ kho.
9. **Cài Đặt Hệ Thống, Sao Lưu CSDL 1-Click & Xuất Excel (UTF-8 BOM)**: Tùy biến thông tin NPP, tài khoản ngân hàng nhận tiền, sao lưu an toàn chỉ với 1 click, tải báo cáo định dạng CSV chuẩn tiếng Việt.
10. **Phân Quyền 5 Vai Trò (RBAC) & Bảo Mật OWASP**: Admin, Kế Toán, Thủ Kho, Giám Sát Tuyến, Sale Thị Trường. Mã hóa mật khẩu `scrypt` kèm random salt, JWT ký `HMAC-SHA256`, giới hạn thử đăng nhập (Rate Limit) và OWASP Security Headers (CSP, X-Frame-Options).
11. **Cổng Bán Hàng SFA Thị Trường (Mobile Terminal)**: Tác nghiệp trực tiếp trên điện thoại: chụp ảnh quầy kệ thực tế có gắn Watermark GPS, kiểm tồn xe tải bán dạo (Van Sales), ghi nhận nợ hàng bổ sung (Backorders).

---

## 📁 Cấu Trúc Dự Án (Monorepo)

```text
ERP_BanHang/
├── apps/
│   ├── web-next/                # Ứng Dụng Web Fullstack Production (Next.js 14 App Router + Tailwind + Prisma)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Schema PostgreSQL / Supabase Transaction Pooler (Port 6543 & 5432)
│   │   │   └── seed.ts         # Dữ liệu mẫu Bánh kẹo VN (Chocopie, AFC, Custas, Oishi...) & Tài khoản mẫu
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/        # 54 Serverless REST API Routes (Auth, Inventory, Orders, MCP, VietQR...)
│   │   │   │   ├── layout.tsx
│   │   │   │   └── page.tsx    # SPA Router điều hướng 11 module nghiệp vụ
│   │   │   ├── components/     # UI Components (Sidebar, Navbar, InteractiveRouteMap, InvoiceModal...)
│   │   │   ├── pages-view/     # 11 Màn hình nghiệp vụ Web FMCG ERP
│   │   │   ├── lib/            # Prisma Client, Supabase Client, Auth scrypt/JWT, Business Services
│   │   │   └── middleware.ts   # OWASP Security Headers & CORS Policy
│   │   ├── vercel.json         # Cấu hình Vercel Serverless (Region sin1 Singapore)
│   │   └── package.json
│   │
│   └── mobile-flutter/          # Ứng Dụng Di Động SFA Độc Lập Cho Sale Thị Trường (Flutter)
│       ├── lib/
│       │   ├── core/constants/api_constants.dart
│       │   └── main.dart
│       ├── pubspec.yaml
│       └── README.md
│
├── HUONG_DAN_DEPLOY_VERCEL_SUPABASE.md # Cẩm nang hướng dẫn triển khai thực tế 0đ/tháng
├── Chay_App_NextJS.bat          # 1-Click khởi động bản Web Next.js cục bộ (Port 3000)
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh (Local Development)

### Cách 1: Sử dụng file chạy nhanh (1-Click)
Nhấp đúp chuột vào file:
```text
Chay_App_NextJS.bat
```
Trình duyệt sẽ tự động mở địa chỉ `http://localhost:3000`.

### Cách 2: Sử dụng dòng lệnh Terminal
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy Web Next.js
npm run dev
```

---

## 🌐 Hướng Dẫn Triển Khai Lên Vercel & Supabase (0đ/tháng)

Toàn bộ quy trình triển khai chi tiết từng bước được hướng dẫn tại:
👉 [HUONG_DAN_DEPLOY_VERCEL_SUPABASE.md](file:///d:/ERP_BanHang/HUONG_DAN_DEPLOY_VERCEL_SUPABASE.md)

Tóm tắt 3 bước:
1. **Supabase**: Tạo Project miễn phí tại [supabase.com](https://supabase.com), copy URL kết nối Transaction Pooler (Port 6543) và Session Pooler (Port 5432).
2. **Push Schema CSDL**: Chạy `npx prisma db push` trong `apps/web-next` để tự động tạo toàn bộ bảng dữ liệu.
3. **Vercel**: Import repository GitHub, chọn thư mục gốc `apps/web-next`, nhập các biến môi trường từ `.env.example` và nhấn **Deploy**.
