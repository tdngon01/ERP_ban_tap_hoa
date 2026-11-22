'use client';
import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  ShoppingCart,
  Store,
  AlertTriangle,
  Clock,
  TrendingUp,
  ShieldAlert,
  ArrowUpRight,
  CheckCircle2,
  Calendar,
  Trophy,
  Target,
  Award,
  Package,
  BarChart3,
  Users,
} from 'lucide-react';
import { getDashboardMetrics } from '../api';

export const DashboardPage: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getDashboardMetrics();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Đang tải dữ liệu tổng quan...</div>;
  }

  const kpi = data?.kpi || {};
  const nearDateLots = data?.nearDateLots || [];
  const salesRepPerformance = data?.salesRepPerformance || [];
  const topProducts = data?.topProducts || [];
  const topOutlets = data?.topOutlets || [];
  const revenueByCategory = data?.revenueByCategory || [];

  // Ảnh mẫu nhân viên bán hàng
  const getRepAvatar = (name: string, idx: number) => {
    const avatars = [
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    ];
    return avatars[idx % avatars.length];
  };

  // Ảnh mẫu sản phẩm bánh kẹo
  const getProductImage = (code: string) => {
    if (code?.includes('CHOCO')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=150&q=80';
    if (code?.includes('CUSTAS')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&q=80';
    if (code?.includes('AFC')) return 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=150&q=80';
    if (code?.includes('COSY')) return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&q=80';
    if (code?.includes('OISHI')) return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=150&q=80';
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=150&q=80';
  };

  // Ảnh mẫu tiệm tạp hóa
  const getStoreImage = (idx: number) => {
    const storeImgs = [
      'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=150&q=80',
      'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=150&q=80',
      'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=150&q=80',
      'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=150&q=80',
      'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&q=80',
    ];
    return storeImgs[idx % storeImgs.length];
  };

  return (
    <div className="space-y-6">
      {/* Cảnh báo Hàng Cận Date FEFO Banner nếu có */}
      {kpi.criticalNearDateCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start justify-between shadow-xs">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Cảnh báo FEFO: Có {kpi.criticalNearDateCount} lô bánh kẹo cận date (&le; 30 ngày)
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Cần ưu tiên xuất lô cận date hoặc lập phiếu xuất khuyến mãi/đổi trả cho nhà sản xuất ngay.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition flex items-center space-x-1.5 shadow-sm"
          >
            <span>Xử lý ngay</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh số hôm nay */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doanh Số Hôm Nay</span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {(kpi.todayRevenue || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center mt-1">
              <TrendingUp className="w-3.5 h-3.5 mr-1" />
              <span>{kpi.todayOrdersCount || 0} đơn hàng thành công</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Tổng Điểm Bán Tạp Hóa */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Điểm Bán Tạp Hóa (GT)</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpi.totalOutlets || 0}</div>
            <div className="text-xs text-slate-500 mt-1">
              Viếng thăm hôm nay: <strong className="text-slate-800">{kpi.todayVisitsCount || 0}</strong> điểm
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Tỷ Lệ Đơn Hàng Tuyến (Strike Rate) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tỷ Lệ Lên Đơn (Strike Rate)</span>
            <div className="text-2xl font-black text-slate-900 mt-1">{kpi.strikeRatePercent || 0}%</div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">Đạt chỉ tiêu đi tuyến Sale</div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Tổng Công Nợ Gối Đầu */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Công Nợ Tạp Hóa</span>
            <div className="text-2xl font-black text-rose-600 mt-1">
              {(kpi.totalDebt || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Hạn mức: {(kpi.totalCreditLimit || 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2 Cột: Bảng Lô Hàng Cận Date (FEFO) & Đơn Hàng Gần Đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bảng Lô Hàng Cận Date */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">Cảnh Báo Lô Bánh Kẹo Cận Hạn Sử Dụng (FEFO)</h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-600 hover:text-amber-700 font-bold"
            >
              Quản lý kho &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {nearDateLots.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Không có lô hàng nào cận hạn sử dụng.</div>
            ) : (
              nearDateLots.slice(0, 5).map((lot: any) => {
                const isCritical = lot.daysUntilExpiry <= 30;
                return (
                  <div key={lot.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getProductImage(lot.product?.code)}
                        alt={lot.product?.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                      />
                      <div>
                        <div className="text-xs font-bold text-slate-900">{lot.product?.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          Lô: {lot.batchCode} • {lot.warehouse?.name}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {lot.availableQty} {lot.product?.baseUom}
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md inline-block mt-0.5 ${
                          isCritical ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        Còn {lot.daysUntilExpiry} ngày
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Đơn Hàng Gần Đây */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Đơn Hàng Thị Trường Gần Đây</h3>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
            >
              Xem tất cả đơn &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {(data?.recentOrders || []).length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">Chưa có đơn hàng nào hôm nay.</div>
            ) : (
              (data?.recentOrders || []).map((order: any) => (
                <div key={order.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">{order.orderCode}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {order.orderType === 'PRE_SALES' ? 'Pre-sales' : 'Van sales'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Sale: <strong className="text-slate-700">{order.salesRepName}</strong> •{' '}
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Nợ gối đầu'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Bảng Thi Đua Chỉ Tiêu & KPI Nhân Viên Bán Hàng */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">Bảng Thi Đua Chỉ Tiêu Doanh Số & KPI Nhân Viên Bán Hàng</h3>
              <p className="text-[11px] text-slate-500">Chỉ tiêu 50.000.000 đ/tháng, số đơn hàng và tỷ lệ ra đơn (Strike Rate)</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('routes')}
            className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center space-x-1"
          >
            <span>Quản lý tuyến MCP</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <th className="p-3.5 text-center">Hạng</th>
                <th className="p-3.5">Nhân Viên Bán Hàng</th>
                <th className="p-3.5 text-right">Doanh Số Thực Tế</th>
                <th className="p-3.5 text-center">Chỉ Tiêu / Tiến Độ</th>
                <th className="p-3.5 text-center">Số Đơn</th>
                <th className="p-3.5 text-center">Ghé Thăm</th>
                <th className="p-3.5 text-center">Tỷ Lệ Ra Đơn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {salesRepPerformance.map((rep: any, idx: number) => (
                <tr key={rep.name} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 text-center">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-bold text-xs ${
                        rep.rank === 1
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : rep.rank === 2
                          ? 'bg-slate-200 text-slate-800'
                          : rep.rank === 3
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {rep.rank === 1 ? '🥇' : rep.rank === 2 ? '🥈' : rep.rank === 3 ? '🥉' : rep.rank}
                    </span>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center space-x-3">
                      <img
                        src={getRepAvatar(rep.name, idx)}
                        alt={rep.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{rep.name}</div>
                        <div className="text-[10px] text-slate-500">Tuyến Van Sales</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-emerald-700">
                    {rep.actualRevenue.toLocaleString('vi-VN')} đ
                  </td>
                  <td className="p-3.5">
                    <div className="w-36 mx-auto space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold">
                        <span className="text-slate-500">{rep.achievementPercent}% đạt</span>
                        <span className="text-slate-400">/ 50.000.000đ</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            rep.achievementPercent >= 100
                              ? 'bg-emerald-500'
                              : rep.achievementPercent >= 50
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, rep.achievementPercent)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-800">{rep.ordersCount} đơn</td>
                  <td className="p-3.5 text-center text-slate-600">{rep.visitsCount} tiệm</td>
                  <td className="p-3.5 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {rep.strikeRatePercent}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top 5 Sản Phẩm Bán Chạy & Top 5 Điểm Bán Mua Hàng Nhiều Nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 SKU Bán Chạy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-800">Top 5 Bánh Kẹo Bán Chạy Nhất (Best Sellers)</h3>
            </div>
            <button onClick={() => onNavigate('products')} className="text-xs text-blue-600 font-bold hover:text-blue-700">
              Xem sản phẩm &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topProducts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Chưa có dữ liệu sản phẩm xuất bán.</div>
            ) : (
              topProducts.map((p: any, idx: number) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getProductImage(p.code)}
                      alt={p.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Mã: {p.code} • {p.category}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-slate-900">{p.revenue.toLocaleString('vi-VN')} đ</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Đã bán: <strong className="text-blue-700">{p.totalQty}</strong> {p.baseUom}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top 5 Điểm Bán Mua Nhiều Nhất */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Top 5 Điểm Bán Doanh Thu Cao Nhất</h3>
            </div>
            <button onClick={() => onNavigate('outlets')} className="text-xs text-emerald-600 font-bold hover:text-emerald-700">
              Xem điểm bán &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {topOutlets.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">Chưa có dữ liệu điểm bán mua hàng.</div>
            ) : (
              topOutlets.map((o: any, idx: number) => (
                <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div className="flex items-center space-x-3">
                    <img
                      src={getStoreImage(idx)}
                      alt={o.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900">{o.name}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        Chủ tiệm: {o.ownerName} • ĐT: {o.phone}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-bold text-emerald-700">{o.totalSpent.toLocaleString('vi-VN')} đ</div>
                    <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                      Nợ gối đầu: {(o.currentDebt || 0).toLocaleString('vi-VN')} đ
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Phân bổ Doanh số theo Ngành Hàng */}
      {revenueByCategory.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs uppercase tracking-wide">
            <BarChart3 className="w-4 h-4 text-slate-600" />
            <span>Phân Bổ Cơ Cấu Doanh Số Theo Ngành Hàng Bánh Kẹo:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {revenueByCategory.map((c: any) => (
              <div key={c.category} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                <div className="text-xs text-slate-500 font-medium truncate">{c.category}</div>
                <div className="text-sm font-bold text-slate-900 mt-1">{c.revenue.toLocaleString('vi-VN')} đ</div>
                <div className="text-[10px] text-emerald-600 font-bold mt-0.5">{c.percent}% tổng doanh thu</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
