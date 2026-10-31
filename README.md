# Hệ Thống ERP & DMS Ngành Phân Phối Bánh Kẹo & Tạp Hóa (FMCG)

Hệ thống chuyên biệt cho **Nhà Phân Phối (NPP)** và **Đội ngũ Sale Thị Trường (General Trade - GT)** với quy mô phân phối bánh kẹo, giải quyết triệt để 6 bài toán cốt lõi:
1. **Đa đơn vị tính & Quy cách đóng gói linh hoạt**: Thùng -> Hộp/Dây/Lốc -> Gói/Thanh, tự động quy đổi và hạch toán tồn kho theo Đơn vị cơ sở (Base UoM).
2. **Quản trị Lô & Hạn sử dụng theo FEFO (First Expired, First Out)**: Tự động đề xuất xuất hàng cận date trước, cảnh báo đỏ $\le 30$ ngày, tách biệt Tồn thực tế / Tồn giữ chỗ (Soft Reservation) / Tồn khả dụng.
3. **Bộ máy Khuyến mãi & Chiết khấu phức tạp (Promotion Engine)**: Tự động kích hoạt Mua X tặng Y (hàng tặng đơn giá 0đ), chiết khấu theo giá trị đơn hàng.
4. **Lịch trình tuyến MCP (Master Call Plan T2 - T7) & GPS Check-in**: Kiểm soát vị trí viếng thăm trong bán kính $\le 100\text{m}$, chống gian lận Fake GPS.
5. **Công nợ gối đầu & Sinh mã VietQR động**: Tự động sinh mã VietQR Napas kèm nội dung chuyển khoản để chủ tạp hóa quét thanh toán tức thì và tự động gạch nợ.
6. **Đồng bộ hai chiều Google Sheets API**: Kết nối trực tiếp với bảng Google Sheets của Nhà phân phối, kéo sản phẩm & điểm bán về ERP, đẩy đơn hàng và tồn kho FEFO lên Google Sheet.

---

## 📁 Cấu Trúc Dự Án (Monorepo)

```text
ERP_BanHang/
├── apps/
│   ├── backend/                 # Core API & Nghiệp vụ ERP (NestJS + Prisma + Google Sheets API)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Schema CSDL 13 thực thể chuẩn hóa
│   │   │   └── seed.ts         # Dữ liệu mẫu Bánh kẹo VN (Chocopie, AFC, Custas, Oishi...)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── google-sheets/  # Tích hợp Google Sheets API v4
│   │   │   │   ├── products/       # Đa đơn vị tính & Quy đổi ĐVT
│   │   │   │   ├── inventory/      # Thuật toán FEFO & Quản lý Lô HSD
│   │   │   │   ├── outlets/        # Điểm bán tạp hóa & Hạn mức nợ
│   │   │   │   ├── routes/         # Tuyến MCP T2-T7 & Check-in GPS Haversine
│   │   │   │   ├── orders/         # Khuyến mãi & Đơn Pre-sales / Van sales
│   │   │   │   ├── debt/           # Sổ cái công nợ & Sinh VietQR động
│   │   │   │   └── dashboard/      # BI & Báo cáo điều hành
│   │   │   ├── main.ts
│   │   │   └── app.module.ts
│   │   ├── package.json
│   │   └── .env
│   │
│   ├── web-admin/               # Web Quản Trị NPP & Giả Lập Mobile SFA (React + Vite + Tailwind)
│   │   ├── src/
│   │   │   ├── pages/
│   │   │   │   ├── DashboardPage.tsx       # Bảng điều hành KPI & Cảnh báo FEFO
│   │   │   │   ├── ProductsPage.tsx        # Bánh kẹo & Bộ máy quy đổi ĐVT
│   │   │   │   ├── InventoryFefoPage.tsx   # Kho bãi & Đề xuất bốc lô FEFO
│   │   │   │   ├── OutletsPage.tsx         # Điểm bán tạp hóa GT & Hạn mức nợ
│   │   │   │   ├── RouteMcpPage.tsx        # Tuyến MCP & Giám sát vị trí Sale
│   │   │   │   ├── OrdersPage.tsx          # Đơn hàng & Tách dòng Hàng bán/Tặng
│   │   │   │   ├── DebtVietQrPage.tsx      # Sổ cái công nợ & Sinh mã VietQR
│   │   │   │   ├── GoogleSheetsPage.tsx    # Trung tâm đồng bộ Google Sheets API
│   │   │   │   └── MobileSfaSimulator.tsx  # Giả lập điện thoại Sale 5 bước viếng thăm
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── package.json
│   │
│   └── mobile-flutter/          # Ứng Dụng Di Động SFA Độc Lập Cho Sale Thị Trường (Flutter)
│       ├── lib/
│       │   ├── core/constants/api_constants.dart
│       │   └── main.dart
│       ├── pubspec.yaml
│       └── README.md
│
├── package.json
└── README.md
```

---

## 🚀 Hướng Dẫn Khởi Chạy Dự Án

### Bước 1: Khởi động Backend API (NestJS + Prisma)

Mở một cửa sổ Terminal (PowerShell):
```bash
cd d:\ERP_BanHang\apps\backend

# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi tạo cơ sở dữ liệu và nạp dữ liệu mẫu FMCG Bánh Kẹo
npx prisma db push
npm run seed

# 3. Khởi động Backend API
npm run start:dev
```
Backend API sẽ lắng nghe tại: `http://localhost:5000`

### Bước 2: Khởi động Ứng Dụng Desktop (0 đồng VPS - 0 đồng Domain)

Cách 1 (Nhanh nhất): Nhấp đúp chuột vào tệp tin **`Chay_App_Desktop.bat`** tại thư mục gốc `d:\ERP_BanHang`.
Cửa sổ phần mềm Desktop ERP sẽ tự động mở lên trên màn hình máy tính của bạn!

Cách 2: Chạy lệnh qua PowerShell:
```bash
npm run desktop
```

### Bước 3: Khởi động Web Quản Trị trên Trình Duyệt (Tùy chọn)

Mở cửa sổ Terminal:
```bash
cd d:\ERP_BanHang\apps\web-admin
npm run dev
```
Truy cập trình duyệt tại: `http://localhost:3000`

---

## 📊 Hướng Dẫn Kết Nối Google Sheets API

1. Truy cập tab **Đồng Bộ Google Sheets** trên Web Quản Trị ERP.
2. Tạo một file Google Sheets trên Google Drive của bạn gồm 4 tab (Sheet):
   - `SanPham`: Cột `Mã SKU`, `Tên Bánh Kẹo`, `Ngành Hàng`, `Thương Hiệu`, `ĐVT Cơ Sở`, `ĐVT Quy Cách`, `Hệ Số`, `Giá Bán`.
   - `DiemBan`: Cột `Mã Điểm Bán`, `Tên Tạp Hóa`, `Chủ Tiệm`, `Số Điện Thoại`, `Địa Chỉ`, `GPS Lat`, `GPS Lng`, `Hạn Mức Nợ`.
   - `DonHang`: Cột `Mã Đơn`, `Ngày Giờ`, `Tạp Hóa`, `Sale`, `Mặt Hàng`, `Tổng Tiền`, `Trạng Thái`.
   - `TonKho`: Cột `Kho Hàng`, `Mã SKU`, `Tên Bánh`, `Số Lô`, `HSD`, `Số Ngày Còn Lại`, `FEFO`, `Tồn Khả Dụng`.
3. Chia sẻ bảng tính (Share) ở quyền xem hoặc quyền chỉnh sửa.
4. Copy mã **Spreadsheet ID** (chuỗi nằm giữa `/d/` và `/edit` trong URL) dán vào ô cấu hình và bấm **Lưu Cấu Hình**.
5. Bấm các nút **Đồng Bộ Sản Phẩm**, **Đồng Bộ Điểm Bán**, hoặc **Đẩy Đơn Hàng / Báo Cáo FEFO** với 1 cú click!

---

## 📱 Ứng Dụng Di Động Sale Thị Trường (Flutter)

- Có sẵn **Màn hình Giả lập Mobile SFA** chạy trực tiếp trên Web Admin (`http://localhost:3000` &rarr; chọn mục *Giả Lập Mobile Sale SFA*).
- Dự án Flutter Native độc lập nằm trong thư mục `apps/mobile-flutter`. Khi bạn cài đặt Flutter SDK, chỉ cần vào thư mục này chạy `flutter pub get` và `flutter run`.

