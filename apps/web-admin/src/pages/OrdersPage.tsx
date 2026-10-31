import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Gift,
  CheckCircle,
  Truck,
  Clock,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import { getOrders, getPromotions, createOrder, getOutlets, getProducts } from '../api';

export const OrdersPage: React.FC<{ onNavigateToQr?: (outletId: string, orderId: string, amount: number) => void }> = ({ onNavigateToQr }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form tạo đơn mới
  const [outlets, setOutlets] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedOutletId, setSelectedOutletId] = useState('');
  const [salesRepName, setSalesRepName] = useState('Nguyễn Văn Hùng');
  const [orderType, setOrderType] = useState('PRE_SALES');
  const [orderItems, setOrderItems] = useState<any[]>([
    { productId: '', uomName: 'Thùng', quantity: 5 },
  ]);

  useEffect(() => {
    loadData();
    Promise.all([getOutlets(), getProducts()]).then(([o, p]) => {
      setOutlets(o);
      setProducts(p);
      if (o.length > 0) setSelectedOutletId(o[0].id);
      if (p.length > 0) {
        setOrderItems([{ productId: p[0].id, uomName: 'Thùng', quantity: 5 }]);
      }
    });
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, promosData] = await Promise.all([
        getOrders(),
        getPromotions(),
      ]);
      setOrders(ordersData);
      setPromotions(promosData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    if (products.length > 0) {
      setOrderItems([...orderItems, { productId: products[0].id, uomName: 'Thùng', quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...orderItems];
    updated[index][field] = value;
    setOrderItems(updated);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createOrder({
        outletId: selectedOutletId,
        salesRepName,
        orderType,
        items: orderItems,
        notes: 'Đơn tạo từ Web Quản Trị ERP',
      });
      alert(res.message);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Active Promotion Programs Banner */}
      <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
        <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider mb-2">
          <Gift className="w-4 h-4 text-amber-600" />
          <span>Chương Trình Khuyến Mãi Bánh Kẹo Đang Áp Dụng:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
          {promotions.map((p) => (
            <div key={p.id} className="p-2.5 rounded-lg bg-white border border-amber-200/80 flex items-center justify-between shadow-xs">
              <div>
                <span className="font-bold text-slate-800">{p.name}</span>
                <span className="block text-[11px] text-slate-500 font-mono">Mã: {p.code}</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Tự động áp dụng
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Orders Header & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="text-sm font-bold text-slate-800">
          Danh Sách Đơn Hàng Bánh Kẹo ({orders.length} đơn)
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Lên Đơn Hàng Mới</span>
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl">Đang tải đơn hàng...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-white rounded-xl">Chưa có đơn hàng nào.</div>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-bold text-slate-900 font-mono bg-slate-100 px-2.5 py-1 rounded">
                    {order.orderCode}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      order.orderType === 'PRE_SALES'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}
                  >
                    {order.orderType === 'PRE_SALES' ? 'Pre-sales (Giao sau)' : 'Van sales (Bán trên xe)'}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-500">
                    Thời gian: <strong className="text-slate-700">{new Date(order.createdAt).toLocaleString('vi-VN')}</strong>
                  </span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded ${
                      order.status === 'CONFIRMED'
                        ? 'bg-amber-100 text-amber-800'
                        : order.status === 'DELIVERED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {order.status === 'CONFIRMED' ? 'Đã xác nhận' : order.status === 'DELIVERED' ? 'Đã giao hàng' : order.status}
                  </span>
                </div>
              </div>

              {/* Thông tin tiệm tạp hóa & Sale */}
              <div className="flex flex-col md:flex-row md:items-center justify-between text-xs text-slate-600 gap-2">
                <div>
                  Tiệm tạp hóa: <strong className="text-slate-900 font-semibold">{order.outlet?.name}</strong>{' '}
                  <span className="text-slate-400">({order.outlet?.address})</span>
                </div>
                <div>
                  Sale phụ trách: <strong className="text-slate-800">{order.salesRepName}</strong>
                </div>
              </div>

              {/* Bảng Mặt Hàng (Hàng Bán + Hàng Tặng Khuyến Mãi) */}
              <div className="bg-slate-50/70 rounded-lg p-3 border border-slate-200 space-y-1.5">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Chi Tiết Mặt Hàng & Phân Bổ Lô FEFO:
                </div>
                {(order.items || []).map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-200/50 last:border-0">
                    <div className="flex items-center space-x-2">
                      {item.isGiftItem ? (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 flex items-center">
                          <Gift className="w-3 h-3 mr-0.5" /> TẶNG KM
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          BÁN
                        </span>
                      )}
                      <span className="font-bold text-slate-800">{item.product?.name}</span>
                      <span className="text-slate-500">
                        ({item.quantity} {item.uomName})
                      </span>
                      <span className="font-mono text-[11px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-amber-800 font-semibold">
                        Lô FEFO: {item.allocatedBatch || 'Tự động'}
                      </span>
                    </div>

                    <div className="font-mono font-bold text-slate-900">
                      {item.isGiftItem ? (
                        <span className="text-emerald-600">0 đ (Miễn phí)</span>
                      ) : (
                        `${item.totalPrice.toLocaleString('vi-VN')} đ`
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Tổng tiền & Trạng thái thanh toán */}
              <div className="flex flex-col md:flex-row md:items-center justify-between pt-2 border-t border-slate-100 gap-2">
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-slate-500">Thanh toán:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                      order.paymentStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {order.paymentStatus === 'PAID'
                      ? 'Đã thanh toán đủ'
                      : `Còn nợ: ${(order.totalAmount - order.paidAmount).toLocaleString('vi-VN')} đ`}
                  </span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-2">Tổng thanh toán:</span>
                    <span className="text-lg font-extrabold text-amber-700 font-mono">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  {order.paymentStatus !== 'PAID' && onNavigateToQr && (
                    <button
                      onClick={() => onNavigateToQr(order.outletId, order.id, order.totalAmount - order.paidAmount)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Thu tiền VietQR</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Lên Đơn Hàng Mới */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-base text-slate-900">Lên Đơn Hàng Bánh Kẹo Mới</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Chọn tiệm tạp hóa (GT)</label>
                <select
                  value={selectedOutletId}
                  onChange={(e) => setSelectedOutletId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white font-medium"
                  required
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.ownerName} - {o.address}) - Nợ hiện tại: {o.currentDebt.toLocaleString('vi-VN')}đ
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mô hình bán hàng</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm bg-white"
                  >
                    <option value="PRE_SALES">Pre-sales (Lên đơn trước, xe giao sau)</option>
                    <option value="VAN_SALES">Van Sales (Bán và giao ngay từ kho xe)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Sale thị trường</label>
                  <input
                    type="text"
                    value={salesRepName}
                    onChange={(e) => setSalesRepName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Danh sách mặt hàng mua */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Mặt hàng bánh kẹo đặt mua:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-amber-600 font-bold hover:underline"
                  >
                    + Thêm mặt hàng
                  </button>
                </div>

                {orderItems.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white font-medium"
                        required
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-3">
                      <select
                        value={item.uomName}
                        onChange={(e) => handleItemChange(idx, 'uomName', e.target.value)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs bg-white"
                      >
                        <option value="Thùng">Thùng</option>
                        <option value="Hộp">Hộp</option>
                        <option value="Dây">Dây</option>
                        <option value="Gói">Gói</option>
                      </select>
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full border border-slate-300 rounded p-1.5 text-xs font-bold"
                        required
                      />
                    </div>

                    <div className="col-span-1 text-center">
                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="text-rose-500 hover:text-rose-700 text-sm font-bold"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-amber-50 text-[11px] text-amber-900 border border-amber-200 leading-relaxed">
                ✨ <strong>Promotion Engine:</strong> Hệ thống sẽ tự động quét chính sách khuyến mãi (vd: Mua 5 thùng Chocopie tặng 1 dây Oishi) và tự động chỉ định Lô cận date theo FEFO khi bạn bấm Lưu.
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                >
                  Tạo Đơn & Phân Bổ FEFO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

