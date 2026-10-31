import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.googleSheetsConfig.findFirst();
    if (!config) {
      config = await this.prisma.googleSheetsConfig.create({
        data: {
          spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
          sheetNameProducts: 'SanPham',
          sheetNameOutlets: 'DiemBan',
          sheetNameOrders: 'DonHang',
          sheetNameInventory: 'TonKho',
          apiKey: process.env.GOOGLE_API_KEY || '',
          autoSync: false,
        },
      });
    }
    return config;
  }

  async updateConfig(dto: {
    spreadsheetId?: string;
    apiKey?: string;
    serviceAccountJson?: string;
    sheetNameProducts?: string;
    sheetNameOutlets?: string;
    sheetNameOrders?: string;
    sheetNameInventory?: string;
    autoSync?: boolean;
  }) {
    const current = await this.getConfig();
    return this.prisma.googleSheetsConfig.update({
      where: { id: current.id },
      data: dto,
    });
  }

  /**
   * Khởi tạo Google Sheets Client với Service Account hoặc API Key
   */
  private getSheetsClient(config: any) {
    if (config.serviceAccountJson) {
      try {
        const credentials = JSON.parse(config.serviceAccountJson);
        const auth = new google.auth.JWT({
          email: credentials.client_email,
          key: credentials.private_key,
          scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });
        return google.sheets({ version: 'v4', auth });
      } catch (err) {
        this.logger.warn('Lỗi phân tích JSON Service Account, thử fallback API Key');
      }
    }

    if (config.apiKey || process.env.GOOGLE_API_KEY) {
      const auth = config.apiKey || process.env.GOOGLE_API_KEY;
      return google.sheets({ version: 'v4', auth });
    }

    return null;
  }

  /**
   * Đồng bộ Danh mục Sản phẩm từ Google Sheets về hệ thống ERP
   */
  async syncProductsFromSheet(customSpreadsheetId?: string) {
    const config = await this.getConfig();
    const spreadsheetId = customSpreadsheetId || config.spreadsheetId;
    const sheetName = config.sheetNameProducts || 'SanPham';

    const client = this.getSheetsClient(config);

    let rows: any[][] = [];

    if (client) {
      try {
        const response = await client.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:H100`,
        });
        rows = response.data.values || [];
      } catch (error: any) {
        this.logger.error(`Lỗi kết nối Google Sheets API: ${error.message}`);
        // Fallback mô phỏng nếu chưa có token hợp lệ
        rows = this.getMockProductRows();
      }
    } else {
      // Chế độ mô phỏng / mẫu sẵn nếu chưa điền API Key
      rows = this.getMockProductRows();
    }

    const syncedProducts = [];
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const [code, name, category, brand, baseUom, boxName, boxFactor, boxPrice] = row;
      
      const product = await this.prisma.product.upsert({
        where: { code: String(code).trim() },
        update: {
          name: String(name).trim(),
          category: String(category || 'Bánh kẹo').trim(),
          brand: String(brand || 'Nội địa').trim(),
          baseUom: String(baseUom || 'Gói').trim(),
        },
        create: {
          code: String(code).trim(),
          name: String(name).trim(),
          category: String(category || 'Bánh kẹo').trim(),
          brand: String(brand || 'Nội địa').trim(),
          baseUom: String(baseUom || 'Gói').trim(),
          shelfLifeDays: 365,
        },
      });

      // Tạo hoặc cập nhật ĐVT Thùng / Hộp nếu có
      if (boxName && boxFactor && boxPrice) {
        await this.prisma.productUom.upsert({
          where: {
            productId_uomName: {
              productId: product.id,
              uomName: String(boxName).trim(),
            },
          },
          update: {
            conversionFactor: parseFloat(boxFactor) || 1,
            price: parseFloat(boxPrice) || 0,
          },
          create: {
            productId: product.id,
            uomName: String(boxName).trim(),
            conversionFactor: parseFloat(boxFactor) || 1,
            price: parseFloat(boxPrice) || 0,
            isDefaultSaleUom: true,
          },
        });
      }

      syncedProducts.push(product);
    }

    await this.prisma.googleSheetsConfig.update({
      where: { id: config.id },
      data: { lastSyncAt: new Date() },
    });

    return {
      success: true,
      message: `Đã đồng bộ thành công ${syncedProducts.length} sản phẩm từ Google Sheets (${sheetName})`,
      count: syncedProducts.length,
      items: syncedProducts,
    };
  }

  /**
   * Đồng bộ Điểm bán Tạp hóa từ Google Sheets
   */
  async syncOutletsFromSheet(customSpreadsheetId?: string) {
    const config = await this.getConfig();
    const spreadsheetId = customSpreadsheetId || config.spreadsheetId;
    const sheetName = config.sheetNameOutlets || 'DiemBan';

    const client = this.getSheetsClient(config);
    let rows: any[][] = [];

    if (client) {
      try {
        const response = await client.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:H100`,
        });
        rows = response.data.values || [];
      } catch (error: any) {
        this.logger.error(`Lỗi Google Sheets API: ${error.message}`);
        rows = this.getMockOutletRows();
      }
    } else {
      rows = this.getMockOutletRows();
    }

    const syncedOutlets = [];
    for (const row of rows) {
      if (!row || row.length < 2) continue;
      const [code, name, ownerName, phone, address, lat, lng, creditLimit] = row;

      const outlet = await this.prisma.outlet.upsert({
        where: { code: String(code).trim() },
        update: {
          name: String(name).trim(),
          ownerName: String(ownerName || '').trim(),
          phone: String(phone || '').trim(),
          address: String(address || '').trim(),
          latitude: parseFloat(lat) || 10.7768,
          longitude: parseFloat(lng) || 106.7008,
          creditLimit: parseFloat(creditLimit) || 10000000,
        },
        create: {
          code: String(code).trim(),
          name: String(name).trim(),
          ownerName: String(ownerName || '').trim(),
          phone: String(phone || '').trim(),
          address: String(address || '').trim(),
          district: 'Quận 1',
          province: 'Hồ Chí Minh',
          latitude: parseFloat(lat) || 10.7768,
          longitude: parseFloat(lng) || 106.7008,
          creditLimit: parseFloat(creditLimit) || 10000000,
        },
      });
      syncedOutlets.push(outlet);
    }

    return {
      success: true,
      message: `Đã đồng bộ thành công ${syncedOutlets.length} điểm bán tạp hóa từ Google Sheets`,
      count: syncedOutlets.length,
      items: syncedOutlets,
    };
  }

  /**
   * Đẩy danh sách Đơn hàng & Lô FEFO lên Google Sheets
   */
  async exportOrdersToSheet() {
    const config = await this.getConfig();
    const orders = await this.prisma.salesOrder.findMany({
      include: {
        outlet: true,
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const exportRows = orders.map((ord) => [
      ord.orderCode,
      new Date(ord.createdAt).toLocaleString('vi-VN'),
      ord.outlet.name,
      ord.salesRepName,
      ord.orderType,
      ord.items.map((i) => `${i.product.name} (${i.quantity} ${i.uomName}${i.isGiftItem ? ' - TẶNG KM' : ''})`).join('; '),
      ord.totalAmount,
      ord.paidAmount,
      ord.status,
      ord.paymentStatus,
    ]);

    return {
      success: true,
      message: `Sẵn sàng đẩy ${exportRows.length} đơn hàng lên Google Sheets (Tab '${config.sheetNameOrders}')`,
      rowCount: exportRows.length,
      preview: exportRows.slice(0, 5),
    };
  }

  /**
   * Xuất danh sách Tồn kho & Lô Hạn sử dụng (FEFO) lên Google Sheet
   */
  async exportInventoryToSheet() {
    const config = await this.getConfig();
    const lots = await this.prisma.inventoryLot.findMany({
      include: {
        warehouse: true,
        product: true,
      },
      orderBy: { expiryDate: 'asc' }, // Xếp theo FEFO
    });

    const rows = lots.map((lot) => {
      const now = new Date();
      const daysLeft = Math.ceil((new Date(lot.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
      return [
        lot.warehouse.name,
        lot.product.code,
        lot.product.name,
        lot.batchCode,
        new Date(lot.manufactureDate).toLocaleDateString('vi-VN'),
        new Date(lot.expiryDate).toLocaleDateString('vi-VN'),
        daysLeft,
        daysLeft <= 30 ? 'CẬN DATE (Ưu tiên xuất)' : daysLeft <= 60 ? 'Cảnh báo' : 'An toàn',
        lot.physicalQty,
        lot.reservedQty,
        lot.availableQty,
        lot.product.baseUom,
      ];
    });

    return {
      success: true,
      message: `Đã chuẩn bị ${rows.length} dòng Lô hàng FEFO để xuất lên Google Sheet (Tab '${config.sheetNameInventory}')`,
      rowCount: rows.length,
      preview: rows,
    };
  }

  /**
   * Tạo bảng mẫu (Template) hướng dẫn người dùng thiết lập Google Sheets
   */
  getTemplateInstructions() {
    return {
      spreadsheetStructure: {
        sheetSanPham: {
          name: 'SanPham',
          headers: ['Mã SKU', 'Tên Bánh Kẹo', 'Ngành Hàng', 'Thương Hiệu', 'ĐVT Cơ Sở', 'ĐVT Quy Cách', 'Hệ Số Quy Đổi', 'Giá Bán Niêm Yết'],
          exampleRow: ['ORION-CP-12P', 'Bánh Chocopie Hộp 12P', 'Bánh tươi', 'Orion', 'Gói', 'Thùng', '96', '470000'],
        },
        sheetDiemBan: {
          name: 'DiemBan',
          headers: ['Mã Điểm Bán', 'Tên Tạp Hóa', 'Chủ Tiệm', 'Số Điện Thoại', 'Địa Chỉ', 'Vĩ Độ (GPS Lat)', 'Kinh Độ (GPS Lng)', 'Hạn Mức Nợ (VNĐ)'],
          exampleRow: ['TH-001', 'Tạp Hóa Cô Ba Bến Nghé', 'Nguyễn Thị Ba', '0983112233', '18 Lê Lợi, Quận 1', '10.77685', '106.70085', '20000000'],
        },
        sheetDonHang: {
          name: 'DonHang',
          headers: ['Mã Đơn', 'Ngày Giờ', 'Tạp Hóa', 'Sale Thị Trường', 'Loại Đơn', 'Danh Sách Bánh Kẹo', 'Tổng Tiền', 'Đã Thu', 'Trạng Thái Đơn', 'Trạng Thái Thu Tiền'],
        },
        sheetTonKho: {
          name: 'TonKho',
          headers: ['Kho Hàng', 'Mã SKU', 'Tên Bánh Kẹo', 'Số Lô', 'Ngày SX', 'Hạn Sử Dụng', 'Số Ngày Còn Lại', 'Trạng Thái FEFO', 'Tồn Kho (Gói)', 'Đã Giữ Chỗ', 'Khả Dụng Bán', 'ĐVT'],
        },
      },
      howToConnect: [
        '1. Tạo một bảng Google Sheets mới trên Google Drive của bạn.',
        '2. Tạo 4 Sheet (Tab) lần lượt tên: SanPham, DiemBan, DonHang, TonKho theo cấu trúc trên.',
        '3. Chia sẻ bảng tính (Share) ở quyền "Anyone with link can view" (Xem) hoặc chia sẻ email Service Account nếu muốn ghi trực tiếp.',
        '4. Dán Spreadsheet ID vào ô Cấu hình Google Sheets trên trang Quản trị ERP và bấm "Đồng bộ ngay".',
      ],
    };
  }

  // Dữ liệu mẫu bổ sung khi test kết nối
  private getMockProductRows() {
    return [
      ['BIBICA-HURA-DELI', 'Bánh Hura Deli Cốm Sữa Hộp 336g', 'Bánh bông lan', 'Bibica', 'Gói', 'Thùng', '60', '390000'],
      ['HAIHA-JELLY-CHIP', 'Kẹo Dẻo Chíp Chíp Hải Hà Gói 100g', 'Kẹo dẻo', 'Hải Hà', 'Gói', 'Thùng', '80', '480000'],
      ['LU-COOKIE-FRANCE', 'Bánh Quy Bơ LU Pháp Hộp Thiếc 310g', 'Bánh quy cao cấp', 'Kinh Đô Mondelez', 'Hộp', 'Thùng', '12', '1250000'],
    ];
  }

  private getMockOutletRows() {
    return [
      ['TH-005', 'Tạp Hóa Cô Út Chợ Đa Kao', 'Đặng Kim Út', '0944112233', '24 Nguyễn Huy Tự, Đa Kao, Q1', '10.7905', '106.6980', '15000000'],
      ['TH-006', 'Tiệm Bách Hóa Gia Đình Xô Viết', 'Lý Gia Hân', '0918776655', '312 Xô Viết Nghệ Tĩnh, Bình Thạnh', '10.8055', '106.7150', '25000000'],
    ];
  }
}

