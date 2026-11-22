'use client';
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
  Printer,
  RotateCcw,
  FileText,
  Trash2,
} from 'lucide-react';
import {
  getOrders,
  getPromotions,
  createOrder,
  getOutlets,
  getProducts,
  createReturnOrder,
  getReturnHistory,
} from '../api';
import { InvoiceModal } from '../components/InvoiceModal';

export const OrdersPage: React.FC<{ onNavigateToQr?: (outletId: string, orderId: string, amount: number) => void }> = ({ onNavigateToQr }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<any>(null);

  // Tab: 'orders' (Đơn bán) | 'returns' (Đổi trả / Thu hồi hàng)
  const [activeTab, setActiveTab] = useState<'orders' | 'returns'>('orders');
  const [returnHistory, setReturnHistory] = useState<any[]>([]);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnForm, setReturnForm] = useState({
    outletId: '',
    salesRepName: 'Nguyễn Văn Hùng',
    reason: 'Bao bì móp méo / rách vỡ khi vận chuyển',
    notes: '',
    items: [{ productId: '', uomName: 'Thùng', quantity: 1, unitPrice: 470000 }],
  });

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
      if (o.length > 0) {
        setSelectedOutletId(o[0].id);
        setReturnForm((prev) => ({ ...prev, outletId: o[0].id }));
      }
      if (p.length > 0) {
        setOrderItems([{ productId: p[0].id, uomName: 'Thùng', quantity: 5 }]);
        setReturnForm((prev) => ({
          ...prev,
          items: [{ productId: p[0].id, uomName: 'Thùng', quantity: 1, unitPrice: p[0].uoms?.[p[0].uoms.length - 1]?.price || 470000 }],
        }));
      }
    });
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, promosData, returnsData] = await Promise.all([
        getOrders(),
        getPromotions(),
        getReturnHistory().catch(() => []),
      ]);
      setOrders(ordersData);
      setPromotions(promosData);
      setReturnHistory(returnsData);
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
        notes: 'Đơn tạo từ Desktop App ERP FMCG',
      });
      alert(res.message);
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Handlers cho Đổi trả hàng / Thu hồi hàng lỗi
  const handleAddReturnItem = () => {
    if (products.length > 0) {
      const p = products[0];
      const defaultPrice = p.uoms?.[p.uoms.length - 1]?.price || 470000;
      setReturnForm({
        ...returnForm,
        items: [...returnForm.items, { productId: p.id, uomName: 'Thùng', quantity: 1, unitPrice: defaultPrice }],
      });
    }
  };

  const handleRemoveReturnItem = (index: number) => {
    setReturnForm({
      ...returnForm,
      items: returnForm.items.filter((_, i) => i !== index),
    });
  };

  const handleReturnItemChange = (index: number, field: string, value: any) => {
    const updated = [...returnForm.items];
    updated[index][field] = value;
    if (field === 'productId') {
      const p = products.find((prod) => prod.id === value);
      if (p) {
        const uom = p.uoms?.find((u: any) => u.uomName === updated[index].uomName) || p.uoms?.[p.uoms.length - 1];
        if (uom) updated[index].unitPrice = uom.price;
      }
    }
    if (field === 'uomName') {
      const p = products.find((prod) => prod.id === updated[index].productId);
      if (p) {
        const uom = p.uoms?.find((u: any) => u.uomName === value);
        if (uom) updated[index].unitPrice = uom.price;
      }
    }
    setReturnForm({ ...returnForm, items: updated });
  };

  const handleCreateReturnOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await createReturnOrder(returnForm);
      alert(res.message);
      setShowReturnModal(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* THAM KHẢO PHẦN MỀM CHUYÊN NGHIỆP: Bộ chuyển Tab Đơn Hàng & Đổi Trả Hàng (Returns / Credit Memo) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeTab === 'orders'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Đơn Hàng Bán ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('returns')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeTab === 'returns'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            <span>Đổi Trả Hàng & Thu Hồi Lỗi ({returnHistory.length})</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowReturnModal(true)}
            className="px-3.5 py-2 rounded-xl border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs flex items-center space-x-1.5 transition shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
            <span>+ Lập Phiếu Đổi Trả (Giảm Nợ)</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Lên Đơn Hàng Mới</span>
          </button>
        </div>
      </div>

      {/* Active Promotion Programs Banner (Hiện khi xem đơn hàng) */}
      {activeTab === 'orders' && (
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
      )}

      {/* Orders List */}
      {activeTab === 'orders' && (
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

                <div className="flex items-center space-x-2">
                  <div className="text-right mr-2">
                    <span className="text-xs text-slate-500 mr-2">Tổng thanh toán:</span>
                    <span className="text-lg font-extrabold text-amber-700 font-mono">
                      {order.totalAmount.toLocaleString('vi-VN')} đ
                    </span>
                  </div>

                  <button
                    onClick={() => setSelectedOrderForInvoice(order)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center space-x-1 shadow-sm"
                    title="In Phiếu Giao Hàng & Hóa Đơn kèm mã VietQR"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-400" />
                    <span>In Phiếu Giao Hàng</span>
                  </button>

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
      )}

      {/* THAM KHẢO PHẦN MỀM CHUYÊN NGHIỆP: Danh Sách Phiếu Đổi Trả Hàng (Returns & Credit Memos) */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div className="bg-rose-50/70 p-4 rounded-xl border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-rose-900 gap-2">
            <div>
              <span className="font-bold">Nghiệp vụ Thu Hồi / Đổi Trả Hàng:</span> Khi phát sinh bánh kẹo móp méo, rách vỡ hoặc cận date từ tiệm tạp hóa, nhân viên tạo phiếu thu hồi để hệ thống tự động giảm trừ công nợ gối đầu cho khách hàng và nhập kho hàng hủy/khuyến mãi.
            </div>
            <button
              onClick={() => setShowReturnModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold whitespace-nowrap shadow-xs"
            >
              + Lập phiếu thu hồi
            </button>
          </div>

          {returnHistory.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              <RotateCcw className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              Chưa có phiếu đổi trả hàng nào. Bấm nút "+ Lập Phiếu Đổi Trả" để tạo mới.
            </div>
          ) : (
            returnHistory.map((ret: any) => (
              <div key={ret.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-100 gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded">
                      {ret.receiptCode}
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Đã giảm trừ công nợ
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    Ngày lập: <strong className="text-slate-800">{new Date(ret.receiptDate).toLocaleString('vi-VN')}</strong>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-700 gap-2">
                  <div>
                    Tiệm tạp hóa: <strong className="text-slate-900">{ret.outlet?.name}</strong>{' '}
                    <span className="text-slate-400">({ret.outlet?.address})</span>
                  </div>
                  <div className="text-right">
                    Số tiền giảm nợ: <strong className="text-rose-600 text-sm font-bold font-mono">-{ret.amount.toLocaleString('vi-VN')} đ</strong>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 border border-slate-200/70">
                  <span className="font-semibold text-slate-700">Nội dung / Lý do:</span> {ret.notes}
                </div>
              </div>
            ))
          )}
        </div>
      )}

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

      {/* THAM KHẢO PHẦN MỀM CHUYÊN NGHIỆP: Modal Lập Phiếu Đổi Trả Hàng & Giảm Trừ Nợ */}
      {showReturnModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Lập Phiếu Thu Hồi / Đổi Trả Bánh Kẹo</h3>
                  <p className="text-[11px] text-slate-500">Tự động giảm trừ công nợ gối đầu của tiệm tạp hóa</p>
                </div>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateReturnOrder} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn tiệm tạp hóa trả hàng</label>
                <select
                  value={returnForm.outletId}
                  onChange={(e) => setReturnForm({ ...returnForm, outletId: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-rose-500"
                  required
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.ownerName} - {o.address}) - Nợ hiện tại: {o.currentDebt.toLocaleString('vi-VN')} đ
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lý do đổi trả / thu hồi</label>
                  <select
                    value={returnForm.reason}
                    onChange={(e) => setReturnForm({ ...returnForm, reason: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Bao bì móp méo / rách vỡ khi vận chuyển">Bao bì móp méo / rách vỡ khi vận chuyển</option>
                    <option value="Hàng cận date / hết hạn sử dụng">Hàng cận date / hết hạn sử dụng</option>
                    <option value="Lỗi chất lượng từ nhà sản xuất">Lỗi chất lượng từ nhà sản xuất</option>
                    <option value="Khách đổi trả theo chính sách NPP">Khách đổi trả theo chính sách NPP</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Sale / Tài xế tiếp nhận</label>
                  <input
                    type="text"
                    value={returnForm.salesRepName}
                    onChange={(e) => setReturnForm({ ...returnForm, salesRepName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-medium focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Danh sách mặt hàng trả lại */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Sản phẩm bánh kẹo thu hồi:
                  </label>
                  <button
                    type="button"
                    onClick={handleAddReturnItem}
                    className="text-xs text-rose-600 font-bold hover:underline"
                  >
                    + Thêm sản phẩm
                  </button>
                </div>

                {returnForm.items.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5">
                      <select
                        value={item.productId}
                        onChange={(e) => handleReturnItemChange(idx, 'productId', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium"
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
                        onChange={(e) => handleReturnItemChange(idx, 'uomName', e.target.value)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white font-medium"
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
                        placeholder="SL"
                        value={item.quantity}
                        onChange={(e) => handleReturnItemChange(idx, 'quantity', parseFloat(e.target.value) || 1)}
                        className="w-full border border-slate-300 rounded-lg p-2 text-xs font-bold text-center"
                        required
                      />
                    </div>

                    <div className="col-span-2 flex items-center justify-between">
                      <span className="font-mono font-bold text-[11px] text-slate-700">
                        {((item.quantity || 1) * (item.unitPrice || 0)).toLocaleString('vi-VN')}đ
                      </span>
                      {returnForm.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReturnItem(idx)}
                          className="text-rose-500 hover:text-rose-700 text-sm font-bold ml-1"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ghi chú chi tiết</label>
                <input
                  type="text"
                  placeholder="VD: Thùng bị rách góc, vỏ hộp móp..."
                  value={returnForm.notes}
                  onChange={(e) => setReturnForm({ ...returnForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5"
                />
              </div>

              {/* Tóm tắt hoàn tiền */}
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 flex items-center justify-between font-bold text-rose-900">
                <span>Tổng giá trị giảm trừ công nợ:</span>
                <span className="text-base font-mono">
                  {returnForm.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toLocaleString('vi-VN')} đ
                </span>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition"
                >
                  Xác Nhận Thu Hồi & Giảm Nợ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal In Hóa Đơn Kiêm Phiếu Giao Hàng */}
      {selectedOrderForInvoice && (
        <InvoiceModal
          order={selectedOrderForInvoice}
          onClose={() => setSelectedOrderForInvoice(null)}
        />
      )}
    </div>
  );
};

