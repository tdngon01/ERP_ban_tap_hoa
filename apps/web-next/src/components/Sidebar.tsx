'use client';
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
  ClipboardList,
  Settings,
  ShieldCheck,
  Building2,
  Boxes,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  currentUser?: any;
  allowedTabs?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  currentUser,
  allowedTabs,
}) => {
  // Menu phân nhóm theo chuẩn ERP Doanh Nghiệp Quốc Tế
  const menuGroups = [
    {
      groupTitle: 'BÁN HÀNG & THỊ TRƯỜNG',
      items: [
        { id: 'dashboard', label: 'Tổng Quan & KPIs', icon: LayoutDashboard, badge: 'Live' },
        { id: 'routes', label: 'Tuyến Bán Hàng (MCP)', icon: MapPin },
        { id: 'orders', label: 'Đơn Hàng & Khuyến Mãi', icon: ShoppingCart },
        { id: 'outlets', label: 'Khách Hàng & Điểm Bán', icon: Store },
      ],
    },
    {
      groupTitle: 'KHO BÃI & VẬN HÀNH',
      items: [
        { id: 'inventory', label: 'Kho & Lô HSD (FEFO)', icon: Layers, highlight: true },
        { id: 'picking-list', label: 'Soạn Hàng Xe Tải', icon: ClipboardList, badge: 'Mới' },
        { id: 'products', label: 'Bánh Kẹo & Đa ĐVT', icon: Package },
      ],
    },
    {
      groupTitle: 'TÀI CHÍNH & KẾ TOÁN',
      items: [
        { id: 'debt', label: 'Sổ Nợ & VietQR Động', icon: QrCode },
        { id: 'google-sheets', label: 'Đồng Bộ Google Sheets', icon: FileSpreadsheet, badge: 'API' },
      ],
    },
    {
      groupTitle: 'HỆ THỐNG & ĐỘI NGŨ',
      items: [
        { id: 'mobile-sfa', label: 'Cổng Bán Hàng SFA (Sale)', icon: Smartphone, special: true },
        { id: 'users', label: 'Tài Khoản & Phân Quyền', icon: ShieldCheck, badge: 'RBAC' },
        { id: 'settings', label: 'Cài Đặt Hệ Thống', icon: Settings },
      ],
    },
  ];

  // Map ảnh chân dung thực tế theo vai trò
  const getUserAvatar = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80';
      case 'ACCOUNTANT':
        return 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&q=80';
      case 'WAREHOUSE':
        return 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80';
      case 'SUPERVISOR':
        return 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80';
      case 'SALES_REP':
        return 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&q=80';
      default:
        return 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80';
    }
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col h-screen fixed left-0 top-0 z-30 shadow-2xl border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/40">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black text-lg">
          <Boxes className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="font-extrabold text-sm text-white tracking-wider uppercase leading-tight truncate">
            KIM ĐÔ FMCG ERP
          </h1>
          <p className="text-[11px] text-emerald-400 font-semibold tracking-wide truncate">
            Enterprise Distribution
          </p>
        </div>
      </div>

      {/* Navigation Links Grouped */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
        {menuGroups.map((group) => {
          // Lọc các item trong group theo phân quyền allowedTabs
          const visibleItems = group.items.filter((item) => {
            if (!allowedTabs || allowedTabs.length === 0) return true;
            return allowedTabs.includes(item.id);
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={group.groupTitle} className="space-y-1">
              <div className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                {group.groupTitle}
              </div>

              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                      isActive
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                        : item.special
                        ? 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 hover:text-white border border-emerald-800/40'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5 truncate">
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive
                            ? 'text-slate-950'
                            : item.special
                            ? 'text-emerald-400'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isActive
                            ? 'bg-slate-950 text-emerald-400'
                            : 'bg-slate-800 text-emerald-400 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* User Profile Card */}
      {currentUser && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <img
              src={getUserAvatar(currentUser.role)}
              alt="User Avatar"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-emerald-500/40 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {currentUser.fullName || currentUser.username}
              </div>
              <div className="text-[10px] text-emerald-400 font-mono font-medium truncate">
                {currentUser.role}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* System Status Footer */}
      <div className="px-4 py-2.5 border-t border-slate-800/80 bg-slate-950/90 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400">Hạ Tầng CSDL</span>
          <span className="flex items-center space-x-1.5 text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Supabase Cloud</span>
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
