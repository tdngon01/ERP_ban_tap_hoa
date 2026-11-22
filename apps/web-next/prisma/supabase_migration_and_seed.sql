-- ==============================================================================
-- DỰ ÁN: ERP PHÂN PHỐI BÁNH KẸO FMCG & QUẢN LÝ ĐI TUYẾN SFA (SUPABASE POSTGRESQL)
-- TẬP LỆNH MIGRATION & DỮ LIỆU SEED MẪU HOÀN CHỈNH CHO SUPABASE CLOUD
-- Hướng dẫn: Copy toàn bộ nội dung dán vào "SQL Editor" trên Supabase và bấm "Run"
-- ==============================================================================

-- 1. KÍCH HOẠT CÁC EXTENSION CỦA POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. TẠO TOÀN BỘ 16 BẢNG DỮ LIỆU FMCG (TRÙNG KHỚP PRISMA SCHEMA)

-- Bảng 1: Danh mục Sản phẩm bánh kẹo (SKU)
CREATE TABLE IF NOT EXISTS "products" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "barcode" TEXT,
    "baseUom" TEXT NOT NULL DEFAULT 'Gói',
    "shelfLifeDays" INTEGER NOT NULL DEFAULT 365,
    "imageUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "products_category_idx" ON "products"("category");
CREATE INDEX IF NOT EXISTS "products_brand_idx" ON "products"("brand");

-- Bảng 2: Quy đổi Đa Đơn Vị Tính (Thùng -> Hộp -> Gói)
CREATE TABLE IF NOT EXISTS "product_uoms" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "uomName" TEXT NOT NULL,
    "conversionFactor" DOUBLE PRECISION NOT NULL,
    "isBaseUom" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultSaleUom" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "barcode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_uoms_productId_uomName_key" UNIQUE ("productId", "uomName")
);
CREATE INDEX IF NOT EXISTS "product_uoms_productId_idx" ON "product_uoms"("productId");

-- Bảng 3: Quản lý Kho bãi
CREATE TABLE IF NOT EXISTS "warehouses" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CENTRAL',
    "address" TEXT,
    "assignedSalesId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 4: Quản lý Lô & Hạn sử dụng - FEFO (First Expired, First Out)
CREATE TABLE IF NOT EXISTS "inventory_lots" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "warehouseId" TEXT NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "batchCode" TEXT NOT NULL,
    "manufactureDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "physicalQty" DOUBLE PRECISION NOT NULL,
    "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableQty" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "inventory_lots_warehouseId_productId_batchCode_key" UNIQUE ("warehouseId", "productId", "batchCode")
);
CREATE INDEX IF NOT EXISTS "inventory_lots_warehouseId_idx" ON "inventory_lots"("warehouseId");
CREATE INDEX IF NOT EXISTS "inventory_lots_productId_idx" ON "inventory_lots"("productId");
CREATE INDEX IF NOT EXISTS "inventory_lots_expiryDate_idx" ON "inventory_lots"("expiryDate");

-- Bảng 5: Lịch sử dịch chuyển kho
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "warehouseId" TEXT NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL,
    "batchCode" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "uomName" TEXT,
    "refOrderCode" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "stock_movements_warehouseId_idx" ON "stock_movements"("warehouseId");
CREATE INDEX IF NOT EXISTS "stock_movements_productId_idx" ON "stock_movements"("productId");
CREATE INDEX IF NOT EXISTS "stock_movements_createdAt_idx" ON "stock_movements"("createdAt");

-- Bảng 6: Tuyến bán hàng MCP
CREATE TABLE IF NOT EXISTS "routes" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "dayOfWeek" TEXT NOT NULL,
    "salesRepName" TEXT NOT NULL,
    "salesRepPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "routes_dayOfWeek_idx" ON "routes"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "routes_salesRepName_idx" ON "routes"("salesRepName");

-- Bảng 7: Điểm bán Tạp hóa (Outlet)
CREATE TABLE IF NOT EXISTS "outlets" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "province" TEXT NOT NULL DEFAULT 'Hồ Chí Minh',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 10000000,
    "currentDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "routeId" TEXT REFERENCES "routes"("id") ON DELETE SET NULL,
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "outlets_routeId_idx" ON "outlets"("routeId");
CREATE INDEX IF NOT EXISTS "outlets_phone_idx" ON "outlets"("phone");

-- Bảng 8: Lịch sử Viếng thăm Điểm bán của Sale
CREATE TABLE IF NOT EXISTS "store_visits" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "outletId" TEXT NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "routeId" TEXT REFERENCES "routes"("id") ON DELETE SET NULL,
    "salesRepName" TEXT NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP(3),
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "distanceMeters" DOUBLE PRECISION,
    "isGpsValid" BOOLEAN NOT NULL DEFAULT false,
    "storePhotoUrl" TEXT,
    "displayPhotoUrl" TEXT,
    "storeInventoryNotes" TEXT,
    "hasOrder" BOOLEAN NOT NULL DEFAULT false,
    "noOrderReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "store_visits_outletId_idx" ON "store_visits"("outletId");
CREATE INDEX IF NOT EXISTS "store_visits_visitDate_idx" ON "store_visits"("visitDate");
CREATE INDEX IF NOT EXISTS "store_visits_salesRepName_idx" ON "store_visits"("salesRepName");

-- Bảng 9: Bộ máy Khuyến mãi (Promotion Engine)
CREATE TABLE IF NOT EXISTS "promotion_rules" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" TEXT NOT NULL UNIQUE,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "minOrderAmount" DOUBLE PRECISION,
    "buyProductId" TEXT,
    "buyQty" DOUBLE PRECISION,
    "buyUom" TEXT,
    "giftProductId" TEXT,
    "giftQty" DOUBLE PRECISION,
    "giftUom" TEXT,
    "discountPercent" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "promotion_rules_isActive_idx" ON "promotion_rules"("isActive");
CREATE INDEX IF NOT EXISTS "promotion_rules_startDate_endDate_idx" ON "promotion_rules"("startDate", "endDate");

-- Bảng 10: Đơn hàng Bán (Sales Order)
CREATE TABLE IF NOT EXISTS "sales_orders" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "orderCode" TEXT NOT NULL UNIQUE,
    "outletId" TEXT NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "salesRepName" TEXT NOT NULL,
    "orderType" TEXT NOT NULL DEFAULT 'PRE_SALES',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paymentStatus" TEXT NOT NULL DEFAULT 'UNPAID',
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "sales_orders_outletId_idx" ON "sales_orders"("outletId");
CREATE INDEX IF NOT EXISTS "sales_orders_status_idx" ON "sales_orders"("status");
CREATE INDEX IF NOT EXISTS "sales_orders_paymentStatus_idx" ON "sales_orders"("paymentStatus");
CREATE INDEX IF NOT EXISTS "sales_orders_createdAt_idx" ON "sales_orders"("createdAt");

-- Bảng 11: Chi tiết Đơn hàng & Tách Dòng Hàng Bán / Hàng Tặng KM
CREATE TABLE IF NOT EXISTS "sales_order_items" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "orderId" TEXT NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "products"("id"),
    "uomName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "baseQty" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "isGiftItem" BOOLEAN NOT NULL DEFAULT false,
    "promotionRuleId" TEXT,
    "allocatedBatch" TEXT
);
CREATE INDEX IF NOT EXISTS "sales_order_items_orderId_idx" ON "sales_order_items"("orderId");
CREATE INDEX IF NOT EXISTS "sales_order_items_productId_idx" ON "sales_order_items"("productId");

-- Bảng 12: Phiếu Thu Tiền & Gạch Nợ VietQR
CREATE TABLE IF NOT EXISTS "payment_receipts" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "receiptCode" TEXT NOT NULL UNIQUE,
    "outletId" TEXT NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "orderId" TEXT REFERENCES "sales_orders"("id") ON DELETE SET NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'VIETQR_TRANSFER',
    "vietQrRefCode" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CONFIRMED_BY_ACCOUNTANT',
    "receiptDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT
);
CREATE INDEX IF NOT EXISTS "payment_receipts_outletId_idx" ON "payment_receipts"("outletId");
CREATE INDEX IF NOT EXISTS "payment_receipts_orderId_idx" ON "payment_receipts"("orderId");
CREATE INDEX IF NOT EXISTS "payment_receipts_receiptDate_idx" ON "payment_receipts"("receiptDate");

-- Bảng 13: Cấu hình Đồng bộ Google Sheets
CREATE TABLE IF NOT EXISTS "google_sheets_configs" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "spreadsheetId" TEXT NOT NULL,
    "sheetNameProducts" TEXT NOT NULL DEFAULT 'SanPham',
    "sheetNameOutlets" TEXT NOT NULL DEFAULT 'DiemBan',
    "sheetNameOrders" TEXT NOT NULL DEFAULT 'DonHang',
    "sheetNameInventory" TEXT NOT NULL DEFAULT 'TonKho',
    "apiKey" TEXT,
    "serviceAccountJson" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 14: Cài đặt Hệ thống & Tài khoản VietQR NPP
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "distributorName" TEXT NOT NULL DEFAULT 'NHÀ PHÂN PHỐI BÁNH KẸO AN PHÁT',
    "phone" TEXT NOT NULL DEFAULT '0908.123.456 - 028.3888.9999',
    "address" TEXT NOT NULL DEFAULT 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. Hồ Chí Minh',
    "taxCode" TEXT DEFAULT '0312345678',
    "bankName" TEXT NOT NULL DEFAULT 'MBBank (Ngân Hàng Quân Đội)',
    "bankBin" TEXT NOT NULL DEFAULT '970422',
    "bankAccountNo" TEXT NOT NULL DEFAULT '0988889999',
    "bankAccountName" TEXT NOT NULL DEFAULT 'NPP BANH KEO AN PHAT',
    "autoBackupDays" INTEGER NOT NULL DEFAULT 1,
    "invoiceNotes" TEXT DEFAULT 'Cảm ơn Quý khách! Vui lòng kiểm tra kỹ số lượng, hạn sử dụng bánh kẹo và quét mã QR thanh toán.',
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 15: Ghi nhớ Nợ Hàng / Giao Bù Xe Van (Backorders)
CREATE TABLE IF NOT EXISTS "backorder_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "outletId" TEXT NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "productId" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "uomName" TEXT NOT NULL DEFAULT 'Thùng',
    "quantity" DOUBLE PRECISION NOT NULL,
    "promisedDate" TIMESTAMP(3),
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "salesRepName" TEXT,
    "notes" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "backorder_reminders_outletId_idx" ON "backorder_reminders"("outletId");
CREATE INDEX IF NOT EXISTS "backorder_reminders_productId_idx" ON "backorder_reminders"("productId");
CREATE INDEX IF NOT EXISTS "backorder_reminders_status_idx" ON "backorder_reminders"("status");

-- Bảng 16: Tài khoản & Phân quyền Người dùng (RBAC)
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "username" TEXT NOT NULL UNIQUE,
    "password" TEXT NOT NULL DEFAULT '123456',
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'SALES_REP',
    "phone" TEXT,
    "email" TEXT,
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

-- 3. KÍCH HOẠT SUPABASE REALTIME VÀ STORAGE BUCKETS
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE "sales_orders";
    ALTER PUBLICATION supabase_realtime ADD TABLE "outlets";
    ALTER PUBLICATION supabase_realtime ADD TABLE "store_visits";
    ALTER PUBLICATION supabase_realtime ADD TABLE "backorder_reminders";
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

INSERT INTO storage.buckets ("id", "name", "public") 
VALUES 
    ('store-photos', 'store-photos', true),
    ('display-photos', 'display-photos', true),
    ('product-images', 'product-images', true)
ON CONFLICT ("id") DO NOTHING;

-- 4. NẠP DỮ LIỆU SEED MẪU ĐẦY ĐỦ (CHUẨN FMCG BÁNH KẸO)

-- A. Tài khoản mẫu (Mật khẩu chuẩn 123456 đã băm scrypt)
INSERT INTO "users" ("id", "username", "password", "fullName", "role", "phone", "email", "isActive")
VALUES
    ('u-admin', 'admin', '40975276e37a58a6a615b6b17a850162:3804e44f66ee4d7e4dbe36d96ae74f0a10db9339c388916d2c0ab89e19f4ee531510b9a948a41017c17b65ec13dd2bc2d766553cabdb07209949c6d47a968f31', 'Trần Đại Nghĩa (Chủ NPP)', 'ADMIN', '0908123456', 'admin@anphatfmcg.vn', true),
    ('u-ketoan', 'ketoan', '40975276e37a58a6a615b6b17a850162:3804e44f66ee4d7e4dbe36d96ae74f0a10db9339c388916d2c0ab89e19f4ee531510b9a948a41017c17b65ec13dd2bc2d766553cabdb07209949c6d47a968f31', 'Nguyễn Thu Hương', 'ACCOUNTANT', '0912345678', 'huong.ketoan@anphatfmcg.vn', true),
    ('u-thukho', 'thukho', '40975276e37a58a6a615b6b17a850162:3804e44f66ee4d7e4dbe36d96ae74f0a10db9339c388916d2c0ab89e19f4ee531510b9a948a41017c17b65ec13dd2bc2d766553cabdb07209949c6d47a968f31', 'Trần Văn Khoa', 'WAREHOUSE', '0933456789', 'khoa.kho@anphatfmcg.vn', true),
    ('u-giamsat', 'giamsat', '40975276e37a58a6a615b6b17a850162:3804e44f66ee4d7e4dbe36d96ae74f0a10db9339c388916d2c0ab89e19f4ee531510b9a948a41017c17b65ec13dd2bc2d766553cabdb07209949c6d47a968f31', 'Lê Hoàng Nam', 'SUPERVISOR', '0977889900', 'nam.giamsat@anphatfmcg.vn', true),
    ('u-sale01', 'sale01', '40975276e37a58a6a615b6b17a850162:3804e44f66ee4d7e4dbe36d96ae74f0a10db9339c388916d2c0ab89e19f4ee531510b9a948a41017c17b65ec13dd2bc2d766553cabdb07209949c6d47a968f31', 'Nguyễn Văn Hùng', 'SALES_REP', '0909123456', 'hung.sales@anphatfmcg.vn', true)
ON CONFLICT ("username") DO UPDATE SET "password" = EXCLUDED."password";

-- B. Kho bãi
INSERT INTO "warehouses" ("id", "code", "name", "type", "address", "assignedSalesId")
VALUES
    ('wh-01', 'KHO-TONG', 'Kho Tổng Trung Tâm An Phát (Kho Chính)', 'CENTRAL', 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. HCM', NULL),
    ('wh-02', 'KHO-KM', 'Kho Hàng Khuyến Mãi & Quà Tặng Hãng', 'PROMOTION', 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. HCM', NULL),
    ('wh-03', 'VAN-XE-01', 'Kho Xe Tải Van Sales 01 (Biển số 51D-889.21)', 'VAN', 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. HCM', 'SALE-01')
ON CONFLICT ("code") DO NOTHING;

-- C. Sản phẩm Bánh kẹo & Quy đổi ĐVT
INSERT INTO "products" ("id", "code", "name", "category", "brand", "baseUom", "shelfLifeDays", "barcode", "imageUrl", "description")
VALUES
    ('prod-cp', 'ORION-CP-12P', 'Bánh Chocopie Orion Hộp 12 Cái', 'Bánh tươi / Bánh phủ sô-cô-la', 'Orion', 'Gói', 365, '8936036010015', 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300', 'Bánh Chocopie trứ danh từ Orion, bánh mềm thơm xốp phủ lớp sô-cô-la béo ngọt ngào.'),
    ('prod-afc', 'KD-AFC-WHEAT', 'Bánh Quy AFC Dinh Dưỡng Lúa Mì', 'Bánh quy giòn', 'Kinh Đô', 'Gói', 365, '8934680031122', 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300', 'Bánh quy dinh dưỡng vị lúa mì bổ sung canxi và chất xơ.'),
    ('prod-custas', 'ORION-CUSTAS-6P', 'Bánh Trứng Custas Kem Trứng 6P', 'Bánh tươi / Bánh trứng', 'Orion', 'Gói', 365, '8936036010084', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300', 'Bánh trứng Custas vỏ bánh xốp mềm nhân kem trứng ngọt bùi giàu dinh dưỡng.'),
    ('prod-oishi', 'OISHI-SNACK-SPICY', 'Snack Oishi Tôm Cay Đặc Biệt 40g', 'Snack / Bắp rang', 'Oishi', 'Gói', 180, '8934789010012', 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=300', 'Snack tôm cay Oishi giòn rụm vị cay đậm đà.')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "product_uoms" ("id", "productId", "uomName", "conversionFactor", "isBaseUom", "isDefaultSaleUom", "price")
VALUES
    ('uom-cp-1', 'prod-cp', 'Gói', 1, true, false, 5500),
    ('uom-cp-2', 'prod-cp', 'Hộp', 12, false, false, 62000),
    ('uom-cp-3', 'prod-cp', 'Thùng', 96, false, true, 470000),
    ('uom-afc-1', 'prod-afc', 'Gói', 1, true, false, 4200),
    ('uom-afc-2', 'prod-afc', 'Hộp', 8, false, false, 32000),
    ('uom-afc-3', 'prod-afc', 'Thùng', 96, false, true, 365000),
    ('uom-custas-1', 'prod-custas', 'Gói', 1, true, false, 5800),
    ('uom-custas-2', 'prod-custas', 'Hộp', 6, false, false, 33500),
    ('uom-custas-3', 'prod-custas', 'Thùng', 96, false, true, 510000),
    ('uom-oishi-1', 'prod-oishi', 'Gói', 1, true, false, 6000),
    ('uom-oishi-2', 'prod-oishi', 'Thùng', 50, false, true, 280000)
ON CONFLICT ("productId", "uomName") DO NOTHING;

-- D. Lô hàng Quản trị FEFO
INSERT INTO "inventory_lots" ("id", "warehouseId", "productId", "batchCode", "manufactureDate", "expiryDate", "physicalQty", "reservedQty", "availableQty")
VALUES
    -- Chocopie: 1 Lô cận date (25 ngày) + 1 Lô date dài
    ('lot-cp-01', 'wh-01', 'prod-cp', 'LOT-CP-202512', NOW() - INTERVAL '11 months', NOW() + INTERVAL '25 days', 288, 0, 288),
    ('lot-cp-02', 'wh-01', 'prod-cp', 'LOT-CP-202604', NOW() - INTERVAL '6 months', NOW() + INTERVAL '180 days', 1920, 96, 1824),
    -- AFC: 1 Lô cận date (18 ngày - cảnh báo đỏ) + 1 Lô date dài
    ('lot-afc-01', 'wh-01', 'prod-afc', 'LOT-AFC-RED', NOW() - INTERVAL '11 months', NOW() + INTERVAL '18 days', 192, 0, 192),
    ('lot-afc-02', 'wh-01', 'prod-afc', 'LOT-AFC-SAFE', NOW() - INTERVAL '2 months', NOW() + INTERVAL '300 days', 960, 0, 960),
    -- Custas: Lô an toàn
    ('lot-custas-01', 'wh-01', 'prod-custas', 'LOT-CUSTAS-2026', NOW() - INTERVAL '3 months', NOW() + INTERVAL '270 days', 960, 0, 960),
    -- Oishi Khuyến Mãi tại Kho KM
    ('lot-oishi-km', 'wh-02', 'prod-oishi', 'LOT-OISHI-GIFT', NOW() - INTERVAL '1 month', NOW() + INTERVAL '150 days', 500, 0, 500)
ON CONFLICT ("warehouseId", "productId", "batchCode") DO NOTHING;

-- E. Tuyến bán hàng MCP & Điểm bán Tạp Hóa
INSERT INTO "routes" ("id", "code", "name", "dayOfWeek", "salesRepName", "salesRepPhone")
VALUES
    ('rt-01', 'TUYEN-Q1-T2', 'Tuyến Quận 1 - Bến Nghé & Đa Kao (T2)', 'MONDAY', 'Nguyễn Văn Hùng', '0909123456'),
    ('rt-02', 'TUYEN-Q5-T3', 'Tuyến Quận 5 - Chợ Lớn & An Đông (T3)', 'TUESDAY', 'Nguyễn Văn Hùng', '0909123456')
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "outlets" ("id", "code", "name", "ownerName", "phone", "address", "district", "province", "latitude", "longitude", "creditLimit", "currentDebt", "routeId", "tier")
VALUES
    ('out-01', 'TH-Q1-001', 'Tạp Hóa Cô Ba Bến Nghé', 'Nguyễn Thị Ba', '0903112233', 'Số 42 Đường Ngô Đức Kế, P. Bến Nghé', 'Quận 1', 'Hồ Chí Minh', 10.77382, 106.70487, 20000000, 4700000, 'rt-01', 'VIP'),
    ('out-02', 'TH-Q1-002', 'Tạp Hóa Chị Lan Phố Đi Bộ', 'Trần Mai Lan', '0918445566', 'Số 88 Đường Nguyễn Huệ, P. Bến Nghé', 'Quận 1', 'Hồ Chí Minh', 10.77450, 106.70320, 15000000, 1840000, 'rt-01', 'GOLD'),
    ('out-03', 'TH-Q1-003', 'Tiệm Bánh Kẹo Chú Bảy', 'Võ Văn Bảy', '0988776655', 'Số 15 Đinh Tiên Hoàng, P. Đa Kao', 'Quận 1', 'Hồ Chí Minh', 10.78910, 106.69950, 10000000, 0, 'rt-01', 'STANDARD'),
    ('out-04', 'TH-Q5-001', 'Đại Lý Bánh Kẹo Hưng Phát', 'Lý Gia Thành', '0908889911', 'Số 102 Đường Châu Văn Liêm, Phường 11', 'Quận 5', 'Hồ Chí Minh', 10.75230, 106.65780, 50000000, 12500000, 'rt-02', 'VIP')
ON CONFLICT ("code") DO NOTHING;

-- F. Bộ máy khuyến mãi (Mua 5 Chocopie tặng 1 Oishi)
INSERT INTO "promotion_rules" ("id", "code", "name", "type", "buyProductId", "buyQty", "buyUom", "giftProductId", "giftQty", "giftUom", "startDate", "endDate", "isActive")
VALUES
    ('pr-01', 'KM-CHOCO-GIFT-OISHI', 'Mua 5 Thùng Chocopie Tặng 1 Thùng Oishi Bắp Cay', 'BUY_X_GET_Y', 'prod-cp', 5, 'Thùng', 'prod-oishi', 1, 'Thùng', NOW() - INTERVAL '15 days', NOW() + INTERVAL '45 days', true)
ON CONFLICT ("code") DO NOTHING;

-- G. Cài đặt Doanh nghiệp mặc định
INSERT INTO "system_settings" ("id", "distributorName", "phone", "address", "taxCode", "bankName", "bankBin", "bankAccountNo", "bankAccountName")
VALUES
    ('default', 'NHÀ PHÂN PHỐI BÁNH KẸO AN PHÁT', '0908.123.456 - 028.3888.9999', 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. Hồ Chí Minh', '0312345678', 'MBBank (Ngân Hàng Quân Đội)', '970422', '0988889999', 'NPP BANH KEO AN PHAT')
ON CONFLICT ("id") DO NOTHING;

-- H. Cấu hình Google Sheets mặc định
INSERT INTO "google_sheets_configs" ("id", "spreadsheetId", "sheetNameProducts", "sheetNameOutlets", "sheetNameOrders", "sheetNameInventory", "autoSync")
VALUES
    ('gs-default', '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms', 'SanPham', 'DiemBan', 'DonHang', 'TonKho', false)
ON CONFLICT ("id") DO NOTHING;
