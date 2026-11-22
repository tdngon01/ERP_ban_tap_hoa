'use client';
import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Save,
  Layers,
  ArrowRight,
  Database,
  ShieldCheck,
  CloudUpload,
  Clock,
  FileDown,
} from 'lucide-react';
import {
  getGoogleSheetsConfig,
  updateGoogleSheetsConfig,
  getGoogleSheetsGuide,
  syncProductsFromSheets,
  syncOutletsFromSheets,
  exportOrdersToSheets,
  exportInventoryToSheets,
  exportProductsToSheets,
  exportOutletsToSheets,
  backupAllToGoogleSheets,
  getCsvExportUrl,
} from '../api';

export const GoogleSheetsPage: React.FC = () => {
  const [config, setConfig] = useState<any>({
    spreadsheetId: '',
    apiKey: '',
    sheetNameProducts: 'SanPham',
    sheetNameOutlets: 'DiemBan',
    sheetNameOrders: 'DonHang',
    sheetNameInventory: 'TonKho',
  });
  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configData, guideData] = await Promise.all([
        getGoogleSheetsConfig(),
        getGoogleSheetsGuide(),
      ]);
      setConfig(configData);
      setGuide(guideData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateGoogleSheetsConfig(config);
      alert('Đã lưu cấu hình Google Sheets thành công!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  const handleBackupAll = async () => {
    try {
      setSyncing('backup-all');
      setSyncResult(null);
      const res = await backupAllToGoogleSheets(config.spreadsheetId);
      setSyncResult({ type: res.success ? 'success' : 'warning', data: res });
      await loadData();
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleExportProducts = async () => {
    try {
      setSyncing('export-products');
      setSyncResult(null);
      const res = await exportProductsToSheets();
      setSyncResult({ type: 'success', data: res });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleExportOutlets = async () => {
    try {
      setSyncing('export-outlets');
      setSyncResult(null);
      const res = await exportOutletsToSheets();
      setSyncResult({ type: 'success', data: res });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleExportOrders = async () => {
    try {
      setSyncing('export-orders');
      setSyncResult(null);
      const res = await exportOrdersToSheets();
      setSyncResult({ type: 'success', data: res });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleExportInventory = async () => {
    try {
      setSyncing('export-inventory');
      setSyncResult(null);
      const res = await exportInventoryToSheets();
      setSyncResult({ type: 'success', data: res });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncProductsFromSheet = async () => {
    try {
      setSyncing('pull-products');
      setSyncResult(null);
      const res = await syncProductsFromSheets(config.spreadsheetId);
      setSyncResult({ type: 'success', data: res });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncOutletsFromSheet = async () => {
    try {
      setSyncing('pull-outlets');
      setSyncResult(null);
      const res = await syncOutletsFromSheets(config.spreadsheetId);
      setSyncResult({ type: 'success', data: res });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Architecture Banner: Supabase Master -> Google Sheets Backup */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-900 text-white shadow-lg border border-slate-700">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Kiến Trúc Sao Lưu Dữ Liệu Cloud
              </span>
              {config.lastSyncAt && (
                <span className="text-[11px] text-slate-300 flex items-center space-x-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>Sao lưu gần nhất: {new Date(config.lastSyncAt).toLocaleString('vi-VN')}</span>
                </span>
              )}
            </div>

            <h3 className="text-xl font-extrabold tracking-tight flex items-center space-x-2">
              <Database className="w-6 h-6 text-emerald-400" />
              <span>{config.dbSource || 'Supabase / CSDL Chính'}</span>
              <ArrowRight className="w-5 h-5 text-amber-400" />
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
              <span>Google Sheets Đối Soát & Dự Phòng</span>
            </h3>

            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Dữ liệu vận hành chính lưu an toàn trên CSDL. Chỉ với 1 thao tác, hệ thống đồng bộ toàn bộ 5 bảng dữ liệu cốt lõi (Sản phẩm, Điểm bán, Đơn hàng, Lô FEFO, Phiếu thu VietQR) sang Google Sheets để bạn dễ dàng tra cứu, kiểm tra lại hoặc mở trên Excel bất kỳ lúc nào.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-shrink-0">
            <button
              onClick={handleBackupAll}
              disabled={syncing !== null}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 flex items-center justify-center space-x-2 transition"
            >
              <CloudUpload className={`w-4 h-4 ${syncing === 'backup-all' ? 'animate-bounce' : ''}`} />
              <span>
                {syncing === 'backup-all'
                  ? 'Đang Đồng Bộ 5 Bảng...'
                  : 'Đồng Bộ Sao Lưu Toàn Bộ Sang Sheet'}
              </span>
            </button>

            {config.spreadsheetId && (
              <a
                href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition flex items-center justify-center space-x-1.5"
              >
                <span>Mở File Sheet</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Connection Readiness Status Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  config.hasWritePermission ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              ></span>
              <span className="text-slate-200">
                Quyền Ghi Google Sheets API:{' '}
                <strong className={config.hasWritePermission ? 'text-emerald-300' : 'text-amber-300'}>
                  {config.hasWritePermission
                    ? `Đã kích hoạt (${config.serviceAccountEmail})`
                    : 'Chưa cấu hình khóa Service Account trong .env'}
                </strong>
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-slate-400">Xuất nhanh file Excel/CSV về máy:</span>
            <a
              href={getCsvExportUrl('orders')}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold flex items-center space-x-1"
            >
              <FileDown className="w-3 h-3" />
              <span>Đơn hàng</span>
            </a>
            <a
              href={getCsvExportUrl('inventory')}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold flex items-center space-x-1"
            >
              <FileDown className="w-3 h-3" />
              <span>Tồn kho</span>
            </a>
            <a
              href={getCsvExportUrl('debt')}
              className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[11px] font-semibold flex items-center space-x-1"
            >
              <FileDown className="w-3 h-3" />
              <span>Công nợ</span>
            </a>
          </div>
        </div>
      </div>

      {/* Sync Result Feedback Box */}
      {syncResult && (
        <div
          className={`p-5 rounded-xl border space-y-3 animate-in fade-in ${
            syncResult.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : syncResult.type === 'warning'
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-start space-x-3">
            {syncResult.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 text-xs">
              <div className="font-bold text-sm">
                {syncResult.data?.pushedToGoogleCloud
                  ? 'Đã Ghi Dữ Liệu Lên Google Sheets Thành Công!'
                  : syncResult.type === 'error'
                  ? 'Không Thể Đồng Bộ'
                  : 'Đã Tổng Hợp Dữ Liệu Sao Lưu'}
              </div>
              <p className="mt-1 font-medium">{syncResult.data?.message || syncResult.message}</p>
            </div>
          </div>

          {/* Chi tiết từng Tab khi sao lưu toàn bộ */}
          {syncResult.data?.details && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
              {syncResult.data.details.map((d: any) => (
                <div
                  key={d.tab}
                  className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-slate-800">{d.tab}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        d.status === 'SYNCED_TO_CLOUD'
                          ? 'bg-emerald-100 text-emerald-800'
                          : d.status === 'ERROR'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {d.status === 'SYNCED_TO_CLOUD'
                        ? 'Đã đẩy Sheet'
                        : d.status === 'ERROR'
                        ? 'Lỗi'
                        : 'Sẵn sàng'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-600">{d.title}</div>
                  <div className="font-extrabold text-sm text-slate-900">{d.rowCount} dòng</div>
                  {d.error && <div className="text-[10px] text-rose-600">{d.error}</div>}
                </div>
              ))}
            </div>
          )}

          {syncResult.data?.preview && !syncResult.data?.details && (
            <div className="mt-2 bg-white/80 p-3 rounded-lg border font-mono text-[11px] overflow-x-auto">
              <div className="font-bold mb-1">Dữ liệu trích xuất mới nhất (5 dòng đầu):</div>
              <pre>{JSON.stringify(syncResult.data.preview, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* Sync Individual Ledgers (DB/Supabase -> Google Sheets) */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
          <Upload className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sao Lưu Từng Bảng Dữ Liệu Riêng Lẻ (Từ Supabase / CSDL Sang Google Sheets)</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Đẩy Bảng Sản Phẩm & Giá</h4>
              <p className="text-xs text-slate-500 mt-1">
                Sao lưu danh mục bánh kẹo và quy đổi đa ĐVT sang Tab '{config.sheetNameProducts}'
              </p>
            </div>
            <button
              onClick={handleExportProducts}
              disabled={syncing !== null}
              className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{syncing === 'export-products' ? 'Đang đẩy...' : 'Đẩy Sản Phẩm'}</span>
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Đẩy Điểm Bán & Công Nợ</h4>
              <p className="text-xs text-slate-500 mt-1">
                Sao lưu hồ sơ tiệm tạp hóa, tọa độ GPS và dư nợ sang Tab '{config.sheetNameOutlets}'
              </p>
            </div>
            <button
              onClick={handleExportOutlets}
              disabled={syncing !== null}
              className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{syncing === 'export-outlets' ? 'Đang đẩy...' : 'Đẩy Điểm Bán'}</span>
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Đẩy Sổ Đơn Hàng</h4>
              <p className="text-xs text-slate-500 mt-1">
                Lưu vết toàn bộ đơn Pre-sales / Van sales, chiết khấu sang Tab '{config.sheetNameOrders}'
              </p>
            </div>
            <button
              onClick={handleExportOrders}
              disabled={syncing !== null}
              className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{syncing === 'export-orders' ? 'Đang đẩy...' : 'Đẩy Đơn Hàng'}</span>
            </button>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                <Upload className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">Đẩy Tồn Kho & Lô FEFO</h4>
              <p className="text-xs text-slate-500 mt-1">
                Lưu tồn kho, hạn sử dụng từng lô & cảnh báo cận date sang Tab '{config.sheetNameInventory}'
              </p>
            </div>
            <button
              onClick={handleExportInventory}
              disabled={syncing !== null}
              className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{syncing === 'export-inventory' ? 'Đang đẩy...' : 'Đẩy Tồn Kho'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cấu Hình Google Sheets & Hướng Dẫn Kết Nối */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Save className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">Thiết Lập Bảng Tính Google Sheets Sao Lưu</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Spreadsheet ID (Mã Bảng Tính Google Sheet)
              </label>
              <input
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={config.spreadsheetId || ''}
                onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500"
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Có thể điền ở đây hoặc điền vào biến <code>GOOGLE_SHEETS_SPREADSHEET_ID</code> trong file <code>.env</code>.
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tab Sản Phẩm</label>
                <input
                  type="text"
                  value={config.sheetNameProducts || 'SanPham'}
                  onChange={(e) => setConfig({ ...config, sheetNameProducts: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tab Điểm Bán</label>
                <input
                  type="text"
                  value={config.sheetNameOutlets || 'DiemBan'}
                  onChange={(e) => setConfig({ ...config, sheetNameOutlets: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tab Đơn Hàng</label>
                <input
                  type="text"
                  value={config.sheetNameOrders || 'DonHang'}
                  onChange={(e) => setConfig({ ...config, sheetNameOrders: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tab Tồn Kho</label>
                <input
                  type="text"
                  value={config.sheetNameInventory || 'TonKho'}
                  onChange={(e) => setConfig({ ...config, sheetNameInventory: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-2">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition"
              >
                Lưu Tên Tab & ID Sheet
              </button>
            </div>
          </form>

          {/* Optional Pull Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Hoặc nhập ngược từ Sheet về CSDL (nếu cần):</span>
            <div className="flex space-x-2">
              <button
                onClick={handleSyncProductsFromSheet}
                disabled={syncing !== null}
                className="px-2.5 py-1 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Kéo SP
              </button>
              <button
                onClick={handleSyncOutletsFromSheet}
                disabled={syncing !== null}
                className="px-2.5 py-1 border border-slate-300 rounded hover:bg-slate-50 text-slate-700 font-semibold"
              >
                Kéo Tiệm
              </button>
            </div>
          </div>
        </div>

        {/* Hướng Dẫn Kết Nối Tự Động */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Quy Trình Kết Nối Tự Động Supabase → Google Sheets</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-600">
            {guide?.howToConnect?.map((step: string, idx: number) => (
              <div key={idx} className="flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900">
            <strong>💡 Lưu ý quan trọng:</strong> Hệ thống sẽ tự động tạo sẵn cả 5 Tab (<code>SanPham</code>, <code>DiemBan</code>, <code>DonHang</code>, <code>TonKho</code>, <code>ThuNo</code>) trong file Google Sheets của bạn khi bấm <strong>Đồng Bộ Sao Lưu Toàn Bộ</strong> — bạn không cần tự gõ tiêu đề cột bằng tay!
          </div>
        </div>
      </div>
    </div>
  );
};
export default GoogleSheetsPage;
