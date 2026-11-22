'use client';
import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  Boxes,
  Database,
  KeyRound,
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

  const sampleRoles = [
    {
      username: 'admin',
      name: 'Trần Đại Nghĩa',
      badge: '👑 Chủ NPP / Giám Đốc',
      color: 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    },
    {
      username: 'ketoan',
      name: 'Nguyễn Thu Hương',
      badge: '💼 Kế Toán Trưởng',
      color: 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80',
    },
    {
      username: 'thukho',
      name: 'Trần Văn Khoa',
      badge: '📦 Thủ Kho Vận',
      color: 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    },
    {
      username: 'giamsat',
      name: 'Lê Hoàng Nam',
      badge: '🗺️ Giám Sát Tuyến',
      color: 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    },
    {
      username: 'sale01',
      name: 'Nguyễn Văn Hùng',
      badge: '📱 Sale Thị Trường',
      color: 'bg-teal-50 text-teal-900 border-teal-200 hover:bg-teal-100',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80',
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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 border border-slate-200">
        {/* CỘT TRÁI: HERO BANNER DOANH NGHIỆP */}
        <div className="lg:col-span-5 relative bg-slate-900 text-white p-8 flex flex-col justify-between overflow-hidden">
          {/* Background Image Warehouse with overlay */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=1200&q=80')",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/90 to-slate-950" />

          {/* Nội dung bên trên */}
          <div className="relative z-10 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Boxes className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-extrabold text-base tracking-wider text-white uppercase">
                  KIM ĐÔ FMCG ERP
                </h1>
                <p className="text-[11px] text-emerald-400 font-semibold tracking-wide">
                  Distribution Enterprise
                </p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black text-white leading-snug">
                Hệ Thống Quản Trị & Phân Phối Bánh Kẹo Doanh Nghiệp
              </h2>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Giải pháp số hóa toàn diện: Quản trị kho hạn sử dụng FEFO, bảng kê soạn hàng xe tải, giám sát tuyến bán hàng MCP và gạch nợ VietQR tự động.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Phân quyền 5 vai trò (Chủ NPP, Kế toán, Thủ kho, Giám sát, Sales)</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Thuật toán FEFO bốc lô cận date tự động, chống hết hạn kho bãi</span>
              </div>
              <div className="flex items-start space-x-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Gạch nợ VietQR Napas 247 và đồng bộ hai chiều Google Sheets</span>
              </div>
            </div>
          </div>

          {/* Footer bên trái */}
          <div className="relative z-10 pt-6 mt-6 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Supabase Cloud PostgreSQL</span>
            </span>
            <span className="text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-800/60">
              Vercel Serverless
            </span>
          </div>
        </div>

        {/* CỘT PHẢI: FORM ĐĂNG NHẬP CHUẨN DOANH NGHIỆP */}
        <div className="lg:col-span-7 p-8 flex flex-col justify-between bg-white">
          <div>
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">Đăng Nhập Hệ Thống</h3>
              <p className="text-xs text-slate-500 mt-1">
                Nhập tài khoản và mật khẩu được cấp để truy cập vào hệ thống ERP
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Tên Đăng Nhập (Username)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Nhập tên đăng nhập..."
                    className="w-full pl-10 pr-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Mật Khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu..."
                    className="w-full pl-10 pr-10 py-2.5 text-xs border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-900 transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ghi nhớ phiên đăng nhập</span>
                </label>
                <span className="text-[11px] text-slate-400">Mật khẩu mặc định: 123456</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {loading ? (
                  <span>Đang xác thực thông tin...</span>
                ) : (
                  <>
                    <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* CHỌN TÀI KHOẢN VẬN HÀNH NHANH */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
                <span>Chọn nhanh vai trò vận hành:</span>
                <span className="text-[10px] text-emerald-600 font-semibold">5 Phân Quyền</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sampleRoles.map((role) => (
                  <button
                    key={role.username}
                    type="button"
                    onClick={() => {
                      setUsername(role.username);
                      setPassword('123456');
                      handleLogin(undefined, role.username, '123456');
                    }}
                    className={`p-2 rounded-xl border text-left transition flex items-center space-x-2.5 ${role.color}`}
                  >
                    <img
                      src={role.avatar}
                      alt={role.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-black/10"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-900">{role.name}</div>
                      <div className="text-[10px] text-slate-500 truncate">{role.badge}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* TIÊU CHUẨN BẢO MẬT DOANH NGHIỆP */}
          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Mã hóa Scrypt + Salted Hash</span>
            </span>
            <span className="font-mono text-slate-400 text-[10px]">JWT HMAC-SHA256</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
