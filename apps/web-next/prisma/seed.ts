import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('--- KHỞI TẠO DỮ LIỆU MẪU ERP & DMS BÁNH KẸO (FMCG) ---');

  // 1. Xóa dữ liệu cũ
  await prisma.paymentReceipt.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.storeVisit.deleteMany();
  await prisma.inventoryLot.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.productUom.deleteMany();
  await prisma.product.deleteMany();
  await prisma.outlet.deleteMany();
  await prisma.route.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.promotionRule.deleteMany();
  await prisma.googleSheetsConfig.deleteMany();

  // 2. Tạo Kho
  const warehouseCentral = await prisma.warehouse.create({
    data: {
      code: 'KHO-TONG',
      name: 'Kho Tổng Trung Tâm An Phát (Kho Chính)',
      type: 'CENTRAL',
      address: 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. HCM',
    },
  });

  const warehousePromo = await prisma.warehouse.create({
    data: {
      code: 'KHO-KM',
      name: 'Kho Hàng Khuyến Mãi & Quà Tặng Hãng',
      type: 'PROMOTION',
      address: 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. HCM',
    },
  });

  const warehouseVan = await prisma.warehouse.create({
    data: {
      code: 'VAN-XE-01',
      name: 'Kho Xe Tải Van Sales 01 (Biển số 51D-889.21)',
      type: 'VAN',
      assignedSalesId: 'SALE-01',
    },
  });

  // 3. Tạo Sản phẩm & Đa đơn vị tính (Thùng -> Hộp/Dây -> Gói)
  // SP 1: Chocopie Orion 12P
  const pChocopie = await prisma.product.create({
    data: {
      code: 'ORION-CP-12P',
      name: 'Bánh Chocopie Orion Hộp 12 Cái',
      category: 'Bánh tươi / Bánh phủ sô-cô-la',
      brand: 'Orion',
      baseUom: 'Gói',
      shelfLifeDays: 365,
      barcode: '8936036010015',
      imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300',
      description: 'Bánh Chocopie trứ danh từ Orion, bánh mềm thơm xốp phủ lớp sô-cô-la béo ngọt ngào.',
      uoms: {
        create: [
          { uomName: 'Gói', conversionFactor: 1, isBaseUom: true, isDefaultSaleUom: false, price: 5500 },
          { uomName: 'Hộp', conversionFactor: 12, isBaseUom: false, isDefaultSaleUom: false, price: 62000 },
          { uomName: 'Thùng', conversionFactor: 96, isBaseUom: false, isDefaultSaleUom: true, price: 470000 }, // 1 Thùng = 8 Hộp = 96 Gói
        ],
      },
    },
  });

  // SP 2: Bánh Quy AFC Dinh Dưỡng Lúa Mì
  const pAfc = await prisma.product.create({
    data: {
      code: 'KD-AFC-WHEAT',
      name: 'Bánh Quy AFC Dinh Dưỡng Lúa Mì',
      category: 'Bánh quy giòn',
      brand: 'Kinh Đô',
      baseUom: 'Gói',
      shelfLifeDays: 365,
      barcode: '8934680031122',
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300',
      description: 'Bánh quy dinh dưỡng vị lúa mì bổ sung canxi và chất xơ.',
      uoms: {
        create: [
          { uomName: 'Gói', conversionFactor: 1, isBaseUom: true, isDefaultSaleUom: false, price: 4200 },
          { uomName: 'Hộp', conversionFactor: 8, isBaseUom: false, isDefaultSaleUom: false, price: 32000 },
          { uomName: 'Thùng', conversionFactor: 96, isBaseUom: false, isDefaultSaleUom: true, price: 365000 }, // 1 Thùng = 12 Hộp = 96 Gói
        ],
      },
    },
  });

  // SP 3: Bánh Trứng Custas Kem Trứng
  const pCustas = await prisma.product.create({
    data: {
      code: 'ORION-CUSTAS-6P',
      name: 'Bánh Trứng Custas Kem Trứng 6P',
      category: 'Bánh bông lan / Bánh tươi',
      brand: 'Orion',
      baseUom: 'Gói',
      shelfLifeDays: 300,
      barcode: '8936036010046',
      imageUrl: 'https://images.unsplash.com/photo-1587314168485-3236d6710814?w=300',
      description: 'Bánh trứng phồng xốp nhân kem trứng thơm béo bổ dưỡng.',
      uoms: {
        create: [
          { uomName: 'Gói', conversionFactor: 1, isBaseUom: true, isDefaultSaleUom: false, price: 6500 },
          { uomName: 'Hộp', conversionFactor: 6, isBaseUom: false, isDefaultSaleUom: false, price: 38000 },
          { uomName: 'Thùng', conversionFactor: 96, isBaseUom: false, isDefaultSaleUom: true, price: 580000 }, // 1 Thùng = 16 Hộp = 96 Gói
        ],
      },
    },
  });

  // SP 4: Snack Bắp Cay Oishi
  const pOishi = await prisma.product.create({
    data: {
      code: 'OISHI-BAP-CAY',
      name: 'Snack Bắp Ngọt Cay Oishi 40g',
      category: 'Snack / Bimbim',
      brand: 'Oishi',
      baseUom: 'Gói',
      shelfLifeDays: 180,
      barcode: '8934680010035',
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300',
      description: 'Snack ngô bắp sấy giòn thơm lừng cay cay mặn ngọt.',
      uoms: {
        create: [
          { uomName: 'Gói', conversionFactor: 1, isBaseUom: true, isDefaultSaleUom: false, price: 4500 },
          { uomName: 'Dây', conversionFactor: 10, isBaseUom: false, isDefaultSaleUom: false, price: 44000 },
          { uomName: 'Thùng', conversionFactor: 60, isBaseUom: false, isDefaultSaleUom: true, price: 255000 }, // 1 Thùng = 6 Dây = 60 Gói
        ],
      },
    },
  });

  // 4. Tạo Lô hàng tồn kho (Inventory Lots) kèm Hạn Sử Dụng (FEFO)
  const now = new Date();
  
  // Lô cận date (< 30 ngày) để test cảnh báo FEFO
  const nearDateExpiry = new Date();
  nearDateExpiry.setDate(now.getDate() + 25); // Còn 25 ngày nữa hết hạn!

  // Lô trung bình (~ 90 ngày)
  const midDateExpiry = new Date();
  midDateExpiry.setDate(now.getDate() + 90);

  // Lô xa date (> 250 ngày)
  const farDateExpiry = new Date();
  farDateExpiry.setDate(now.getDate() + 280);

  // Chocopie: 2 Lô (1 lô cận date, 1 lô date xa)
  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouseCentral.id,
      productId: pChocopie.id,
      batchCode: 'LOT-CP-2026-EARLY',
      manufactureDate: new Date(now.getTime() - 300 * 24 * 60 * 60 * 1000),
      expiryDate: nearDateExpiry,
      physicalQty: 480, // 5 thùng = 480 gói (Ưu tiên xuất trước theo FEFO!)
      reservedQty: 0,
      availableQty: 480,
    },
  });

  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouseCentral.id,
      productId: pChocopie.id,
      batchCode: 'LOT-CP-2026-FRESH',
      manufactureDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      expiryDate: farDateExpiry,
      physicalQty: 2880, // 30 thùng = 2880 gói
      reservedQty: 0,
      availableQty: 2880,
    },
  });

  // AFC: Lô HSD trung bình
  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouseCentral.id,
      productId: pAfc.id,
      batchCode: 'LOT-AFC-01',
      manufactureDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
      expiryDate: midDateExpiry,
      physicalQty: 1920, // 20 thùng
      reservedQty: 0,
      availableQty: 1920,
    },
  });

  // Oishi: Kho Tổng và Kho Xe Van Sales
  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouseCentral.id,
      productId: pOishi.id,
      batchCode: 'LOT-OISHI-C1',
      manufactureDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000),
      expiryDate: midDateExpiry,
      physicalQty: 3000, // 50 thùng
      reservedQty: 0,
      availableQty: 3000,
    },
  });

  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouseVan.id,
      productId: pOishi.id,
      batchCode: 'LOT-OISHI-VAN',
      manufactureDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      expiryDate: midDateExpiry,
      physicalQty: 600, // 10 thùng trên xe van
      reservedQty: 0,
      availableQty: 600,
    },
  });

  // Custas: 1 lô cận date 20 ngày
  const custasNearExpiry = new Date();
  custasNearExpiry.setDate(now.getDate() + 18);
  await prisma.inventoryLot.create({
    data: {
      warehouseId: warehouseCentral.id,
      productId: pCustas.id,
      batchCode: 'LOT-CUSTAS-HOT',
      manufactureDate: new Date(now.getTime() - 280 * 24 * 60 * 60 * 1000),
      expiryDate: custasNearExpiry,
      physicalQty: 384, // 4 thùng cận date cần đẩy khuyến mãi
      reservedQty: 0,
      availableQty: 384,
    },
  });

  // 5. Tuyến Bán hàng MCP (Master Call Plan)
  const routeT2 = await prisma.route.create({
    data: {
      code: 'TUYEN-Q1-T2',
      name: 'Tuyến Quận 1 - Thứ Hai',
      dayOfWeek: 'MONDAY',
      salesRepName: 'Nguyễn Văn Hùng',
      salesRepPhone: '0908123456',
    },
  });

  const routeT3 = await prisma.route.create({
    data: {
      code: 'TUYEN-BT-T3',
      name: 'Tuyến Bình Thạnh - Thứ Ba',
      dayOfWeek: 'TUESDAY',
      salesRepName: 'Trần Minh Tuấn',
      salesRepPhone: '0912345678',
    },
  });

  // 6. Điểm bán Tạp Hóa (Outlets) với Tọa độ GPS chuẩn
  const th01 = await prisma.outlet.create({
    data: {
      code: 'TH-001',
      name: 'Tạp Hóa Cô Ba Bến Nghé',
      ownerName: 'Nguyễn Thị Ba',
      phone: '0983112233',
      address: 'Số 18 Lê Lợi, Bến Nghé, Quận 1',
      district: 'Quận 1',
      province: 'Hồ Chí Minh',
      latitude: 10.77685,
      longitude: 106.70085,
      creditLimit: 20000000,
      currentDebt: 4500000,
      tier: 'VIP',
      routeId: routeT2.id,
    },
  });

  const th02 = await prisma.outlet.create({
    data: {
      code: 'TH-002',
      name: 'Tạp Hóa Chị Lan Phố Đi Bộ',
      ownerName: 'Lê Hoàng Lan',
      phone: '0977889900',
      address: 'Số 42 Nguyễn Huệ, Quận 1',
      district: 'Quận 1',
      province: 'Hồ Chí Minh',
      latitude: 10.77452,
      longitude: 106.70351,
      creditLimit: 15000000,
      currentDebt: 1200000,
      tier: 'GOLD',
      routeId: routeT2.id,
    },
  });

  const th03 = await prisma.outlet.create({
    data: {
      code: 'TH-003',
      name: 'Đại Lý Bánh Kẹo Hưng Thịnh',
      ownerName: 'Phạm Hưng Thịnh',
      phone: '0903998877',
      address: 'Số 88 Hai Bà Trưng, Bến Nghé, Quận 1',
      district: 'Quận 1',
      province: 'Hồ Chí Minh',
      latitude: 10.78121,
      longitude: 106.69904,
      creditLimit: 40000000,
      currentDebt: 12500000,
      tier: 'VIP',
      routeId: routeT2.id,
    },
  });

  const th04 = await prisma.outlet.create({
    data: {
      code: 'TH-004',
      name: 'Tạp Hóa Bác Năm Thị Nghè',
      ownerName: 'Trần Văn Năm',
      phone: '0933556677',
      address: 'Số 145 Xô Viết Nghệ Tĩnh, Bình Thạnh',
      district: 'Bình Thạnh',
      province: 'Hồ Chí Minh',
      latitude: 10.80155,
      longitude: 106.71233,
      creditLimit: 10000000,
      currentDebt: 0,
      tier: 'SILVER',
      routeId: routeT3.id,
    },
  });

  // 7. Chương trình Khuyến Mãi (Promotion Rules)
  await prisma.promotionRule.create({
    data: {
      code: 'KM-CHOCO-OISHI',
      name: 'Mua 5 Thùng Chocopie Tặng 1 Dây Snack Oishi Bắp Cay',
      type: 'BUY_X_GET_Y',
      buyProductId: pChocopie.id,
      buyQty: 5,
      buyUom: 'Thùng',
      giftProductId: pOishi.id,
      giftQty: 1,
      giftUom: 'Dây',
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  await prisma.promotionRule.create({
    data: {
      code: 'KM-GIAM-DON-LON',
      name: 'Chiết khấu 3% cho đơn hàng bánh kẹo từ 5.000.000đ',
      type: 'ORDER_DISCOUNT_PERCENT',
      minOrderAmount: 5000000,
      discountPercent: 3,
      startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      isActive: true,
    },
  });

  // 8. Đơn hàng mẫu & Viếng thăm mẫu
  const sampleOrder = await prisma.salesOrder.create({
    data: {
      orderCode: 'ORD-20261031-001',
      outletId: th01.id,
      salesRepName: 'Nguyễn Văn Hùng',
      orderType: 'PRE_SALES',
      status: 'CONFIRMED',
      paymentStatus: 'PARTIALLY_PAID',
      subTotal: 2350000,
      discountAmount: 0,
      totalAmount: 2350000,
      paidAmount: 1000000,
      notes: 'Đã check date và giao trước 15h chiều.',
      items: {
        create: [
          {
            productId: pChocopie.id,
            uomName: 'Thùng',
            quantity: 5,
            baseQty: 480,
            unitPrice: 470000,
            totalPrice: 2350000,
            isGiftItem: false,
            allocatedBatch: 'LOT-CP-2026-EARLY', // Xuất lô cận date theo FEFO
          },
          {
            productId: pOishi.id,
            uomName: 'Dây',
            quantity: 1,
            baseQty: 10,
            unitPrice: 0,
            totalPrice: 0,
            isGiftItem: true, // Hàng tặng khuyến mãi
            allocatedBatch: 'LOT-OISHI-C1',
          },
        ],
      },
      payments: {
        create: {
          receiptCode: 'REC-20261031-001',
          outletId: th01.id,
          amount: 1000000,
          paymentMethod: 'VIETQR_TRANSFER',
          vietQrRefCode: 'ORD-20261031-001-QR',
          status: 'CONFIRMED_BY_ACCOUNTANT',
          notes: 'Khách quét VietQR chuyển khoản đặt cọc',
        },
      },
    },
  });

  // Lịch sử viếng thăm
  await prisma.storeVisit.create({
    data: {
      outletId: th01.id,
      routeId: routeT2.id,
      salesRepName: 'Nguyễn Văn Hùng',
      checkInLat: 10.77682,
      checkInLng: 106.70087,
      distanceMeters: 4.2, // Check-in thành công cách tiệm 4.2m (< 100m)
      isGpsValid: true,
      storePhotoUrl: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=400',
      displayPhotoUrl: 'https://images.unsplash.com/photo-1528698827591-e19ccd7bc23d?w=400',
      storeInventoryNotes: 'Chocopie tồn 2 hộp date tháng 12/2026; AFC hết hàng.',
      hasOrder: true,
      notes: 'Chủ tiệm đồng ý lấy thêm 5 thùng Chocopie để nhận khuyến mãi Oishi.',
    },
  });

  // 9. Cấu hình Google Sheets mặc định
  await prisma.googleSheetsConfig.create({
    data: {
      spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
      sheetNameProducts: 'SanPham',
      sheetNameOutlets: 'DiemBan',
      sheetNameOrders: 'DonHang',
      sheetNameInventory: 'TonKho',
      autoSync: false,
    },
  });

  console.log('✅ KHỞI TẠO DỮ LIỆU SEED THÀNH CÔNG!');
  console.log(' - Đã tạo 4 SKU bánh kẹo với đầy đủ quy đổi Đa đơn vị tính (Thùng/Hộp/Dây/Gói)');
  console.log(' - Đã tạo Lô hàng với HSD cận date và date xa để sẵn sàng chạy thuật toán FEFO');
  console.log(' - Đã tạo Tuyến bán hàng MCP T2, T3 và các tiệm Tạp Hóa với GPS tọa độ chuẩn');
  console.log(' - Đã tạo Đơn hàng mẫu kèm tách dòng Hàng Bán / Hàng Tặng Khuyến Mãi');
}

main()
  .catch((e) => {
    console.error('Lỗi khởi tạo seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

