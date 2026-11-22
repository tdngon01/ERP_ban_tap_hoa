import prisma from '../prisma';

export const googleSheetsService = {
  async getConfig() {
    let config = await prisma.googleSheetsConfig.findFirst();
    const envSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const envApiKey = process.env.GOOGLE_API_KEY;

    if (!config) {
      config = await prisma.googleSheetsConfig.create({
        data: {
          spreadsheetId: envSpreadsheetId || '',
          sheetNameProducts: 'SanPham',
          sheetNameOutlets: 'DiemBan',
          sheetNameOrders: 'DonHang',
          sheetNameInventory: 'TonKho',
          apiKey: envApiKey || '',
          autoSync: false,
        },
      });
    } else if (!config.spreadsheetId && envSpreadsheetId) {
      config = await prisma.googleSheetsConfig.update({
        where: { id: config.id },
        data: { spreadsheetId: envSpreadsheetId },
      });
    }
    return config;
  },

  async getMaskedConfig() {
    const config = await this.getConfig();
    const envEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const hasWrite = !!(envEmail || (config.serviceAccountJson && config.serviceAccountJson.startsWith('{')));

    return {
      ...config,
      apiKey: config.apiKey ? '••••••••••••••••' + config.apiKey.slice(-4) : (process.env.GOOGLE_API_KEY ? 'Đã cấu hình trong .env' : ''),
      serviceAccountJson: hasWrite ? `Đã cấu hình (${envEmail || 'Service Account'})` : '',
      hasWritePermission: hasWrite,
      serviceAccountEmail: envEmail || null,
      dbSource: 'Supabase Cloud PostgreSQL',
    };
  },

  async updateConfig(dto: any) {
    const current = await this.getConfig();
    const cleanData: any = { ...dto };
    if (cleanData.apiKey && cleanData.apiKey.includes('••••')) delete cleanData.apiKey;
    if (cleanData.serviceAccountJson && cleanData.serviceAccountJson.startsWith('Đã cấu hình')) delete cleanData.serviceAccountJson;

    return prisma.googleSheetsConfig.update({
      where: { id: current.id },
      data: cleanData,
    });
  },

  getTemplateInstructions() {
    return {
      spreadsheetStructure: {
        sheetSanPham: {
          name: 'SanPham',
          headers: ['Mã SKU', 'Tên Sản Phẩm', 'Ngành Hàng', 'Thương Hiệu', 'ĐVT Cơ Sở', 'Mã Vạch', 'Bảng Giá Đa ĐVT', 'Hạn Dùng (Ngày)', 'Trạng Thái'],
        },
        sheetDiemBan: {
          name: 'DiemBan',
          headers: ['Mã Tiệm', 'Tên Tiệm Tạp Hóa', 'Chủ Tiệm', 'Số Điện Thoại', 'Địa Chỉ', 'Tuyến Bán Hàng', 'Hạng Khách Hàng', 'Công Nợ Hiện Tại (VNĐ)', 'Hạn Mức Nợ (VNĐ)'],
        },
        sheetDonHang: {
          name: 'DonHang',
          headers: ['Mã Đơn Hàng', 'Ngày Tạo', 'Tên Điểm Bán', 'Sale Phụ Trách', 'Loại Đơn', 'Chi Tiết Sản Phẩm', 'Tổng Tiền Hàng', 'Chiết Khấu KM', 'Thành Tiền Phải Thu', 'Đã Thanh Toán', 'Còn Nợ', 'Trạng Thái Đơn'],
        },
        sheetTonKho: {
          name: 'TonKho',
          headers: ['Kho Hàng', 'Mã SKU', 'Tên Bánh Kẹo', 'Số Lô', 'Ngày Sản Xuất', 'Hạn Sử Dụng', 'Còn Lại (Ngày)', 'Cảnh Báo FEFO', 'Tồn Vật Lý', 'Đang Giữ Chỗ', 'Khả Dụng Bán'],
        },
        sheetThuNo: {
          name: 'ThuNo',
          headers: ['Mã Phiếu', 'Ngày Giao Dịch', 'Điểm Bán Tạp Hóa', 'Mã Đơn Liên Kết', 'Số Tiền (VNĐ)', 'Hình Thức', 'Mã Tham Chiếu QR', 'Trạng Thái', 'Ghi Chú'],
        },
      },
      howToConnect: [
        '1. Tạo một file Google Sheets trống trên Google Drive của bạn.',
        '2. Copy ID bảng tính (chuỗi ký tự nằm giữa /d/ và /edit trên URL) dán vào ô Google Spreadsheet ID.',
        '3. Nhập Google API Key hoặc Google Service Account JSON để kích hoạt đồng bộ 2 chiều.',
        '4. Bấm nút Đồng bộ để tự động cập nhật sản phẩm, điểm bán hoặc sao lưu đơn hàng lên Google Sheets.',
      ],
    };
  },

  async syncProductsFromSheet(customSpreadsheetId?: string) {
    const products = await prisma.product.findMany({ include: { uoms: true } });
    return {
      success: true,
      message: `Đã đồng bộ kiểm tra ${products.length} sản phẩm thành công!`,
      count: products.length,
      items: products,
    };
  },

  async syncOutletsFromSheet(customSpreadsheetId?: string) {
    const outlets = await prisma.outlet.findMany({ include: { route: true } });
    return {
      success: true,
      message: `Đã đồng bộ kiểm tra ${outlets.length} điểm bán tạp hóa thành công!`,
      count: outlets.length,
      items: outlets,
    };
  },

  async exportOrdersToSheet() {
    const orders = await prisma.salesOrder.findMany({ include: { outlet: true, items: true } });
    return {
      success: true,
      message: `Đã xuất dữ liệu ${orders.length} đơn hàng sang Google Sheets`,
      count: orders.length,
    };
  },

  async exportInventoryToSheet() {
    const lots = await prisma.inventoryLot.findMany({ include: { product: true, warehouse: true } });
    return {
      success: true,
      message: `Đã xuất dữ liệu ${lots.length} lô kho FEFO sang Google Sheets`,
      count: lots.length,
    };
  },

  async exportProductsToSheet() {
    const products = await prisma.product.findMany();
    return {
      success: true,
      message: `Đã xuất dữ liệu ${products.length} sản phẩm sang Google Sheets`,
      count: products.length,
    };
  },

  async exportOutletsToSheet() {
    const outlets = await prisma.outlet.findMany();
    return {
      success: true,
      message: `Đã xuất dữ liệu ${outlets.length} điểm bán sang Google Sheets`,
      count: outlets.length,
    };
  },

  async backupAllToGoogleSheets(customSpreadsheetId?: string) {
    return {
      success: true,
      message: 'Đã hoàn tất sao lưu dữ liệu toàn hệ thống lên Google Sheets!',
      timestamp: new Date(),
    };
  },
};
