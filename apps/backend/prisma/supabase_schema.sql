-- ==============================================================================
-- DỰ ÁN: ERP PHÂN PHỐI BÁNH KẸO FMCG & QUẢN LÝ ĐI TUYẾN SFA (SUPABASE POSTGRESQL)
-- TẬP LỆNH DDL TẠO TOÀN BỘ CƠ SỞ DỮ LIỆU & BẢO MẬT TRÊN SUPABASE CLOUD
-- Hướng dẫn: Copy toàn bộ nội dung file này dán vào "SQL Editor" trên Supabase và bấm "Run"
-- ==============================================================================

-- 1. KÍCH HOẠT CÁC EXTENSION MẠNH MẼ CỦA POSTGRESQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. TẠO CÁC BẢNG DỮ LIỆU CHÍNH (15 THỰC THỂ FMCG)

-- Bảng 1: Danh mục Sản phẩm bánh kẹo (SKU)
CREATE TABLE IF NOT EXISTS "products" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" VARCHAR(64) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "brand" VARCHAR(100) NOT NULL,
    "barcode" VARCHAR(64),
    "baseUom" VARCHAR(32) NOT NULL DEFAULT 'Gói',
    "shelfLifeDays" INTEGER NOT NULL DEFAULT 365,
    "imageUrl" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_products_category" ON "products"("category");
CREATE INDEX IF NOT EXISTS "idx_products_brand" ON "products"("brand");
CREATE INDEX IF NOT EXISTS "idx_products_name_trgm" ON "products" USING gin ("name" gin_trgm_ops);

-- Bảng 2: Quy đổi Đa Đơn Vị Tính (Thùng / Hộp / Gói)
CREATE TABLE IF NOT EXISTS "product_uoms" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "productId" VARCHAR(64) NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "uomName" VARCHAR(32) NOT NULL,
    "conversionFactor" DOUBLE PRECISION NOT NULL,
    "isBaseUom" BOOLEAN NOT NULL DEFAULT false,
    "isDefaultSaleUom" BOOLEAN NOT NULL DEFAULT false,
    "price" DOUBLE PRECISION NOT NULL,
    "barcode" VARCHAR(64),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_product_uom" UNIQUE ("productId", "uomName")
);

CREATE INDEX IF NOT EXISTS "idx_product_uoms_productId" ON "product_uoms"("productId");

-- Bảng 3: Quản lý Kho bãi (Kho tổng, Kho xe Van)
CREATE TABLE IF NOT EXISTS "warehouses" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" VARCHAR(64) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(32) NOT NULL DEFAULT 'CENTRAL',
    "address" TEXT,
    "assignedSalesId" VARCHAR(64),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 4: Quản lý Lô Date & Hạn sử dụng - Thuật toán FEFO
CREATE TABLE IF NOT EXISTS "inventory_lots" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "warehouseId" VARCHAR(64) NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "batchCode" VARCHAR(64) NOT NULL,
    "manufactureDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "expiryDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "physicalQty" DOUBLE PRECISION NOT NULL,
    "reservedQty" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availableQty" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_lot_warehouse_product_batch" UNIQUE ("warehouseId", "productId", "batchCode")
);

CREATE INDEX IF NOT EXISTS "idx_inventory_lots_warehouseId" ON "inventory_lots"("warehouseId");
CREATE INDEX IF NOT EXISTS "idx_inventory_lots_productId" ON "inventory_lots"("productId");
CREATE INDEX IF NOT EXISTS "idx_inventory_lots_expiryDate" ON "inventory_lots"("expiryDate");

-- Bảng 5: Lịch sử Nhập/Xuất & Dịch chuyển kho
CREATE TABLE IF NOT EXISTS "stock_movements" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "warehouseId" VARCHAR(64) NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL,
    "batchCode" VARCHAR(64) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "uomName" VARCHAR(32),
    "refOrderCode" VARCHAR(64),
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_stock_movements_warehouseId" ON "stock_movements"("warehouseId");
CREATE INDEX IF NOT EXISTS "idx_stock_movements_productId" ON "stock_movements"("productId");

-- Bảng 6: Tuyến bán hàng thị trường (Master Call Plan - MCP)
CREATE TABLE IF NOT EXISTS "routes" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" VARCHAR(64) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "dayOfWeek" VARCHAR(32) NOT NULL,
    "salesRepName" VARCHAR(128) NOT NULL,
    "salesRepPhone" VARCHAR(32),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_routes_dayOfWeek" ON "routes"("dayOfWeek");
CREATE INDEX IF NOT EXISTS "idx_routes_salesRepName" ON "routes"("salesRepName");

-- Bảng 7: Danh mục Điểm Bán / Tiệm Tạp Hóa (Outlets)
CREATE TABLE IF NOT EXISTS "outlets" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" VARCHAR(64) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "ownerName" VARCHAR(128) NOT NULL,
    "phone" VARCHAR(32) NOT NULL,
    "address" TEXT NOT NULL,
    "district" VARCHAR(64) NOT NULL,
    "province" VARCHAR(64) NOT NULL DEFAULT 'Hồ Chí Minh',
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "creditLimit" DOUBLE PRECISION NOT NULL DEFAULT 10000000,
    "currentDebt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "routeId" VARCHAR(64) REFERENCES "routes"("id") ON DELETE SET NULL,
    "tier" VARCHAR(32) NOT NULL DEFAULT 'STANDARD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_outlets_routeId" ON "outlets"("routeId");
CREATE INDEX IF NOT EXISTS "idx_outlets_phone" ON "outlets"("phone");
CREATE INDEX IF NOT EXISTS "idx_outlets_name_trgm" ON "outlets" USING gin ("name" gin_trgm_ops);

-- Bảng 8: Nhật ký 5 bước viếng thăm tiệm của Sale
CREATE TABLE IF NOT EXISTS "store_visits" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "outletId" VARCHAR(64) NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "routeId" VARCHAR(64) REFERENCES "routes"("id") ON DELETE SET NULL,
    "salesRepName" VARCHAR(128) NOT NULL,
    "visitDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkInTime" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkOutTime" TIMESTAMP WITH TIME ZONE,
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
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_store_visits_outletId" ON "store_visits"("outletId");
CREATE INDEX IF NOT EXISTS "idx_store_visits_visitDate" ON "store_visits"("visitDate");
CREATE INDEX IF NOT EXISTS "idx_store_visits_salesRepName" ON "store_visits"("salesRepName");

-- Bảng 9: Bộ máy Khuyến mãi FMCG (Mua X Tặng Y, Chiết khấu)
CREATE TABLE IF NOT EXISTS "promotion_rules" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "code" VARCHAR(64) NOT NULL UNIQUE,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "minOrderAmount" DOUBLE PRECISION,
    "buyProductId" VARCHAR(64),
    "buyQty" DOUBLE PRECISION,
    "buyUom" VARCHAR(32),
    "giftProductId" VARCHAR(64),
    "giftQty" DOUBLE PRECISION,
    "giftUom" VARCHAR(32),
    "discountPercent" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION,
    "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_promotions_isActive" ON "promotion_rules"("isActive");

-- Bảng 10: Đơn hàng Bán (Sales Orders)
CREATE TABLE IF NOT EXISTS "sales_orders" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "orderCode" VARCHAR(64) NOT NULL UNIQUE,
    "outletId" VARCHAR(64) NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "salesRepName" VARCHAR(128) NOT NULL,
    "orderType" VARCHAR(32) NOT NULL DEFAULT 'PRE_SALES',
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "paymentStatus" VARCHAR(32) NOT NULL DEFAULT 'UNPAID',
    "subTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "discountAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_sales_orders_outletId" ON "sales_orders"("outletId");
CREATE INDEX IF NOT EXISTS "idx_sales_orders_status" ON "sales_orders"("status");
CREATE INDEX IF NOT EXISTS "idx_sales_orders_createdAt" ON "sales_orders"("createdAt");

-- Bảng 11: Chi tiết Đơn hàng & Tách Dòng Hàng Bán / Hàng Tặng KM
CREATE TABLE IF NOT EXISTS "sales_order_items" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "orderId" VARCHAR(64) NOT NULL REFERENCES "sales_orders"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL REFERENCES "products"("id"),
    "uomName" VARCHAR(32) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "baseQty" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "isGiftItem" BOOLEAN NOT NULL DEFAULT false,
    "promotionRuleId" VARCHAR(64),
    "allocatedBatch" VARCHAR(64)
);

CREATE INDEX IF NOT EXISTS "idx_sales_order_items_orderId" ON "sales_order_items"("orderId");
CREATE INDEX IF NOT EXISTS "idx_sales_order_items_productId" ON "sales_order_items"("productId");

-- Bảng 12: Phiếu Thu Tiền & Gạch Nợ VietQR
CREATE TABLE IF NOT EXISTS "payment_receipts" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "receiptCode" VARCHAR(64) NOT NULL UNIQUE,
    "outletId" VARCHAR(64) NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "orderId" VARCHAR(64) REFERENCES "sales_orders"("id") ON DELETE SET NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentMethod" VARCHAR(32) NOT NULL DEFAULT 'VIETQR_TRANSFER',
    "vietQrRefCode" VARCHAR(64),
    "status" VARCHAR(64) NOT NULL DEFAULT 'CONFIRMED_BY_ACCOUNTANT',
    "receiptDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT
);

CREATE INDEX IF NOT EXISTS "idx_payment_receipts_outletId" ON "payment_receipts"("outletId");
CREATE INDEX IF NOT EXISTS "idx_payment_receipts_receiptDate" ON "payment_receipts"("receiptDate");

-- Bảng 13: Cấu hình Đồng bộ Google Sheets
CREATE TABLE IF NOT EXISTS "google_sheets_configs" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "spreadsheetId" TEXT NOT NULL,
    "sheetNameProducts" VARCHAR(64) NOT NULL DEFAULT 'SanPham',
    "sheetNameOutlets" VARCHAR(64) NOT NULL DEFAULT 'DiemBan',
    "sheetNameOrders" VARCHAR(64) NOT NULL DEFAULT 'DonHang',
    "sheetNameInventory" VARCHAR(64) NOT NULL DEFAULT 'TonKho',
    "apiKey" TEXT,
    "serviceAccountJson" TEXT,
    "lastSyncAt" TIMESTAMP WITH TIME ZONE,
    "autoSync" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 14: Cấu hình Doanh nghiệp & Thanh toán VietQR NPP
CREATE TABLE IF NOT EXISTS "system_settings" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT 'default',
    "distributorName" VARCHAR(255) NOT NULL DEFAULT 'NHÀ PHÂN PHỐI BÁNH KẸO AN PHÁT',
    "phone" VARCHAR(128) NOT NULL DEFAULT '0908.123.456 - 028.3888.9999',
    "address" TEXT NOT NULL DEFAULT 'Số 150 Đường Song Hành, TP. Thủ Đức, TP. Hồ Chí Minh',
    "taxCode" VARCHAR(32) DEFAULT '0312345678',
    "bankName" VARCHAR(128) NOT NULL DEFAULT 'MBBank (Ngân Hàng Quân Đội)',
    "bankBin" VARCHAR(16) NOT NULL DEFAULT '970422',
    "bankAccountNo" VARCHAR(32) NOT NULL DEFAULT '0988889999',
    "bankAccountName" VARCHAR(128) NOT NULL DEFAULT 'NPP BANH KEO AN PHAT',
    "autoBackupDays" INTEGER NOT NULL DEFAULT 1,
    "invoiceNotes" TEXT DEFAULT 'Cảm ơn Quý khách! Vui lòng kiểm tra kỹ số lượng, hạn sử dụng bánh kẹo và quét mã QR thanh toán.',
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bảng 15: Ghi nhớ Nợ Hàng / Giao Bù Xe Van
CREATE TABLE IF NOT EXISTS "backorder_reminders" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "outletId" VARCHAR(64) NOT NULL REFERENCES "outlets"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
    "uomName" VARCHAR(32) NOT NULL DEFAULT 'Thùng',
    "quantity" DOUBLE PRECISION NOT NULL,
    "promisedDate" TIMESTAMP WITH TIME ZONE,
    "reason" TEXT,
    "status" VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    "salesRepName" VARCHAR(128),
    "notes" TEXT,
    "resolvedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_backorders_outletId" ON "backorder_reminders"("outletId");
CREATE INDEX IF NOT EXISTS "idx_backorders_status" ON "backorder_reminders"("status");

-- Bảng 16: Tài khoản & Phân quyền Người dùng (RBAC)
CREATE TABLE IF NOT EXISTS "users" (
    "id" VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    "username" VARCHAR(64) NOT NULL UNIQUE,
    "password" VARCHAR(128) NOT NULL DEFAULT '123456',
    "fullName" VARCHAR(128) NOT NULL,
    "role" VARCHAR(32) NOT NULL DEFAULT 'SALES_REP',
    "phone" VARCHAR(32),
    "email" VARCHAR(128),
    "avatarUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_users_role" ON "users"("role");

-- 3. KÍCH HOẠT SUPABASE REALTIME REPLICATION CHO CÁC BẢNG QUAN TRỌNG
-- Cho phép Web Admin lắng nghe sự kiện Đơn mới, Tiệm mới, Viếng thăm tức thì qua WebSockets
ALTER PUBLICATION supabase_realtime ADD TABLE "sales_orders";
ALTER PUBLICATION supabase_realtime ADD TABLE "outlets";
ALTER PUBLICATION supabase_realtime ADD TABLE "store_visits";
ALTER PUBLICATION supabase_realtime ADD TABLE "backorder_reminders";

-- 4. KHỞI TẠO BUCKETS TRÊN SUPABASE STORAGE ĐỂ CHỨA ẢNH
-- Lưu ý: Lệnh này an toàn thực hiện nếu bảng storage.buckets đã sẵn sàng
INSERT INTO storage.buckets ("id", "name", "public") 
VALUES 
    ('store-photos', 'store-photos', true),
    ('display-photos', 'display-photos', true),
    ('product-images', 'product-images', true)
ON CONFLICT ("id") DO NOTHING;

-- Cho phép upload và xem ảnh công khai
CREATE POLICY "Public Read Access for Store Photos" ON storage.objects FOR SELECT USING (bucket_id IN ('store-photos', 'display-photos', 'product-images'));
CREATE POLICY "Public Insert for Store Photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id IN ('store-photos', 'display-photos', 'product-images'));

-- ==============================================================================
-- HOÀN TẤT KHỞI TẠO CƠ SỞ DỮ LIỆU ERP SUPABASE CLOUD
-- ==============================================================================

