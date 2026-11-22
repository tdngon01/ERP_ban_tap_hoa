import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Layers,
  Plus,
  Save,
  Navigation,
  Search,
  Move,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Sparkles,
  Store,
  RefreshCw,
  Compass,
  ArrowRight,
  Route as RouteIcon,
  X,
} from 'lucide-react';
import {
  getOutlets,
  getRoutes,
  createOutlet,
  updateOutlet,
  createRoute,
  assignOutletsToRoute,
} from '../api';

// Các nguồn bản đồ 100% Miễn Phí (Không cần API Key, không giới hạn)
const TILE_SERVERS = {
  osm: {
    name: 'Đường Phố (OpenStreetMap)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  satellite: {
    name: 'Ảnh Vệ Tinh (Esri Satellite)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
  },
  carto: {
    name: 'Bản Đồ Sáng (CartoDB Positron)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
};

// Màu sắc cho các tuyến bán hàng (Thứ 2 đến Thứ 7)
const ROUTE_COLORS: Record<string, string> = {
  MONDAY: '#f59e0b', // Vàng cam
  TUESDAY: '#3b82f6', // Xanh dương
  WEDNESDAY: '#10b981', // Xanh lá
  THURSDAY: '#8b5cf6', // Tím
  FRIDAY: '#ec4899', // Hồng
  SATURDAY: '#06b6d4', // Cyan
  UNASSIGNED: '#64748b', // Xám
};

export const InteractiveRouteMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);

  // Dữ liệu
  const [outlets, setOutlets] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Điều khiển bản đồ
  const [tileType, setTileType] = useState<'osm' | 'satellite' | 'carto'>('osm');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('ALL');
  const [mode, setMode] = useState<'view' | 'add_outlet' | 'edit_route'>('view');
  const [allowDrag, setAllowDrag] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Sửa Tuyến (Danh sách ID điểm bán thuộc tuyến theo thứ tự)
  const [routeOutletIds, setRouteOutletIds] = useState<string[]>([]);
  const [savingRoute, setSavingRoute] = useState(false);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number | null>(null);

  // Modal Thêm Điểm Bán Mới
  const [showAddOutletModal, setShowAddOutletModal] = useState(false);
  const [clickedLatLng, setClickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [outletForm, setOutletForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    routeId: '',
    tier: 'STANDARD',
    creditLimit: 10000000,
  });
  const [addressLoading, setAddressLoading] = useState(false);
  const [savingOutlet, setSavingOutlet] = useState(false);

  // Modal Tạo Tuyến Mới
  const [showAddRouteModal, setShowAddRouteModal] = useState(false);
  const [routeForm, setRouteForm] = useState({
    name: '',
    code: '',
    dayOfWeek: 'MONDAY',
    salesRepName: 'Nguyễn Văn Hùng',
  });

  // Tìm kiếm địa điểm miễn phí (OpenStreetMap Nominatim)
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);

  // 1. Tải dữ liệu ban đầu
  const loadData = async () => {
    try {
      setLoading(true);
      const [outletsData, routesData] = await Promise.all([getOutlets(), getRoutes()]);
      setOutlets(outletsData);
      setRoutes(routesData);
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu bản đồ:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // 2. Khởi tạo Leaflet Map (chạy 1 lần duy nhất)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Tọa độ trung tâm mặc định: TP. Hồ Chí Minh
    const map = L.map(mapContainerRef.current, {
      center: [10.7769, 106.7009],
      zoom: 13,
      zoomControl: false,
    });

    // Thêm nút zoom ở góc phải dưới
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Lớp gạch nền bản đồ
    const initialTile = L.tileLayer(TILE_SERVERS.osm.url, {
      attribution: TILE_SERVERS.osm.attribution,
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = initialTile;

    // Lớp chứa markers
    const markersGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = markersGroup;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 3. Đổi loại bản đồ nền (OSM / Vệ Tinh / Carto)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    const config = TILE_SERVERS[tileType];
    const newTile = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    tileLayerRef.current = newTile;
  }, [tileType]);

  // 4. Lắng nghe sự kiện click trên bản đồ khi ở chế độ "Chấm Thêm Tiệm"
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (e: L.LeafletMouseEvent) => {
      if (mode !== 'add_outlet') return;

      const { lat, lng } = e.latlng;
      setClickedLatLng({ lat, lng });
      setShowAddOutletModal(true);

      // Tự động gọi OpenStreetMap Nominatim Reverse Geocoding miễn phí
      try {
        setAddressLoading(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
        );
        const data = await res.json();
        if (data && data.display_name) {
          setOutletForm((prev) => ({
            ...prev,
            address: data.display_name.split(',').slice(0, 4).join(', ').trim(),
          }));
        }
      } catch (err) {
        console.warn('Lỗi reverse geocode:', err);
      } finally {
        setAddressLoading(false);
      }
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [mode]);

  // 5. Cập nhật danh sách điểm bán thuộc tuyến khi chọn tuyến
  useEffect(() => {
    if (selectedRouteId && selectedRouteId !== 'ALL') {
      const activeRoute = routes.find((r) => r.id === selectedRouteId);
      if (activeRoute && activeRoute.outlets) {
        setRouteOutletIds(activeRoute.outlets.map((o: any) => o.id));
      } else {
        const matching = outlets.filter((o) => o.routeId === selectedRouteId);
        setRouteOutletIds(matching.map((o) => o.id));
      }
    } else {
      setRouteOutletIds([]);
    }
  }, [selectedRouteId, routes, outlets]);

  // 6. Vẽ lại Markers và Tuyến Đường (Polylines)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersLayerRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();
    if (polylineLayerRef.current) {
      map.removeLayer(polylineLayerRef.current);
      polylineLayerRef.current = null;
    }

    const currentRoute = routes.find((r) => r.id === selectedRouteId);
    const routeColor = currentRoute
      ? ROUTE_COLORS[currentRoute.dayOfWeek] || '#f59e0b'
      : '#f59e0b';

    // Lọc danh sách điểm bán hiển thị
    const visibleOutlets =
      selectedRouteId === 'ALL'
        ? outlets
        : mode === 'edit_route'
        ? outlets // Trong chế độ sửa tuyến, hiển thị tất cả để người dùng click thêm/bớt
        : outlets.filter((o) => o.routeId === selectedRouteId);

    const routeCoords: [number, number][] = [];

    visibleOutlets.forEach((outlet) => {
      if (!outlet.latitude || !outlet.longitude) return;

      const isInCurrentRoute =
        selectedRouteId !== 'ALL' && routeOutletIds.includes(outlet.id);
      const outletRoute = routes.find((r) => r.id === outlet.routeId);
      const markerColor = isInCurrentRoute
        ? routeColor
        : outletRoute
        ? ROUTE_COLORS[outletRoute.dayOfWeek] || '#3b82f6'
        : ROUTE_COLORS.UNASSIGNED;

      const sequenceIndex = isInCurrentRoute
        ? routeOutletIds.indexOf(outlet.id) + 1
        : null;

      if (isInCurrentRoute) {
        routeCoords.push([outlet.latitude, outlet.longitude]);
      }

      // Tạo Custom HTML Marker với màu sắc & số thứ tự đi tuyến
      const customIcon = L.divIcon({
        className: 'custom-outlet-marker',
        html: `
          <div style="
            background: ${markerColor};
            color: white;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 11px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            cursor: ${allowDrag ? 'grab' : 'pointer'};
            transition: transform 0.15s ease;
          ">
            ${sequenceIndex ? `${sequenceIndex}` : '🏪'}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([outlet.latitude, outlet.longitude], {
        icon: customIcon,
        draggable: allowDrag,
        title: outlet.name,
      });

      // Xử lý kéo thả marker để cập nhật tọa độ trực tiếp vào CSDL
      marker.on('dragend', async (e: any) => {
        const newPos = e.target.getLatLng();
        try {
          await updateOutlet(outlet.id, {
            latitude: Number(newPos.lat.toFixed(6)),
            longitude: Number(newPos.lng.toFixed(6)),
          });
          setStatusMessage(`✓ Đã lưu vị trí mới cho: ${outlet.name}`);
          setTimeout(() => setStatusMessage(''), 4000);
          loadData();
        } catch (err: any) {
          alert('Lỗi cập nhật vị trí điểm bán: ' + err.message);
        }
      });

      // Click vào Marker
      marker.on('click', () => {
        if (mode === 'edit_route' && selectedRouteId !== 'ALL') {
          // Bật / Tắt tiệm trong tuyến đang chọn
          setRouteOutletIds((prev) => {
            if (prev.includes(outlet.id)) {
              return prev.filter((id) => id !== outlet.id);
            } else {
              return [...prev, outlet.id];
            }
          });
        }
      });

      // Popup thông tin chi tiết
      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; min-width: 200px; padding: 4px;">
          <div style="font-size: 10px; font-weight: bold; color: #64748b; font-family: monospace;">${outlet.code}</div>
          <div style="font-weight: bold; font-size: 14px; color: #0f172a; margin-top: 2px;">${outlet.name}</div>
          <div style="color: #475569; margin-top: 4px;">Chủ tiệm: <strong>${outlet.ownerName}</strong> (${outlet.phone || 'Chưa có SĐT'})</div>
          <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${outlet.address || 'Chưa cập nhật địa chỉ'}</div>
          <div style="margin-top: 8px; padding-top: 6px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center;">
            <span style="font-weight: bold; color: #b45309;">Nợ: ${Number(outlet.currentDebt || 0).toLocaleString('vi-VN')}đ</span>
            <span style="font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #f1f5f9; color: #334155;">
              ${outletRoute ? outletRoute.name : 'Chưa gán tuyến'}
            </span>
          </div>
        </div>
      `;
      marker.bindPopup(popupHtml);

      markersGroup.addLayer(marker);
    });

    // Vẽ Polyline nối các điểm bán trong tuyến
    if (routeCoords.length > 1) {
      const polyline = L.polyline(routeCoords, {
        color: routeColor,
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);

      polylineLayerRef.current = polyline;

      // Tính tổng khoảng cách đường chim bay
      let totalMeters = 0;
      for (let i = 0; i < routeCoords.length - 1; i++) {
        const from = L.latLng(routeCoords[i][0], routeCoords[i][1]);
        const to = L.latLng(routeCoords[i + 1][0], routeCoords[i + 1][1]);
        totalMeters += from.distanceTo(to);
      }
      setRouteDistanceKm(Number((totalMeters / 1000).toFixed(1)));
    } else {
      setRouteDistanceKm(null);
    }
  }, [outlets, routes, selectedRouteId, mode, allowDrag, routeOutletIds]);

  // 7. Lưu thay đổi phân tuyến lên máy chủ
  const handleSaveRouteAssignment = async () => {
    if (!selectedRouteId || selectedRouteId === 'ALL') {
      alert('Vui lòng chọn một Tuyến bán hàng để lưu');
      return;
    }
    try {
      setSavingRoute(true);
      await assignOutletsToRoute(selectedRouteId, routeOutletIds);
      setStatusMessage('✓ Đã cập nhật thành công các điểm bán cho tuyến!');
      setTimeout(() => setStatusMessage(''), 4000);
      setMode('view');
      await loadData();
    } catch (err: any) {
      alert('Lỗi lưu tuyến bán hàng: ' + err.message);
    } finally {
      setSavingRoute(false);
    }
  };

  // 8. Lưu điểm bán mới (từ form chấm bản đồ)
  const handleSaveNewOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletForm.name.trim() || !clickedLatLng) {
      alert('Vui lòng nhập tên điểm bán');
      return;
    }
    try {
      setSavingOutlet(true);
      await createOutlet({
        name: outletForm.name.trim(),
        ownerName: outletForm.ownerName.trim() || 'Chưa cập nhật',
        phone: outletForm.phone.trim() || '0900000000',
        address: outletForm.address.trim() || 'Địa chỉ trên bản đồ',
        latitude: Number(clickedLatLng.lat.toFixed(6)),
        longitude: Number(clickedLatLng.lng.toFixed(6)),
        routeId: outletForm.routeId || undefined,
        tier: outletForm.tier,
        creditLimit: Number(outletForm.creditLimit),
      });

      setShowAddOutletModal(false);
      setMode('view');
      setOutletForm({
        name: '',
        ownerName: '',
        phone: '',
        address: '',
        routeId: '',
        tier: 'STANDARD',
        creditLimit: 10000000,
      });

      setStatusMessage('✓ Đã thêm tiệm mới vào CSDL và ghim lên bản đồ!');
      setTimeout(() => setStatusMessage(''), 4000);
      await loadData();
    } catch (err: any) {
      alert('Lỗi tạo tiệm mới: ' + err.message);
    } finally {
      setSavingOutlet(false);
    }
  };

  // 9. Tạo Tuyến Mới
  const handleSaveNewRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routeForm.name.trim()) return;
    try {
      const newRoute = await createRoute({
        name: routeForm.name.trim(),
        code: routeForm.code.trim() || undefined,
        dayOfWeek: routeForm.dayOfWeek,
        salesRepName: routeForm.salesRepName,
      });
      setShowAddRouteModal(false);
      setRouteForm({
        name: '',
        code: '',
        dayOfWeek: 'MONDAY',
        salesRepName: 'Nguyễn Văn Hùng',
      });
      await loadData();
      setSelectedRouteId(newRoute.id);
      setMode('edit_route');
      setStatusMessage('✓ Tuyến mới đã tạo! Hãy click vào các điểm bán trên bản đồ để gán vào tuyến.');
    } catch (err: any) {
      alert('Lỗi tạo tuyến mới: ' + err.message);
    }
  };

  // 10. Tìm kiếm địa chỉ OpenStreetMap Nominatim
  const handleSearchLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;

    try {
      setSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim() + ', Vietnam'
        )}&limit=1`
      );
      const results = await res.json();
      if (results && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        mapInstanceRef.current.flyTo([lat, lon], 15, { duration: 1.5 });
      } else {
        alert('Không tìm thấy địa điểm này trên bản đồ OpenStreetMap');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Thanh Điều Khiển Trên Bản Đồ (Map Control Toolbar) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        {/* Nhóm Bộ Lọc & Tìm Kiếm */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Chọn Tuyến Bán Hàng */}
          <div className="flex items-center space-x-1.5">
            <RouteIcon className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">📍 Tất cả điểm bán ({outlets.length} tiệm)</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.dayOfWeek} • {r.name} ({r.outlets?.length || 0} tiệm)
                </option>
              ))}
            </select>
          </div>

          {/* Chọn Nền Bản Đồ Miễn Phí */}
          <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
            {(['osm', 'carto', 'satellite'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTileType(t)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded transition ${
                  tileType === t
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t === 'osm' ? 'Đường Phố' : t === 'carto' ? 'Bản Đồ Sáng' : 'Ảnh Vệ Tinh'}
              </button>
            ))}
          </div>

          {/* Tìm Kiếm Địa Điểm Miễn Phí */}
          <form onSubmit={handleSearchLocation} className="relative w-56">
            <input
              type="text"
              placeholder="Tìm đường, phường, quận..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-400" />
          </form>
        </div>

        {/* Nhóm Hành Động (Action Buttons) */}
        <div className="flex items-center space-x-2">
          {/* Nút Kéo Thả Sửa Vị Trí */}
          <button
            onClick={() => setAllowDrag(!allowDrag)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border flex items-center space-x-1.5 transition ${
              allowDrag
                ? 'bg-amber-100 text-amber-900 border-amber-300 ring-2 ring-amber-400'
                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
            }`}
            title="Bật/tắt chế độ kéo thả ghim để cập nhật tọa độ GPS"
          >
            <Move className="w-3.5 h-3.5 text-amber-600" />
            <span>{allowDrag ? 'Đang bật Kéo Thả' : 'Kéo Thả Vị Trí'}</span>
          </button>

          {/* Chế Độ Chấm Thêm Tiệm */}
          <button
            onClick={() => {
              if (mode === 'add_outlet') {
                setMode('view');
              } else {
                setMode('add_outlet');
                setStatusMessage('👉 Hãy nhấp chuột vào một vị trí trên bản đồ để thêm điểm bán mới.');
              }
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center space-x-1.5 transition ${
              mode === 'add_outlet'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{mode === 'add_outlet' ? 'Đang Chấm Tiệm...' : '+ Chấm Thêm Tiệm'}</span>
          </button>

          {/* Chế Độ Sửa Tuyến */}
          {selectedRouteId !== 'ALL' && (
            <button
              onClick={() => {
                if (mode === 'edit_route') {
                  setMode('view');
                } else {
                  setMode('edit_route');
                  setStatusMessage('👉 Nhấp vào các điểm bán trên bản đồ để Thêm/Bớt khỏi tuyến này.');
                }
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center space-x-1.5 transition ${
                mode === 'edit_route'
                  ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                  : 'bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{mode === 'edit_route' ? 'Đang Sửa Tuyến...' : 'Vẽ Tuyến Bán Hàng'}</span>
            </button>
          )}

          {/* Nút Tạo Tuyến Mới */}
          <button
            onClick={() => setShowAddRouteModal(true)}
            className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span>+ Tạo Tuyến Mới</span>
          </button>
        </div>
      </div>

      {/* Thông Báo Hướng Dẫn Nhanh (Status Banner) */}
      {statusMessage && (
        <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs font-semibold flex items-center justify-between animate-in fade-in">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <button
            onClick={() => setStatusMessage('')}
            className="text-amber-800 hover:text-amber-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Vùng Bản Đồ & Panel Điều Khiển Tuyến */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Bản Đồ Leaflet (OpenStreetMap) */}
        <div
          className={`relative rounded-xl overflow-hidden border border-slate-300 shadow-md ${
            selectedRouteId !== 'ALL' && mode === 'edit_route' ? 'lg:col-span-8' : 'lg:col-span-12'
          }`}
          style={{ height: '620px' }}
        >
          <div
            ref={mapContainerRef}
            className="w-full h-full"
            style={{ cursor: mode === 'add_outlet' ? 'crosshair' : 'grab' }}
          />

          {/* Watermark / Badge 100% Miễn Phí */}
          <div className="absolute top-3 left-3 z-[1000] bg-slate-900/85 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-lg text-xs flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-bold text-amber-400">OpenStreetMap Free Engine</span>
            <span className="text-[10px] text-slate-300 border-l border-slate-700 pl-2">
              0đ Phí Google • Không Giới Hạn Lượt Tải
            </span>
          </div>

          {/* Bảng Thống Kê Tuyến Trên Bản Đồ */}
          {selectedRouteId !== 'ALL' && routeDistanceKm !== null && (
            <div className="absolute bottom-4 left-4 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-xl border border-slate-300 shadow-lg text-xs text-slate-800 flex items-center space-x-4">
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Tổng Chiều Dài Tuyến
                </span>
                <span className="text-base font-extrabold text-blue-600">
                  {routeDistanceKm} km
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200"></div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Điểm Bán Trong Tuyến
                </span>
                <span className="text-base font-extrabold text-slate-900">
                  {routeOutletIds.length} tiệm
                </span>
              </div>
              <div className="h-7 w-px bg-slate-200"></div>
              <div>
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                  Thời Gian Chạy Xe Ước Tính
                </span>
                <span className="text-base font-extrabold text-emerald-600">
                  ~{Math.round(routeDistanceKm * 3.5)} phút
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Panel Chỉnh Sửa Tuyến (Hiển thị khi đang ở chế độ Edit Route) */}
        {selectedRouteId !== 'ALL' && mode === 'edit_route' && (
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col justify-between max-h-[620px] overflow-hidden">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Sắp Xếp & Gán Điểm Bán
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Tuyến: {routes.find((r) => r.id === selectedRouteId)?.name}
                  </p>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {routeOutletIds.length} tiệm
                </span>
              </div>

              {/* Danh sách các tiệm trong tuyến */}
              <div className="py-2 space-y-1.5 overflow-y-auto max-h-[460px]">
                {routeOutletIds.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    Chưa có điểm bán nào trong tuyến. Hãy nhấp vào các điểm bán trên bản đồ để thêm!
                  </div>
                ) : (
                  routeOutletIds.map((id, idx) => {
                    const item = outlets.find((o) => o.id === id);
                    if (!item) return null;

                    return (
                      <div
                        key={id}
                        className="p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-white transition flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 truncate">
                              {item.name}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {item.address}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setRouteOutletIds(routeOutletIds.filter((x) => x !== id))
                          }
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition ml-2"
                          title="Gỡ khỏi tuyến"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Nút Lưu Cấu Trúc Tuyến */}
            <div className="pt-3 border-t border-slate-200 flex space-x-2">
              <button
                onClick={() => setMode('view')}
                className="w-1/3 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveRouteAssignment}
                disabled={savingRoute}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center justify-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingRoute ? 'Đang lưu CSDL...' : 'Lưu Tuyến Lên CSDL'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal Chấm Thêm Điểm Bán Mới */}
      {showAddOutletModal && clickedLatLng && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50/50">
              <div className="flex items-center space-x-2">
                <Store className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Thêm Điểm Bán Mới Tại Tọa Độ Đã Chấm
                </h3>
              </div>
              <button
                onClick={() => setShowAddOutletModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewOutlet} className="p-5 space-y-3.5">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-600 flex items-center justify-between">
                <span>
                  Tọa độ GPS: <strong>{clickedLatLng.lat.toFixed(6)}, {clickedLatLng.lng.toFixed(6)}</strong>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-sans font-bold">
                  OpenStreetMap
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Tiệm Tạp Hóa / Cửa Hàng *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tạp Hóa Cô Ba, Siêu Thị Mini 79..."
                  value={outletForm.name}
                  onChange={(e) => setOutletForm({ ...outletForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tên Chủ Tiệm
                  </label>
                  <input
                    type="text"
                    placeholder="Anh Nam, Chị Hương..."
                    value={outletForm.ownerName}
                    onChange={(e) =>
                      setOutletForm({ ...outletForm, ownerName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Số Điện Thoại
                  </label>
                  <input
                    type="tel"
                    placeholder="09xx..."
                    value={outletForm.phone}
                    onChange={(e) => setOutletForm({ ...outletForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Địa Chỉ Đường Phố {addressLoading && '(Đang tra cứu tự động...)'}
                </label>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường..."
                  value={outletForm.address}
                  onChange={(e) => setOutletForm({ ...outletForm, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gán Vào Tuyến
                  </label>
                  <select
                    value={outletForm.routeId}
                    onChange={(e) => setOutletForm({ ...outletForm, routeId: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Chưa gán tuyến --</option>
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.dayOfWeek} • {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Hạn Mức Công Nợ (VNĐ)
                  </label>
                  <input
                    type="number"
                    step={1000000}
                    value={outletForm.creditLimit}
                    onChange={(e) =>
                      setOutletForm({ ...outletForm, creditLimit: Number(e.target.value) })
                    }
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddOutletModal(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={savingOutlet}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  {savingOutlet ? 'Đang lưu CSDL...' : 'Lưu Điểm Bán Mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Tạo Tuyến Bán Hàng Mới */}
      {showAddRouteModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <RouteIcon className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Tạo Tuyến Bán Hàng Mới</h3>
              </div>
              <button
                onClick={() => setShowAddRouteModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewRoute} className="p-5 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tên Tuyến Bán Hàng *
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Tuyến Quận 3 - Thứ Tư, Tuyến Bình Thạnh..."
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Thứ Viếng Thăm (MCP)
                  </label>
                  <select
                    value={routeForm.dayOfWeek}
                    onChange={(e) => setRouteForm({ ...routeForm, dayOfWeek: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="MONDAY">Thứ Hai</option>
                    <option value="TUESDAY">Thứ Ba</option>
                    <option value="WEDNESDAY">Thứ Tư</option>
                    <option value="THURSDAY">Thứ Năm</option>
                    <option value="FRIDAY">Thứ Sáu</option>
                    <option value="SATURDAY">Thứ Bảy</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nhân Viên Phụ Trách
                  </label>
                  <input
                    type="text"
                    value={routeForm.salesRepName}
                    onChange={(e) =>
                      setRouteForm({ ...routeForm, salesRepName: e.target.value })
                    }
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddRouteModal(false)}
                  className="px-3 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm"
                >
                  Tạo Tuyến Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default InteractiveRouteMap;
