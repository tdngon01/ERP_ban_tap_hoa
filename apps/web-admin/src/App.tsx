import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
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

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [debtPreselect, setDebtPreselect] = useState<any>(null);

  const getPageTitle = () => {
    switch (currentTab) {
      case 'dashboard':
        return { title: 'Bảng Điều Hành & Chỉ Số Quản Trị (BI Dashboard)', subtitle: 'Giám sát doanh số, độ phủ tuyến và cảnh báo hạn sử dụng' };
      case 'products':
        return { title: 'Danh Mục Bánh Kẹo & Bảng Quy Đổi Đa Đơn Vị Tính', subtitle: 'Thùng -> Hộp/Dây -> Gói/Thanh và cơ chế đồng nhất Base UoM' };
      case 'inventory':
        return { title: 'Quản Trị Kho Bãi & Lô Hạn Sử Dụng (Thuật Toán FEFO)', subtitle: 'Xuất hàng cận date trước, quản lý tồn thực tế và tồn giữ chỗ' };
      case 'picking-list':
        return { title: 'Bảng Kê Soạn Hàng Tổng Cho Xe Tải (Picking List)', subtitle: 'Gộp các đơn hàng đã xác nhận để thủ kho soạn hàng tập trung theo lô FEFO' };
      case 'outlets':
        return { title: 'Quản Lý Điểm Bán Tạp Hóa (General Trade - GT)', subtitle: 'Danh sách tiệm, chủ tiệm, hạn mức công nợ và tọa độ GPS' };
      case 'routes':
        return { title: 'Lịch Trình Tuyến Bán Hàng (MCP T2 - T7) & Giám Sát GPS', subtitle: 'Xác thực khoảng cách check-in và theo dõi tiến độ nhân viên thị trường' };
      case 'orders':
        return { title: 'Quản Lý Đơn Hàng Pre-sales / Van sales & Khuyến Mãi', subtitle: 'Tự động tính chiết khấu, Mua X tặng Y, in hóa đơn kèm VietQR và phân bổ lô xuất kho' };
      case 'debt':
        return { title: 'Sổ Cái Công Nợ Gối Đầu & Sinh Mã VietQR Tự Động', subtitle: 'Đối soát thu tiền mặt, thanh toán VietQR động theo đơn hàng' };
      case 'google-sheets':
        return { title: 'Trung Tâm Đồng Bộ Google Sheets API Hai Chiều', subtitle: 'Kéo thả dữ liệu sản phẩm, điểm bán và đẩy báo cáo đơn hàng/kho tự động' };
      case 'settings':
        return { title: 'Cài Đặt Hệ Thống, Tài Khoản VietQR & Sao Lưu CSDL', subtitle: 'Thông tin nhà phân phối, số tài khoản ngân hàng, xuất báo cáo CSV và sao lưu an toàn' };
      case 'mobile-sfa':
        return { title: 'Giả Lập Ứng Dụng Di Động SFA Thị Trường Cho Sale', subtitle: '5 bước viếng thăm tạp hóa: GPS check-in, kiểm date, chụp ảnh, lên đơn, VietQR' };
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
      <Sidebar currentTab={currentTab} onSelectTab={(tab) => setCurrentTab(tab)} />

      {/* Main Content Area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar title={title} subtitle={subtitle} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardPage onNavigate={(tab) => setCurrentTab(tab)} />}
          {currentTab === 'products' && <ProductsPage />}
          {currentTab === 'inventory' && <InventoryFefoPage />}
          {currentTab === 'picking-list' && <PickingListPage />}
          {currentTab === 'outlets' && <OutletsPage />}
          {currentTab === 'routes' && <RouteMcpPage />}
          {currentTab === 'orders' && <OrdersPage onNavigateToQr={handleNavigateToQr} />}
          {currentTab === 'debt' && <DebtVietQrPage preselect={debtPreselect} />}
          {currentTab === 'google-sheets' && <GoogleSheetsPage />}
          {currentTab === 'settings' && <SettingsPage />}
          {currentTab === 'mobile-sfa' && <MobileSfaSimulator />}
        </main>
      </div>
    </div>
  );
};
export default App;

