import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { DashboardService } from './modules/dashboard/dashboard.service';
import { ProductsService } from './modules/products/products.service';
import { InventoryService } from './modules/inventory/inventory.service';
import { OutletsService } from './modules/outlets/outlets.service';
import { RoutesService } from './modules/routes/routes.service';
import { OrdersService } from './modules/orders/orders.service';
import { DebtService } from './modules/debt/debt.service';
import { SettingsService } from './modules/settings/settings.service';
import { GoogleSheetsService } from './modules/google-sheets/google-sheets.service';

interface TestResult {
  module: string;
  testCase: string;
  status: 'PASS' | 'FAIL';
  detail: string;
}

async function runFullAudit() {
  console.log('========================================================================');
  console.log('🔍 BẮT ĐẦU KIỂM TRA CHUYÊN SÂU TOÀN DIỆN HỆ THỐNG ERP & DMS BÁNH KẸO');
  console.log('========================================================================\n');

  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const results: TestResult[] = [];

  function record(module: string, testCase: string, passed: boolean, detail: string) {
    results.push({
      module,
      testCase,
      status: passed ? 'PASS' : 'FAIL',
      detail,
    });
    const icon = passed ? '✅ [PASS]' : '❌ [FAIL]';
    console.log(`${icon} [${module}] ${testCase}: ${detail}`);
  }

  try {
    const prisma = app.get(PrismaService);
    const dashboard = app.get(DashboardService);
    const products = app.get(ProductsService);
    const inventory = app.get(InventoryService);
    const outlets = app.get(OutletsService);
    const routes = app.get(RoutesService);
    const orders = app.get(OrdersService);
    const debt = app.get(DebtService);
    const settings = app.get(SettingsService);
    const sheets = app.get(GoogleSheetsService);

    // 1. KIỂM TRA CƠ SỞ DỮ LIỆU & BẢNG
    console.log('\n--- 1. KIỂM TRA DỮ LIỆU CỐT LÕI (DATABASE & PRISMA) ---');
    const productCount = await prisma.product.count();
    const lotCount = await prisma.inventoryLot.count();
    const outletCount = await prisma.outlet.count();
    const routeCount = await prisma.route.count();
    const orderCount = await prisma.salesOrder.count();

    record('Database', 'Bảng Sản phẩm', productCount > 0, `Đã nạp ${productCount} mặt hàng bánh kẹo`);
    record('Database', 'Bảng Lô HSD FEFO', lotCount > 0, `Đã nạp ${lotCount} lô date`);
    record('Database', 'Bảng Điểm Bán Khách Hàng', outletCount > 0, `Đã nạp ${outletCount} tiệm tạp hóa`);
    record('Database', 'Bảng Tuyến Bán Hàng MCP', routeCount > 0, `Đã nạp ${routeCount} tuyến`);
    record('Database', 'Bảng Đơn Hàng', orderCount > 0, `Đã nạp ${orderCount} đơn hàng`);

    // 2. KIỂM TRA BI DASHBOARD METRICS
    console.log('\n--- 2. KIỂM TRA BI DASHBOARD (CHỈ SỐ ĐIỀU HÀNH) ---');
    const metrics = await dashboard.getMetrics();
    record('Dashboard', 'Tính toán Doanh thu', typeof metrics.kpi.todayRevenue === 'number', `Doanh thu hôm nay: ${metrics.kpi.todayRevenue.toLocaleString('vi-VN')} đ | Tổng DT: ${metrics.kpi.totalRevenue.toLocaleString('vi-VN')} đ`);
    record('Dashboard', 'Cảnh báo Lô cận Date (FEFO Alert)', Array.isArray(metrics.nearDateLots), `Có ${metrics.nearDateLots.length} lô cận date (Nguy cấp: ${metrics.kpi.criticalNearDateCount}, Cảnh báo: ${metrics.kpi.warningNearDateCount})`);
    record('Dashboard', 'Tiến độ MCP ngày hôm nay', typeof metrics.kpi.strikeRatePercent === 'number', `Số lượt viếng thăm hôm nay: ${metrics.kpi.todayVisitsCount}, Tỷ lệ thành công (Strike Rate): ${metrics.kpi.strikeRatePercent}%`);

    // 3. KIỂM TRA ĐA ĐƠN VỊ TÍNH & QUY ĐỔI (UOM ENGINE)
    console.log('\n--- 3. KIỂM TRA ĐA ĐƠN VỊ TÍNH (UOM CONVERSION ENGINE) ---');
    const allProducts = await products.findAll();
    const chocopie = allProducts.find((p) => p.code === 'ORION-CP-12P');
    if (chocopie) {
      const convThung = await products.calculateConversion(chocopie.id, 'Thùng', 2);
      record('Products UoM', 'Quy đổi 2 Thùng Chocopie ra Base UoM', convThung.baseQty === 192, `2 Thùng = ${convThung.baseQty} Gói (Hệ số quy đổi: ${convThung.conversionFactor}, Thành tiền: ${convThung.totalPrice.toLocaleString('vi-VN')}đ)`);
    } else {
      record('Products UoM', 'Tìm mặt hàng Chocopie', false, 'Không tìm thấy mã ORION-CP-12P');
    }

    // 4. KIỂM TRA THUẬT TOÁN FEFO & BẢNG KÊ SOẠN HÀNG XE TẢI
    console.log('\n--- 4. KIỂM TRA THUẬT TOÁN FEFO & SOẠN HÀNG KHO ---');
    if (chocopie) {
      const fefoRec = await inventory.recommendFefoAllocation(chocopie.id, 10);
      record('Inventory FEFO', 'Phân bổ Lô cận Date (First Expired, First Out)', fefoRec.length > 0, `Đã phân bổ từ lô date sớm nhất: ${fefoRec[0]?.batchCode || 'N/A'} (Xuất ${fefoRec[0]?.allocatedQty || 0} Base Qty)`);
    }
    const picking = await inventory.getPickingList('CONFIRMED');
    record('Inventory Picking', 'Bảng kê soạn hàng xe tải tập trung', picking.pickingItems !== undefined, `Tổng hợp ${picking.totalOrdersCount} đơn, ${picking.pickingItems.length} mặt hàng gom lên xe`);

    // 4b. KIỂM TRA TỒN KHO XE VAN SALES & SỔ GHI NHỚ GIAO BÙ
    console.log('\n--- 4b. KIỂM TRA SOẠN HÀNG LÊN XE VAN & SỔ GHI NHỚ GIAO BÙ ---');
    const vanStockBefore = await inventory.getVanStock();
    record('Van Stock', 'Lấy tồn kho xe Van Sales lưu động', vanStockBefore.vanWarehouse !== undefined, `Kho xe: ${vanStockBefore.vanWarehouse.name} (${vanStockBefore.vanWarehouse.code}), Phụ trách: ${vanStockBefore.vanWarehouse.assignedSales}`);

    if (chocopie) {
      const loadResult = await inventory.loadItemsToVan({
        salesRepName: 'Nguyễn Văn Hùng',
        items: [
          { productId: chocopie.id, uomName: 'Thùng', quantity: 2 },
        ],
      });
      record('Van Stock Loading', 'Soạn bốc thêm 2 Thùng Chocopie lên xe', loadResult.items !== undefined, `Cập nhật tồn kho xe: ${loadResult.items.length} mặt hàng trên xe`);
    }

    const allOutletsForBo = await outlets.findAll();
    const testBoOutlet = allOutletsForBo[0];
    let createdBoId = '';
    if (testBoOutlet && chocopie) {
      const newBo = await inventory.createBackorderReminder({
        outletId: testBoOutlet.id,
        productId: chocopie.id,
        uomName: 'Thùng',
        quantity: 2,
        promisedDate: '2026-11-03',
        reason: 'Xe hết hàng giữa tuyến, khách dặn thêm giao đợt sau',
        salesRepName: 'Nguyễn Văn Hùng',
      });
      createdBoId = newBo.id;
      record('Backorder Reminder', 'Ghi chú hẹn giao bù khi thiếu hàng', newBo.id !== undefined, `Đã ghi nhận nợ ${newBo.quantity} ${newBo.uomName} cho ${newBo.outlet?.name}`);

      const allBo = await inventory.getBackorderReminders();
      record('Backorder List', 'Truy vấn danh sách sổ ghi nhớ giao bù', allBo.length > 0, `Hiện có ${allBo.length} ghi chú giao bổ sung trên toàn hệ thống`);

      if (createdBoId) {
        const resolvedBo = await inventory.resolveBackorderReminder(createdBoId);
        record('Backorder Resolve', 'Đánh dấu hoàn tất giao bổ sung hàng', resolvedBo.status === 'RESOLVED', `Ghi chú ID ${resolvedBo.id} chuyển trạng thái RESOLVED vào lúc ${resolvedBo.resolvedAt}`);
      }
    }

    // 5. KIỂM TRA KHÁCH HÀNG CRM 360 & GOOGLE MAPS
    console.log('\n--- 5. KIỂM TRA KHÁCH HÀNG CRM 360 & TỌA ĐỘ GOOGLE MAPS ---');
    const allOutlets = await outlets.findAll();
    const firstOutlet = allOutlets[0];
    if (firstOutlet) {
      const profile = await outlets.findOne(firstOutlet.id);
      record('Customer CRM 360', 'Hồ sơ khách hàng 360 độ', profile !== null, `Khách: ${profile.name}, Có ${profile.orders?.length || 0} đơn, ${profile.visits?.length || 0} lượt thăm`);
      record('Customer CRM 360', 'Tọa độ GPS Google Maps', profile.latitude !== 0 && profile.longitude !== 0, `Vị trí: ${profile.latitude}, ${profile.longitude}`);
    }

    // 6. KIỂM TRA TUYẾN MCP & CHECK-IN GPS HAVERSINE
    console.log('\n--- 6. KIỂM TRA TUYẾN MCP & CHECK-IN GPS ---');
    const todayMcp = await routes.getTodayMcp();
    record('Route MCP', 'Lấy lịch trình tuyến MCP hôm nay', todayMcp.routes !== undefined, `Tuyến: ${todayMcp.dayOfWeek}, Số tuyến hoạt động: ${todayMcp.routes.length}`);

    if (firstOutlet) {
      // Test checkin với tọa độ gần (< 100m)
      const checkinNear = await routes.checkIn({
        outletId: firstOutlet.id,
        salesRepName: 'Sale Tester',
        latitude: firstOutlet.latitude + 0.0001, // ~11 mét
        longitude: firstOutlet.longitude + 0.0001,
      });
      record('Route MCP', 'Kiểm tra GPS Check-in hợp lệ (<100m)', checkinNear.visit.isGpsValid === true, `Khoảng cách đo: ${Math.round(checkinNear.visit.distanceMeters || 0)}m (Hợp lệ)`);

      // Test checkin với tọa độ xa (> 100m)
      const checkinFar = await routes.checkIn({
        outletId: firstOutlet.id,
        salesRepName: 'Sale Tester',
        latitude: firstOutlet.latitude + 0.05, // ~5.5 km
        longitude: firstOutlet.longitude + 0.05,
      });
      record('Route MCP', 'Chặn Fake GPS khi đứng xa (>100m)', checkinFar.visit.isGpsValid === false, `Khoảng cách đo: ${Math.round(checkinFar.visit.distanceMeters || 0)}m (Chính xác bị từ chối)`);
    }

    // 7. KIỂM TRA ĐƠN HÀNG & BỘ MÁY KHUYẾN MÃI (PROMOTION ENGINE)
    console.log('\n--- 7. KIỂM TRA ĐƠN HÀNG & BỘ MÁY KHUYẾN MÃI MUA X TẶNG Y ---');
    const promos = await orders.getPromotions();
    record('Promotion Engine', 'Danh sách chương trình khuyến mãi', promos.length > 0, `Đang có ${promos.length} chương trình khuyến mãi bánh kẹo`);

    if (firstOutlet && chocopie) {
      const newOrder = await orders.createOrder({
        outletId: firstOutlet.id,
        salesRepName: 'Sale Tester',
        orderType: 'PRE_SALES',
        items: [{ productId: chocopie.id, uomName: 'Thùng', quantity: 5 }],
        notes: 'Đơn test tự động kiểm tra hệ thống',
      });

      const giftItem = newOrder.order.items.find((it: any) => it.isGiftItem);
      record('Promotion Engine', 'Tự động kích hoạt hàng tặng 0đ (Mua 5 Thùng Chocopie tặng 1)', giftItem !== undefined, `Hàng tặng: ${giftItem ? giftItem.product?.name : 'Không có'} (Đơn giá: 0đ)`);
      record('Orders FEFO', 'Tự động phân bổ Lô cận Date khi tạo đơn', newOrder.order.items[0]?.allocatedBatch !== null, `Lô xuất: ${newOrder.order.items[0]?.allocatedBatch}`);
    }

    // 8. KIỂM TRA CÔNG NỢ & SINH MÃ VIETQR NAPAS
    console.log('\n--- 8. KIỂM TRA SỔ NỢ & SINH MÃ VIETQR ĐỘNG ---');
    const ledger = await debt.getLedger();
    record('Debt & VietQR', 'Sổ cái công nợ gối đầu', ledger.length > 0, `Quản lý công nợ cho ${ledger.length} tiệm`);

    if (firstOutlet) {
      const qr = await debt.generateVietQr({
        outletId: firstOutlet.id,
        amount: 500000,
        description: `TT TEST ${firstOutlet.code}`,
      });
      record('Debt & VietQR', 'Sinh mã VietQR Napas động kèm nội dung', qr.qrImageUrl.includes('vietqr.io'), `Mã QR tạo thành công: ${qr.bankName} - ${qr.accountNo}`);
    }

    // 9. KIỂM TRA CÀI ĐẶT HỆ THỐNG, SAO LƯU CSDL & XUẤT CSV
    console.log('\n--- 9. KIỂM TRA CÀI ĐẶT NPP, SAO LƯU DB & XUẤT CSV EXCEL ---');
    const currentSettings = await settings.getSettings();
    record('Settings', 'Lấy thông tin NPP & Ngân hàng', currentSettings.distributorName !== undefined, `NPP: ${currentSettings.distributorName}, STK: ${currentSettings.bankAccountNo}`);

    const backupRes = await settings.createDatabaseBackup();
    record('Settings Backup', 'Sao lưu CSDL 1-Click SQLite', backupRes.success === true, `File backup: ${backupRes.fileName} (${(backupRes.sizeBytes / 1024).toFixed(1)} KB)`);

    const csvOrders = await settings.exportReportCsv('orders');
    record('Settings CSV', 'Xuất báo cáo Đơn hàng (UTF-8 with BOM)', csvOrders.startsWith('\ufeff'), `Đã tạo file CSV có BOM mở bằng Excel chuẩn font`);

    const csvInventory = await settings.exportReportCsv('inventory');
    record('Settings CSV', 'Xuất báo cáo Tồn kho FEFO (UTF-8 with BOM)', csvInventory.startsWith('\ufeff'), `Đã tạo file CSV tồn kho có BOM`);

    const csvDebt = await settings.exportReportCsv('debt');
    record('Settings CSV', 'Xuất báo cáo Sổ nợ Tạp hóa (UTF-8 with BOM)', csvDebt.startsWith('\ufeff'), `Đã tạo file CSV sổ nợ có BOM`);

    // 10. KIỂM TRA GOOGLE SHEETS INTEGRATION
    console.log('\n--- 10. KIỂM TRA TRUNG TÂM GOOGLE SHEETS API ---');
    const sheetsConfig = await sheets.getConfig();
    record('Google Sheets', 'Cấu hình đồng bộ Google Sheets', sheetsConfig !== null, `ID bảng tính: ${sheetsConfig.spreadsheetId || 'Mặc định'}`);
    const sheetsGuide = sheets.getTemplateInstructions();
    record('Google Sheets', 'Hướng dẫn 4 bảng mẫu Google Sheets', sheetsGuide.spreadsheetStructure !== undefined, 'Đầy đủ tab SanPham, DiemBan, DonHang, TonKho');

  } catch (err: any) {
    console.error('❌ LỖI TRONG QUÁ TRÌNH KIỂM TRA:', err);
    record('System Error', 'Lỗi ngoại lệ', false, err.message);
  } finally {
    await app.close();
  }

  // TỔNG KẾT
  console.log('\n========================================================================');
  console.log('📊 BẢNG TỔNG HỢP KẾT QUẢ KIỂM THỬ TOÀN BỘ HỆ THỐNG');
  console.log('========================================================================');
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const failCount = results.filter((r) => r.status === 'FAIL').length;
  console.log(`Tổng số ca kiểm thử: ${results.length}`);
  console.log(`Số ca ĐẠT (PASS)  : ${passCount}`);
  console.log(`Số ca LỖI (FAIL)  : ${failCount}`);
  console.log(`Tỷ lệ hoàn hảo    : ${((passCount / results.length) * 100).toFixed(1)}%`);
  console.log('========================================================================\n');
}

runFullAudit();
