class ApiConstants {
  // Mặc định kết nối Web Next.js Serverless API (Port 3000)
  // Trên máy ảo Android Emulator: http://10.0.2.2:3000/api
  // Trên điện thoại thật (cùng mạng WiFi): http://<IP_MAY_TINH>:3000/api
  // Hoặc URL Vercel khi deploy: https://<your-app>.vercel.app/api
  static String baseUrl = 'http://10.0.2.2:3000/api';

  static String get todayMcpEndpoint => '$baseUrl/routes/mcp/today';
  static String get routesEndpoint => '$baseUrl/routes';
  static String get outletsEndpoint => '$baseUrl/outlets';
  static String get checkInEndpoint => '$baseUrl/routes/checkin';
  static String get checkOutEndpoint => '$baseUrl/routes/checkout';
  static String get productsEndpoint => '$baseUrl/products';
  static String get ordersEndpoint => '$baseUrl/orders';
  static String get vietQrEndpoint => '$baseUrl/debt/vietqr/generate';
  static String get vanStockEndpoint => '$baseUrl/inventory/van-stock';
  static String get backordersEndpoint => '$baseUrl/inventory/backorders';

  static void setBaseUrl(String newUrl) {
    if (newUrl.trim().isNotEmpty) {
      String clean = newUrl.trim();
      if (clean.endsWith('/')) {
        clean = clean.substring(0, clean.length - 1);
      }
      if (!clean.endsWith('/api')) {
        clean = '$clean/api';
      }
      baseUrl = clean;
    }
  }
}
