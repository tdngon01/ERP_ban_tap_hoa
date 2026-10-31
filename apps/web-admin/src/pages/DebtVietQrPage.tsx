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
} from 'lucide-react';
import { getDebtLedger, generateVietQr, recordPayment, getPaymentReceipts } from '../api';

export const DebtVietQrPage: React.FC<{ preselect?: { outletId: string; orderId?: string; amount: number } }> = ({ preselect }) => {
  const [ledger, setLedger] = useState<any[]>([]);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ledger' | 'receipts'>('ledger');

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
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Không có công nợ nào.</td>
                  </tr>
                ) : (
                  ledger.map((row) => (
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

