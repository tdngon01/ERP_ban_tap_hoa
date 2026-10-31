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
} from 'lucide-react';
import {
  getGoogleSheetsConfig,
  updateGoogleSheetsConfig,
  getGoogleSheetsGuide,
  syncProductsFromSheets,
  syncOutletsFromSheets,
  exportOrdersToSheets,
  exportInventoryToSheets,
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

  const handleSyncProducts = async () => {
    try {
      setSyncing('products');
      setSyncResult(null);
      const res = await syncProductsFromSheets(config.spreadsheetId);
      setSyncResult({ type: 'success', data: res });
    } catch (err: any) {
      setSyncResult({ type: 'error', message: err.response?.data?.message || err.message });
    } finally {
      setSyncing(null);
    }
  };

  const handleSyncOutlets = async () => {
    try {
      setSyncing('outlets');
      setSyncResult(null);
      const res = await syncOutletsFromSheets(config.spreadsheetId);
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

  return (
    <div className="space-y-6">
      {/* Introduction Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <FileSpreadsheet className="w-6 h-6 text-emerald-200" />
            <h3 className="text-lg font-extrabold tracking-tight">Tích Hợp Google Sheets API Hai Chiều</h3>
          </div>
          <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
            Kết nối trực tiếp hệ thống ERP với bảng Google Sheets của Nhà phân phối. Cho phép nhập danh mục sản phẩm, điểm bán tạp hóa từ Sheet và tự động đẩy đơn hàng, cảnh báo tồn kho FEFO lên Sheet để chủ doanh nghiệp mở xem ngay trên điện thoại di động!
          </p>
        </div>

        {config.spreadsheetId && (
          <a
            href={`https://docs.google.com/spreadsheets/d/${config.spreadsheetId}/edit`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2.5 rounded-xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 transition flex items-center space-x-1.5 flex-shrink-0 shadow-sm"
          >
            <span>Mở Bảng Google Sheet</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>

      {/* Sync Action Center */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sync Products */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Kéo Sản Phẩm Bánh Kẹo</h4>
            <p className="text-xs text-slate-500 mt-1">Đồng bộ mã SKU, tên bánh kẹo, quy đổi ĐVT từ Sheet '{config.sheetNameProducts}'</p>
          </div>
          <button
            onClick={handleSyncProducts}
            disabled={syncing !== null}
            className="w-full py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing === 'products' ? 'animate-spin' : ''}`} />
            <span>{syncing === 'products' ? 'Đang đọc...' : 'Đồng Bộ Sản Phẩm'}</span>
          </button>
        </div>

        {/* Sync Outlets */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
              <Download className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Kéo Điểm Bán Tạp Hóa</h4>
            <p className="text-xs text-slate-500 mt-1">Nhập danh sách tiệm tạp hóa, tọa độ GPS từ Sheet '{config.sheetNameOutlets}'</p>
          </div>
          <button
            onClick={handleSyncOutlets}
            disabled={syncing !== null}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing === 'outlets' ? 'animate-spin' : ''}`} />
            <span>{syncing === 'outlets' ? 'Đang đọc...' : 'Đồng Bộ Điểm Bán'}</span>
          </button>
        </div>

        {/* Export Orders */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Đẩy Đơn Hàng Lên Sheet</h4>
            <p className="text-xs text-slate-500 mt-1">Ghi nhận các đơn Pre-sales/Van sales và thanh toán vào Sheet '{config.sheetNameOrders}'</p>
          </div>
          <button
            onClick={handleExportOrders}
            disabled={syncing !== null}
            className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{syncing === 'export-orders' ? 'Đang ghi...' : 'Đẩy Đơn Hàng'}</span>
          </button>
        </div>

        {/* Export FEFO Inventory */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-3">
          <div>
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
              <Upload className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900">Đẩy Báo Cáo Lô FEFO</h4>
            <p className="text-xs text-slate-500 mt-1">Xuất danh sách lô, HSD, cảnh báo cận date ra Sheet '{config.sheetNameInventory}'</p>
          </div>
          <button
            onClick={handleExportInventory}
            disabled={syncing !== null}
            className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1 transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{syncing === 'export-inventory' ? 'Đang ghi...' : 'Đẩy Báo Cáo FEFO'}</span>
          </button>
        </div>
      </div>

      {/* Sync Result Feedback Box */}
      {syncResult && (
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 ${
            syncResult.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          {syncResult.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 text-xs">
            <div className="font-bold text-sm">
              {syncResult.type === 'success' ? 'Đồng Bộ Thành Công!' : 'Không Thể Đồng Bộ'}
            </div>
            <p className="mt-1">{syncResult.data?.message || syncResult.message}</p>
            {syncResult.data?.preview && (
              <div className="mt-2 bg-white/70 p-2.5 rounded-lg border font-mono text-[11px] overflow-x-auto">
                <div className="font-bold mb-1">Dữ liệu mẫu đã xử lý:</div>
                <pre>{JSON.stringify(syncResult.data.preview, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Cấu Hình Google Sheets & Hướng Dẫn Định Dạng */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form Cấu Hình Kết Nối */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Save className="w-4 h-4 text-slate-700" />
            <h3 className="font-bold text-sm text-slate-900">Thiết Lập Google Sheets ID & API</h3>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Spreadsheet ID (Mã Bảng Tính Google Sheet)
              </label>
              <input
                type="text"
                placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                value={config.spreadsheetId}
                onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500"
                required
              />
              <span className="text-[11px] text-slate-400 mt-0.5 block">
                Chuỗi ký tự nằm giữa <code>/d/</code> và <code>/edit</code> trên đường dẫn URL của Google Sheet.
              </span>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Google Cloud API Key (Tùy chọn nếu trang tính được chia sẻ xem)
              </label>
              <input
                type="password"
                placeholder="AIzaSy..."
                value={config.apiKey || ''}
                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tên Tab Sản Phẩm</label>
                <input
                  type="text"
                  value={config.sheetNameProducts}
                  onChange={(e) => setConfig({ ...config, sheetNameProducts: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tên Tab Điểm Bán Tạp Hóa</label>
                <input
                  type="text"
                  value={config.sheetNameOutlets}
                  onChange={(e) => setConfig({ ...config, sheetNameOutlets: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tên Tab Đơn Hàng</label>
                <input
                  type="text"
                  value={config.sheetNameOrders}
                  onChange={(e) => setConfig({ ...config, sheetNameOrders: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Tên Tab Tồn Kho & FEFO</label>
                <input
                  type="text"
                  value={config.sheetNameInventory}
                  onChange={(e) => setConfig({ ...config, sheetNameInventory: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition"
            >
              Lưu Cấu Hình Kết Nối
            </button>
          </form>
        </div>

        {/* Hướng Dẫn Thiết Lập Sheet Mẫu Chuẩn */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Hướng Dẫn Tạo 4 Sheet Mẫu Trên Google Drive</h3>
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

          {/* Mẫu cấu trúc các cột */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Tên các cột chuẩn (Headers) cho Tab 'SanPham':
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              Mã SKU | Tên Bánh Kẹo | Ngành Hàng | Thương Hiệu | ĐVT Cơ Sở | ĐVT Quy Cách | Hệ Số | Giá Bán
            </div>

            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pt-1">
              Tên các cột chuẩn cho Tab 'DiemBan':
            </div>
            <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700">
              Mã Điểm Bán | Tên Tạp Hóa | Chủ Tiệm | SĐT | Địa Chỉ | GPS Lat | GPS Lng | Hạn Mức Nợ
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

