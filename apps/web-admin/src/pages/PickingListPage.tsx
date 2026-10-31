import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Printer,
  RefreshCw,
  Truck,
  Package,
  Layers,
  Store,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { getPickingList } from '../api';

export const PickingListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    totalOrdersCount: number;
    orders: any[];
    pickingItems: any[];
  }>({ totalOrdersCount: 0, orders: [], pickingItems: [] });
  const [statusFilter, setStatusFilter] = useState('CONFIRMED');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getPickingList(statusFilter);
      setData(res);
    } catch (err) {
      console.error('Error fetching picking list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handlePrint = () => {
    window.print();
  };

  // Tính tổng số lượng theo đơn vị tính
  const totalCases = data.pickingItems
    .filter((item) => item.uomName === 'Thùng')
    .reduce((sum, item) => sum + item.totalQty, 0);

  const totalBoxes = data.pickingItems
    .filter((item) => item.uomName === 'Hộp' || item.uomName === 'Dây')
    .reduce((sum, item) => sum + item.totalQty, 0);

  const totalPacks = data.pickingItems
    .filter((item) => item.uomName === 'Gói' || item.uomName === 'Thanh')
    .reduce((sum, item) => sum + item.totalQty, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner / Controls (Hidden on Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm print:hidden">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Bảng Kê Soạn Hàng Tổng (Picking List)</h2>
            <p className="text-xs text-slate-500">
              Gộp toàn bộ đơn hàng trong ngày để thủ kho soạn hàng tập trung lên xe tải theo chuẩn FEFO
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white"
          >
            <option value="CONFIRMED">Đơn Đã Xác Nhận (CONFIRMED)</option>
            <option value="PENDING">Đơn Chờ Xử Lý (PENDING)</option>
            <option value="SHIPPING">Đơn Đang Giao Hàng (SHIPPING)</option>
          </select>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>In Bảng Kê Soạn Hàng (Ctrl + P)</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards (Hidden on Print) */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 print:hidden">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng số đơn hàng gộp</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{data.totalOrdersCount}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Tổng Thùng cần bốc</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{totalCases} Thùng</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Hộp / Dây lẻ</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">{totalBoxes}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 font-medium">Gói / Thanh lẻ</p>
            <p className="text-2xl font-black text-purple-700 mt-1">{totalPacks}</p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Sheet Content for Screen and Printing */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-base font-black uppercase text-slate-900">
                NHÀ PHÂN PHỐI BÁNH KẸO AN PHÁT - KHO TRUNG TÂM
              </h1>
              <p className="text-xs text-slate-600">Phân hệ Kho bãi & Soạn hàng tập trung (Warehouse Picking)</p>
            </div>
            <div className="text-right text-xs">
              <p>Ngày in: <strong>{new Date().toLocaleDateString('vi-VN')}</strong> {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-slate-500">Trạng thái: <strong>{statusFilter}</strong> ({data.totalOrdersCount} đơn hàng)</p>
            </div>
          </div>

          <div className="text-center mt-3">
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide">
              BẢNG KÊ SOẠN HÀNG TỔNG XUẤT XE TẢI
            </h2>
            <p className="text-xs text-slate-500 italic">
              (Thủ kho căn cứ bảng kê này để lấy đúng số lượng và Lô HSD FEFO lên xe tải)
            </p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400">Đang tổng hợp dữ liệu soạn hàng...</div>
        ) : data.pickingItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-semibold">Hiện không có đơn hàng nào ở trạng thái {statusFilter}</p>
            <p className="text-xs text-slate-500 mt-1">Hãy chuyển trạng thái đơn hàng sang {statusFilter} để tạo bảng kê.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Table Tổng Hợp Mặt Hàng */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-800 text-left print:bg-slate-200">
                    <th className="py-2.5 px-2 text-center w-10">STT</th>
                    <th className="py-2.5 px-3">Mã Bánh Kẹo</th>
                    <th className="py-2.5 px-3">Tên Sản Phẩm Bánh Kẹo</th>
                    <th className="py-2.5 px-3 text-center">ĐVT</th>
                    <th className="py-2.5 px-3 text-center">Lô HSD Cần Lấy (FEFO)</th>
                    <th className="py-2.5 px-3 text-right">Tổng SL Lấy</th>
                    <th className="py-2.5 px-3">Chi Tiết Tạp Hóa Nhận</th>
                    <th className="py-2.5 px-2 text-center w-16">Kiểm Đếm</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {data.pickingItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80">
                      <td className="py-3 px-2 text-center text-slate-500 font-semibold">{idx + 1}</td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-800">{item.productCode}</td>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.productName}</td>
                      <td className="py-3 px-3 text-center font-bold text-amber-900 bg-amber-50/50 rounded">
                        {item.uomName}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800">
                          {item.allocatedBatch}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black font-mono text-base text-amber-700">
                        {item.totalQty}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {item.outletBreakdown?.map((o: any, oIdx: number) => (
                            <span
                              key={oIdx}
                              className="inline-block bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-700"
                            >
                              <strong>{o.outletName}</strong>: {o.quantity} {item.uomName}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="w-5 h-5 border-2 border-slate-400 rounded mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Chữ ký xác nhận */}
            <div className="grid grid-cols-3 gap-4 text-center text-xs pt-8 border-t border-slate-200">
              <div>
                <p className="font-bold text-slate-900">Người Lập Bảng Kê</p>
                <p className="text-[10px] text-slate-500 italic">(Ký, họ tên)</p>
                <div className="h-16"></div>
                <p className="font-semibold text-slate-700">Điều phối kho</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">Thủ Kho Soạn Hàng</p>
                <p className="text-[10px] text-slate-500 italic">(Đã kiểm đếm & chuẩn bị đủ)</p>
                <div className="h-16"></div>
                <p className="font-semibold text-slate-700">Thủ kho FEFO</p>
              </div>
              <div>
                <p className="font-bold text-slate-900">Tài Xế Nhận Hàng Lên Xe</p>
                <p className="text-[10px] text-slate-500 italic">(Đã nhận đủ theo bảng kê)</p>
                <div className="h-16"></div>
                <p className="font-semibold text-slate-700">Tài xế giao vận</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

