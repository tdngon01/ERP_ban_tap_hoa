import React from 'react';
import { Bell, Search, RefreshCw, UserCheck } from 'lucide-react';

interface NavbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ title, subtitle, onRefresh, loading }) => {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900 leading-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>

      <div className="flex items-center space-x-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-600' : 'text-slate-500'}`} />
            <span>{loading ? 'Đang tải...' : 'Làm mới'}</span>
          </button>
        )}

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center space-x-2 pl-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 font-bold text-xs">
            QL
          </div>
          <div className="text-left hidden md:block">
            <div className="text-xs font-semibold text-slate-800">Kế Toán Bán Hàng</div>
            <div className="text-[10px] text-slate-500">Giám Sát NPP</div>
          </div>
        </div>
      </div>
    </header>
  );
};

