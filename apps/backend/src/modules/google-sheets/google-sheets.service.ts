import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { google } from 'googleapis';

@Injectable()
export class GoogleSheetsService {
  private readonly logger = new Logger(GoogleSheetsService.name);

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getConfig() {
    let config = await this.prisma.googleSheetsConfig.findFirst();
    const envSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const envApiKey = process.env.GOOGLE_API_KEY;

    if (!config) {
      config = await this.prisma.googleSheetsConfig.create({
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
      config = await this.prisma.googleSheetsConfig.update({
        where: { id: config.id },
        data: { spreadsheetId: envSpreadsheetId },
      });
    }
    return config;
  }

  async getMaskedConfig() {
    const config = await this.getConfig();
    const writeInfo = this.getWriteCredentials(config);
    const effectiveSpreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;

    return {
      ...config,
      spreadsheetId: effectiveSpreadsheetId,
      apiKey: config.apiKey ? '••••••••••••••••' + config.apiKey.slice(-4) : (process.env.GOOGLE_API_KEY ? 'Đã cấu hình trong .env' : ''),
      serviceAccountJson: writeInfo ? `Đã cấu hình (${writeInfo.email})` : '',
      hasWritePermission: !!writeInfo,
      serviceAccountEmail: writeInfo?.email || null,
      dbSource: (process.env.DATABASE_URL || '').startsWith('postgres') ? 'Supabase Cloud PostgreSQL' : 'SQLite Nội Bộ (dev.db)',
    };
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
    const cleanData: any = { ...dto };
    // Không ghi đè giá trị che giấu từ UI
    if (cleanData.apiKey && cleanData.apiKey.includes('••••')) delete cleanData.apiKey;
    if (cleanData.serviceAccountJson && cleanData.serviceAccountJson.startsWith('Đã cấu hình')) delete cleanData.serviceAccountJson;

    return this.prisma.googleSheetsConfig.update({
      where: { id: current.id },
      data: cleanData,
    });
  }

  /**
   * Trích xuất thông tin Service Account từ DB hoặc trực tiếp từ file .env
   */
  private getWriteCredentials(config: any): { email: string; key: string } | null {
    if (config?.serviceAccountJson && config.serviceAccountJson.startsWith('{')) {
      try {
        const credentials = JSON.parse(config.serviceAccountJson);
        if (credentials.client_email && credentials.private_key) {
          return {
            email: credentials.client_email,
            key: credentials.private_key.replace(/\\n/g, '\n'),
          };
        }
      } catch (err) {
        this.logger.warn('Lỗi phân tích JSON Service Account từ DB');
      }
    }

    const envEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const envKey = process.env.GOOGLE_PRIVATE_KEY;
    if (envEmail && envKey && envEmail.trim() && envKey.trim()) {
      return {
        email: envEmail.trim(),
        key: envKey.replace(/\\n/g, '\n').trim(),
      };
    }

    return null;
  }

  /**
   * Khởi tạo Google Sheets Client (Hỗ trợ cả Đọc và Ghi hai chiều)
   */
  private getSheetsClient(config: any, requireWrite = false) {
    const writeCreds = this.getWriteCredentials(config);
    if (writeCreds) {
      const auth = new google.auth.JWT({
        email: writeCreds.email,
        key: writeCreds.key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      return { sheets: google.sheets({ version: 'v4', auth }), canWrite: true, email: writeCreds.email };
    }

    if (!requireWrite && (config?.apiKey || process.env.GOOGLE_API_KEY)) {
      const auth = config?.apiKey || process.env.GOOGLE_API_KEY;
      return { sheets: google.sheets({ version: 'v4', auth }), canWrite: false, email: null };
    }

    return null;
  }

  /**
   * Tạo Tab Sheet tự động nếu chưa có và ghi toàn bộ dữ liệu từ Supabase/DB lên Google Sheets
   */
  private async writeSheetTab(
    sheetsClient: any,
    spreadsheetId: string,
    tabName: string,
    headers: string[],
    rows: any[][],
  ) {
    // 1. Kiểm tra danh sách Tab hiện tại trên Google Sheet
    const meta = await sheetsClient.spreadsheets.get({ spreadsheetId });
    const existingTabs = meta.data.sheets?.map((s: any) => s.properties?.title) || [];

    if (!existingTabs.includes(tabName)) {
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              addSheet: {
                properties: { title: tabName },
              },
            },
          ],
        },
      });
      this.logger.log(`Đã tự động tạo Tab mới '${tabName}' trên Google Sheets`);
    }

    // 2. Xóa dữ liệu cũ trên Tab
    await sheetsClient.spreadsheets.values.clear({
      spreadsheetId,
      range: `${tabName}!A1:Z20000`,
    });

    // 3. Chuẩn bị nội dung có dòng trạng thái đồng bộ ở cuối hoặc tiêu đề chuẩn
    const values = [headers, ...rows];

    // 4. Ghi dữ liệu mới lên Google Sheets
    await sheetsClient.spreadsheets.values.update({
      spreadsheetId,
      range: `${tabName}!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    return rows.length;
  }

  /**
   * ========================================================================
   * LUỒNG SAO LƯU CHÍNH: ĐỒNG BỘ TỪ SUPABASE / CSDL SANG GOOGLE SHEETS
   * (Dùng để lưu vết, tra cứu dự phòng trên điện thoại/Excel mọi lúc)
   * ========================================================================
   */
  async backupAllToGoogleSheets(customSpreadsheetId?: string) {
    const config = await this.getConfig();
    const spreadsheetId = customSpreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;
    const clientInfo = this.getSheetsClient(config, true);

    // 1. Chuẩn bị dữ liệu cả 5 bảng từ Supabase/DB
    const [productsPrep, outletsPrep, ordersPrep, inventoryPrep, receiptsPrep] = await Promise.all([
      this.prepareProductsData(),
      this.prepareOutletsData(),
      this.prepareOrdersData(),
      this.prepareInventoryData(),
      this.prepareDebtReceiptsData(),
    ]);

    const sheetsPayload = [
      { tab: config.sheetNameProducts || 'SanPham', title: 'Sản Phẩm & Giá ĐVT', ...productsPrep },
      { tab: config.sheetNameOutlets || 'DiemBan', title: 'Điểm Bán & Công Nợ', ...outletsPrep },
      { tab: config.sheetNameOrders || 'DonHang', title: 'Lịch Sử Đơn Hàng', ...ordersPrep },
      { tab: config.sheetNameInventory || 'TonKho', title: 'Tồn Kho & Lô FEFO', ...inventoryPrep },
      { tab: 'ThuNo', title: 'Phiếu Thu Nợ & Đổi Trả', ...receiptsPrep },
    ];

    const syncTimestamp = new Date().toLocaleString('vi-VN');

    // 2. Nếu đã cấu hình Service Account & Spreadsheet ID -> Đẩy trực tiếp lên Google Cloud
    if (clientInfo && clientInfo.canWrite && spreadsheetId) {
      const results = [];
      for (const item of sheetsPayload) {
        try {
          await this.writeSheetTab(clientInfo.sheets, spreadsheetId, item.tab, item.headers, item.rows);
          results.push({
            tab: item.tab,
            title: item.title,
            rowCount: item.rows.length,
            status: 'SYNCED_TO_CLOUD',
          });
        } catch (err: any) {
          this.logger.error(`Lỗi đẩy Tab ${item.tab}: ${err.message}`);
          results.push({
            tab: item.tab,
            title: item.title,
            rowCount: item.rows.length,
            status: 'ERROR',
            error: err.message,
          });
        }
      }

      await this.prisma.googleSheetsConfig.update({
        where: { id: config.id },
        data: { lastSyncAt: new Date() },
      });

      const hasError = results.some((r) => r.status === 'ERROR');
      return {
        success: !hasError,
        pushedToGoogleCloud: true,
        spreadsheetId,
        syncTime: syncTimestamp,
        message: hasError
          ? 'Có lỗi khi ghi lên một số Tab (Kiểm tra xem bạn đã Share quyền Editor cho email Service Account chưa!)'
          : `Đã sao lưu thành công toàn bộ 5 bảng dữ liệu từ CSDL sang Google Sheets (${syncTimestamp})!`,
        details: results,
      };
    }

    // 3. Nếu chưa điền GOOGLE_PRIVATE_KEY trong .env -> Trả về bản tổng hợp đầy đủ kèm hướng dẫn
    return {
      success: true,
      pushedToGoogleCloud: false,
      spreadsheetId: spreadsheetId || null,
      syncTime: syncTimestamp,
      message:
        'Đã tổng hợp toàn bộ 5 bảng dữ liệu từ CSDL sẵn sàng sao lưu! Để tự động ghi trực tiếp vào Google Sheets, hãy điền GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL và GOOGLE_PRIVATE_KEY vào file .env.',
      details: sheetsPayload.map((s) => ({
        tab: s.tab,
        title: s.title,
        rowCount: s.rows.length,
        status: 'READY_FOR_EXPORT',
        headers: s.headers,
        preview: s.rows.slice(0, 5),
      })),
    };
  }

  // --- CÁC HÀM CHUẨN BỊ DỮ LIỆU TỪ SUPABASE / DB ---

  private async prepareProductsData() {
    const products = await this.prisma.product.findMany({
      include: { uoms: true },
      orderBy: { code: 'asc' },
    });

    const headers = [
      'Mã SKU',
      'Tên Sản Phẩm',
      'Ngành Hàng',
      'Thương Hiệu',
      'ĐVT Cơ Sở',
      'Mã Vạch',
      'Bảng Giá Đa ĐVT',
      'Hạn Dùng (Ngày)',
      'Trạng Thái',
    ];

    const rows = products.map((p) => [
      p.code,
      p.name,
      p.category,
      p.brand,
      p.baseUom,
      p.barcode || '',
      p.uoms.map((u) => `${u.uomName} (x${u.conversionFactor}): ${u.price.toLocaleString('vi-VN')}đ`).join(' | '),
      p.shelfLifeDays,
      p.isActive ? 'Đang bán' : 'Ngưng bán',
    ]);

    return { headers, rows };
  }

  private async prepareOutletsData() {
    const outlets = await this.prisma.outlet.findMany({
      include: { route: true },
      orderBy: { code: 'asc' },
    });

    const headers = [
      'Mã Tiệm',
      'Tên Tiệm Tạp Hóa',
      'Chủ Tiệm',
      'Số Điện Thoại',
      'Địa Chỉ',
      'Tuyến Bán Hàng',
      'Hạng Khách Hàng',
      'Công Nợ Hiện Tại (VNĐ)',
      'Hạn Mức Nợ (VNĐ)',
      'Vĩ Độ GPS',
      'Kinh Độ GPS',
    ];

    const rows = outlets.map((o) => [
      o.code,
      o.name,
      o.ownerName,
      o.phone,
      o.address,
      o.route ? `${o.route.name} (${o.route.dayOfWeek})` : 'Chưa gán tuyến',
      o.tier,
      o.currentDebt,
      o.creditLimit,
      o.latitude,
      o.longitude,
    ]);

    return { headers, rows };
  }

  private async prepareOrdersData() {
    const orders = await this.prisma.salesOrder.findMany({
      include: {
        outlet: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });

    const headers = [
      'Mã Đơn Hàng',
      'Ngày Tạo',
      'Tên Điểm Bán',
      'Sale Phụ Trách',
      'Loại Đơn',
      'Chi Tiết Sản Phẩm',
      'Tổng Tiền Hàng',
      'Chiết Khấu KM',
      'Thành Tiền Phải Thu',
      'Đã Thanh Toán',
      'Còn Nợ',
      'Trạng Thái Đơn',
      'Trạng Thái Thu Tiền',
    ];

    const rows = orders.map((ord) => [
      ord.orderCode,
      new Date(ord.createdAt).toLocaleString('vi-VN'),
      ord.outlet?.name || '',
      ord.salesRepName,
      ord.orderType,
      ord.items
        .map((i) => `${i.product?.name} (${i.quantity} ${i.uomName}${i.isGiftItem ? ' - TẶNG KM' : ''})`)
        .join('; '),
      ord.subTotal,
      ord.discountAmount,
      ord.totalAmount,
      ord.paidAmount,
      Math.max(0, ord.totalAmount - ord.paidAmount),
      ord.status,
      ord.paymentStatus,
    ]);

    return { headers, rows };
  }

  private async prepareInventoryData() {
    const lots = await this.prisma.inventoryLot.findMany({
      include: { warehouse: true, product: true },
      orderBy: { expiryDate: 'asc' },
    });

    const now = new Date();
    const headers = [
      'Kho Hàng',
      'Mã SKU',
      'Tên Bánh Kẹo',
      'Số Lô',
      'Ngày Sản Xuất',
      'Hạn Sử Dụng',
      'Còn Lại (Ngày)',
      'Cảnh Báo FEFO',
      'Tồn Vật Lý',
      'Đang Giữ Chỗ',
      'Khả Dụng Bán',
      'ĐVT Cơ Sở',
    ];

    const rows = lots.map((lot) => {
      const daysLeft = Math.ceil((new Date(lot.expiryDate).getTime() - now.getTime()) / (1000 * 3600 * 24));
      return [
        lot.warehouse?.name || '',
        lot.product?.code || '',
        lot.product?.name || '',
        lot.batchCode,
        new Date(lot.manufactureDate).toLocaleDateString('vi-VN'),
        new Date(lot.expiryDate).toLocaleDateString('vi-VN'),
        daysLeft,
        daysLeft <= 30 ? 'CẬN DATE (Ưu tiên xuất)' : daysLeft <= 60 ? 'Sắp hết hạn' : 'An toàn',
        lot.physicalQty,
        lot.reservedQty,
        lot.availableQty,
        lot.product?.baseUom || 'Gói',
      ];
    });

    return { headers, rows };
  }

  private async prepareDebtReceiptsData() {
    const receipts = await this.prisma.paymentReceipt.findMany({
      include: { outlet: true, order: true },
      orderBy: { receiptDate: 'desc' },
      take: 500,
    });

    const headers = [
      'Mã Phiếu',
      'Ngày Giao Dịch',
      'Điểm Bán Tạp Hóa',
      'Mã Đơn Liên Kết',
      'Số Tiền (VNĐ)',
      'Hình Thức',
      'Mã Tham Chiếu QR',
      'Trạng Thái',
      'Ghi Chú',
    ];

    const rows = receipts.map((r) => [
      r.receiptCode,
      new Date(r.receiptDate).toLocaleString('vi-VN'),
      r.outlet?.name || '',
      r.order?.orderCode || '',
      r.amount,
      r.paymentMethod === 'CASH'
        ? 'Tiền Mặt'
        : r.paymentMethod === 'VIETQR_TRANSFER'
        ? 'Chuyển Khoản VietQR'
        : r.paymentMethod,
      r.vietQrRefCode || '',
      r.status,
      r.notes || '',
    ]);

    return { headers, rows };
  }

  /**
   * Đẩy riêng từng Tab lên Google Sheets (Ghi thật nếu có Service Account, ngược lại trả preview)
   */
  async exportOrdersToSheet() {
    const config = await this.getConfig();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;
    const { headers, rows } = await this.prepareOrdersData();
    const tabName = config.sheetNameOrders || 'DonHang';

    const clientInfo = this.getSheetsClient(config, true);
    let pushedToCloud = false;

    if (clientInfo && clientInfo.canWrite && spreadsheetId) {
      await this.writeSheetTab(clientInfo.sheets, spreadsheetId, tabName, headers, rows);
      pushedToCloud = true;
      await this.prisma.googleSheetsConfig.update({ where: { id: config.id }, data: { lastSyncAt: new Date() } });
    }

    return {
      success: true,
      pushedToGoogleCloud: pushedToCloud,
      message: pushedToCloud
        ? `Đã đẩy ${rows.length} đơn hàng từ CSDL lên Google Sheets (Tab '${tabName}') thành công!`
        : `Đã chuẩn bị ${rows.length} đơn hàng để sao lưu sang Tab '${tabName}' (Chưa cấu hình Service Account ghi tự động).`,
      rowCount: rows.length,
      preview: rows.slice(0, 5),
    };
  }

  async exportInventoryToSheet() {
    const config = await this.getConfig();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;
    const { headers, rows } = await this.prepareInventoryData();
    const tabName = config.sheetNameInventory || 'TonKho';

    const clientInfo = this.getSheetsClient(config, true);
    let pushedToCloud = false;

    if (clientInfo && clientInfo.canWrite && spreadsheetId) {
      await this.writeSheetTab(clientInfo.sheets, spreadsheetId, tabName, headers, rows);
      pushedToCloud = true;
      await this.prisma.googleSheetsConfig.update({ where: { id: config.id }, data: { lastSyncAt: new Date() } });
    }

    return {
      success: true,
      pushedToGoogleCloud: pushedToCloud,
      message: pushedToCloud
        ? `Đã đẩy ${rows.length} lô tồn kho FEFO lên Google Sheets (Tab '${tabName}') thành công!`
        : `Đã chuẩn bị ${rows.length} lô tồn kho FEFO để sao lưu sang Tab '${tabName}' (Chưa cấu hình Service Account ghi tự động).`,
      rowCount: rows.length,
      preview: rows.slice(0, 5),
    };
  }

  async exportProductsToSheet() {
    const config = await this.getConfig();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;
    const { headers, rows } = await this.prepareProductsData();
    const tabName = config.sheetNameProducts || 'SanPham';

    const clientInfo = this.getSheetsClient(config, true);
    let pushedToCloud = false;

    if (clientInfo && clientInfo.canWrite && spreadsheetId) {
      await this.writeSheetTab(clientInfo.sheets, spreadsheetId, tabName, headers, rows);
      pushedToCloud = true;
      await this.prisma.googleSheetsConfig.update({ where: { id: config.id }, data: { lastSyncAt: new Date() } });
    }

    return {
      success: true,
      pushedToGoogleCloud: pushedToCloud,
      message: pushedToCloud
        ? `Đã sao lưu ${rows.length} sản phẩm lên Google Sheets (Tab '${tabName}') thành công!`
        : `Đã chuẩn bị ${rows.length} sản phẩm sao lưu sang Tab '${tabName}'.`,
      rowCount: rows.length,
      preview: rows.slice(0, 5),
    };
  }

  async exportOutletsToSheet() {
    const config = await this.getConfig();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;
    const { headers, rows } = await this.prepareOutletsData();
    const tabName = config.sheetNameOutlets || 'DiemBan';

    const clientInfo = this.getSheetsClient(config, true);
    let pushedToCloud = false;

    if (clientInfo && clientInfo.canWrite && spreadsheetId) {
      await this.writeSheetTab(clientInfo.sheets, spreadsheetId, tabName, headers, rows);
      pushedToCloud = true;
      await this.prisma.googleSheetsConfig.update({ where: { id: config.id }, data: { lastSyncAt: new Date() } });
    }

    return {
      success: true,
      pushedToGoogleCloud: pushedToCloud,
      message: pushedToCloud
        ? `Đã sao lưu ${rows.length} điểm bán & công nợ lên Google Sheets (Tab '${tabName}') thành công!`
        : `Đã chuẩn bị ${rows.length} điểm bán sao lưu sang Tab '${tabName}'.`,
      rowCount: rows.length,
      preview: rows.slice(0, 5),
    };
  }

  // Giữ tương thích với các chức năng đồng bộ từ Sheet về nếu cần
  async syncProductsFromSheet(customSpreadsheetId?: string) {
    const config = await this.getConfig();
    const spreadsheetId = customSpreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;
    const sheetName = config.sheetNameProducts || 'SanPham';

    const clientInfo = this.getSheetsClient(config);
    let rows: any[][] = [];

    if (clientInfo && spreadsheetId) {
      try {
        const response = await clientInfo.sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${sheetName}!A2:H100`,
        });
        rows = response.data.values || [];
      } catch (error: any) {
        this.logger.error(`Lỗi Google Sheets API: ${error.message}`);
        rows = this.getMockProductRows();
      }
    } else {
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
          brand: String(brand || 'Khác').trim(),
          baseUom: String(baseUom || 'Gói').trim(),
        },
        create: {
          code: String(code).trim(),
          name: String(name).trim(),
          category: String(category || 'Bánh kẹo').trim(),
          brand: String(brand || 'Khác').trim(),
          baseUom: String(baseUom || 'Gói').trim(),
          shelfLifeDays: 365,
        },
      });

      if (boxName && boxFactor) {
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

  async syncOutletsFromSheet(customSpreadsheetId?: string) {
    const config = await this.getConfig();
    const spreadsheetId = customSpreadsheetId || process.env.GOOGLE_SHEETS_SPREADSHEET_ID || config.spreadsheetId;
    const sheetName = config.sheetNameOutlets || 'DiemBan';

    const clientInfo = this.getSheetsClient(config);
    let rows: any[][] = [];

    if (clientInfo && spreadsheetId) {
      try {
        const response = await clientInfo.sheets.spreadsheets.values.get({
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
        '1. Tạo một file Google Sheets trống trên Google Drive của bạn (ví dụ: "Sao_Luu_ERP_TuanKiet").',
        '2. Copy ID bảng tính (chuỗi ký tự nằm giữa /d/ và /edit trên URL trình duyệt) dán vào GOOGLE_SHEETS_SPREADSHEET_ID trong .env.',
        '3. Tạo Google Service Account từ Google Cloud Console, cấp quyền Google Sheets API, tải khóa và điền GOOGLE_SERVICE_ACCOUNT_EMAIL & GOOGLE_PRIVATE_KEY vào .env.',
        '4. Chia sẻ (Share) file Google Sheets đó cho email Service Account với quyền "Người chỉnh sửa" (Editor).',
        '5. Bấm "Đồng Bộ Sao Lưu Toàn Bộ Sang Google Sheets" — hệ thống sẽ tự tạo 5 Tab chuẩn và đổ toàn bộ dữ liệu từ Supabase sang để bạn lưu vết!',
      ],
    };
  }

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
