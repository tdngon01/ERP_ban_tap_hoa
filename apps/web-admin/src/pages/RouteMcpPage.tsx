import React, { useEffect, useState } from 'react';
import { MapPin, Navigation, User, Calendar, CheckCircle2, AlertTriangle, Image as ImageIcon, Clock } from 'lucide-react';
import { getRoutes, getTodayMcp, getVisitHistory } from '../api';

export const RouteMcpPage: React.FC = () => {
  const [routes, setRoutes] = useState<any[]>([]);
  const [todayMcp, setTodayMcp] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'routes' | 'history'>('routes');
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
          onClick={() => setActiveTab('routes')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
            activeTab === 'routes'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Kế Hoạch Tuyến Bán Hàng (MCP T2 - T7)</span>
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

      {activeTab === 'routes' ? (
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
                    Lịch trình đi tuyến hôm nay: Thứ {todayMcp.dayOfWeek === 'MONDAY' ? 'Hai' : todayMcp.dayOfWeek === 'TUESDAY' ? 'Ba' : todayMcp.dayOfWeek} ({todayMcp.date})
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
              <div key={route.id} className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
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
                  <span>Sale phụ trách: <strong className="text-slate-800">{route.salesRepName}</strong></span>
                  {route.salesRepPhone && <span>({route.salesRepPhone})</span>}
                </div>

                {/* Danh sách các điểm tạp hóa trong tuyến */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-xs font-semibold text-slate-500 flex justify-between">
                    <span>Điểm bán trong tuyến:</span>
                    <span className="font-bold text-slate-800">{route.outlets?.length || 0} tiệm tạp hóa</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {(route.outlets || []).map((o: any, idx: number) => (
                      <div
                        key={o.id}
                        className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="font-bold text-slate-800">{o.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              GPS: {o.latitude.toFixed(4)}, {o.longitude.toFixed(4)}
                            </div>
                          </div>
                        </div>

                        <span className="font-mono text-[11px] font-bold text-slate-700">
                          {o.currentDebt > 0 ? `${o.currentDebt.toLocaleString('vi-VN')}đ` : 'Hết nợ'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Tab Lịch Sử Viếng Thăm & Xác Thực GPS Check-in */
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold text-xs border-b border-slate-200 uppercase">
                <tr>
                  <th className="py-3 px-4">Thời Gian & Nhân Viên</th>
                  <th className="py-3 px-4">Tiệm Tạp Hóa</th>
                  <th className="py-3 px-4">Tuyến Bán Hàng</th>
                  <th className="py-3 px-4 text-center">Xác Thực Check-in GPS</th>
                  <th className="py-3 px-4 text-center">Ảnh Thực Tế</th>
                  <th className="py-3 px-4">Ghi Chú Kiểm Date / Tồn Quầy</th>
                  <th className="py-3 px-4 text-center">Kết Quả Đơn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visits.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">Chưa có nhật ký viếng thăm nào.</td>
                  </tr>
                ) : (
                  visits.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{v.salesRepName}</div>
                        <div className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(v.checkInTime).toLocaleString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {v.outlet?.name}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">
                        {v.route?.name || 'Tuyến thị trường'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            v.isGpsValid
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800 border border-rose-300'
                          }`}
                        >
                          {v.isGpsValid ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Hợp lệ ({v.distanceMeters || 0}m)</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="w-3 h-3" />
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
                            className="inline-flex items-center space-x-1 text-xs text-blue-600 hover:underline"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
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

