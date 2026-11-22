'use client';
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, UserCheck, ChevronDown, ShieldCheck, Check, LogOut } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  currentUser?: any;
  usersList?: any[];
  onSwitchUser?: (user: any) => void;
  onNavigateToUsers?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  title,
  subtitle,
  onRefresh,
  loading,
  currentUser,
  usersList = [],
  onSwitchUser,
  onNavigateToUsers,
  onLogout,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: '👑 Chủ NPP' };
      case 'ACCOUNTANT':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: '💼 Kế Toán' };
      case 'WAREHOUSE':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: '📦 Thủ Kho' };
      case 'SUPERVISOR':
        return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', label: '🗺️ Giám Sát' };
      case 'SALES_REP':
        return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', label: '📱 Van Sales' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', label: role };
    }
  };

  const currentRoleStyle = getRoleBadgeStyle(currentUser?.role || 'ADMIN');

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex-1 min-w-0 pr-4">
        <h2 className="text-lg font-bold text-slate-900 leading-tight truncate">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500 truncate">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile & Security Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 pl-2 pr-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition focus:outline-none shadow-xs"
            title="Tài khoản cá nhân"
          >
            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-sm">
              {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                {currentUser?.fullName || 'Trần Đại Nghĩa'}
              </div>
              <div className="flex items-center space-x-1">
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
                >
                  {currentRoleStyle.label}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                    {currentUser?.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'A'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.fullName}</p>
                    <p className="text-[11px] text-slate-500 font-mono">@{currentUser?.username}</p>
                    <span
                      className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.2 rounded border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
                    >
                      {currentRoleStyle.label}
                    </span>
                  </div>
                </div>
                {currentUser?.phone && (
                  <p className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200/60">
                    SĐT: <strong>{currentUser.phone}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1">
                {currentUser?.role === 'ADMIN' && onNavigateToUsers && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigateToUsers();
                    }}
                    className="w-full py-2 px-3 text-left text-xs font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg flex items-center space-x-2 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Quản lý nhân viên & Phân quyền RBAC</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full py-2 px-3 text-left text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg flex items-center space-x-2 transition border-t border-slate-100 mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Đăng Xuất Khỏi Hệ Thống</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
