'use client';
import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Navigation,
  User,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Image as ImageIcon,
  Clock,
  Sparkles,
} from 'lucide-react';
import { getRoutes, getTodayMcp, getVisitHistory } from '../api';

const InteractiveRouteMap = dynamic(
  () => import('../components/InteractiveRouteMap').then((mod) => mod.InteractiveRouteMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-[600px] flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-sm text-slate-500 font-medium">Đang tải bản đồ tuyến bán hàng vệ tinh...</p>
        </div>
      </div>
    ),
  }
);

export const RouteMcpPage: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [todayMcp, setTodayMcp] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'map' | 'routes' | 'history'>('map');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [routesData, todayData, visitsData] = await Promise.all([
        getRoutes(),
        getTodayMcp(),
        getVisitHistory(),
      ]);
      setRoutes(routesData);
      setTodayMcp(todayData);
      setVisits(visitsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('map')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'map'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Bản Đồ Tuyến & Điểm Bán (OpenStreetMap Free)</span>
          <span className="text-[10px] bg-slate-900 text-amber-400 font-bold px-1.5 py-0.2 rounded ml-1">
            0đ Phí
          </span>
        </button>

        <button
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'routes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Danh Sách Tuyến Bán Hàng (MCP T2 - T7)</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'history'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Nhật Ký Viếng Thăm & Giám Sát GPS ({visits.length})</span>
        </button>
      </div>

      {/* Tab 1: Bản Đồ Tương Tác OpenStreetMap (100% Miễn Phí) */}
      {activeTab === 'map' && <InteractiveRouteMap />}

      {/* Tab 2: Danh Sách Tuyến & Điểm Bán */}
      {activeTab === 'routes' && (
        <div className="space-y-6">
          {/* Today MCP Notification Banner */}
          {todayMcp && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-900">
                    Lịch trình đi tuyến hôm nay: Thứ{' '}
                    {todayMcp.dayOfWeek === 'MONDAY'
                      ? 'Hai'
                      : todayMcp.dayOfWeek === 'TUESDAY'
                      ? 'Ba'
                      : todayMcp.dayOfWeek}{' '}
                    ({todayMcp.date})
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Hệ thống tự động kích hoạt danh sách điểm bán tạp hóa tương ứng trên ứng dụng di động của Sale thị trường.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Routes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {routes.map((route) => (
              <div
                key={route.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
                      {route.code}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 mt-1">{route.name}</h3>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {route.dayOfWeek}
                  </span>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>
                    Nhân viên phụ trách: <strong>{route.salesRepName || 'Chưa phân bổ'}</strong>
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                    <span className="font-semibold">Điểm bán trên tuyến ({route.outlets?.length || 0})</span>
                    <button
                      onClick={() => setActiveTab('map')}
                      className="text-amber-600 hover:text-amber-700 font-bold flex items-center space-x-1"
                    >
                      <span>Xem & Sắp Xếp Trên Map</span>
                      <span>→</span>
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {route.outlets?.map((outlet: any, idx: number) => (
                      <div
                        key={outlet.id}
                        className="flex items-center justify-between p-2 rounded bg-slate-50 text-xs"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-slate-800">{outlet.name}</span>
                        </div>
                        <span className="text-slate-500 text-[11px] font-mono">
                          {outlet.phone || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Nhật Ký Viếng Thăm GPS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-bold text-sm text-slate-900">
              Nhật Ký Viếng Thăm Điểm Bán & Xác Thực Tọa Độ Vệ Tinh GPS
            </h3>
            <span className="text-xs text-slate-500">Giới hạn bán kính hợp lệ: &le; 100m</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Thời Gian</th>
                  <th className="py-3 px-4">Nhân Viên</th>
                  <th className="py-3 px-4">Điểm Bán (Tạp Hóa)</th>
                  <th className="py-3 px-4">Tuyến Bán Hàng</th>
                  <th className="py-3 px-4 text-center">Xác Thực GPS</th>
                  <th className="py-3 px-4 text-center">Hình Ảnh Chụp</th>
                  <th className="py-3 px-4">Ghi Chú Kiểm Tồn</th>
                  <th className="py-3 px-4 text-center">Đơn Hàng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-xs text-slate-400">
                      Chưa có dữ liệu viếng thăm nào được ghi nhận hôm nay.
                    </td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 text-xs text-slate-700 whitespace-nowrap">
                        <div className="flex items-center space-x-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(v.checkInTime).toLocaleTimeString('vi-VN')}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(v.checkInTime).toLocaleDateString('vi-VN')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-800">
                        {v.salesRepName}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-bold text-slate-900">{v.outlet?.name}</div>
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">
                          {v.outlet?.address}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {v.route?.name || 'Tuyến vãng lai'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            v.isGpsValid
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {v.isGpsValid ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đúng vị trí ({v.distanceMeters || 0}m)</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Lệch {v.distanceMeters || 0}m!</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {v.storePhotoUrl ? (
                          <a
                            href={v.storePhotoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center space-x-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                          >
                            <img
                              src={v.storePhotoUrl}
                              alt="Store"
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shadow-xs"
                            />
                            <span>Xem ảnh</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">Không có</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                        {v.storeInventoryNotes || v.notes || 'Không ghi chú'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                            v.hasOrder
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {v.hasOrder ? 'Có lên đơn' : 'Không mua hàng'}
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
    </div>
  );
};
export default RouteMcpPage;
