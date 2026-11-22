'use client';
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw, ChevronDown, ShieldCheck, LogOut, Database, Bell } from 'lucide-react';

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

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', label: '👑 Giám Đốc / Chủ NPP' };
      case 'ACCOUNTANT':
        return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', label: '💼 Kế Toán Trưởng' };
      case 'WAREHOUSE':
        return { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', label: '📦 Quản Lý Kho Vận' };
      case 'SUPERVISOR':
        return { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', label: '🗺️ Giám Sát Tuyến' };
      case 'SALES_REP':
        return { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-300', label: '📱 Nhân Viên Bán Hàng' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-300', label: role };
    }
  };

  const currentRoleStyle = getRoleBadgeStyle(currentUser?.role || 'ADMIN');

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center space-x-2 text-[11px] text-slate-400 font-medium">
          <span>KIM ĐÔ ERP</span>
          <span>/</span>
          <span className="text-emerald-600 font-semibold uppercase">{title}</span>
        </div>
        <h2 className="text-base font-bold text-slate-900 leading-tight truncate">{title}</h2>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0">
        {/* Trạng thái Database Supabase */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Supabase PostgreSQL • Online</span>
        </div>

        {/* Nút Làm Mới */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs"
            title="Làm mới dữ liệu từ Supabase"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200"></div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 p-1.5 pr-2.5 rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition focus:outline-none shadow-xs"
            title="Tài khoản cá nhân"
          >
            <img
              src={getUserAvatar(currentUser?.role)}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-500/30 shrink-0"
            />
            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-slate-900 truncate max-w-[130px]">
                {currentUser?.fullName || 'Trần Đại Nghĩa'}
              </div>
              <div className="text-[10px] text-slate-500 truncate font-medium">
                {currentRoleStyle.label}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-2 flex items-center space-x-3">
                <img
                  src={getUserAvatar(currentUser?.role)}
                  alt="Avatar"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/50 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.fullName}</p>
                  <p className="text-[11px] text-slate-500 font-mono">@{currentUser?.username}</p>
                  <span
                    className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-md border ${currentRoleStyle.bg} ${currentRoleStyle.text} ${currentRoleStyle.border}`}
                  >
                    {currentRoleStyle.label}
                  </span>
                </div>
              </div>

              {/* Chuyển nhanh vai trò kiểm thử */}
              {usersList.length > 0 && onSwitchUser && (
                <div className="mb-2">
                  <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Chuyển tài khoản vận hành:
                  </div>
                  <div className="space-y-0.5 max-h-40 overflow-y-auto">
                    {usersList.map((u) => {
                      const isCur = u.username === currentUser?.username;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setDropdownOpen(false);
                            onSwitchUser(u);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            isCur
                              ? 'bg-emerald-50 text-emerald-800 font-bold'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <div className="truncate">
                            <span className="font-medium">{u.fullName}</span>{' '}
                            <span className="text-[10px] text-slate-400">({u.role})</span>
                          </div>
                          {isCur && <span className="text-emerald-600 text-xs font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-slate-100 pt-1 space-y-1">
                {onNavigateToUsers && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigateToUsers();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-2 transition"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Quản lý phân quyền tài khoản</span>
                  </button>
                )}

                {onLogout && (
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Đăng xuất khỏi hệ thống</span>
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
