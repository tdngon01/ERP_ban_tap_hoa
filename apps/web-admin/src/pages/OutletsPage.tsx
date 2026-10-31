import React, { useEffect, useState } from 'react';
import {
  Store,
  Search,
  Plus,
  MapPin,
  Phone,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  Navigation,
  Crosshair,
  Compass,
  CheckCircle2,
  Edit,
  X,
} from 'lucide-react';
import { getOutlets, createOutlet, updateOutlet, getRoutes } from '../api';

export const OutletsPage: React.FC = () => {
  const [outlets, setOutlets] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditId, setCurrentEditId] = useState<string | null>(null);

  // Modal xem bản đồ
  const [viewingMapOutlet, setViewingMapOutlet] = useState<any>(null);

  // Form thêm / sửa
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

  const [pastedMapInput, setPastedMapInput] = useState('');
  const [parseStatus, setParseStatus] = useState<string>('');
  const [isLocating, setIsLocating] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

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

  const resetForm = () => {
    setForm({
      code: `TH-${String(outlets.length + 1).padStart(3, '0')}`,
      name: '',
      ownerName: '',
      phone: '',
      address: '',
      district: 'Quận 1',
      province: 'Hồ Chí Minh',
      latitude: 10.7768,
      longitude: 106.7008,
      creditLimit: 15000000,
      routeId: routes.length > 0 ? routes[0].id : '',
      tier: 'STANDARD',
    });
    setPastedMapInput('');
    setParseStatus('');
    setIsEditing(false);
    setCurrentEditId(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEditModal = (outlet: any) => {
    setIsEditing(true);
    setCurrentEditId(outlet.id);
    setForm({
      code: outlet.code,
      name: outlet.name,
      ownerName: outlet.ownerName,
      phone: outlet.phone,
      address: outlet.address,
      district: outlet.district || 'Quận 1',
      province: outlet.province || 'Hồ Chí Minh',
      latitude: outlet.latitude,
      longitude: outlet.longitude,
      creditLimit: outlet.creditLimit,
      routeId: outlet.routeId || (routes.length > 0 ? routes[0].id : ''),
      tier: outlet.tier || 'STANDARD',
    });
    setPastedMapInput(`${outlet.latitude}, ${outlet.longitude}`);
    setParseStatus('');
    setShowModal(true);
  };

  // 1. Phân tích tọa độ từ link Google Maps hoặc chuỗi copy
  const handleParseMapInput = () => {
    if (!pastedMapInput.trim()) return;
    const input = pastedMapInput.trim();

    // Regex 1: "10.7768, 106.7008" hoặc "10.7768 106.7008"
    const directMatch = input.match(/([-+]?\d{1,2}\.\d+)[,\s]+([-+]?\d{1,3}\.\d+)/);
    if (directMatch) {
      const lat = parseFloat(directMatch[1]);
      const lng = parseFloat(directMatch[2]);
      if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setParseStatus(`✓ Đã nhận diện tọa độ: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        return;
      }
    }

    // Regex 2: Google Maps link chứa /@lat,lng
    const atMatch = input.match(/@([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
    if (atMatch) {
      const lat = parseFloat(atMatch[1]);
      const lng = parseFloat(atMatch[2]);
      setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      setParseStatus(`✓ Đã trích xuất từ link Google Maps: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      return;
    }

    // Regex 3: Link có tham số ?q=lat,lng
    const queryMatch = input.match(/[?&](?:q|ll)=([-+]?\d{1,2}\.\d+),([-+]?\d{1,3}\.\d+)/);
    if (queryMatch) {
      const lat = parseFloat(queryMatch[1]);
      const lng = parseFloat(queryMatch[2]);
      setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
      setParseStatus(`✓ Đã trích xuất từ tham số vị trí: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      return;
    }

    setParseStatus('⚠ Không nhận diện được tọa độ. Vui lòng thử dán dạng "10.7768, 106.7008"');
  };

  // 2. Lấy vị trí GPS thiết bị hiện tại (HTML5 Geolocation)
  const handleGetDeviceLocation = () => {
    if (!navigator.geolocation) {
      alert('Thiết bị không hỗ trợ Geolocation GPS.');
      return;
    }

    setIsLocating(true);
    setParseStatus('Đang đo tọa độ GPS từ thiết bị...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        const accuracy = Math.round(pos.coords.accuracy);

        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setPastedMapInput(`${lat}, ${lng}`);
        setParseStatus(`✓ Đã bắt vị trí GPS thiết bị (Độ chính xác: ±${accuracy}m): ${lat}, ${lng}`);
        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        setParseStatus(`⚠ Không thể lấy GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  // 3. Tìm tọa độ theo địa chỉ tự động (Geocoding)
  const handleGeocodeAddress = async () => {
    if (!form.address.trim()) {
      alert('Vui lòng nhập Địa chỉ chi tiết trước khi tìm tọa độ.');
      return;
    }

    try {
      setIsGeocoding(true);
      setParseStatus('Đang tìm kiếm tọa độ từ địa chỉ...');

      const fullAddress = `${form.address}, ${form.district || ''}, ${form.province || 'Hồ Chí Minh'}, Việt Nam`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`;

      const res = await fetch(url, { headers: { 'Accept-Language': 'vi' } });
      const data = await res.json();

      if (data && data.length > 0) {
        const lat = parseFloat(parseFloat(data[0].lat).toFixed(6));
        const lng = parseFloat(parseFloat(data[0].lon).toFixed(6));

        setForm((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setPastedMapInput(`${lat}, ${lng}`);
        setParseStatus(`✓ Đã tìm thấy tọa độ theo địa chỉ: ${lat}, ${lng}`);
      } else {
        setParseStatus('⚠ Không tìm thấy tọa độ chính xác cho địa chỉ này. Hãy thử bấm "Mở Google Maps ngoài" để chọn thủ công.');
      }
    } catch (e: any) {
      setParseStatus(`⚠ Lỗi tìm kiếm tọa độ: ${e.message}`);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditing && currentEditId) {
        await updateOutlet(currentEditId, form);
        alert('Cập nhật điểm bán tạp hóa thành công!');
      } else {
        await createOutlet(form);
        alert('Thêm điểm bán tạp hóa thành công!');
      }
      setShowModal(false);
      loadData();
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
          onClick={handleOpenAddModal}
          className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm Điểm Bán Tạp Hóa Mới</span>
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

            const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${outlet.latitude},${outlet.longitude}`;

            return (
              <div
                key={outlet.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
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
                      <MapPin className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                      <span className="line-clamp-1">{outlet.address}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100">
                      <span>GPS: {outlet.latitude.toFixed(5)}, {outlet.longitude.toFixed(5)}</span>
                      <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-sans font-bold flex items-center space-x-0.5"
                        title="Mở Google Maps trong trình duyệt"
                      >
                        <span>Mở Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  {/* Thanh theo dõi Hạn mức Công nợ */}
                  <div className="pt-2 border-t border-slate-100 space-y-1.5">
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

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => setViewingMapOutlet(outlet)}
                    className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center space-x-1 transition"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    <span>Xem Bản Đồ GG Map</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditModal(outlet)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <Edit className="w-3.5 h-3.5 text-slate-500" />
                    <span>Sửa Tọa Độ / Tiệm</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Xem Bản Đồ Google Maps Tạp Hóa */}
      {viewingMapOutlet && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5 text-rose-500" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">{viewingMapOutlet.name}</h3>
                  <p className="text-xs text-slate-500">{viewingMapOutlet.address}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingMapOutlet(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embedded Google Maps View */}
            <div className="w-full h-80 rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 relative">
              <iframe
                title="Google Maps Outlet Location"
                width="100%"
                height="100%"
                frameBorder="0"
                scrolling="no"
                marginHeight={0}
                marginWidth={0}
                src={`https://maps.google.com/maps?q=${viewingMapOutlet.latitude},${viewingMapOutlet.longitude}&hl=vi&z=17&output=embed`}
                className="w-full h-full"
              ></iframe>
            </div>

            {/* Thông tin chi tiết & Nút điều hướng */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-slate-500">Tọa độ GPS xác thực:</p>
                <p className="font-mono font-bold text-slate-900 text-sm">
                  {viewingMapOutlet.latitude.toFixed(6)}, {viewingMapOutlet.longitude.toFixed(6)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Chủ tiệm: <strong>{viewingMapOutlet.ownerName}</strong> • ĐT: <strong>{viewingMapOutlet.phone}</strong>
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${viewingMapOutlet.latitude},${viewingMapOutlet.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm"
                >
                  <Navigation className="w-4 h-4" />
                  <span>Chỉ Đường Đi (Google Maps)</span>
                </a>

                <button
                  onClick={() => {
                    const target = viewingMapOutlet;
                    setViewingMapOutlet(null);
                    handleOpenEditModal(target);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs"
                >
                  Sửa Tọa Độ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thêm Mới / Chỉnh Sửa Điểm Bán Tạp Hóa */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {isEditing ? 'Cập Nhật Điểm Bán & Vị Trí Google Maps' : 'Thêm Điểm Bán Tạp Hóa Mới (GT)'}
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Thông tin cơ bản */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Mã tiệm tạp hóa</label>
                  <input
                    type="text"
                    placeholder="VD: TH-007"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-mono uppercase font-bold"
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
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Tên chủ tiệm</label>
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Số điện thoại liên hệ</label>
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

              {/* Địa chỉ & Nút tìm kiếm Geocode */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">Địa chỉ chi tiết</label>
                  <button
                    type="button"
                    onClick={handleGeocodeAddress}
                    disabled={isGeocoding}
                    className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center space-x-1"
                  >
                    <span>{isGeocoding ? 'Đang tìm...' : '🔍 Tìm Tọa Độ Theo Địa Chỉ Này'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="VD: Số 18 Lê Lợi, Phường Bến Nghé, Quận 1"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                  required
                />
              </div>

              {/* KHU VỰC VỊ TRÍ GOOGLE MAPS & GPS */}
              <div className="p-3.5 bg-amber-50/70 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 text-amber-900 font-bold text-xs uppercase tracking-wide">
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>Vị Trí Tiệm Trên Google Maps (GPS)</span>
                  </div>

                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center space-x-1"
                    title="Mở Google Maps tab mới để tìm và sao chép tọa độ"
                  >
                    <span>Mở Google Maps ngoài</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Tiện ích 1: Dán link Google Maps hoặc tọa độ */}
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Dán link Google Maps hoặc tọa độ (VD: 10.7768, 106.7008)"
                      value={pastedMapInput}
                      onChange={(e) => setPastedMapInput(e.target.value)}
                      className="flex-1 border border-amber-300 rounded-lg p-2 text-xs bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleParseMapInput}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1"
                    >
                      <span>Nhận Diện</span>
                    </button>
                  </div>
                </div>

                {/* Tiện ích 2: Lấy GPS từ thiết bị */}
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleGetDeviceLocation}
                    disabled={isLocating}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm"
                  >
                    <Crosshair className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Đang lấy GPS...' : 'Lấy Vị Trí GPS Thiết Bị Hiện Tại'}</span>
                  </button>

                  <span className="text-[10px] text-slate-500 italic">
                    Dùng khi đang đứng trực tiếp tại tiệm
                  </span>
                </div>

                {parseStatus && (
                  <div className="p-2 bg-white rounded-lg border border-amber-200 text-[11px] font-semibold text-slate-800">
                    {parseStatus}
                  </div>
                )}

                {/* 2 Ô nhập Lat / Lng */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Vĩ độ (GPS Latitude)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.latitude}
                      onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                      Kinh độ (GPS Longitude)
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={form.longitude}
                      onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-mono font-bold bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Mini Google Maps Live Preview */}
                <div className="mt-2 rounded-lg overflow-hidden border border-amber-300 h-44 bg-slate-100">
                  <iframe
                    title="Live Location Preview"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="no"
                    marginHeight={0}
                    marginWidth={0}
                    src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&hl=vi&z=16&output=embed`}
                  ></iframe>
                </div>
              </div>

              {/* Hạn mức nợ & Tuyến bán hàng */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Hạn mức nợ gối đầu (VNĐ)</label>
                  <input
                    type="number"
                    value={form.creditLimit}
                    onChange={(e) => setForm({ ...form, creditLimit: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-sm font-bold font-mono"
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

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20"
                >
                  {isEditing ? 'Lưu Cập Nhật Điểm Bán' : 'Tạo Điểm Bán Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
