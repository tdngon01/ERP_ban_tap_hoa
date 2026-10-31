class ApiConstants {
  // Thay thế localhost bằng IP máy tính của bạn khi chạy trên thiết bị thật (VD: http://192.168.1.5:5000)
  // Trên máy ảo Android Emulator dùng: http://10.0.2.2:5000
  static const String baseUrl = 'http://10.0.2.2:5000/api';

  static const String todayMcpEndpoint = '$baseUrl/routes/mcp/today';
  static const String checkInEndpoint = '$baseUrl/routes/checkin';
  static const String checkOutEndpoint = '$baseUrl/routes/checkout';
  static const String productsEndpoint = '$baseUrl/products';
  static const String ordersEndpoint = '$baseUrl/orders';
  static const String vietQrEndpoint = '$baseUrl/debt/vietqr/generate';
  static const String vanStockEndpoint = '$baseUrl/inventory/van-stock';
  static const String backordersEndpoint = '$baseUrl/inventory/backorders';
}

