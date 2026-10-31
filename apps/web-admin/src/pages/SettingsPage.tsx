import React, { useEffect, useState } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  Database,
  FileSpreadsheet,
  Save,
  CheckCircle2,
  Download,
  ShieldCheck,
  HardDrive,
  RefreshCw,
  QrCode,
  AlertCircle,
} from 'lucide-react';
import {
  getSystemSettings,
  updateSystemSettings,
  createBackup,
  getBackups,
  getCsvExportUrl,
} from '../api';

export const SettingsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState('');

  const [form, setForm] = useState({
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

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, backupList] = await Promise.all([
        getSystemSettings(),
        getBackups(),
      ]);
      if (settingsData && settingsData.distributorName) {
        setForm({
          distributorName: settingsData.distributorName || '',
          hotline: settingsData.hotline || '',
          address: settingsData.address || '',
          taxCode: settingsData.taxCode || '',
          bankName: settingsData.bankName || 'MBBank',
          bankBin: settingsData.bankBin || '970422',
          bankAccount: settingsData.bankAccount || '',
          bankAccountName: settingsData.bankAccountName || '',
          invoiceNotes: settingsData.invoiceNotes || '',
        });
      }
      setBackups(backupList?.backups || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await updateSystemSettings(form);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setBackupLoading(true);
      const res = await createBackup();
      setBackupMessage(res.message);
      const updatedBackups = await getBackups();
      setBackups(updatedBackups?.backups || []);
      setTimeout(() => setBackupMessage(''), 4000);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    } finally {
      setBackupLoading(false);
    }
  };

  const banksList = [
    { name: 'MBBank (Ngân hàng Quân Đội)', bin: '970422' },
    { name: 'Vietcombank', bin: '970436' },
    { name: 'Techcombank', bin: '970407' },
    { name: 'ACB (Á Châu)', bin: '970416' },
    { name: 'VPBank', bin: '970432' },
    { name: 'BIDV', bin: '970418' },
    { name: 'VietinBank', bin: '970415' },
    { name: 'TPBank', bin: '970458' },
  ];

  const handleBankSelect = (bin: string) => {
    const selected = banksList.find((b) => b.bin === bin);
    if (selected) {
      setForm({ ...form, bankBin: selected.bin, bankName: selected.name.split(' ')[0] });
    }
  };

  const previewQrUrl = form.bankAccount && form.bankBin
    ? `https://img.vietqr.io/image/${form.bankBin}-${form.bankAccount}-compact2.png?amount=100000&addInfo=TEST%20VIETQR&accountName=${encodeURIComponent(form.bankAccountName || 'NPP')}`
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base">Cài Đặt Hệ Thống & Vận Hành NPP</h2>
            <p className="text-xs text-slate-500">
              Quản lý thông tin nhà phân phối, tài khoản ngân hàng nhận tiền VietQR, sao lưu CSDL an toàn và xuất file Excel
            </p>
          </div>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Form thông tin NPP & Ngân Hàng */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSaveSettings} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Section 1: Thông tin NPP */}
            <div>
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-900">
                <Building className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Thông Tin Nhà Phân Phối FMCG</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tên Nhà Phân Phối (Hiển thị đầu hóa đơn)</label>
                  <input
                    type="text"
                    value={form.distributorName}
                    onChange={(e) => setForm({ ...form, distributorName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hotline Giao Hàng & Đặt Hàng</label>
                  <input
                    type="text"
                    value={form.hotline}
                    onChange={(e) => setForm({ ...form, hotline: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mã Số Thuế (MST)</label>
                  <input
                    type="text"
                    value={form.taxCode}
                    onChange={(e) => setForm({ ...form, taxCode: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Địa Chỉ Kho Bãi / Văn Phòng Phân Phối</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                    required
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ghi Chú In Chân Phiếu Giao Hàng</label>
                  <textarea
                    rows={2}
                    value={form.invoiceNotes}
                    onChange={(e) => setForm({ ...form, invoiceNotes: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Tài khoản nhận tiền VietQR */}
            <div>
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-900">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm uppercase tracking-wide">Cấu Hình Ngân Hàng & VietQR Nhận Tiền</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Ngân Hàng Thụ Hưởng</label>
                  <select
                    value={form.bankBin}
                    onChange={(e) => handleBankSelect(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                  >
                    {banksList.map((b) => (
                      <option key={b.bin} value={b.bin}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mã BIN Ngân Hàng</label>
                  <input
                    type="text"
                    value={form.bankBin}
                    readOnly
                    className="w-full border border-slate-200 bg-slate-50 rounded-lg p-2.5 text-sm font-mono text-slate-600"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Số Tài Khoản Nhận Tiền</label>
                  <input
                    type="text"
                    value={form.bankAccount}
                    onChange={(e) => setForm({ ...form, bankAccount: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-mono font-bold text-slate-900"
                    placeholder="VD: 0909123456"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tên Chủ Tài Khoản (Không dấu)</label>
                  <input
                    type="text"
                    value={form.bankAccountName}
                    onChange={(e) => setForm({ ...form, bankAccountName: e.target.value.toUpperCase() })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm uppercase font-semibold text-slate-900"
                    placeholder="VD: NGUYEN VAN A HOAC NPP AN PHAT"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              {saveSuccess ? (
                <div className="flex items-center space-x-1.5 text-emerald-600 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Đã lưu thành công thông tin hệ thống!</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Các thay đổi sẽ có hiệu lực ngay trên Phiếu Giao Hàng và VietQR</span>
              )}

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1.5 shadow-md shadow-amber-500/20"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </form>

          {/* Xuất Báo Cáo Ra Excel / CSV */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 text-slate-900 mb-4">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Xuất Báo Cáo Ra File Excel / CSV (UTF-8 BOM)</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Tải dữ liệu đầy đủ định dạng CSV có chứa UTF-8 BOM, mở trực tiếp bằng Microsoft Excel không lo lỗi font tiếng Việt:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <a
                href={getCsvExportUrl('orders')}
                download
                className="p-3 rounded-lg border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 flex flex-col items-center text-center transition group"
              >
                <FileSpreadsheet className="w-6 h-6 text-amber-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Báo Cáo Đơn Hàng</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Doanh số, tiệm mua, trạng thái</span>
                <span className="mt-2 text-[11px] text-amber-700 font-semibold flex items-center space-x-1">
                  <Download className="w-3 h-3" />
                  <span>Tải file CSV</span>
                </span>
              </a>

              <a
                href={getCsvExportUrl('inventory')}
                download
                className="p-3 rounded-lg border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 flex flex-col items-center text-center transition group"
              >
                <HardDrive className="w-6 h-6 text-blue-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Báo Cáo Tồn Kho FEFO</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Lô HSD, số ngày còn lại, vị trí</span>
                <span className="mt-2 text-[11px] text-blue-700 font-semibold flex items-center space-x-1">
                  <Download className="w-3 h-3" />
                  <span>Tải file CSV</span>
                </span>
              </a>

              <a
                href={getCsvExportUrl('debt')}
                download
                className="p-3 rounded-lg border border-slate-200 hover:border-rose-400 hover:bg-rose-50/50 flex flex-col items-center text-center transition group"
              >
                <CreditCard className="w-6 h-6 text-rose-600 mb-1.5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold text-slate-800">Sổ Nợ Tạp Hóa (GT)</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Dư nợ, hạn mức nợ gối đầu</span>
                <span className="mt-2 text-[11px] text-rose-700 font-semibold flex items-center space-x-1">
                  <Download className="w-3 h-3" />
                  <span>Tải file CSV</span>
                </span>
              </a>
            </div>
          </div>
        </div>

        {/* Right Column: Live VietQR Preview & Database Backups */}
        <div className="space-y-6">
          {/* VietQR Live Test Preview */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-2">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <h4 className="font-bold text-xs uppercase tracking-wide">Mã VietQR Mẫu Thử Nghiệm</h4>
            </div>

            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 rounded-xl border border-slate-200">
              {previewQrUrl ? (
                <img
                  src={previewQrUrl}
                  alt="Live VietQR Preview"
                  className="w-44 h-44 object-contain rounded-lg border border-slate-300 bg-white p-1.5 shadow-sm"
                />
              ) : (
                <div className="w-44 h-44 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                  Điền đầy đủ STK & Ngân hàng
                </div>
              )}
              <p className="text-[11px] font-bold text-slate-800 mt-2">{form.bankAccountName || 'CHỦ TÀI KHOẢN'}</p>
              <p className="text-[11px] text-slate-500 font-mono">
                {form.bankName} - {form.bankAccount}
              </p>
              <p className="text-[10px] text-emerald-700 mt-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                ✓ Quét bằng App ngân hàng để thử
              </p>
            </div>
          </div>

          {/* Database Backup Section */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-2">
              <Database className="w-4 h-4 text-blue-600" />
              <h4 className="font-bold text-xs uppercase tracking-wide">Sao Lưu CSDL An Toàn (1-Click)</h4>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs text-blue-900 leading-relaxed">
              <ShieldCheck className="w-4 h-4 text-blue-600 inline mr-1" />
              Dữ liệu được lưu trữ an toàn trong tệp SQLite cục bộ trên máy của bạn (không phát sinh chi phí Cloud VPS). Nhấn nút bên dưới để tạo bản snapshot dự phòng ngay lập tức:
            </div>

            <button
              onClick={handleCreateBackup}
              disabled={backupLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center justify-center space-x-1.5 shadow-md shadow-blue-600/20"
            >
              <Database className="w-4 h-4" />
              <span>{backupLoading ? 'Đang sao lưu CSDL...' : 'Sao Lưu CSDL Ngay (1-Click)'}</span>
            </button>

            {backupMessage && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{backupMessage}</span>
              </div>
            )}

            {/* Danh sách các bản sao lưu đã tạo */}
            <div className="pt-2">
              <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-2">
                Các bản sao lưu gần nhất ({backups.length}):
              </h5>

              {backups.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Chưa có bản sao lưu nào. Hãy bấm sao lưu ở trên.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {backups.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div className="overflow-hidden">
                        <p className="font-mono font-bold text-slate-800 truncate text-[11px]">{b.filename}</p>
                        <p className="text-[10px] text-slate-500">
                          {new Date(b.createdAt).toLocaleString('vi-VN')} • {(b.sizeBytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                        Safe
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
