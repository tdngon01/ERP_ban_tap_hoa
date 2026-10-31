import React, { useEffect, useState } from 'react';
import { Store, Search, Plus, MapPin, Phone, ShieldCheck, AlertCircle } from 'lucide-react';
import { getOutlets, createOutlet, getRoutes } from '../api';

export const OutletsPage: React.FC = () => {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    code: '',
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    district: 'Quận 1',
    province: 'Hồ Chí Minh',
    latitude: 10.7768,
    longitude: 106.7008,
    creditLimit: 15000000,
    routeId: '',
    tier: 'STANDARD',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [outletsData, routesData] = await Promise.all([
        getOutlets(undefined, search),
        getRoutes(),
      ]);
      setOutlets(outletsData);
      setRoutes(routesData);
      if (routesData.length > 0 && !form.routeId) {
        setForm((prev) => ({ ...prev, routeId: routesData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createOutlet(form);
      setShowModal(false);
      loadData();
      alert('Thêm điểm bán tạp hóa thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Tìm theo tên tiệm, chủ tạp hóa, SĐT, mã..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadData()}
            className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Điểm Bán Tạp Hóa</span>
        </button>
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 p-8 text-center text-slate-500">Đang tải danh sách điểm bán...</div>
        ) : outlets.length === 0 ? (
          <div className="col-span-3 p-8 text-center text-slate-500">Không tìm thấy điểm bán nào.</div>
        ) : (
          outlets.map((outlet) => {
            const usagePercent = outlet.creditLimit > 0
              ? Math.round((outlet.currentDebt / outlet.creditLimit) * 100)
              : 0;

            return (
              <div
                key={outlet.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {outlet.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{outlet.name}</h3>
                    <p className="text-xs text-slate-500">Chủ tiệm: <strong className="text-slate-700">{outlet.ownerName}</strong></p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      outlet.tier === 'VIP'
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : outlet.tier === 'GOLD'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {outlet.tier}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{outlet.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span className="line-clamp-1">{outlet.address}</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-400">
                    GPS: {outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}
                  </div>
                </div>

                {/* Thanh theo dõi Hạn mức Công nợ */}
                <div className="pt-3 border-t border-slate-100 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Nợ gối đầu:</span>
                    <span className={`font-bold font-mono ${outlet.currentDebt > 0 ? 'text-rose-600' : 'text-slate-700'}`}>
                      {outlet.currentDebt.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        usagePercent >= 90
                          ? 'bg-rose-500'
                          : usagePercent >= 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, usagePercent)}%` }}
                    ></div>
                  </div>

                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Hạn mức: {outlet.creditLimit.toLocaleString('vi-VN')} đ</span>
                    <span className="font-semibold text-slate-700">{usagePercent}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Thêm Điểm Bán Mới */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Thêm Điểm Bán Tạp Hóa Mới (GT)</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mã tiệm</label>
                  <input
                    type="text"
                    placeholder="VD: TH-007"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono uppercase"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tên tiệm tạp hóa</label>
                  <input
                    type="text"
                    placeholder="Tạp Hóa Bác Sáu"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Chủ tiệm</label>
                  <input
                    type="text"
                    placeholder="Nguyễn Văn Sáu"
                    value={form.ownerName}
                    onChange={(e) => setForm({ ...form, ownerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    placeholder="0909123456"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Địa chỉ chi tiết</label>
                <input
                  type="text"
                  placeholder="Số 10 Hai Bà Trưng, Phường Bến Nghé, Quận 1"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tọa độ Vĩ độ (GPS Lat)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={form.latitude}
                    onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tọa độ Kinh độ (GPS Lng)</label>
                  <input
                    type="number"
                    step="0.00001"
                    value={form.longitude}
                    onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hạn mức nợ (VNĐ)</label>
                  <input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tuyến bán hàng (MCP)</label>
                  <select
                    value={form.routeId}
                    onChange={(e) => setForm({ ...form, routeId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  Lưu Điểm Bán
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

