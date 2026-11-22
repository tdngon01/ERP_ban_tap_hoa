import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { InventoryFefoPage } from './pages/InventoryFefoPage';
import { OutletsPage } from './pages/OutletsPage';
import { RouteMcpPage } from './pages/RouteMcpPage';
import { OrdersPage } from './pages/OrdersPage';
import { DebtVietQrPage } from './pages/DebtVietQrPage';
import { GoogleSheetsPage } from './pages/GoogleSheetsPage';
import { MobileSfaSimulator } from './pages/MobileSfaSimulator';
import { PickingListPage } from './pages/PickingListPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPermissionsPage } from './pages/UsersPermissionsPage';
import { getUsers, getUserRoles, login } from './api';
import { ShieldAlert, ArrowRight, Lock, KeyRound } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [debtPreselect, setDebtPreselect] = useState<any>(null);

  // Authentication State
  const [token, setToken] = useState<string | null>(() => {
    return (
      localStorage.getItem('fmcg_auth_token') ||
      sessionStorage.getItem('fmcg_auth_token') ||
      null
    );
  });

  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved =
        localStorage.getItem('fmcg_current_user') ||
        sessionStorage.getItem('fmcg_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // RBAC User & Roles state
  const [usersList, setUsersList] = useState<any[]>([]);
  const [rolesMap, setRolesMap] = useState<Record<string, any>>({});

  // Tải danh sách người dùng & ma trận vai trò
  useEffect(() => {
    if (!token) return;

    const fetchAuthData = async () => {
      try {
        const [uList, rData] = await Promise.all([getUsers(), getUserRoles()]);
        setUsersList(uList);

        const rMap: Record<string, any> = {};
        if (rData && rData.roles) {
          rData.roles.forEach((r: any) => {
            rMap[r.key] = r;
          });
        }
        setRolesMap(rMap);
      } catch (err) {
        console.error('Lỗi khi tải dữ liệu phân quyền:', err);
      }
    };
    fetchAuthData();
  }, [token]);

  const handleLoginSuccess = (authData: { user: any; token: string; allowedTabs: string[] }) => {
    setToken(authData.token);
    setCurrentUser(authData.user);

    // Chuyển tới tab đầu tiên được phép
    if (authData.allowedTabs && authData.allowedTabs.length > 0) {
      if (!authData.allowedTabs.includes(currentTab)) {
        setCurrentTab(authData.allowedTabs[0]);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fmcg_auth_token');
    localStorage.removeItem('fmcg_current_user');
    sessionStorage.removeItem('fmcg_auth_token');
    sessionStorage.removeItem('fmcg_current_user');
    setToken(null);
    setCurrentUser(null);
  };

  const handleSwitchUser = async (user: any) => {
    try {
      // Đăng nhập nhanh sang tài khoản đó với mật khẩu 123456
      const res = await login({ username: user.username, password: '123456' });
      if (res && res.token) {
        localStorage.setItem('fmcg_auth_token', res.token);
        localStorage.setItem('fmcg_current_user', JSON.stringify(res.user));
        setToken(res.token);
        setCurrentUser(res.user);

        const roleDef = rolesMap[res.user.role];
        if (roleDef && roleDef.allowedTabs && !roleDef.allowedTabs.includes(currentTab)) {
          setCurrentTab(roleDef.allowedTabs[0] || 'dashboard');
        }
      }
    } catch {
      // Fallback đổi local
      setCurrentUser(user);
      localStorage.setItem('fmcg_current_user', JSON.stringify(user));
      const roleDef = rolesMap[user.role];
      if (roleDef && roleDef.allowedTabs && !roleDef.allowedTabs.includes(currentTab)) {
        setCurrentTab(roleDef.allowedTabs[0] || 'dashboard');
      }
    }
  };

  // Nếu chưa đăng nhập, hiển thị màn hình Đăng Nhập
  if (!token || !currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Tính toán danh sách tabs được phép theo vai trò hiện tại
  const currentRoleDef = currentUser?.role ? rolesMap[currentUser.role] : null;
  const allowedTabs: string[] = currentRoleDef?.allowedTabs || [
    'dashboard',
    'products',
    'inventory',
    'picking-list',
    'outlets',
    'routes',
    'orders',
    'debt',
    'google-sheets',
    'users',
    'settings',
    'mobile-sfa',
  ];

  const isCurrentTabAllowed = allowedTabs.includes(currentTab);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return {
          title: 'Bảng Điều Hành & Chỉ Số Quản Trị (BI Dashboard)',
          subtitle: 'Giám sát doanh số, độ phủ tuyến và cảnh báo hạn sử dụng',
        };
      case 'products':
        return {
          title: 'Danh Mục Bánh Kẹo & Bảng Quy Đổi Đa Đơn Vị Tính',
          subtitle: 'Thùng -> Hộp/Dây -> Gói/Thanh và cơ chế đồng nhất Base UoM',
        };
      case 'inventory':
        return {
          title: 'Quản Trị Kho Bãi & Lô Hạn Sử Dụng (Thuật Toán FEFO)',
          subtitle: 'Xuất hàng cận date trước, quản lý tồn thực tế và tồn giữ chỗ',
        };
      case 'picking-list':
        return {
          title: 'Bảng Kê Soạn Hàng Tổng Cho Xe Tải (Picking List)',
          subtitle: 'Gộp các đơn hàng đã xác nhận để thủ kho soạn hàng tập trung theo lô FEFO',
        };
      case 'outlets':
        return {
          title: 'Quản Lý Khách Hàng & Điểm Bán Tạp Hóa (Customer CRM 360°)',
          subtitle: 'Hồ sơ 360° khách hàng, phân hạng VIP/Vàng, hạn mức công nợ gối đầu, lịch sử mua hàng và vị trí Google Maps',
        };
      case 'routes':
        return {
          title: 'Lịch Trình Tuyến Bán Hàng (MCP T2 - T7) & Giám Sát GPS',
          subtitle: 'Xác thực khoảng cách check-in và theo dõi tiến độ nhân viên thị trường',
        };
      case 'orders':
        return {
          title: 'Quản Lý Đơn Hàng Pre-sales / Van sales & Khuyến Mãi',
          subtitle: 'Tự động tính chiết khấu, Mua X tặng Y, in hóa đơn kèm VietQR và phân bổ lô xuất kho',
        };
      case 'debt':
        return {
          title: 'Sổ Cái Công Nợ Gối Đầu & Sinh Mã VietQR Tự Động',
          subtitle: 'Đối soát thu tiền mặt, thanh toán VietQR động theo đơn hàng',
        };
      case 'google-sheets':
        return {
          title: 'Trung Tâm Đồng Bộ Google Sheets API Hai Chiều',
          subtitle: 'Kéo thả dữ liệu sản phẩm, điểm bán và đẩy báo cáo đơn hàng/kho tự động',
        };
      case 'users':
        return {
          title: 'Quản Lý Tài Khoản & Phân Quyền Người Dùng (RBAC FMCG)',
          subtitle: 'Phân quyền 5 vai trò chuyên biệt: Chủ NPP, Kế Toán, Thủ Kho, Giám Sát Tuyến, Sales Thị Trường',
        };
      case 'settings':
        return {
          title: 'Cài Đặt Hệ Thống, Tài Khoản VietQR & Sao Lưu CSDL',
          subtitle: 'Thông tin nhà phân phối, số tài khoản ngân hàng, xuất báo cáo CSV và sao lưu an toàn',
        };
      case 'mobile-sfa':
        return {
          title: 'Giả Lập Ứng Dụng Di Động SFA Thị Trường Cho Sale',
          subtitle: 'Quy trình viếng thăm tạp hóa: GPS check-in, kiểm date, lên đơn nhanh, mở tiệm mới, thu tiền VietQR',
        };
      default:
        return { title: 'Hệ Thống ERP & DMS Bánh Kẹo', subtitle: 'Nhà Phân Phối FMCG' };
    }
  };

  const { title, subtitle } = getPageTitle();

  const handleNavigateToQr = (outletId: string, orderId: string, amount: number) => {
    setDebtPreselect({ outletId, orderId, amount });
    setCurrentTab('debt');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        currentUser={currentUser}
        allowedTabs={allowedTabs}
      />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar
          title={title}
          subtitle={subtitle}
          currentUser={currentUser}
          usersList={usersList}
          onSwitchUser={handleSwitchUser}
          onNavigateToUsers={() => setCurrentTab('users')}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {/* Permission Guard: Nếu role hiện tại không có quyền xem tab này */}
          {!isCurrentTabAllowed ? (
            <div className="bg-white rounded-xl border border-rose-200 shadow-sm p-8 text-center max-w-xl mx-auto my-12 space-y-4">
              <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <ShieldAlert className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Quyền Truy Cập Bị Giới Hạn</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Tài khoản của bạn đang có vai trò{' '}
                  <strong className="text-slate-900">
                    {currentRoleDef?.name || currentUser?.role}
                  </strong>
                  . Vai trò này không được cấp quyền truy cập phân hệ này theo chính sách bảo mật NPP FMCG.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-center space-x-3">
                <button
                  onClick={() => setCurrentTab(allowedTabs[0] || 'dashboard')}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition flex items-center space-x-1.5"
                >
                  <span>Về phân hệ được phép ({allowedTabs[0]})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {usersList.find((u) => u.username === 'admin') && (
                  <button
                    onClick={() => {
                      const admin = usersList.find((u) => u.username === 'admin');
                      if (admin) handleSwitchUser(admin);
                    }}
                    className="px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-lg hover:bg-amber-600 transition flex items-center space-x-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>Đổi sang Quản Trị Viên (Admin)</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {currentTab === 'dashboard' && <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />}
              {currentTab === 'products' && <ProductsPage />}
              {currentTab === 'inventory' && <InventoryFefoPage />}
              {currentTab === 'picking-list' && <PickingListPage />}
              {currentTab === 'outlets' && <OutletsPage />}
              {currentTab === 'routes' && <RouteMcpPage />}
              {currentTab === 'orders' && <OrdersPage onNavigateToQr={handleNavigateToQr} />}
              {currentTab === 'debt' && <DebtVietQrPage preselect={debtPreselect} />}
              {currentTab === 'google-sheets' && <GoogleSheetsPage />}
              {currentTab === 'users' && (
                <UsersPermissionsPage
                  currentUser={currentUser}
                  onSwitchUser={handleSwitchUser}
                />
              )}
              {currentTab === 'settings' && <SettingsPage />}
              {currentTab === 'mobile-sfa' && <MobileSfaSimulator />}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
export default App;
