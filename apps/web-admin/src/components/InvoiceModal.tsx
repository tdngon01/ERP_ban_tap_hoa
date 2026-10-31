import React, { useEffect, useState } from 'react';
import { Printer, X, CheckCircle2, QrCode } from 'lucide-react';
import { getSystemSettings, generateVietQr } from '../api';

interface InvoiceModalProps {
  order: any;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ order, onClose }) => {
  const [settings, setSettings] = useState<any>({
    distributorName: 'NHÀ PHÂN PHỐI BÁNH KẸO AN PHÁT',
    hotline: '0909 123 456',
    address: 'Số 128 Đường Số 7, KCN Vĩnh Lộc, Q. Bình Tân, TP.HCM',
    taxCode: '0312345678',
    bankName: 'MBBank',
    bankBin: '970422',
    bankAccount: '0909123456',
    bankAccountName: 'NPP AN PHAT FMCG',
    invoiceNotes: 'Quý khách vui lòng kiểm tra kỹ số lượng, hạn sử dụng và bao bì trước khi ký nhận. Đổi trả hàng lỗi do nhà sản xuất trong vòng 48h.',
  });
  const [qrData, setQrData] = useState<any>(null);

  useEffect(() => {
    getSystemSettings()
      .then((data) => {
        if (data && data.distributorName) {
          setSettings(data);
        }
      })
      .catch((err) => console.warn('Could not load settings, using defaults', err));

    // Sinh mã VietQR cho đơn hàng
    if (order) {
      const remainingAmount = Math.max(0, order.totalAmount - (order.paidAmount || 0));
      if (remainingAmount > 0) {
        generateVietQr({
          outletId: order.outletId,
          orderId: order.id,
          amount: remainingAmount,
          memo: `TT ${order.orderCode} ${order.outlet?.name || ''}`.slice(0, 50),
        })
          .then((res) => setQrData(res))
          .catch((err) => console.warn('QR generation error:', err));
      }
    }
  }, [order]);

  const handlePrint = () => {
    window.print();
  };

  if (!order) return null;

  const remainingDebt = Math.max(0, order.totalAmount - (order.paidAmount || 0));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      {/* Container - In screen mode max-w-3xl, In print mode full-width */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[96vh] flex flex-col overflow-hidden print:m-0 print:p-0 print:max-w-none print:shadow-none print:rounded-none">
        {/* Modal Action Bar (Hidden on print) */}
        <div className="p-4 bg-slate-800 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm tracking-wide">
              Xem Trước Phiếu Giao Hàng & Hóa Đơn - #{order.orderCode}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
            >
              <Printer className="w-4 h-4" />
              <span>In Phiếu (Ctrl + P)</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-300 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Printable Sheet */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 text-slate-900 font-sans print:p-0 print:overflow-visible">
          {/* Header Nhà Phân Phối */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-lg font-black tracking-wide text-slate-950 uppercase">
                {settings.distributorName}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">Địa chỉ: {settings.address}</p>
              <p className="text-xs text-slate-600">
                Hotline giao hàng: <strong className="text-slate-900">{settings.hotline}</strong> | MST: {settings.taxCode}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black rounded uppercase">
                {order.orderType === 'VAN_SALES' ? 'Xe Bán Tức Thời (Van)' : 'Đơn Đặt Trước (Pre-Sales)'}
              </span>
              <p className="text-xs text-slate-500 mt-1">Số: <strong className="font-mono text-slate-900">{order.orderCode}</strong></p>
              <p className="text-xs text-slate-500">
                Ngày: {new Date(order.createdAt).toLocaleDateString('vi-VN')} {new Date(order.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center my-4">
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-wider">
              PHIẾU XUẤT KHO KIÊM GIAO HÀNG & THU TIỀN
            </h2>
            <p className="text-xs text-slate-500 italic">
              (Liên 1: Nhà phân phối lưu - Liên 2: Giao khách hàng kiểm đếm)
            </p>
          </div>

          {/* Thông tin khách hàng & Giao vận */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-4 print:border-slate-300 print:bg-transparent">
            <div className="space-y-1">
              <p>
                <span className="text-slate-500">Điểm bán:</span>{' '}
                <strong className="text-slate-900 text-sm">{order.outlet?.name || 'Tạp Hóa Khách Hàng'}</strong>
              </p>
              <p>
                <span className="text-slate-500">Chủ tiệm:</span>{' '}
                <strong>{order.outlet?.ownerName || 'Chủ hộ kinh doanh'}</strong> - ĐT: <strong>{order.outlet?.phone || 'Chưa cập nhật'}</strong>
              </p>
              <p>
                <span className="text-slate-500">Địa chỉ giao:</span>{' '}
                <span>{order.outlet?.address || 'Tại tiệm tạp hóa'}</span>
              </p>
            </div>
            <div className="space-y-1 text-right">
              <p>
                <span className="text-slate-500">Nhân viên bán hàng (SR):</span>{' '}
                <strong>{order.salesRepName || 'NV Thị Trường'}</strong>
              </p>
              <p>
                <span className="text-slate-500">Tuyến bán hàng (MCP):</span>{' '}
                <span>{order.outlet?.route?.name || 'Tuyến Tạp Hóa Nội Thành'}</span>
              </p>
              <p>
                <span className="text-slate-500">Trạng thái đơn:</span>{' '}
                <strong className="text-emerald-700">{order.status}</strong>
              </p>
            </div>
          </div>

          {/* Bảng Chi Tiết Sản Phẩm Bánh Kẹo */}
          <table className="w-full text-xs border-collapse mb-4">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 font-bold text-slate-700 text-left print:bg-slate-200">
                <th className="py-2 px-2 text-center w-8">STT</th>
                <th className="py-2 px-2">Tên Bánh Kẹo / Hàng Hóa</th>
                <th className="py-2 px-2 text-center">ĐVT</th>
                <th className="py-2 px-2 text-center">Lô FEFO</th>
                <th className="py-2 px-2 text-right">SL</th>
                <th className="py-2 px-2 text-right">Đơn Giá</th>
                <th className="py-2 px-2 text-right">Thành Tiền</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {order.items?.map((item: any, idx: number) => (
                <tr key={idx} className={item.isGiftItem ? 'bg-amber-50/60 font-medium' : ''}>
                  <td className="py-2 px-2 text-center text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <span className="font-semibold text-slate-900">{item.product?.name || 'Sản phẩm'}</span>
                    {item.isGiftItem && (
                      <span className="ml-2 inline-block px-1.5 py-0.2 bg-amber-500 text-slate-950 text-[10px] font-extrabold rounded">
                        KM TẶNG (0đ)
                      </span>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-medium">{item.uomName}</td>
                  <td className="py-2 px-2 text-center font-mono text-[11px] text-amber-900">
                    {item.allocatedBatch || 'Lô Tự Động'}
                  </td>
                  <td className="py-2 px-2 text-right font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2 px-2 text-right font-mono">
                    {item.isGiftItem ? '0 đ' : `${(item.unitPrice || 0).toLocaleString('vi-VN')} đ`}
                  </td>
                  <td className="py-2 px-2 text-right font-bold font-mono text-slate-950">
                    {item.isGiftItem ? '0 đ' : `${(item.totalPrice || 0).toLocaleString('vi-VN')} đ`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phần Tổng Tiền & VietQR Thanh Toán */}
          <div className="grid grid-cols-12 gap-4 border-t-2 border-slate-900 pt-3 mb-6">
            {/* Cột Trái: Mã VietQR Quét Nhanh */}
            <div className="col-span-7 flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-200 print:border-slate-300 print:bg-transparent">
              {qrData?.qrUrl ? (
                <img
                  src={qrData.qrUrl}
                  alt="VietQR Payment"
                  className="w-28 h-28 object-contain rounded-lg border border-slate-300 bg-white p-1"
                />
              ) : (
                <div className="w-28 h-28 bg-white border border-slate-300 rounded-lg flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                  <QrCode className="w-8 h-8 text-amber-500 mb-1" />
                  <span className="text-[10px]">Chưa tạo mã QR</span>
                </div>
              )}
              <div className="text-xs space-y-1">
                <p className="font-bold text-slate-900 flex items-center space-x-1">
                  <span>Quét VietQR Thanh Toán Ngay</span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </p>
                <p className="text-[11px] text-slate-600">
                  Ngân hàng: <strong>{settings.bankName}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Số tài khoản: <strong className="font-mono text-slate-900">{settings.bankAccount}</strong>
                </p>
                <p className="text-[11px] text-slate-600">
                  Chủ TK: <strong>{settings.bankAccountName}</strong>
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  *Nội dung đã tự động gắn theo mã hóa đơn #{order.orderCode}
                </p>
              </div>
            </div>

            {/* Cột Phải: Bảng Tính Tiền */}
            <div className="col-span-5 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Tiền hàng thực xuất:</span>
                <span className="font-mono font-medium">
                  {order.totalAmount.toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Chiết khấu khuyến mại:</span>
                <span className="font-mono text-emerald-600 font-medium">
                  -{(order.discountAmount || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Đã thanh toán trước:</span>
                <span className="font-mono text-slate-900 font-medium">
                  {(order.paidAmount || 0).toLocaleString('vi-VN')} đ
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-300 pt-1.5 text-sm font-black text-amber-800">
                <span>TỔNG TIỀN PHẢI THU:</span>
                <span className="font-mono text-base text-rose-700 font-extrabold">
                  {remainingDebt.toLocaleString('vi-VN')} đ
                </span>
              </div>
            </div>
          </div>

          {/* Ghi chú chân trang */}
          <div className="text-[11px] text-slate-600 italic bg-amber-50/50 p-2.5 rounded-lg border border-amber-200/60 mb-6 print:border-none print:bg-transparent">
            <strong>Ghi chú:</strong> {settings.invoiceNotes}
          </div>

          {/* 4 Chữ Ký Xác Nhận */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
            <div>
              <p className="font-bold text-slate-900">Người Lập Phiếu</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, họ tên)</p>
              <div className="h-16"></div>
              <p className="text-xs font-semibold">{order.salesRepName || 'Kế toán bán hàng'}</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Thủ Kho Xuất Hàng</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, họ tên)</p>
              <div className="h-16"></div>
              <p className="text-xs font-semibold">Thủ kho FEFO</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Tài Xế Giao Hàng</p>
              <p className="text-[10px] text-slate-500 italic">(Ký, họ tên)</p>
              <div className="h-16"></div>
              <p className="text-xs font-semibold">Tài xế giao vận</p>
            </div>
            <div>
              <p className="font-bold text-slate-900">Khách Hàng Nhận</p>
              <p className="text-[10px] text-slate-500 italic">(Ký nhận đủ hàng)</p>
              <div className="h-16"></div>
              <p className="text-xs font-semibold">{order.outlet?.ownerName || 'Chủ tiệm'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

