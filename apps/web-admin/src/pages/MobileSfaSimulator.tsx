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
} from 'lucide-react';
import { getTodayMcp, checkInStore, checkOutStore, createOrder, generateVietQr, getProducts } from '../api';

export const MobileSfaSimulator: React.FC = () => {
  const [todayMcp, setTodayMcp] = useState<any>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [step, setStep] = useState<number>(1); // 1 to 5 steps
  const [loading, setLoading] = useState(true);

  // Bước 1: Check-in
  const [checkInResult, setCheckInResult] = useState<any>(null);
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);

  // Bước 2: Kiểm tồn & Date tại quầy
  const [shelfDateNotes, setShelfDateNotes] = useState('Chocopie tồn 2 hộp date 12/2026; AFC còn 5 gói.');

  // Bước 3: Chụp ảnh quầy kệ
  const [displayPhoto, setDisplayPhoto] = useState(
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=500',
  );

  // Bước 4: Đặt đơn
  const [cart, setCart] = useState<any[]>([
    { productId: '', uomName: 'Thùng', quantity: 5 },
  ]);
  const [orderCreated, setOrderCreated] = useState<any>(null);

  // Bước 5: Check-out & VietQR
  const [vietQr, setVietQr] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mcpData, productsData] = await Promise.all([
        getTodayMcp(),
        getProducts(),
      ]);
      setTodayMcp(mcpData);
      setProducts(productsData);

      const firstOutlet = mcpData?.routes?.[0]?.outlets?.[0];
      if (firstOutlet) {
        setSelectedOutlet(firstOutlet);
      }
      if (productsData.length > 0) {
        setCart([{ productId: productsData[0].id, uomName: 'Thùng', quantity: 5 }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Bước 1: Thực hiện GPS Check-in
  const handlePerformCheckIn = async () => {
    if (!selectedOutlet) return;
    try {
      // Giả lập tọa độ Sale đứng cách tiệm 8 mét (Hợp lệ < 100m)
      const lat = selectedOutlet.latitude + 0.00005;
      const lng = selectedOutlet.longitude + 0.00005;

      const res = await checkInStore({
        outletId: selectedOutlet.id,
        salesRepName: 'Nguyễn Văn Hùng (Sale Q1)',
        latitude: lat,
        longitude: lng,
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

  // Bước 4: Gửi đơn hàng
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

      // Sinh mã VietQR cho đơn mới hoặc tiền nợ cũ
      const qr = await generateVietQr({
        outletId: selectedOutlet.id,
        orderId: res.order.id,
        amount: res.order.totalAmount,
      });
      setVietQr(qr);
      setStep(5);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message);
    }
  };

  // Bước 5: Hoàn tất Check-out
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
    setVietQr(null);
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">
              Giả Lập Ứng Dụng Di Động SFA / DMS (Màn Hình Sale Thị Trường)
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Quy trình chuẩn hóa 5 bước viếng thăm tiệm tạp hóa: Check-in GPS &rarr; Kiểm date & tồn quầy &rarr; Chụp ảnh trưng bày &rarr; Lên đơn nhanh &rarr; Check-out VietQR.
          </p>
        </div>

        <button
          onClick={loadData}
          className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          <span>Làm mới lộ trình</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột Trái (4 Cột): Thông tin Lộ trình & Chọn Điểm Bán */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">Danh Sách Tuyến Hôm Nay</h4>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Thứ {todayMcp?.dayOfWeek === 'MONDAY' ? '2' : '3'}
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Chọn tiệm tạp hóa bạn muốn ghé thăm trong ngày để thực hiện quy trình 5 bước trên màn hình điện thoại:
            </p>

            <div className="space-y-2">
              {(todayMcp?.routes?.[0]?.outlets || []).map((o: any, idx: number) => {
                const isSelected = selectedOutlet?.id === o.id;
                return (
                  <div
                    key={o.id}
                    onClick={() => {
                      setSelectedOutlet(o);
                      setStep(1);
                      setCheckInResult(null);
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
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

          <div className="p-4 rounded-xl bg-slate-900 text-slate-300 text-xs space-y-2 leading-relaxed">
            <div className="flex items-center space-x-1.5 text-amber-400 font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Chế độ Hoạt Động Ngoại Tuyến (Offline-First):</span>
            </div>
            <p>
              Khi nhân viên Sale vào chợ truyền thống hoặc vùng sóng 4G chập chờn, ứng dụng lưu tạm đơn hàng và ảnh check-in vào cơ sở dữ liệu nội bộ SQLite và tự động đồng bộ ngầm khi có mạng trở lại.
            </p>
          </div>
        </div>

        {/* Cột Phải (7 Cột): KHUNG ĐIỆN THOẠI DI ĐỘNG (SMARTPHONE MOCKUP) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-[390px] h-[780px] bg-slate-950 rounded-[44px] p-3 shadow-2xl ring-1 ring-slate-800 relative flex flex-col">
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
                  <div className="text-[10px] font-semibold text-emerald-200 uppercase tracking-wider">Sale DMS • Đi Tuyến</div>
                  <div className="text-sm font-bold truncate max-w-[200px]">{selectedOutlet?.name || 'Chọn điểm bán'}</div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span className="text-[11px] font-bold">GPS Bật</span>
                </div>
              </div>

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

              {/* Step Content Container */}
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
                      <div className="text-[11px] font-mono text-slate-400">
                        GPS Chuẩn: {selectedOutlet?.latitude}, {selectedOutlet?.longitude}
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

                {/* BƯỚC 2: KIỂM TỒN & KIỂM DATE TẠI QUẦY */}
                {step === 2 && (
                  <div className="space-y-4 py-2">
                    <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>{checkInResult?.message || 'Đã Check-in GPS thành công!'}</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Bước 2: Kiểm Date & Tồn Quầy Bánh Kẹo</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Kiểm tra hạn sử dụng các hộp bánh kẹo trên kệ để đề xuất đổi trả hoặc nhập bù.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-700 block">
                        Ghi nhận tình trạng Date & Tồn quầy:
                      </label>
                      <textarea
                        rows={4}
                        value={shelfDateNotes}
                        onChange={(e) => setShelfDateNotes(e.target.value)}
                        className="w-full border border-slate-300 rounded-xl p-3 text-xs focus:ring-2 focus:ring-emerald-500"
                        placeholder="Nhập số lượng còn trên quầy và các hộp cận date..."
                      />
                    </div>

                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                      <div className="font-bold">Gợi ý thị trường:</div>
                      <p className="text-[11px] leading-relaxed">
                        Chủ tiệm phản hồi Chocopie bán rất chạy nhưng AFC còn tồn 5 gói. Nên tư vấn mua thêm 5 thùng Chocopie để nhận khuyến mãi Oishi!
                      </p>
                    </div>

                    <button
                      onClick={() => setStep(3)}
                      className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow transition"
                    >
                      Tiếp Tục: Chụp Ảnh Trưng Bày &rarr;
                    </button>
                  </div>
                )}

                {/* BƯỚC 3: CHỤP ẢNH TRƯNG BÀY (MERCHANDISING) */}
                {step === 3 && (
                  <div className="space-y-4 py-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Bước 3: Chụp Ảnh Quầy Kệ Trưng Bày</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Hình ảnh đính kèm watermark thời gian & tọa độ GPS thực tế.
                      </p>
                    </div>

                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm aspect-video bg-black flex items-center justify-center">
                      <img
                        src={displayPhoto}
                        alt="Store Display"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/60 backdrop-blur-xs rounded-lg text-[10px] text-white font-mono leading-tight">
                        <div>📅 {new Date().toLocaleString('vi-VN')}</div>
                        <div>📍 GPS: {selectedOutlet?.latitude.toFixed(5)}, {selectedOutlet?.longitude.toFixed(5)}</div>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => alert('Đã chụp ảnh mới từ Camera điện thoại!')}
                        className="flex-1 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 flex items-center justify-center space-x-1.5"
                      >
                        <Camera className="w-4 h-4 text-slate-500" />
                        <span>Chụp Lại</span>
                      </button>

                      <button
                        onClick={() => setStep(4)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow"
                      >
                        Lên Đơn Hàng &rarr;
                      </button>
                    </div>
                  </div>
                )}

                {/* BƯỚC 4: LÊN ĐƠN HÀNG NHANH */}
                {step === 4 && (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Bước 4: Đặt Đơn Bánh Kẹo</h4>
                        <p className="text-[11px] text-slate-500">Tự động tính khuyến mãi Mua X tặng Y</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Pre-sales
                      </span>
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

                    {/* Khuyến mãi được kích hoạt */}
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-1">
                      <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                        <Gift className="w-4 h-4 text-amber-600" />
                        <span>Khuyến mãi kích hoạt:</span>
                      </div>
                      <p className="text-[11px] text-amber-800 leading-tight">
                        🎉 Đạt điều kiện: Tặng kèm <strong>1 Dây Snack Oishi Bắp Cay</strong> (Trị giá 44.000đ - Miễn phí)!
                      </p>
                    </div>

                    <button
                      onClick={handleSubmitOrder}
                      className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow transition"
                    >
                      Xác Nhận Đơn Hàng & Sinh VietQR &rarr;
                    </button>
                  </div>
                )}

                {/* BƯỚC 5: THU NỢ VIETQR & CHECK-OUT */}
                {step === 5 && vietQr && (
                  <div className="space-y-4 py-2 text-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Bước 5: Thu Tiền VietQR & Check-out</h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Chủ tiệm quét mã VietQR để thanh toán trực tiếp vào tài khoản NPP.
                      </p>
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

              {/* Bottom Home Indicator */}
              <div className="p-2 bg-slate-100 flex justify-center">
                <div className="w-32 h-1 bg-slate-400 rounded-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

