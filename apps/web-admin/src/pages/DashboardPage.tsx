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

  return (
    <div className="space-y-6">
      {/* Cảnh báo Hàng Cận Date FEFO Banner nếu có */}
      {kpi.criticalNearDateCount > 0 && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start justify-between shadow-sm">
          <div className="flex items-start space-x-3">
            <div className="p-2 rounded-lg bg-rose-100 text-rose-600 mt-0.5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-900">
                Cảnh báo FEFO: Có {kpi.criticalNearDateCount} lô bánh kẹo cận date (&le; 30 ngày)
              </h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Cần ưu tiên đẩy bán trước hoặc lập phiếu xuất khuyến mãi/đổi trả cho nhà sản xuất ngay.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('inventory')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition flex items-center space-x-1"
          >
            <span>Xử lý ngay</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Doanh số hôm nay */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Doanh Số Hôm Nay</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">
              {(kpi.todayRevenue || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-emerald-600 font-medium flex items-center mt-1">
              <TrendingUp className="w-3 h-3 mr-1" />
              <span>{kpi.todayOrdersCount || 0} đơn hàng thành công</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Tổng Điểm Bán Tạp Hóa */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Điểm Bán Tạp Hóa (GT)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{kpi.totalOutlets || 0}</div>
            <div className="text-xs text-slate-500 mt-1">
              Viếng thăm hôm nay: <span className="font-semibold text-slate-800">{kpi.todayVisitsCount || 0}</span> điểm
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Store className="w-6 h-6" />
          </div>
        </div>

        {/* Tỷ Lệ Đơn Hàng Tuyến (Strike Rate) */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tỷ Lệ Lên Đơn (Strike Rate)</span>
            <div className="text-2xl font-bold text-slate-900 mt-1">{kpi.strikeRatePercent || 0}%</div>
            <div className="text-xs text-emerald-600 font-medium mt-1">Đạt chỉ tiêu đi tuyến Sale</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Tổng Công Nợ Gối Đầu */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Công Nợ Tạp Hóa</span>
            <div className="text-2xl font-bold text-rose-600 mt-1">
              {(kpi.totalDebt || 0).toLocaleString('vi-VN')} đ
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Hạn mức: {(kpi.totalCreditLimit || 0).toLocaleString('vi-VN')} đ
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 2 Cột: Bảng Lô Hàng Cận Date (FEFO) & Đơn Hàng Gần Đây */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bảng Lô Hàng Cận Date */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-800">Lô Bánh Kẹo Cận HSD (Thuật toán FEFO)</h3>
            </div>
            <button
              onClick={() => onNavigate('inventory')}
              className="text-xs text-amber-600 hover:text-amber-700 font-semibold"
            >
              Xem tất cả kho &rarr;
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {nearDateLots.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">Tất cả lô hàng đều trong hạn an toàn.</div>
            ) : (
              nearDateLots.map((lot: any) => (
                <div key={lot.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition">
                  <div>
                    <div className="text-sm font-bold text-slate-800">{lot.productName}</div>
                    <div className="text-xs text-slate-500 flex items-center space-x-2 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-700 font-semibold">
                        Lô: {lot.batchCode}
                      </span>
                      <span>•</span>
                      <span>HSD: {new Date(lot.expiryDate).toLocaleDateString('vi-VN')}</span>
                      <span>•</span>
                      <span className="text-slate-600">{lot.warehouseName}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        lot.status === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      Còn {lot.daysLeft} ngày
                    </span>
                    <div className="text-xs text-slate-500 mt-1">
                      Tồn: <span className="font-bold text-slate-800">{lot.availableQty}</span> {lot.baseUom}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Đơn Hàng Gần Đây */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="w-4 h-4 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800">Đơn Hàng Thị Trường Gần Đây</h3>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
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
                      <span className="text-sm font-bold text-slate-900">{order.orderCode}</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                        {order.orderType === 'PRE_SALES' ? 'Pre-sales' : 'Van sales'}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      Sale: <span className="font-medium text-slate-700">{order.salesRepName}</span> •{' '}
                      {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-slate-900">
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
    </div>
  );
};

