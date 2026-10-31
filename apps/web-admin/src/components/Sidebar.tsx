import React from 'react';
import {
  LayoutDashboard,
  Package,
  Layers,
  Store,
  MapPin,
  ShoppingCart,
  QrCode,
  FileSpreadsheet,
  Smartphone,
  ChevronRight,
  Sparkles,
  ClipboardList,
  Settings,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Tổng Quan & KPI', icon: LayoutDashboard, badge: 'Live' },
    { id: 'products', label: 'Bánh Kẹo & Đa ĐVT', icon: Package },
    { id: 'inventory', label: 'Kho & Lô HSD (FEFO)', icon: Layers, highlight: true },
    { id: 'picking-list', label: 'Soạn Hàng Xe Tải', icon: ClipboardList, badge: 'Mới' },
    { id: 'outlets', label: 'Điểm Bán Tạp Hóa', icon: Store },
    { id: 'routes', label: 'Tuyến Bán Hàng (MCP)', icon: MapPin },
    { id: 'orders', label: 'Đơn Hàng & Khuyến Mãi', icon: ShoppingCart },
    { id: 'debt', label: 'Công Nợ & VietQR', icon: QrCode },
    { id: 'google-sheets', label: 'Đồng Bộ Google Sheets', icon: FileSpreadsheet, badge: 'API' },
    { id: 'settings', label: 'Cài Đặt & Sao Lưu DB', icon: Settings },
    { id: 'mobile-sfa', label: 'Giả Lập Mobile Sale SFA', icon: Smartphone, special: true },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-xl border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base text-white tracking-wide leading-tight">ERP FMCG</h1>
          <p className="text-xs text-amber-400 font-medium">Bánh Kẹo & Tạp Hóa DMS</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Phân Hệ Quản Trị
        </div>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-md shadow-amber-500/20'
                  : item.special
                  ? 'bg-slate-800/80 text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : item.special ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-amber-400 border border-slate-700'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-slate-300">NPP An Phát</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        <p className="text-[11px] text-slate-500">PostgreSQL / SQLite • Google Sheets Sync</p>
      </div>
    </aside>
  );
};

