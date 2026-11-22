'use client';
import React, { useState } from 'react';
import {
  Sparkles,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  HardDrive,
  Users,
} from 'lucide-react';
import { login } from '../api';

interface LoginPageProps {
  onLoginSuccess: (authData: { user: any; token: string; allowedTabs: string[] }) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const quickRoles = [
    {
      username: 'admin',
      name: 'Chủ NPP / Giám Đốc',
      badge: '👑 Toàn Quyền',
      color: 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200',
      desc: 'Quản trị toàn bộ ERP & KPI',
    },
    {
      username: 'ketoan',
      name: 'Nguyễn Thu Hương',
      badge: '💼 Kế Toán',
      color: 'bg-blue-100 text-blue-900 border-blue-300 hover:bg-blue-200',
      desc: 'Sổ nợ VietQR, duyệt đơn hàng',
    },
    {
      username: 'thukho',
      name: 'Trần Văn Khoa',
      badge: '📦 Thủ Kho',
      color: 'bg-emerald-100 text-emerald-900 border-emerald-300 hover:bg-emerald-200',
      desc: 'Lô FEFO & Bảng kê xe tải',
    },
    {
      username: 'giamsat',
      name: 'Lê Hoàng Nam',
      badge: '🗺️ Giám Sát',
      color: 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200',
      desc: 'Tuyến MCP T2-T7 & Báo cáo GPS',
    },
    {
      username: 'sale01',
      name: 'Nguyễn Văn Hùng',
      badge: '📱 Van Sales',
      color: 'bg-teal-100 text-teal-900 border-teal-300 hover:bg-teal-200',
      desc: 'Ứng dụng Mobile SFA & Mở tiệm',
    },
  ];

  const handleLogin = async (e?: React.FormEvent, customUser?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');

    const loginUser = customUser || username;
    const loginPass = customPass !== undefined ? customPass : password;

    if (!loginUser.trim()) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }

    try {
      setLoading(true);
      const res = await login({ username: loginUser, password: loginPass });
      if (res && res.token) {
        if (rememberMe) {
          localStorage.setItem('fmcg_auth_token', res.token);
          localStorage.setItem('fmcg_current_user', JSON.stringify(res.user));
        } else {
          sessionStorage.setItem('fmcg_auth_token', res.token);
          sessionStorage.setItem('fmcg_current_user', JSON.stringify(res.user));
        }
        onLoginSuccess({
          user: res.user,
          token: res.token,
          allowedTabs: res.allowedTabs || [],
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Đăng nhập không thành công';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (uname: string) => {
    setUsername(uname);
    setPassword('123456');
    handleLogin(undefined, uname, '123456');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 flex flex-col justify-center items-center p-4">
      {/* Container */}
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-700/50">
        {/* Left Side: Brand & Feature Highlights */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
          <div>
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-wide">ERP FMCG</h1>
                <p className="text-xs text-amber-400 font-medium">Bánh Kẹo & Tạp Hóa DMS</p>
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white leading-tight mb-2">
              Hệ Thống Quản Trị & Phân Phối Toàn Diện
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Tối ưu cho Nhà Phân Phối bánh kẹo: Quản lý đa ĐVT, kho hạn sử dụng FEFO, bảng kê soạn hàng xe tải, giám sát tuyến MCP và gạch nợ VietQR tự động.
            </p>

            <div className="space-y-3">
              <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Phân quyền RBAC 5 vai trò</strong> (Chủ NPP, Kế toán, Thủ kho, Giám sát, Van Sales)
                </span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Thuật toán FEFO</strong> tự động gợi ý xuất lô cận date trước
                </span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Sổ nợ gối đầu & mã VietQR động</strong> chuẩn Napas 247
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <HardDrive className="w-3.5 h-3.5 text-amber-400" />
              <span>NPP An Phát</span>
            </span>
            <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              Desktop Offline & Cloud
            </span>
          </div>
        </div>

        {/* Right Side: Login Form & Quick 1-Click Demo */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-slate-900">Đăng Nhập Hệ Thống</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nhập tên đăng nhập và mật khẩu được cấp hoặc chọn tài khoản mẫu bên dưới
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Đăng Nhập (Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ví dụ: admin, ketoan, thukho..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium text-slate-900"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center space-x-2 text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-500"
                  />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
                <span className="text-slate-400 text-[11px]">
                  Bảo mật SSL 256-bit
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-lg text-sm transition shadow-md shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                <span>{loading ? 'Đang xác thực...' : 'Đăng Nhập Vào Hệ Thống'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          </div>

          {/* Hướng dẫn vai trò & Bảo mật Doanh nghiệp */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Users className="w-3.5 h-3.5 text-amber-500" />
                <span>Các Vai Trò Được Phân Quyền</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                RBAC 5 Cấp
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {quickRoles.map((r) => (
                <button
                  key={r.username}
                  type="button"
                  onClick={() => {
                    setUsername(r.username);
                    setPassword('');
                  }}
                  title="Nhấp để điền tên đăng nhập"
                  className={`p-2 rounded-lg border text-left transition text-xs hover:border-slate-400 bg-white`}
                >
                  <div className="font-bold flex items-center justify-between text-slate-800">
                    <span>{r.badge}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">@{r.username}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{r.desc}</div>
                </button>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 text-center mt-3">
              Mật khẩu khởi tạo ban đầu: <code className="font-bold text-slate-600">123456</code> (Vui lòng đổi mật khẩu sau lần đăng nhập đầu tiên)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
