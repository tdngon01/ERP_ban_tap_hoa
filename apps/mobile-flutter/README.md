# Ứng Dụng Di Động SFA / DMS (Flutter) - Phân Phối Bánh Kẹo FMCG

Đây là dự án Mobile App độc lập dành cho **Nhân viên bán hàng thị trường (Sale thị trường)** và **Nhân viên giao nhận / Van Sales**.

## Các Tính Năng Trọng Tâm
1. **Lịch trình tuyến MCP (Master Call Plan)** Thứ 2 đến Thứ 7 tự động tải theo lịch làm việc.
2. **Quy trình 5 bước viếng thăm tạp hóa chuẩn hóa**:
   - Bước 1: Check-in GPS (Xác thực vị trí cách tiệm $\le 100\text{m}$, chặn Fake GPS).
   - Bước 2: Kiểm date & tồn quầy bánh kẹo (ghi nhận hàng cận date để hỗ trợ đổi trả).
   - Bước 3: Chụp ảnh quầy kệ trưng bày (POSM) có đóng dấu watermark thời gian thực & GPS.
   - Bước 4: Lên đơn nhanh đa đơn vị tính (Thùng / Hộp / Dây / Gói) + Tự động tính khuyến mãi Mua X tặng Y.
   - Bước 5: Check-out & hiển thị mã VietQR động để chủ tiệm quét trả tiền.
3. **Cơ chế Hoạt động Ngoại tuyến (Offline-First)**: Lưu trữ tạm trên SQLite/Drift và tự động đồng bộ ngầm (Background Sync) khi có mạng 4G.

---

## Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Yêu Cầu Môi Trường
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (phiên bản 3.19+ hoặc 3.22+)
- Android Studio hoặc VS Code có cài extension Flutter & Dart
- Máy ảo Android Emulator hoặc điện thoại thật bật chế độ USB Debugging

### Các Lệnh Thực Thi

1. **Cài đặt thư viện dependencies:**
   ```bash
   cd apps/mobile-flutter
   flutter pub get
   ```

2. **Cấu hình địa chỉ IP máy chủ API:**
   - Mở file `lib/core/constants/api_constants.dart`.
   - Cập nhật `baseUrl`:
     - Nếu chạy trên máy ảo Android Emulator: giữ nguyên `http://10.0.2.2:5000/api`.
     - Nếu chạy trên điện thoại thật cắm cáp: đổi thành IP WiFi của máy tính (ví dụ `http://192.168.1.15:5000/api`).

3. **Chạy ứng dụng:**
   ```bash
   flutter run
   ```

