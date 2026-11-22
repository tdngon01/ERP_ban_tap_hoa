const http = require('http');

const BASE_URL = 'http://localhost:5000/api';

function request(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch (_) {
            parsed = data;
          }
          resolve({ status: res.statusCode, body: parsed });
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const put = (path, body) => request('PUT', path, body);
const del = (path) => request('DELETE', path);

async function runAllTests() {
  console.log('========================================================================');
  console.log(' BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG ERP & SFA FMCG BÁNH KẸO');
  console.log('========================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(testName, condition, detail = '') {
    if (condition) {
      console.log(`  [PASS] ✓ ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`  [FAIL] ✗ ${testName}: ${detail}`);
      failed++;
    }
  }

  // 1. Dashboard & Chỉ số KPI
  console.log('--- 1. BẢNG ĐIỀU HÀNH & CHỈ SỐ QUẢN TRỊ (DASHBOARD & KPI) ---');
  try {
    const dash = await get('/dashboard/metrics');
    assert('Dashboard Metrics API', dash.status === 200);
    assert('KPI Doanh số & Số đơn', dash.body.kpi && typeof dash.body.kpi.totalRevenue === 'number');
    assert('Cảnh báo Lô FEFO cận date', Array.isArray(dash.body.nearDateLots));
    assert('Leaderboard Chỉ tiêu NVBH (Mới bổ sung)', Array.isArray(dash.body.salesRepPerformance) && dash.body.salesRepPerformance.length > 0, `Có ${dash.body.salesRepPerformance.length} NVBH`);
    assert('Top 5 SKU bán chạy (Mới bổ sung)', Array.isArray(dash.body.topProducts));
    assert('Top 5 Điểm bán lớn nhất (Mới bổ sung)', Array.isArray(dash.body.topOutlets));
    assert('Cơ cấu doanh thu theo ngành hàng (Mới bổ sung)', Array.isArray(dash.body.revenueByCategory));
  } catch (err) {
    assert('Dashboard Metrics API', false, err.message);
  }

  // 2. Danh mục Sản phẩm & Đa đơn vị tính & Quét mã vạch
  console.log('\n--- 2. SẢN PHẨM, QUY ĐỔI ĐA ĐVT & QUÉT MÃ VẠCH (PRODUCTS & UOM) ---');
  let firstProduct = null;
  try {
    const prods = await get('/products');
    assert('Lấy danh mục sản phẩm', prods.status === 200 && prods.body.length > 0, `Có ${prods.body.length} SKU`);
    firstProduct = prods.body[0];

    // Tra cứu mã vạch
    const barcodeSearch = await get('/products?search=8936036010015');
    assert('Quét & Tìm kiếm bằng Mã Vạch', barcodeSearch.status === 200 && barcodeSearch.body.length > 0, barcodeSearch.body[0]?.name);

    // Quy đổi ĐVT
    if (firstProduct) {
      const conv = await post('/products/convert', {
        productId: firstProduct.id,
        uomName: 'Thùng',
        quantity: 2,
      });
      assert('Quy đổi Thùng -> Gói (Base UoM)', conv.status === 200 || conv.status === 201, `2 Thùng = ${conv.body.baseQty} gói (Thành tiền: ${conv.body.totalPrice?.toLocaleString('vi-VN')}đ)`);
    }
  } catch (err) {
    assert('Sản phẩm & ĐVT', false, err.message);
  }

  // 3. Quản trị Kho bãi & Lô HSD theo FEFO
  console.log('\n--- 3. QUẢN TRỊ KHO BÃI & GỢI Ý XUẤT LÔ FEFO (INVENTORY & LOTS) ---');
  try {
    const lots = await get('/inventory/lots');
    assert('Lấy danh sách Lô HSD kho bãi', lots.status === 200 && lots.body.length > 0, `Có ${lots.body.length} lô tồn kho`);

    if (firstProduct) {
      const fefo = await post('/inventory/fefo/recommend', {
        productId: firstProduct.id,
        requiredBaseQty: 96,
      });
      assert('Thuật toán gợi ý lô FEFO (Cận date xuất trước)', fefo.status === 200 || fefo.status === 201, `Đã chọn lô: ${fefo.body.allocatedBatches?.[0]?.batchCode || 'OK'}`);
    }
  } catch (err) {
    assert('Kho & FEFO', false, err.message);
  }

  // 4. Bảng kê soạn hàng xe tải (Picking List)
  console.log('\n--- 4. BẢNG KÊ SOẠN HÀNG TẬP TRUNG CHO XE TẢI (PICKING LIST) ---');
  try {
    const pick = await get('/inventory/picking-list');
    assert('Tạo Bảng kê soạn hàng (Picking List)', pick.status === 200 && Array.isArray(pick.body.pickingItems), `Gộp ${pick.body.totalOrdersCount} đơn, ${pick.body.pickingItems?.length} dòng soạn hàng`);
  } catch (err) {
    assert('Picking List', false, err.message);
  }

  // 5. Tuyến bán hàng MCP & Lịch trình hôm nay
  console.log('\n--- 5. TUYẾN THỊ TRƯỜNG MCP & GIÁM SÁT ĐI TUYẾN (ROUTES & MCP) ---');
  try {
    const routes = await get('/routes');
    assert('Lấy danh mục tuyến bán hàng MCP', routes.status === 200 && routes.body.length > 0, `Có ${routes.body.length} tuyến`);

    const mcp = await get('/routes/mcp/today?dayOfWeek=MONDAY');
    assert('Lịch trình MCP Thứ Hai', mcp.status === 200 && mcp.body.routes?.length > 0, `Tuyến: ${mcp.body.routes?.[0]?.name}`);
  } catch (err) {
    assert('Tuyến MCP', false, err.message);
  }

  // 6. Điểm bán Tạp hóa & Mở tiệm mới trực tiếp
  console.log('\n--- 6. QUẢN LÝ TIỆM TẠP HÓA & TÍNH NĂNG MỞ TIỆM MỚI (OUTLETS) ---');
  let newOutletId = null;
  try {
    const outlets = await get('/outlets');
    assert('Lấy danh sách điểm bán tạp hóa', outlets.status === 200 && outlets.body.length > 0, `Có ${outlets.body.length} tiệm`);

    // Test thêm tiệm mới
    const testOutletPhone = '0988' + Math.floor(100000 + Math.random() * 900000);
    const newOutlet = await post('/outlets', {
      name: 'Tạp Hóa Kiểm Thử Hệ Thống ' + Math.floor(Math.random() * 100),
      ownerName: 'Bác Tư',
      phone: testOutletPhone,
      address: '256 Hoàng Hoa Thám, P.12, Tân Bình',
      routeCode: 'TUYEN-Q1-T2',
      creditLimit: 12000000,
      latitude: 10.7769,
      longitude: 106.7009,
    });
    assert('Mở tiệm mới tự động gán tuyến & sinh mã TH-xxx', (newOutlet.status === 200 || newOutlet.status === 201) && newOutlet.body.code, `${newOutlet.body.code}: ${newOutlet.body.name}`);
    newOutletId = newOutlet.body.id;
  } catch (err) {
    assert('Điểm bán & Mở tiệm mới', false, err.message);
  }

  // 7. Check-in GPS vệ tinh
  console.log('\n--- 7. CHECK-IN GPS VỆ TINH ĐIỂM BÁN (STORE VISIT & GPS) ---');
  try {
    if (newOutletId) {
      const checkin = await post('/routes/checkin', {
        outletId: newOutletId,
        salesRepName: 'Nguyễn Văn Hùng',
        latitude: 10.77695,
        longitude: 106.70092,
      });
      assert('Check-in GPS < 100m hợp lệ', (checkin.status === 200 || checkin.status === 201) && checkin.body.success, `Khoảng cách: ${checkin.body.visit?.distanceMeters || 0}m, Hợp lệ: ${checkin.body.visit?.isGpsValid}`);
    }
  } catch (err) {
    assert('Check-in GPS', false, err.message);
  }

  // 8. Đơn hàng Bán & Bộ máy Khuyến Mãi (Mua X tặng Y)
  console.log('\n--- 8. TẠO ĐƠN HÀNG, KHUYẾN MÃI & PHÂN BỔ FEFO (ORDERS & PROMOTIONS) ---');
  let createdOrderId = null;
  try {
    if (newOutletId && firstProduct) {
      const orderRes = await post('/orders', {
        outletId: newOutletId,
        salesRepName: 'Nguyễn Văn Hùng',
        orderType: 'PRE_SALES',
        items: [
          {
            productId: firstProduct.id,
            uomName: 'Thùng',
            quantity: 5,
          },
        ],
        notes: 'Đơn hàng tự động kiểm thử tính năng khuyến mãi',
      });
      assert('Tạo đơn hàng Pre-sales thành công', orderRes.status === 200 || orderRes.status === 201, orderRes.body.order?.orderCode);
      assert('Tự động phân bổ Lô FEFO & Khuyến mãi', orderRes.body.order?.items?.length > 0, `Số dòng đơn: ${orderRes.body.order?.items?.length}`);
      createdOrderId = orderRes.body.order?.id;
    }
  } catch (err) {
    assert('Tạo đơn hàng', false, err.message);
  }

  // 9. Tính năng Đổi Trả Hàng & Thu Hồi Hàng Lỗi / Giảm Trừ Nợ (Mới Bổ Sung)
  console.log('\n--- 9. ĐỔI TRẢ HÀNG & THU HỒI HÀNG LỖI (SALES RETURNS - MỚI BỔ SUNG) ---');
  try {
    if (newOutletId && firstProduct) {
      const returnRes = await post('/orders/returns', {
        outletId: newOutletId,
        salesRepName: 'Nguyễn Văn Hùng',
        reason: 'Hàng cận date / hết hạn sử dụng',
        notes: 'Tiệm gửi trả lại 1 thùng cận date theo chính sách NPP',
        items: [
          {
            productId: firstProduct.id,
            uomName: 'Thùng',
            quantity: 1,
            unitPrice: 470000,
          },
        ],
      });
      assert('Tạo phiếu đổi trả & Thu hồi hàng cận date', returnRes.status === 200 || returnRes.status === 201, returnRes.body.returnCode);
      assert('Tự động giảm trừ công nợ gối đầu', returnRes.body.prevDebt > returnRes.body.newDebt || returnRes.body.returnTotal === 470000, `Giảm ${returnRes.body.returnTotal}đ`);

      const returnHistory = await get('/orders/returns/history');
      assert('Truy vấn lịch sử phiếu đổi trả hàng', returnHistory.status === 200 && returnHistory.body.length > 0, `Có ${returnHistory.body.length} phiếu đổi trả`);
    }
  } catch (err) {
    assert('Đổi trả hàng', false, err.message);
  }

  // 10. Sổ cái Công Nợ & Sinh mã VietQR động
  console.log('\n--- 10. SỔ CÁI CÔNG NỢ & SINH MÃ VIETQR ĐỘNG (DEBT & VIETQR) ---');
  try {
    const ledger = await get('/debt/ledger');
    assert('Truy vấn Sổ cái công nợ & Phân loại rủi ro', ledger.status === 200 && ledger.body.length > 0, `Có ${ledger.body.length} tiệm`);

    if (newOutletId) {
      const qr = await post('/debt/vietqr/generate', {
        outletId: newOutletId,
        amount: 500000,
        description: 'THANH TOAN DON HANG',
      });
      assert('Sinh mã VietQR động chuẩn EMVCo Napas', qr.status === 200 || qr.status === 201, qr.body.bankName);

      // Ghi nhận thanh toán
      const pay = await post('/debt/payment', {
        outletId: newOutletId,
        amount: 500000,
        paymentMethod: 'VIETQR_TRANSFER',
        notes: 'Khách quét QR thành công',
      });
      assert('Gạch nợ tự động sau thanh toán VietQR', pay.status === 200 || pay.status === 201, `Đã thu 500.000đ`);
    }
  } catch (err) {
    assert('Công nợ & VietQR', false, err.message);
  }

  // 11. Tồn Kho Xe Tải Van Sales & Giao Hàng Bổ Sung (Backorders)
  console.log('\n--- 11. QUẢN LÝ KHO XE TẢI & NỢ HÀNG GIAO BÙ (VAN STOCK & BACKORDERS) ---');
  try {
    const van = await get('/inventory/van-stock?salesRepName=Nguy%E1%BB%85n%20V%C4%83n%20H%C3%B9ng');
    assert('Kiểm tra tồn kho xe tải Van Sales 01', van.status === 200, van.body.warehouse?.name || 'Kho Xe Tải 01');

    if (newOutletId && firstProduct) {
      const backorder = await post('/inventory/backorders', {
        outletId: newOutletId,
        productId: firstProduct.id,
        uomName: 'Thùng',
        quantity: 2,
        salesRepName: 'Nguyễn Văn Hùng',
        reason: 'Hết hàng trên xe lúc giao',
        notes: 'Hẹn 9h sáng mai giao bù 2 thùng',
      });
      assert('Ghi nhận nợ hàng / giao bù sáng mai', backorder.status === 200 || backorder.status === 201);
    }
  } catch (err) {
    assert('Kho Xe Van & Backorders', false, err.message);
  }

  // 12. Cấu hình CSDL & Supabase Cloud Status
  console.log('\n--- 12. CẤU HÌNH HỆ THỐNG & TRẠNG THÁI CSDL SUPABASE (SETTINGS & DB INFO) ---');
  try {
    const dbInfo = await get('/settings/database-info');
    assert('Kiểm tra trạng thái CSDL', dbInfo.status === 200, `${dbInfo.body.provider} (${dbInfo.body.status})`);

    const settings = await get('/settings');
    assert('Thông tin NPP & Tài khoản ngân hàng VietQR', settings.status === 200, settings.body.distributorName);
  } catch (err) {
    assert('Cấu hình CSDL & Hệ thống', false, err.message);
  }

  // 13. Phân Quyền Người Dùng & Ma Trận RBAC FMCG (Users & Roles)
  console.log('\n--- 13. PHÂN QUYỀN NGƯỜI DÙNG & MA TRẬN RBAC FMCG (USERS & ROLES) ---');
  try {
    const usersRes = await get('/users');
    assert('Lấy danh sách người dùng hệ thống', usersRes.status === 200 && Array.isArray(usersRes.body), `${usersRes.body.length} tài khoản`);

    const adminUser = usersRes.body.find(u => u.username === 'admin');
    assert('Tài khoản Quản trị tối cao (admin) tồn tại', !!adminUser, adminUser?.fullName);

    const rolesRes = await get('/users/roles');
    assert('Ma trận 5 vai trò FMCG (ADMIN, ACCOUNTANT, WAREHOUSE, SUPERVISOR, SALES_REP)', rolesRes.status === 200 && rolesRes.body.roles.length === 5, `${rolesRes.body.roles.length} vai trò`);
    assert('Danh sách 13 năng lực nghiệp vụ phân quyền', rolesRes.body.permissionsList.length >= 13, `${rolesRes.body.permissionsList.length} permissions`);

    // Tạo người dùng mới
    const testUsername = `nv_test_${Date.now().toString().slice(-4)}`;
    const createRes = await post('/users', {
      username: testUsername,
      fullName: 'Nhân Viên Thử Nghiệm FMCG',
      role: 'SALES_REP',
      phone: '0988776655',
      email: 'test@anphat.vn',
    });
    assert('Tạo tài khoản người dùng mới thành công', createRes.status === 200 || createRes.status === 201, createRes.body.username);

    const testUserId = createRes.body.id;

    // Cập nhật người dùng
    const updateRes = await put(`/users/${testUserId}`, {
      fullName: 'Nhân Viên Đã Đổi Tên',
      role: 'SUPERVISOR',
      phone: '0988111222',
      email: 'updated@anphat.vn',
      isActive: true,
    });
    assert('Cập nhật vai trò sang SUPERVISOR', updateRes.status === 200 && updateRes.body.role === 'SUPERVISOR', updateRes.body.fullName);

    // Xóa người dùng thử nghiệm
    const delRes = await del(`/users/${testUserId}`);
    assert('Xóa tài khoản người dùng thử nghiệm', delRes.status === 200);

    // Kiểm tra bảo vệ tài khoản admin (không cho phép xóa)
    if (adminUser) {
      const delAdminRes = await del(`/users/${adminUser.id}`);
      assert('Bảo vệ tài khoản admin (ngăn chặn xóa nhầm)', delAdminRes.status === 400);
    }
  } catch (err) {
    assert('Phân quyền người dùng RBAC', false, err.message);
  }

  // 14. Đăng Nhập & Bảo Mật Xác Thực (Authentication & JWT Login)
  console.log('\n--- 14. ĐĂNG NHẬP & BẢO MẬT XÁC THỰC (AUTHENTICATION & JWT) ---');
  try {
    // Đăng nhập hợp lệ với Admin
    const loginAdmin = await post('/auth/login', { username: 'admin', password: '123456' });
    assert('Đăng nhập Quản trị viên (admin) thành công', loginAdmin.status === 200 || loginAdmin.status === 201, `Token: ${loginAdmin.body.token ? 'JWT OK' : 'No'}`);
    assert('Quyền truy cập toàn bộ 12 phân hệ của Admin', loginAdmin.body.allowedTabs?.length === 12);

    // Đăng nhập sai mật khẩu
    const loginFail = await post('/auth/login', { username: 'admin', password: 'sai_mat_khau_123' });
    assert('Chặn đăng nhập khi sai mật khẩu (401 Unauthorized)', loginFail.status === 401);

    // Đăng nhập nhân viên Van Sales
    const loginSale = await post('/auth/login', { username: 'sale01', password: '123456' });
    assert('Đăng nhập Nhân viên Van Sales (sale01)', (loginSale.status === 200 || loginSale.status === 201) && loginSale.body.user?.role === 'SALES_REP', loginSale.body.user?.fullName);
    assert('Giới hạn quyền Sales chỉ xem 3 phân hệ (mobile-sfa, outlets, products)', loginSale.body.allowedTabs?.length === 3);

    // Kiểm tra xác thực thông tin tài khoản qua JWT (GET /api/auth/me)
    if (loginAdmin.body.token) {
      const meRes = await new Promise((resolve) => {
        const url = new URL('http://localhost:5000/api/auth/me');
        const req = http.request({
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          method: 'GET',
          headers: { 'Authorization': `Bearer ${loginAdmin.body.token}` },
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
        });
        req.end();
      });
      assert('Lấy hồ sơ cá nhân qua JWT Header Bearer (GET /auth/me)', meRes.status === 200, meRes.body.user?.fullName);
    }
  } catch (err) {
    assert('Đăng nhập & Xác thực JWT', false, err.message);
  }

  // 15. Bản Đồ Số OpenStreetMap: Tạo Tuyến, Chấm Điểm & Kéo Thả Vị Trí
  console.log('\n--- 15. BẢN ĐỒ SỐ OPENSTREETMAP: TẠO TUYẾN, CHẤM ĐIỂM & KÉO THẢ (MAP GIS) ---');
  try {
    const newRouteRes = await post('/routes', {
      name: 'Tuyến Quận 3 - Thứ Tư (Test Map)',
      dayOfWeek: 'WEDNESDAY',
      salesRepName: 'Nguyễn Văn Hùng',
    });
    assert('Tạo tuyến bán hàng mới từ bản đồ', newRouteRes.status === 200 || newRouteRes.status === 201, newRouteRes.body.code);

    const routeId = newRouteRes.body.id;

    // Chấm tọa độ thêm điểm bán mới trên map
    const mapOutletRes = await post('/outlets', {
      name: 'Tạp Hóa Chấm Map OpenStreetMap',
      ownerName: 'Chị Mai',
      phone: '0909888777',
      address: '123 Võ Văn Tần, Quận 3, TP.HCM',
      latitude: 10.7755,
      longitude: 106.6889,
    });
    assert('Chấm tọa độ trên bản đồ lưu điểm bán mới', mapOutletRes.status === 200 || mapOutletRes.status === 201, mapOutletRes.body.code);

    const outletId = mapOutletRes.body.id;

    // Gán điểm bán vào tuyến mới
    const assignRes = await post(`/routes/${routeId}/assign-outlets`, {
      outletIds: [outletId],
    });
    assert('Vẽ tuyến & Gán điểm bán trực tiếp vào tuyến', (assignRes.status === 200 || assignRes.status === 201) && assignRes.body.outlets?.length === 1);

    // Kéo thả cập nhật tọa độ
    const dragRes = await put(`/outlets/${outletId}`, {
      latitude: 10.7799,
      longitude: 106.6911,
    });
    assert('Kéo thả ghim cập nhật tọa độ GPS vào CSDL', dragRes.status === 200 && dragRes.body.latitude === 10.7799);

    // Dọn dẹp tuyến test
    const delRouteRes = await del(`/routes/${routeId}`);
    assert('Xóa tuyến thử nghiệm', delRouteRes.status === 200);
  } catch (err) {
    assert('Bản đồ số tương tác OSM GIS', false, err.message);
  }

  // 16. Đồng Bộ Sao Lưu Từ Supabase / CSDL Sang Google Sheets
  console.log('\n--- 16. ĐỒNG BỘ SAO LƯU TỪ SUPABASE / CSDL SANG GOOGLE SHEETS ---');
  try {
    const backupRes = await post('/google-sheets/backup-all', {});
    assert('Đồng bộ sao lưu toàn bộ 5 bảng sang Google Sheets', (backupRes.status === 200 || backupRes.status === 201) && backupRes.body.details?.length === 5, backupRes.body.details?.map(d => `${d.tab}:${d.rowCount}`).join(', '));

    const expProd = await get('/google-sheets/export/products');
    assert('Xuất bảng Sản Phẩm sang Sheet SanPham', expProd.status === 200 && expProd.body.rowCount > 0, `${expProd.body.rowCount} SKU`);

    const expOutlet = await get('/google-sheets/export/outlets');
    assert('Xuất bảng Điểm Bán & Công Nợ sang Sheet DiemBan', expOutlet.status === 200 && expOutlet.body.rowCount > 0, `${expOutlet.body.rowCount} tiệm`);
  } catch (err) {
    assert('Sao lưu sang Google Sheets', false, err.message);
  }

  console.log('\n========================================================================');
  console.log(` KẾT QUẢ KIỂM THỬ: ${passed} PASS / ${failed} FAIL (TỶ LỆ THÀNH CÔNG: ${Math.round((passed / (passed + failed)) * 100)}%)`);
  console.log('========================================================================');
}

runAllTests().catch(console.error);
