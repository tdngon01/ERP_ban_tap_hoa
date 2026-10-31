import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  MapPin,
  Camera,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ShoppingCart,
  QrCode,
  ArrowRight,
  ArrowLeft,
  Search,
  Gift,
  Clock,
  Sparkles,
  RefreshCw,
  Truck,
  Package,
  ClipboardList,
  Plus,
  Check,
  AlertCircle,
  FileText,
  Layers,
  Store,
  ChevronRight,
} from 'lucide-react';
import {
  getTodayMcp,
  checkInStore,
  checkOutStore,
  createOrder,
  generateVietQr,
  getProducts,
  getVanStock,
  loadItemsToVan,
  getBackorders,
  createBackorder,
  resolveBackorder,
} from '../api';

export const MobileSfaSimulator: React.FC = () => {
  const [todayMcp, setTodayMcp] = useState<any>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Điều hướng chính trong điện thoại: 'visit' (Đi tuyến) | 'vanStock' (Soạn & Tồn xe) | 'backorders' (Giao bù)
  const [mobileTab, setMobileTab] = useState<'visit' | 'vanStock' | 'backorders'>('visit');

  // Quy trình 5 bước viếng thăm
  const [step, setStep] = useState<number>(1);
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);
  const [shelfDateNotes, setShelfDateNotes] = useState('Chocopie tồn 2 hộp date 12/2026; AFC còn 5 gói.');
  const [displayPhoto, setDisplayPhoto] = useState(
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500',
  );
  const [cart, setCart] = useState<any[]>([{ productId: '', uomName: 'Thùng', quantity: 5 }]);
  const [orderCreated, setOrderCreated] = useState<any>(null);
  const [vietQr, setVietQr] = useState<any>(null);

  // Dữ liệu Soạn Hàng Lên Xe (Van Stock)
  const [vanStock, setVanStock] = useState<any>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadItems, setLoadItems] = useState<any[]>([{ productId: '', uomName: 'Thùng', quantity: 10 }]);

  // Dữ liệu Ghi Chú Nợ Hàng / Giao Bổ Sung (Backorders)
  const [backorders, setBackorders] = useState<any[]>([]);
  const [showBackorderModal, setShowBackorderModal] = useState(false);
  const [backorderForm, setBackorderForm] = useState({
    outletId: '',
    productId: '',
    uomName: 'Thùng',
    quantity: 2,
    promisedDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    reason: 'Hết hàng trên xe lúc giao',
    notes: 'Khách dặn giao bổ sung trước 10h sáng mai',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mcpData, productsData, vanData, backorderData] = await Promise.all([
        getTodayMcp(),
        getProducts(),
        getVanStock('Nguyễn Văn Hùng'),
        getBackorders('PENDING'),
      ]);
      setTodayMcp(mcpData);
      setProducts(productsData);
      setVanStock(vanData);
      setBackorders(backorderData);

      const firstOutlet = mcpData?.routes?.[0]?.outlets?.[0];
      if (firstOutlet) {
        setSelectedOutlet(firstOutlet);
        setBackorderForm((prev) => ({ ...prev, outletId: firstOutlet.id }));
      }
      if (productsData.length > 0) {
        setCart([{ productId: productsData[0].id, uomName: 'Thùng', quantity: 5 }]);
        setLoadItems([{ productId: productsData[0].id, uomName: 'Thùng', quantity: 10 }]);
        setBackorderForm((prev) => ({ ...prev, productId: productsData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bước 1: Check-in GPS
  const handlePerformCheckIn = async () => {
    if (!selectedOutlet) return;
    try {
      const res = await checkInStore({
        outletId: selectedOutlet.id,
        salesRepName: 'Nguyễn Văn Hùng (Sale Q1)',
        latitude: selectedOutlet.latitude + 0.0001,
        longitude: selectedOutlet.longitude + 0.0001,
        storeInventoryNotes: shelfDateNotes,
        storePhotoUrl: displayPhoto,
      });

      setCheckInResult(res);
      setCurrentVisitId(res.visit.id);
      setStep(2);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Bước 4: Đặt đơn
  const handleSubmitOrder = async () => {
    if (!selectedOutlet) return;
    try {
      const res = await createOrder({
        outletId: selectedOutlet.id,
        salesRepName: 'Nguyễn Văn Hùng (Sale Q1)',
        orderType: 'PRE_SALES',
        items: cart,
        notes: 'Đơn đặt từ Mobile App SFA thị trường',
      });
      setOrderCreated(res.order);

      const qr = await generateVietQr({
        outletId: selectedOutlet.id,
        orderId: res.order.id,
        amount: res.order.totalAmount,
      });
      setVietQr(qr);
      setStep(5);

      // Cập nhật lại tồn xe sau khi bán
      const updatedVan = await getVanStock('Nguyễn Văn Hùng');
      setVanStock(updatedVan);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Bước 5: Check-out
  const handleCompleteCheckOut = async () => {
    if (currentVisitId) {
      await checkOutStore({
        visitId: currentVisitId,
        hasOrder: true,
        notes: 'Đã hoàn tất viếng thăm 5 bước và thu nợ',
      });
    }
    alert('🎉 Chúc mừng bạn đã hoàn tất quy trình viếng thăm điểm bán tạp hóa!');
    setStep(1);
    setCheckInResult(null);
    setOrderCreated(null);
  };

  // Xử lý Soạn Hàng Bốc Lên Xe Đầu Ngày
  const handleLoadVanStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loadItemsToVan({
        items: loadItems,
        salesRepName: 'Nguyễn Văn Hùng',
        notes: 'Soạn hàng bốc lên xe đầu ngày',
      });
      alert('Đã bốc hàng lên xe tải thành công!');
      setShowLoadModal(false);
      const updated = await getVanStock('Nguyễn Văn Hùng');
      setVanStock(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Xử lý Tạo Ghi Nhớ Giao Bổ Sung / Nợ Hàng
  const handleCreateBackorder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBackorder({
        ...backorderForm,
        salesRepName: 'Nguyễn Văn Hùng',
      });
      alert('Đã ghi nhớ thông tin nợ hàng / giao bổ sung cho khách!');
      setShowBackorderModal(false);
      const updated = await getBackorders('PENDING');
      setBackorders(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Xử lý Đã Giao Bù Thành Công
  const handleResolveBackorder = async (id: string) => {
    try {
      await resolveBackorder(id);
      alert('Đã xác nhận giao bù thành công cho khách hàng!');
      const updated = await getBackorders('PENDING');
      setBackorders(updated);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột Trái (5 Cột): Bảng Điều Khiển Giả Lập & Thông Tin Tuyến */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Điều Khiển Giả Lập Mobile SFA</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Mô phỏng trải nghiệm thực tế của Nhân viên Sale thị trường khi chở hàng đi bán: Đi tuyến MCP, kiểm tra số lượng bánh kẹo chở trên xe, và ghi chú nợ hàng để giao bù.
            </p>

            {/* Bộ chọn 3 chế độ nhanh */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                onClick={() => setMobileTab('visit')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                  mobileTab === 'visit'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4 text-emerald-600" />
                <span>1. Đi Tuyến (5 Bước)</span>
              </button>

              <button
                onClick={() => setMobileTab('vanStock')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                  mobileTab === 'vanStock'
                    ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Truck className="w-4 h-4 text-blue-600" />
                <span>2. Soạn & Tồn Xe</span>
              </button>

              <button
                onClick={() => setMobileTab('backorders')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition ${
                  mobileTab === 'backorders'
                    ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4 text-amber-600" />
                <span>3. Giao Bổ Sung ({backorders.length})</span>
              </button>
            </div>
          </div>

          {/* Danh sách các tiệm trên tuyến MCP */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-900 uppercase">Tiệm Tạp Hóa Hôm Nay:</span>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                Tuyến: {todayMcp?.dayOfWeek || 'Thứ Hai'}
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {todayMcp?.routes?.[0]?.outlets?.map((o: any, idx: number) => {
                const isSelected = selectedOutlet?.id === o.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedOutlet(o);
                      setBackorderForm((prev) => ({ ...prev, outletId: o.id }));
                      setStep(1);
                      setCheckInResult(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {idx + 1}
                      </span>
                      <div>
                        <div className="text-sm font-bold text-slate-900">{o.name}</div>
                        <div className="text-xs text-slate-500">{o.ownerName} • {o.address}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-rose-600 block">
                        Nợ: {o.currentDebt.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[10px] text-slate-400">Hạn mức: {o.creditLimit.toLocaleString('vi-VN')}đ</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Action: Ghi Chú Giao Bù Ngay */}
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 flex items-center space-x-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Nợ Hàng / Giao Bổ Sung:</span>
              </span>
              <button
                onClick={() => setShowBackorderModal(true)}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg shadow-xs flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ghi Nhận Giao Bù</span>
              </button>
            </div>
            <p className="text-[11px] text-amber-800 leading-relaxed">
              Khi chở hàng theo bán nếu bị thiếu số lượng hoặc khách đặt thêm, hãy ghi chú lại để sáng mai hệ thống nhắc bạn soạn hàng bù.
            </p>
          </div>
        </div>

        {/* Cột Phải (7 Cột): KHUNG ĐIỆN THOẠI DI ĐỘNG (SMARTPHONE MOCKUP) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-[390px] h-[800px] bg-slate-950 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800 relative flex flex-col">
            {/* Dynamic Island / Notch */}
            <div className="w-28 h-5 bg-black rounded-full mx-auto mb-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-slate-800"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900"></div>
            </div>

            {/* Smartphone Inner Screen */}
            <div className="w-full flex-1 bg-slate-50 rounded-[34px] overflow-hidden flex flex-col text-slate-800 shadow-inner">
              {/* App Bar Header */}
              <div className="bg-emerald-600 text-white p-4 pt-3 flex items-center justify-between shadow-sm">
                <div>
                  <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">
                    {mobileTab === 'visit' ? 'Đi Tuyến Bán Hàng' : mobileTab === 'vanStock' ? 'Soạn & Tồn Kho Xe' : 'Lịch Giao Bổ Sung'}
                  </div>
                  <div className="text-sm font-bold truncate max-w-[200px]">
                    {mobileTab === 'visit' ? (selectedOutlet?.name || 'Chọn điểm bán') : 'Sale: Nguyễn Văn Hùng'}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span className="text-[11px] font-bold">Van Xe 01</span>
                </div>
              </div>

              {/* MÀN HÌNH 1: QUY TRÌNH 5 BƯỚC ĐI TUYẾN (VISIT) */}
              {mobileTab === 'visit' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Progress 5 Steps Indicator */}
                  <div className="bg-white px-3 py-2 border-b border-slate-200 flex items-center justify-between text-[10px] font-bold">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <div
                        key={s}
                        onClick={() => s <= (checkInResult ? 5 : 1) && setStep(s)}
                        className={`flex items-center space-x-1 cursor-pointer ${
                          step === s
                            ? 'text-emerald-700 font-extrabold'
                            : step > s
                            ? 'text-slate-700'
                            : 'text-slate-300'
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                            step === s
                              ? 'bg-emerald-600 text-white'
                              : step > s
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {step > s ? '✓' : s}
                        </span>
                        <span className="hidden sm:inline">
                          {s === 1 ? 'Checkin' : s === 2 ? 'Date' : s === 3 ? 'Ảnh' : s === 4 ? 'Đơn' : 'Thu nợ'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* BƯỚC 1: CHECK-IN GPS */}
                    {step === 1 && (
                      <div className="space-y-4 text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                          <MapPin className="w-8 h-8 animate-bounce" />
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Bước 1: Check-in Tọa Độ GPS</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Xác thực bạn đang có mặt tại cửa hàng trong bán kính cho phép (&le; 100m).
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                          <div className="text-slate-500 font-medium">Tiệm tạp hóa:</div>
                          <div className="font-bold text-slate-900">{selectedOutlet?.name}</div>
                          <div className="text-slate-500">{selectedOutlet?.address}</div>
                          <div className="text-[11px] font-mono text-slate-400 flex items-center justify-between">
                            <span>GPS: {selectedOutlet?.latitude}, {selectedOutlet?.longitude}</span>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${selectedOutlet?.latitude},${selectedOutlet?.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline font-bold font-sans flex items-center space-x-0.5"
                            >
                              <span>Chỉ đường GG Map</span>
                            </a>
                          </div>
                        </div>

                        <button
                          onClick={handlePerformCheckIn}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center justify-center space-x-1.5"
                        >
                          <MapPin className="w-4 h-4" />
                          <span>Bấm Check-in GPS Thực Tế</span>
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 2: KIỂM TỒN & DATE QUẦY */}
                    {step === 2 && (
                      <div className="space-y-4 py-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Bước 2: Kiểm Tra Date & Tồn Quầy</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Ghi nhận các gói/hộp cận hạn sử dụng tại tiệm tạp hóa.
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-2">
                          <label className="text-xs font-semibold text-slate-700 block">
                            Ghi chú date bánh kẹo quầy kệ:
                          </label>
                          <textarea
                            rows={3}
                            value={shelfDateNotes}
                            onChange={(e) => setShelfDateNotes(e.target.value)}
                            className="w-full border border-slate-300 rounded-lg p-2 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                            placeholder="VD: Chocopie còn 2 hộp cận date 12/2026..."
                          />
                        </div>

                        <button
                          onClick={() => setStep(3)}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow"
                        >
                          Chụp Ảnh Trưng Bày &rarr;
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 3: CHỤP ẢNH */}
                    {step === 3 && (
                      <div className="space-y-4 py-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Bước 3: Chụp Ảnh Quầy Kệ Trưng Bày</h4>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Hình ảnh đính kèm watermark thời gian & tọa độ GPS thực tế.
                          </p>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black flex items-center justify-center">
                          <img src={displayPhoto} alt="Display" className="w-full h-full object-cover" />
                          <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 rounded-lg text-[10px] text-white font-mono leading-tight">
                            <div>📅 {new Date().toLocaleString('vi-VN')}</div>
                            <div>📍 GPS: {selectedOutlet?.latitude.toFixed(5)}, {selectedOutlet?.longitude.toFixed(5)}</div>
                          </div>
                        </div>

                        <button
                          onClick={() => setStep(4)}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow"
                        >
                          Lên Đơn Đặt Hàng &rarr;
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 4: ĐẶT ĐƠN & GHI CHÚ NỢ HÀNG NẾU THIẾU */}
                    {step === 4 && (
                      <div className="space-y-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Bước 4: Đặt Đơn Bánh Kẹo</h4>
                            <p className="text-[11px] text-slate-500">Bán trực tiếp từ xe hoặc đặt giao sau</p>
                          </div>
                          <button
                            onClick={() => setShowBackorderModal(true)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[10px] rounded-lg border border-amber-300 flex items-center space-x-1"
                            title="Nếu xe bị thiếu hàng, bấm đây để ghi chú giao bổ sung sau"
                          >
                            <Clock className="w-3 h-3 text-amber-700" />
                            <span>+ Ghi Chú Giao Bù</span>
                          </button>
                        </div>

                        {/* Danh sách giỏ hàng */}
                        <div className="space-y-2">
                          {cart.map((item, idx) => (
                            <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 space-y-2 text-xs">
                              <div>
                                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Mặt hàng</label>
                                <select
                                  value={item.productId}
                                  onChange={(e) => {
                                    const updated = [...cart];
                                    updated[idx].productId = e.target.value;
                                    setCart(updated);
                                  }}
                                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white font-bold"
                                >
                                  {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Đơn vị</label>
                                  <select
                                    value={item.uomName}
                                    onChange={(e) => {
                                      const updated = [...cart];
                                      updated[idx].uomName = e.target.value;
                                      setCart(updated);
                                    }}
                                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs bg-white font-semibold"
                                  >
                                    <option value="Thùng">Thùng</option>
                                    <option value="Hộp">Hộp</option>
                                    <option value="Dây">Dây</option>
                                    <option value="Gói">Gói</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="text-[11px] font-semibold text-slate-500 block mb-1">Số lượng</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updated = [...cart];
                                      updated[idx].quantity = parseInt(e.target.value) || 1;
                                      setCart(updated);
                                    }}
                                    className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-bold"
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-tight">
                          🎉 Đạt khuyến mãi: Tặng <strong>1 Dây Snack Oishi Bắp Cay</strong> (Miễn phí 0đ)!
                        </div>

                        <button
                          onClick={handleSubmitOrder}
                          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow transition"
                        >
                          Lưu Đơn & Sinh VietQR &rarr;
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 5: VIETQR */}
                    {step === 5 && vietQr && (
                      <div className="space-y-4 py-2 text-center">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Bước 5: Quét VietQR Thu Tiền</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Chủ tiệm quét mã để thanh toán ngay</p>
                        </div>

                        <div className="p-3 bg-white rounded-2xl border border-slate-200 inline-block shadow-xs">
                          <img src={vietQr.qrImageUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg" />
                          <div className="text-xs font-extrabold text-amber-700 font-mono mt-1">
                            {vietQr.amount.toLocaleString('vi-VN')} đ
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{vietQr.content}</div>
                        </div>

                        <button
                          onClick={handleCompleteCheckOut}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
                        >
                          Hoàn Tất Viếng Thăm & Rời Tiệm
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* MÀN HÌNH 2: SOẠN HÀNG LÊN XE & TỒN KHO XE (VAN STOCK) */}
              {mobileTab === 'vanStock' && (
                <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Tồn Kho Bánh Kẹo Trên Xe</h4>
                      <p className="text-[11px] text-slate-500">Số lượng thực tế chở theo đang có trên xe</p>
                    </div>
                    <button
                      onClick={() => setShowLoadModal(true)}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg shadow-sm flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Soạn Lên Xe</span>
                    </button>
                  </div>

                  {vanStock?.items?.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 space-y-2">
                      <Truck className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="text-xs font-semibold">Xe hiện tại chưa có hàng bánh kẹo nào.</p>
                      <button
                        onClick={() => setShowLoadModal(true)}
                        className="text-xs text-blue-600 font-bold hover:underline"
                      >
                        Bấm vào đây để bốc hàng từ kho lên xe đầu ngày
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {vanStock?.items?.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-xs text-slate-900">{item.productName}</p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.productCode}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                              Đang trên xe
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100 text-[11px]">
                            <div className="bg-slate-50 p-1.5 rounded-lg">
                              <span className="text-slate-400 block text-[9px]">Thùng</span>
                              <strong className="text-amber-700 text-sm">{item.availableCases}</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded-lg">
                              <span className="text-slate-400 block text-[9px]">Hộp/Dây lẻ</span>
                              <strong className="text-slate-800 text-sm">{item.availableBoxes}</strong>
                            </div>
                            <div className="bg-slate-50 p-1.5 rounded-lg">
                              <span className="text-slate-400 block text-[9px]">Tổng lẻ ({item.baseUom})</span>
                              <strong className="text-emerald-700 text-sm">{item.availablePacks}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MÀN HÌNH 3: LỊCH NHẮC NỢ HÀNG / GIAO BỔ SUNG (BACKORDERS) */}
              {mobileTab === 'backorders' && (
                <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Lịch Nhắc Giao Bổ Sung</h4>
                      <p className="text-[11px] text-slate-500">Các tiệm bị thiếu hàng cần giao bù khi về kho</p>
                    </div>
                    <button
                      onClick={() => setShowBackorderModal(true)}
                      className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] rounded-lg shadow-sm flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Ghi Chú Mới</span>
                    </button>
                  </div>

                  {backorders.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                      <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
                      <p className="text-xs font-semibold text-slate-700">Không có tiệm nào nợ hàng giao bù!</p>
                      <p className="text-[11px] text-slate-500">Tất cả khách hàng đã được giao đủ hàng.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {backorders.map((b: any) => (
                        <div key={b.id} className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-bold text-xs text-slate-900">{b.outlet?.name}</p>
                              <p className="text-[10px] text-slate-500">{b.outlet?.address}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                              Hẹn: {b.promisedDate ? new Date(b.promisedDate).toLocaleDateString('vi-VN') : 'Sớm nhất'}
                            </span>
                          </div>

                          <div className="p-2 bg-amber-50/60 rounded-lg text-xs flex items-center justify-between">
                            <div>
                              <span className="text-slate-500">Thiếu: </span>
                              <strong className="text-rose-700">{b.quantity} {b.uomName}</strong>
                              <span className="text-slate-800 font-semibold"> - {b.product?.name}</span>
                            </div>
                          </div>

                          {b.notes && (
                            <p className="text-[11px] text-slate-500 italic">
                              <strong>Lý do:</strong> {b.notes}
                            </p>
                          )}

                          <button
                            onClick={() => handleResolveBackorder(b.id)}
                            className="w-full py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center space-x-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Đã Giao Bù Thành Công</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* BOTTOM NAVIGATION BAR CỦA SMARTPHONE */}
              <div className="bg-white border-t border-slate-200 p-2 flex items-center justify-around text-[10px] font-bold">
                <button
                  onClick={() => setMobileTab('visit')}
                  className={`flex flex-col items-center space-y-0.5 ${
                    mobileTab === 'visit' ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Đi Tuyến</span>
                </button>

                <button
                  onClick={() => setMobileTab('vanStock')}
                  className={`flex flex-col items-center space-y-0.5 ${
                    mobileTab === 'vanStock' ? 'text-blue-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  <span>Tồn Kho Xe</span>
                </button>

                <button
                  onClick={() => setMobileTab('backorders')}
                  className={`flex flex-col items-center space-y-0.5 relative ${
                    mobileTab === 'backorders' ? 'text-amber-700' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                  <span>Giao Bù</span>
                  {backorders.length > 0 && (
                    <span className="absolute -top-1 right-1 w-3.5 h-3.5 bg-rose-600 text-white rounded-full text-[8px] flex items-center justify-center">
                      {backorders.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Bottom Home Indicator */}
              <div className="p-1.5 bg-slate-100 flex justify-center">
                <div className="w-28 h-1 bg-slate-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: SOẠN HÀNG LÊN XE ĐẦU NGÀY */}
      {showLoadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">Soạn Bánh Kẹo Bốc Lên Xe Tải Đầu Ngày</h3>
              </div>
              <button onClick={() => setShowLoadModal(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleLoadVanStock} className="space-y-4">
              <p className="text-xs text-slate-500">
                Hệ thống sẽ tự động xuất các Lô cận date theo chuẩn FEFO từ Kho Tổng chuyển sang Kho Xe Tải Van Sales:
              </p>

              {loadItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs">
                  <div className="col-span-6">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Mặt hàng bánh kẹo</label>
                    <select
                      value={item.productId}
                      onChange={(e) => {
                        const updated = [...loadItems];
                        updated[idx].productId = e.target.value;
                        setLoadItems(updated);
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Đơn vị</label>
                    <select
                      value={item.uomName}
                      onChange={(e) => {
                        const updated = [...loadItems];
                        updated[idx].uomName = e.target.value;
                        setLoadItems(updated);
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                    >
                      <option value="Thùng">Thùng</option>
                      <option value="Hộp">Hộp</option>
                      <option value="Dây">Dây</option>
                    </select>
                  </div>

                  <div className="col-span-3">
                    <label className="text-[10px] font-semibold text-slate-500 block mb-1">Số lượng</label>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => {
                        const updated = [...loadItems];
                        updated[idx].quantity = parseInt(e.target.value) || 1;
                        setLoadItems(updated);
                      }}
                      className="w-full border border-slate-300 rounded-lg p-2 font-bold text-center"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  if (products.length > 0) {
                    setLoadItems([...loadItems, { productId: products[0].id, uomName: 'Thùng', quantity: 5 }]);
                  }
                }}
                className="text-xs text-blue-600 font-bold hover:underline"
              >
                + Thêm mặt hàng khác bốc lên xe
              </button>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowLoadModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                >
                  Xác Nhận Bốc Lên Xe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: GHI CHÚ NỢ HÀNG / GIAO BỔ SUNG CHO KHÁCH */}
      {showBackorderModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Ghi Chú Nợ Hàng / Giao Bổ Sung Cho Khách</h3>
              </div>
              <button onClick={() => setShowBackorderModal(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateBackorder} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Khách hàng / Tiệm tạp hóa bị thiếu</label>
                <select
                  value={backorderForm.outletId}
                  onChange={(e) => setBackorderForm({ ...backorderForm, outletId: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                  required
                >
                  {todayMcp?.routes?.[0]?.outlets?.map((o: any) => (
                    <option key={o.id} value={o.id}>{o.name} ({o.address})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-12 gap-3">
                <div className="col-span-6">
                  <label className="font-semibold text-slate-700 block mb-1">Mặt hàng bị thiếu</label>
                  <select
                    value={backorderForm.productId}
                    onChange={(e) => setBackorderForm({ ...backorderForm, productId: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                    required
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="font-semibold text-slate-700 block mb-1">Đơn vị</label>
                  <select
                    value={backorderForm.uomName}
                    onChange={(e) => setBackorderForm({ ...backorderForm, uomName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-semibold"
                  >
                    <option value="Thùng">Thùng</option>
                    <option value="Hộp">Hộp</option>
                    <option value="Dây">Dây</option>
                    <option value="Gói">Gói</option>
                  </select>
                </div>

                <div className="col-span-3">
                  <label className="font-semibold text-slate-700 block mb-1">SL thiếu</label>
                  <input
                    type="number"
                    min="1"
                    value={backorderForm.quantity}
                    onChange={(e) => setBackorderForm({ ...backorderForm, quantity: parseFloat(e.target.value) || 1 })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-center"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Ngày hẹn giao bổ sung</label>
                  <input
                    type="date"
                    value={backorderForm.promisedDate}
                    onChange={(e) => setBackorderForm({ ...backorderForm, promisedDate: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Lý do thiếu hàng</label>
                  <select
                    value={backorderForm.reason}
                    onChange={(e) => setBackorderForm({ ...backorderForm, reason: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  >
                    <option value="Hết hàng trên xe lúc giao">Hết hàng trên xe lúc giao</option>
                    <option value="Khách đặt thêm ngoài kế hoạch">Khách đặt thêm ngoài kế hoạch</option>
                    <option value="Hàng cận date nên đổi lô mới">Hàng cận date nên đổi lô mới</option>
                    <option value="Khách yêu cầu giao lại giờ khác">Khách yêu cầu giao lại giờ khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Ghi chú chi tiết</label>
                <input
                  type="text"
                  placeholder="VD: Khách dặn giao bù trước 10h sáng mai..."
                  value={backorderForm.notes}
                  onChange={(e) => setBackorderForm({ ...backorderForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBackorderModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md"
                >
                  Lưu Ghi Nhớ Giao Bù
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
