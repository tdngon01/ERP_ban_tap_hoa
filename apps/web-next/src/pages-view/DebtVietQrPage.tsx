'use client';
import React, { useEffect, useState } from 'react';
import {
  QrCode,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Copy,
  Receipt,
  Search,
  ExternalLink,
  ShieldAlert,
  Filter,
} from 'lucide-react';
import { getDebtLedger, generateVietQr, recordPayment, getPaymentReceipts } from '../api';

export const DebtVietQrPage: React.FC<{ preselect?: { outletId: string; orderId?: string; amount: number } }> = ({ preselect }) => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'receipts'>('ledger');
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState<'ALL' | 'DANGER' | 'WARNING' | 'SAFE' | 'DEBT_ONLY'>('ALL');

  // VietQR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(1000000);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [paymentMethod, setPaymentMethod] = useState<'VIETQR_TRANSFER' | 'CASH'>('VIETQR_TRANSFER');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (preselect && preselect.outletId) {
      handleOpenQr(
        { id: preselect.outletId, name: 'Điểm bán', code: 'TAPHOA' },
        preselect.amount,
        preselect.orderId,
      );
    }
  }, [preselect]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ledgerData, receiptsData] = await Promise.all([
        getDebtLedger(),
        getPaymentReceipts(),
      ]);
      setLedger(ledgerData);
      setReceipts(receiptsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenQr = async (outlet: any, amount?: number, orderId?: string) => {
    setSelectedOutlet(outlet);
    const amt = amount || outlet.currentDebt || 500000;
    setPaymentAmount(amt);
    setSelectedOrderId(orderId);

    try {
      const res = await generateVietQr({
        outletId: outlet.outletId || outlet.id,
        orderId,
        amount: amt,
      });
      setQrData(res);
      setQrModalOpen(true);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleConfirmPayment = async () => {
    if (!selectedOutlet) return;
    try {
      const res = await recordPayment({
        outletId: selectedOutlet.outletId || selectedOutlet.id,
        orderId: selectedOrderId,
        amount: paymentAmount,
        paymentMethod,
        vietQrRefCode: qrData?.content,
        notes: `Thu tiền ${paymentMethod === 'VIETQR_TRANSFER' ? 'VietQR' : 'Tiền mặt'} đối soát`,
      });
      alert(res.message);
      setQrModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const totalDebt = ledger.reduce((s, r) => s + (r.currentDebt || 0), 0);
  const totalOverdue = ledger.reduce((s, r) => s + (r.overdueDebt || 0), 0);
  const dangerCount = ledger.filter((r) => r.riskLevel === 'DANGER').length;
  const warningCount = ledger.filter((r) => r.riskLevel === 'WARNING').length;
  const inDebtCount = ledger.filter((r) => r.currentDebt > 0).length;

  const filteredLedger = ledger.filter((row) => {
    if (riskFilter === 'DANGER' && row.riskLevel !== 'DANGER') return false;
    if (riskFilter === 'WARNING' && row.riskLevel !== 'WARNING') return false;
    if (riskFilter === 'SAFE' && (row.riskLevel !== 'SAFE' || row.currentDebt <= 0)) return false;
    if (riskFilter === 'DEBT_ONLY' && row.currentDebt <= 0) return false;

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const match =
        row.name?.toLowerCase().includes(q) ||
        row.ownerName?.toLowerCase().includes(q) ||
        row.phone?.toLowerCase().includes(q) ||
        row.routeName?.toLowerCase().includes(q) ||
        row.code?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'ledger' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Sổ Cái Công Nợ & Thu Nợ VietQR ({ledger.length} tiệm)</span>
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'receipts' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Lịch Sử Phiếu Thu Tiền ({receipts.length})</span>
        </button>
      </div>

      {activeTab === 'ledger' && (
        <>
          {/* THAM KHẢO PHẦN MỀM CHUYÊN NGHIỆP: 4 Thẻ Phân Tích Tuổi Nợ & Rủi Ro Công Nợ (Debt Aging Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Tổng Nợ Gối Đầu</span>
                <div className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {totalDebt.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Có <strong className="text-slate-800">{inDebtCount}</strong> tiệm đang có nợ
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-rose-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Nợ Quá Hạn &gt;30 Ngày</span>
                <div className="text-xl font-bold text-rose-600 mt-1 font-mono">
                  {totalOverdue.toLocaleString('vi-VN')} đ
                </div>
                <div className="text-[10px] text-rose-700 font-semibold mt-0.5">
                  {dangerCount} tiệm có nguy cơ nợ xấu
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Cảnh Báo Hạn Mức</span>
                <div className="text-xl font-bold text-amber-800 mt-1">
                  {warningCount} tiệm
                </div>
                <div className="text-[10px] text-amber-600 font-medium mt-0.5">
                  Dư nợ đạt &ge; 70% hạn mức gối đầu
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Thu Nợ Tức Thì</span>
                <div className="text-xl font-bold text-emerald-800 mt-1">
                  VietQR 24/7
                </div>
                <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
                  Gạch nợ tự động không cần tiền mặt
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <QrCode className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên tiệm tạp hóa, chủ tiệm, SĐT, tuyến đường..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            <div className="flex items-center space-x-1 overflow-x-auto text-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase flex items-center mr-1">
                <Filter className="w-3 h-3 mr-1" /> Lọc:
              </span>
              <button
                onClick={() => setRiskFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  riskFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({ledger.length})
              </button>
              <button
                onClick={() => setRiskFilter('DEBT_ONLY')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  riskFilter === 'DEBT_ONLY'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                Đang Có Nợ ({inDebtCount})
              </button>
              <button
                onClick={() => setRiskFilter('DANGER')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  riskFilter === 'DANGER'
                    ? 'bg-rose-600 text-white'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                }`}
              >
                Quá Hạn ({dangerCount})
              </button>
              <button
                onClick={() => setRiskFilter('WARNING')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  riskFilter === 'WARNING'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Cảnh Báo ({warningCount})
              </button>
            </div>
          </div>
        </>
      )}

      {activeTab === 'ledger' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200 uppercase">
                <tr>
                  <th className="py-3 px-4">Tiệm Tạp Hóa (GT)</th>
                  <th className="py-3 px-4">Tuyến Bán Hàng</th>
                  <th className="py-3 px-4 text-right">Hạn Mức Nợ</th>
                  <th className="py-3 px-4 text-right">Nợ Hiện Tại</th>
                  <th className="py-3 px-4 text-center">Tỷ Lệ Chạm Trần</th>
                  <th className="py-3 px-4 text-center">Rủi Ro Công Nợ</th>
                  <th className="py-3 px-4 text-center">Hành Động Thu Tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Đang tải sổ cái công nợ...</td>
                  </tr>
                ) : filteredLedger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">Không tìm thấy điểm bán nào khớp với bộ lọc tìm kiếm!</td>
                  </tr>
                ) : (
                  filteredLedger.map((row) => (
                    <tr key={row.outletId} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div>{row.name}</div>
                        <div className="text-xs text-slate-400 font-normal">
                          {row.ownerName} • {row.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{row.routeName}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-medium">
                        {row.creditLimit.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                        {row.currentDebt.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                row.creditUtilization >= 90
                                  ? 'bg-rose-500'
                                  : row.creditUtilization >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(100, row.creditUtilization)}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{row.creditUtilization}%</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            row.riskLevel === 'DANGER'
                              ? 'bg-rose-100 text-rose-700 border border-rose-300'
                              : row.riskLevel === 'WARNING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {row.riskLevel === 'DANGER' ? 'Nguy cơ quá hạn' : row.riskLevel === 'WARNING' ? 'Cảnh báo hạn mức' : 'An toàn'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.currentDebt > 0 ? (
                          <button
                            onClick={() => handleOpenQr(row)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center space-x-1 shadow-sm transition"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Sinh Mã VietQR</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Đã hết nợ</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Tab Lịch Sử Phiếu Thu */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200 uppercase">
                <tr>
                  <th className="py-3 px-4">Mã Phiếu Thu</th>
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Tiệm Tạp Hóa</th>
                  <th className="py-3 px-4">Phương Thức</th>
                  <th className="py-3 px-4 text-right">Số Tiền Thu</th>
                  <th className="py-3 px-4">Nội Dung / Ref VietQR</th>
                  <th className="py-3 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {receipts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Chưa có phiếu thu nào.</td>
                  </tr>
                ) : (
                  receipts.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{r.receiptCode}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {new Date(r.receiptDate).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">{r.outlet?.name}</td>
                      <td className="py-3.5 px-4 text-xs">
                        <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                          {r.paymentMethod === 'VIETQR_TRANSFER' ? 'VietQR Chuyển Khoản' : 'Tiền Mặt'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-700">
                        +{r.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 font-mono">
                        {r.vietQrRefCode || r.notes || 'Thu tiền đơn'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Đã đối soát
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Hiển Thị Mã VietQR Động */}
      {qrModalOpen && qrData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">Mã VietQR Thanh Toán Động</h3>
              </div>
              <button onClick={() => setQrModalOpen(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50 to-white border border-emerald-200/80 inline-block shadow-sm">
              <img
                src={qrData.qrImageUrl}
                alt="VietQR Code"
                className="w-64 h-64 mx-auto rounded-xl shadow-xs"
              />
              <div className="mt-2 text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Quét bằng mọi ứng dụng ngân hàng Việt Nam
              </div>
            </div>

            {/* Thông tin chuyển khoản */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Ngân hàng:</span>
                <span className="font-bold text-slate-800">{qrData.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chủ tài khoản:</span>
                <span className="font-bold text-slate-800">{qrData.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tài khoản:</span>
                <span className="font-bold text-slate-800 font-mono text-sm">{qrData.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số tiền:</span>
                <span className="font-extrabold text-amber-700 font-mono text-sm">
                  {qrData.amount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nội dung CK:</span>
                <span className="font-bold text-blue-700 font-mono">{qrData.content}</span>
              </div>
            </div>

            {/* Chọn phương thức xác nhận */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => setPaymentMethod('VIETQR_TRANSFER')}
                className={`py-2 rounded-lg font-bold border transition ${
                  paymentMethod === 'VIETQR_TRANSFER'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Đã CK VietQR
              </button>
              <button
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 rounded-lg font-bold border transition ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300'
                }`}
              >
                Thu Tiền Mặt Tại Chỗ
              </button>
            </div>

            <button
              onClick={handleConfirmPayment}
              className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
            >
              Xác Nhận Đã Nhận Tiền & Gạch Nợ Ngay
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

