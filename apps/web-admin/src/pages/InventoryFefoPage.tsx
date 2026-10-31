import React, { useEffect, useState } from 'react';
import {
  Layers,
  Warehouse,
  Clock,
  ShieldAlert,
  CheckCircle,
  Plus,
  AlertCircle,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { getInventoryLots, getWarehouses, recommendFefo, createInboundLot, getProducts } from '../api';

export const InventoryFefoPage: React.FC = () => {
  const [lots, setLots] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [fefoFilter, setFefoFilter] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // FEFO Recommender Tool Modal
  const [showFefoModal, setShowFefoModal] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [testProduct, setTestProduct] = useState('');
  const [testQty, setTestQty] = useState(500);
  const [fefoResult, setFefoResult] = useState<any[]>([]);
  const [fefoError, setFefoError] = useState('');

  // Inbound PO Modal
  const [showInboundModal, setShowInboundModal] = useState(false);
  const [inboundForm, setInboundForm] = useState({
    warehouseId: '',
    productId: '',
    batchCode: '',
    manufactureDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    quantity: 10,
    uomName: 'Thùng',
    notes: '',
  });

  useEffect(() => {
    loadData();
    getProducts().then((p) => {
      setProducts(p);
      if (p.length > 0) setTestProduct(p[0].id);
    });
  }, [selectedWarehouse, fefoFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [lotsData, whData] = await Promise.all([
        getInventoryLots(selectedWarehouse, fefoFilter),
        getWarehouses(),
      ]);
      setLots(lotsData);
      setWarehouses(whData);
      if (whData.length > 0 && !inboundForm.warehouseId) {
        setInboundForm((prev) => ({ ...prev, warehouseId: whData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestFefo = async () => {
    try {
      setFefoError('');
      const res = await recommendFefo(testProduct, testQty);
      setFefoResult(res);
    } catch (err: any) {
      setFefoError(err.response?.data?.message || err.message);
      setFefoResult([]);
    }
  };

  const handleCreateInbound = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createInboundLot(inboundForm);
      setShowInboundModal(false);
      loadData();
      alert('Nhập kho thành công!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Warehouse Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((wh) => (
          <div
            key={wh.id}
            onClick={() => setSelectedWarehouse(selectedWarehouse === wh.id ? '' : wh.id)}
            className={`p-4 rounded-xl border cursor-pointer transition ${
              selectedWarehouse === wh.id
                ? 'bg-amber-50/60 border-amber-500 ring-2 ring-amber-500/20'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase tracking-wider">
                {wh.type}
              </span>
              <Warehouse className="w-4 h-4 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 mt-2">{wh.name}</h4>
            <p className="text-xs text-slate-500 mt-0.5">{wh.code}</p>
            <div className="mt-3 pt-2 border-t border-slate-100 text-xs font-semibold text-slate-700 flex justify-between">
              <span>Số lô đang lưu:</span>
              <span className="font-bold text-amber-700">{wh._count?.inventoryLots || 0} lô</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center mr-1">
            <Filter className="w-3.5 h-3.5 mr-1" /> Lọc HSD (FEFO):
          </span>

          <button
            onClick={() => setFefoFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              fefoFilter === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tất cả lô ({lots.length})
          </button>

          <button
            onClick={() => setFefoFilter('CRITICAL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 ${
              fefoFilter === 'CRITICAL'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            <span>Cận date (&le; 30 ngày)</span>
          </button>

          <button
            onClick={() => setFefoFilter('WARNING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              fefoFilter === 'WARNING'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Cảnh báo (31-60 ngày)
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowFefoModal(true)}
            className="px-3.5 py-2 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold hover:bg-amber-100 flex items-center space-x-1.5"
          >
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Thử Thuật Toán FEFO</span>
          </button>

          <button
            onClick={() => setShowInboundModal(true)}
            className="px-3.5 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nhập Kho Lô Mới</span>
          </button>
        </div>
      </div>

      {/* Main FEFO Inventory Lots Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200 uppercase">
              <tr>
                <th className="py-3 px-4">Sản Phẩm Bánh Kẹo</th>
                <th className="py-3 px-4">Mã Lô (Batch)</th>
                <th className="py-3 px-4">Kho Lưu Trữ</th>
                <th className="py-3 px-4">Hạn Sử Dụng (HSD)</th>
                <th className="py-3 px-4 text-center">Trạng Thái FEFO</th>
                <th className="py-3 px-4 text-right">Tồn Thực Tế</th>
                <th className="py-3 px-4 text-right">Đang Giữ Chỗ</th>
                <th className="py-3 px-4 text-right font-bold text-slate-900">Khả Dụng Bán</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Đang tải danh sách tồn kho FEFO...</td>
                </tr>
              ) : lots.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">Không có lô hàng nào phù hợp với bộ lọc.</td>
                </tr>
              ) : (
                lots.map((lot) => (
                  <tr key={lot.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      <div>{lot.product?.name}</div>
                      <div className="text-xs text-slate-400 font-mono font-normal">SKU: {lot.product?.code}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800 text-xs">
                      {lot.batchCode}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-600">
                      {lot.warehouse?.name}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-slate-800">
                        {new Date(lot.expiryDate).toLocaleDateString('vi-VN')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        NSX: {new Date(lot.manufactureDate).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block text-[11px] font-bold px-2.5 py-1 rounded-full ${
                          lot.fefoStatus === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                            : lot.fefoStatus === 'WARNING'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {lot.fefoLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-medium">
                      {lot.physicalQty} <span className="text-slate-400 text-xs">{lot.product?.baseUom}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-600">
                      {lot.reservedQty} <span className="text-slate-400 text-xs">{lot.product?.baseUom}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      {lot.availableQty} <span className="text-emerald-600 text-xs">{lot.product?.baseUom}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Giả Lập Thuật Toán FEFO (First Expired, First Out) */}
      {showFefoModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Kiểm Tra Thuật Toán Phân Bổ FEFO</h3>
              </div>
              <button
                onClick={() => setShowFefoModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Thuật toán FEFO sẽ quét toàn bộ các lô tồn kho của sản phẩm được chọn và ưu tiên bốc từ lô có Hạn sử dụng gần nhất trước để chống thất thoát date cho Nhà phân phối.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn sản phẩm thử nghiệm</label>
                <select
                  value={testProduct}
                  onChange={(e) => setTestProduct(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (ĐVT: {p.baseUom})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Số lượng cần xuất (quy về ĐVT cơ sở)
                </label>
                <input
                  type="number"
                  value={testQty}
                  onChange={(e) => setTestQty(parseInt(e.target.value) || 0)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-800"
                />
              </div>

              <button
                onClick={handleTestFefo}
                className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-sm transition"
              >
                Chạy Đề Xuất Bốc Lô FEFO
              </button>
            </div>

            {fefoError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{fefoError}</span>
              </div>
            )}

            {fefoResult.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Kế Hoạch Bốc Hàng Được Đề Xuất:
                </div>
                {fefoResult.map((res, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-900 font-mono">Lô: {res.batchCode}</div>
                      <div className="text-slate-500 text-[11px]">
                        HSD: {new Date(res.expiryDate).toLocaleDateString('vi-VN')} • {res.warehouseName}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-amber-700 text-sm">{res.allocatedQty}</span>
                      <span className="text-slate-500 text-[11px] block">ĐVT cơ sở</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Nhập Kho Lô Mới */}
      {showInboundModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Phiếu Nhập Kho Lô Hàng PO Mới</h3>
              <button
                onClick={() => setShowInboundModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateInbound} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Kho tiếp nhận</label>
                <select
                  value={inboundForm.warehouseId}
                  onChange={(e) => setInboundForm({ ...inboundForm, warehouseId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  required
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Mặt hàng bánh kẹo</label>
                <select
                  value={inboundForm.productId}
                  onChange={(e) => setInboundForm({ ...inboundForm, productId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  required
                >
                  <option value="">-- Chọn sản phẩm --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.brand})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mã Lô (Batch Code)</label>
                  <input
                    type="text"
                    placeholder="VD: LOT-202611A"
                    value={inboundForm.batchCode}
                    onChange={(e) => setInboundForm({ ...inboundForm, batchCode: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm uppercase font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hạn Sử Dụng (HSD)</label>
                  <input
                    type="date"
                    value={inboundForm.expiryDate}
                    onChange={(e) => setInboundForm({ ...inboundForm, expiryDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Số lượng</label>
                  <input
                    type="number"
                    min="1"
                    value={inboundForm.quantity}
                    onChange={(e) => setInboundForm({ ...inboundForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Đơn vị nhập</label>
                  <select
                    value={inboundForm.uomName}
                    onChange={(e) => setInboundForm({ ...inboundForm, uomName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="Thùng">Thùng</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Dây">Dây</option>
                    <option value="Gói">Gói (Base)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowInboundModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                >
                  Xác Nhận Nhập Kho
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

