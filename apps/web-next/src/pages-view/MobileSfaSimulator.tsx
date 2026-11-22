'use client';
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
  Minus,
  Check,
  AlertCircle,
  FileText,
  Layers,
  Store,
  ChevronRight,
  FastForward,
  Banknote,
  CreditCard,
  Zap,
  Phone,
  Navigation,
  XCircle,
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
  createOutlet,
} from '../api';

export const MobileSfaSimulator: React.FC = () => {
  const [todayMcp, setTodayMcp] = useState<any>(null);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Bộ chọn tuyến MCP
  const [selectedRouteCode, setSelectedRouteCode] = useState<string>('ALL');

  // Tìm kiếm và Lọc trạng thái điểm bán
  const [outletSearch, setOutletSearch] = useState('');
  const [outletStatusFilter, setOutletStatusFilter] = useState<'ALL' | 'UNVISITED' | 'ORDERED' | 'NO_SALE'>('ALL');
  const [outletStatuses, setOutletStatuses] = useState<Record<string, string>>({});

  // Modal Báo Không Mua / Đóng Cửa
  const [showNoSaleModal, setShowNoSaleModal] = useState(false);
  const [targetOutletForNoSale, setTargetOutletForNoSale] = useState<any>(null);
  const [noSaleReason, setNoSaleReason] = useState('Còn nhiều hàng tồn kho bánh kẹo');

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

  // GIỎ HÀNG ĐA SẢN PHẨM (MULTI-ITEM CART)
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [cartUoms, setCartUoms] = useState<Record<string, string>>({});

  const [orderCreated, setOrderCreated] = useState<any>(null);
  const [vietQr, setVietQr] = useState<any>(null);

  // Phương thức thanh toán (Mặc định là TIỀN MẶT - Phổ biến nhất)
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER' | 'DEBT'>('CASH');
  const [cashGiven, setCashGiven] = useState<number>(0);

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

  // Modal Mở Điểm Bán Mới Trên Tuyến (Thêm Tiệm Mới)
  const [showCreateOutletModal, setShowCreateOutletModal] = useState(false);
  const [isSubmittingOutlet, setIsSubmittingOutlet] = useState(false);
  const [newOutletForm, setNewOutletForm] = useState({
    name: '',
    ownerName: '',
    phone: '',
    address: '',
    routeCode: 'TUYEN-Q1-T2',
    creditLimit: 10000000,
    latitude: 10.7769,
    longitude: 106.7009,
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

      // Khởi tạo giỏ hàng ban đầu
      if (productsData.length > 0) {
        const initialUoms: Record<string, string> = {};
        const initialQtys: Record<string, number> = {};

        productsData.forEach((p: any, idx: number) => {
          initialUoms[p.id] = p.uoms?.[p.uoms?.length - 1]?.uomName || 'Thùng';
          // Mẫu: Chọn 2 thùng sp đầu, 1 thùng sp thứ 2
          initialQtys[p.id] = idx === 0 ? 2 : idx === 1 ? 1 : 0;
        });

        setCartUoms(initialUoms);
        setCartQuantities(initialQtys);

        setLoadItems([{ productId: productsData[0].id, uomName: 'Thùng', quantity: 10 }]);
        setBackorderForm((prev) => ({ ...prev, productId: productsData[0].id }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Lấy đơn giá của một sản phẩm theo ĐVT đã chọn
  const getProductUomPrice = (productId: string, uomName: string): number => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || !prod.uoms || prod.uoms.length === 0) return 480000;
    const uom = prod.uoms.find((u: any) => u.uomName === uomName);
    return uom ? uom.price : prod.uoms[0].price;
  };

  // Tính tổng tiền giỏ hàng hiện tại
  const calculatedCartTotal = Object.entries(cartQuantities).reduce((sum, [pId, qty]) => {
    if (qty <= 0) return sum;
    const uomName = cartUoms[pId] || 'Thùng';
    return sum + qty * getProductUomPrice(pId, uomName);
  }, 0);

  const totalCartUnits = Object.values(cartQuantities).reduce((sum, q) => sum + (q > 0 ? q : 0), 0);
  const totalCartItemsCount = Object.values(cartQuantities).filter((q) => q > 0).length;

  // Lấy danh sách sản phẩm thực sự có trong giỏ hàng
  const activeCartItems = products
    .filter((p) => (cartQuantities[p.id] || 0) > 0)
    .map((p) => {
      const uomName = cartUoms[p.id] || 'Thùng';
      const qty = cartQuantities[p.id];
      const unitPrice = getProductUomPrice(p.id, uomName);
      return {
        productId: p.id,
        productCode: p.code,
        name: p.name,
        uomName,
        quantity: qty,
        unitPrice,
        total: qty * unitPrice,
      };
    });

  // Tồn kho xe của từng sản phẩm
  const getVanStockForProduct = (productCode: string): number => {
    const vanItem = vanStock?.items?.find((i: any) => i.productCode === productCode);
    return vanItem ? vanItem.availableCases : 25;
  };

  // Lấy toàn bộ danh sách điểm bán theo bộ lọc tuyến và trạng thái
  const allOutletsRaw = todayMcp?.routes?.flatMap((r: any) => r.outlets || []) || todayMcp?.routes?.[0]?.outlets || [];

  const filteredOutlets = allOutletsRaw.filter((o: any) => {
    // 1. Lọc theo tuyến
    if (selectedRouteCode !== 'ALL' && o.routeCode && o.routeCode !== selectedRouteCode) {
      return false;
    }

    const status = outletStatuses[o.id] || o.status || 'Chưa ghé thăm';

    // 2. Lọc theo trạng thái
    if (outletStatusFilter === 'UNVISITED' && status !== 'Chưa ghé thăm') {
      return false;
    }
    if (outletStatusFilter === 'ORDERED' && status !== 'Đã lên đơn') {
      return false;
    }
    if (outletStatusFilter === 'NO_SALE' && !status.startsWith('Không mua') && !status.startsWith('Đóng cửa')) {
      return false;
    }

    // 3. Tìm kiếm từ khóa
    if (outletSearch.trim()) {
      const q = outletSearch.trim().toLowerCase();
      const match =
        o.name?.toLowerCase().includes(q) ||
        o.code?.toLowerCase().includes(q) ||
        o.ownerName?.toLowerCase().includes(q) ||
        o.phone?.toLowerCase().includes(q) ||
        o.address?.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Đếm tiến độ viếng thăm
  const totalScopeOutlets = allOutletsRaw.filter((o: any) => selectedRouteCode === 'ALL' || o.routeCode === selectedRouteCode).length;
  const doneScopeOutlets = allOutletsRaw.filter((o: any) => {
    if (selectedRouteCode !== 'ALL' && o.routeCode !== selectedRouteCode) return false;
    const st = outletStatuses[o.id] || o.status;
    return st === 'Đã lên đơn' || st?.startsWith('Không mua') || st?.startsWith('Đóng cửa');
  }).length;

  // Xử lý chụp ảnh thực tế từ điện thoại / máy tính
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setDisplayPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Bước 1: Check-in GPS Thực Tế (HTML5 Geolocation)
  const handlePerformCheckIn = async () => {
    if (!selectedOutlet) return;

    let currentRepName = 'Sale Thị Trường';
    try {
      const savedUser = localStorage.getItem('fmcg_current_user');
      if (savedUser) currentRepName = JSON.parse(savedUser).fullName || currentRepName;
    } catch {}

    const doCheckIn = async (lat: number, lng: number) => {
      try {
        const res = await checkInStore({
          outletId: selectedOutlet.id,
          salesRepName: currentRepName,
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

    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          doCheckIn(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          // Fallback nếu người dùng chưa cấp quyền GPS
          doCheckIn(selectedOutlet.latitude, selectedOutlet.longitude);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      doCheckIn(selectedOutlet.latitude, selectedOutlet.longitude);
    }
  };

  // Bước 4: Đặt đơn
  const handleSubmitOrder = async () => {
    if (!selectedOutlet) return;
    if (activeCartItems.length === 0) {
      alert('Vui lòng chọn ít nhất 1 sản phẩm vào giỏ hàng!');
      return;
    }

    try {
      const itemsPayload = activeCartItems.map((item) => ({
        productId: item.productId,
        uomName: item.uomName,
        quantity: item.quantity,
      }));

      const res = await createOrder({
        outletId: selectedOutlet.id,
        salesRepName: 'Nguyễn Văn Hùng (Sale Q1)',
        orderType: 'PRE_SALES',
        items: itemsPayload,
        notes: 'Đơn đặt từ Mobile App SFA thị trường',
      });
      setOrderCreated(res.order);

      const amountToPay = res.order?.totalAmount || calculatedCartTotal;
      setCashGiven(amountToPay);

      const qr = await generateVietQr({
        outletId: selectedOutlet.id,
        orderId: res.order.id,
        amount: amountToPay,
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
    const finalAmount = orderCreated?.totalAmount || calculatedCartTotal;

    // Cập nhật trạng thái điểm bán
    setOutletStatuses((prev) => ({
      ...prev,
      [selectedOutlet.id]: 'Đã lên đơn',
    }));

    if (currentVisitId) {
      await checkOutStore({
        visitId: currentVisitId,
        hasOrder: true,
        notes: `Đã hoàn tất đơn hàng ${finalAmount.toLocaleString('vi-VN')}đ, hình thức: ${paymentMethod}`,
      });
    }

    let msg = `🎉 Hoàn tất đơn hàng cho tiệm ${selectedOutlet.name}!\n`;
    if (paymentMethod === 'CASH') {
      if (cashGiven >= finalAmount) {
        msg += `Đã thu ${finalAmount.toLocaleString('vi-VN')} đ Tiền Mặt (Đủ 100%).`;
      } else {
        msg += `Thu trước ${cashGiven.toLocaleString('vi-VN')} đ • Gối nợ ${(finalAmount - cashGiven).toLocaleString('vi-VN')} đ.`;
      }
    } else if (paymentMethod === 'TRANSFER') {
      msg += `Đã nhận chuyển khoản VietQR ${finalAmount.toLocaleString('vi-VN')} đ.`;
    } else {
      msg += `Đã ghi nhận Nợ Gối Đầu 100% (${finalAmount.toLocaleString('vi-VN')} đ).`;
    }

    alert(msg);
    setStep(1);
    setCheckInResult(null);
    setOrderCreated(null);
  };

  // Xử lý Báo Không Mua / Đóng Cửa
  const handleConfirmNoSale = async () => {
    if (!targetOutletForNoSale) return;
    const newStatus = `Không mua (${noSaleReason})`;
    setOutletStatuses((prev) => ({
      ...prev,
      [targetOutletForNoSale.id]: newStatus,
    }));

    try {
      await checkOutStore({
        visitId: targetOutletForNoSale.id,
        hasOrder: false,
        noOrderReason: noSaleReason,
        notes: 'Sales ghi nhận không mua trực tiếp trên app SFA',
      });
    } catch (_) {}

    setShowNoSaleModal(false);
    alert(`Đã ghi nhận kết quả: ${targetOutletForNoSale.name} - ${newStatus}`);
    if (step > 1) {
      setStep(1);
      setCheckInResult(null);
    }
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

  // Xử lý Mở Điểm Bán Mới Trên Tuyến (Ghé tiệm phát sinh)
  const handleCreateNewOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutletForm.name.trim() || !newOutletForm.ownerName.trim() || !newOutletForm.phone.trim() || !newOutletForm.address.trim()) {
      alert('Vui lòng điền đầy đủ Tên tiệm, Chủ tiệm, SĐT và Địa chỉ!');
      return;
    }

    try {
      setIsSubmittingOutlet(true);
      const created = await createOutlet({
        ...newOutletForm,
        creditLimit: Number(newOutletForm.creditLimit) || 10000000,
      });

      alert(`Đã thêm thành công điểm bán mới: ${created.name} (${created.code})!\nHệ thống đã tự động gán vào tuyến bán hàng.`);
      setShowCreateOutletModal(false);

      // Tải lại MCP hôm nay và tự động chọn tiệm mới để sale có thể lên đơn ngay
      const updatedMcp = await getTodayMcp();
      setTodayMcp(updatedMcp);
      setSelectedOutlet(created);
      setStep(4); // Tự động chuyển đến bước Lên đơn cho tiệm mới

      // Reset form về mặc định
      setNewOutletForm({
        name: '',
        ownerName: '',
        phone: '',
        address: '',
        routeCode: 'TUYEN-Q1-T2',
        creditLimit: 10000000,
        latitude: 10.7769,
        longitude: 106.7009,
      });
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Lỗi khi tạo tiệm mới');
    } finally {
      setIsSubmittingOutlet(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cột Trái (5 Cột): Bảng Điều Khiển Tác Nghiệp SFA & Thông Tin Tuyến */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center space-x-2 text-slate-900 border-b border-slate-100 pb-3">
              <Smartphone className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-sm uppercase tracking-wide">Cổng Bán Hàng & Đi Tuyến SFA Thị Trường</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Giao diện tác nghiệp thực tế của Nhân viên Kinh Doanh (Sales Rep) khi đi thị trường: Đi tuyến bán hàng (MCP), kiểm tra tồn xe bán hàng (Van Sales), và ghi nhận đơn hàng / nợ giao bổ sung.
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
              <span className="text-xs font-bold text-slate-900 uppercase">Tuyến Thị Trường (MCP)</span>
              <button
                onClick={() => setShowCreateOutletModal(true)}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center space-x-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Mở Điểm Bán Mới</span>
              </button>
            </div>

            {/* Dropdown chọn tuyến & tiến độ */}
            <div className="flex items-center space-x-2">
              <select
                value={selectedRouteCode}
                onChange={(e) => setSelectedRouteCode(e.target.value)}
                className="flex-1 text-xs font-bold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">🌟 Tất Cả Các Tuyến Bán Hàng</option>
                <option value="TUYEN-Q1-T2">📍 Thứ Hai - Tuyến Quận 1 (Bến Nghé - Nguyễn Huệ)</option>
                <option value="TUYEN-BT-T3">📍 Thứ Ba - Tuyến Bình Thạnh (Thị Nghè - Bạch Đằng)</option>
                <option value="TUYEN-Q5-T4">📍 Thứ Tư - Tuyến Quận 5 (Chợ Lớn - An Đông)</option>
                <option value="TUYEN-Q10-T5">📍 Thứ Năm - Tuyến Quận 10 (Sư Vạn Hạnh - Tô Hiến Thành)</option>
                <option value="TUYEN-TB-T6">📍 Thứ Sáu - Tuyến Tân Bình (Cộng Hòa - Hoàng Hoa Thám)</option>
                <option value="TUYEN-GV-T7">📍 Thứ Bảy - Tuyến Gò Vấp (Quang Trung - Lê Đức Thọ)</option>
              </select>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50 px-2 py-2 rounded-xl whitespace-nowrap">
                {doneScopeOutlets}/{totalScopeOutlets} tiệm
              </span>
            </div>

            {/* Ô tìm kiếm điểm bán */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Tìm tên tiệm, chủ tiệm, SĐT, địa chỉ..."
                value={outletSearch}
                onChange={(e) => setOutletSearch(e.target.value)}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
              {outletSearch && (
                <button
                  onClick={() => setOutletSearch('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  &times;
                </button>
              )}
            </div>

            {/* BỘ LỌC TRẠNG THÁI */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setOutletStatusFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  outletStatusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Tất Cả ({totalScopeOutlets})
              </button>
              <button
                onClick={() => setOutletStatusFilter('UNVISITED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  outletStatusFilter === 'UNVISITED'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                Chưa Ghé
              </button>
              <button
                onClick={() => setOutletStatusFilter('ORDERED')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  outletStatusFilter === 'ORDERED'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Đã Lên Đơn
              </button>
              <button
                onClick={() => setOutletStatusFilter('NO_SALE')}
                className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                  outletStatusFilter === 'NO_SALE'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Không Mua
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {filteredOutlets.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  Không tìm thấy điểm bán nào khớp với bộ lọc!
                </div>
              ) : (
                filteredOutlets.map((o: any, idx: number) => {
                  const isSelected = selectedOutlet?.id === o.id;
                  const currentStatus = outletStatuses[o.id] || o.status || 'Chưa ghé thăm';
                  const isDone = currentStatus === 'Đã lên đơn';
                  const isNoSale = currentStatus.startsWith('Không mua') || currentStatus.startsWith('Đóng cửa');

                  return (
                    <div
                      key={o.id}
                      className={`p-3 rounded-xl border transition text-xs space-y-2 ${
                        isSelected
                          ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        onClick={() => {
                          setSelectedOutlet(o);
                          setBackorderForm((prev) => ({ ...prev, outletId: o.id }));
                          setStep(1);
                          setCheckInResult(null);
                        }}
                        className="cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-3">
                          <span
                            className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center ${
                              isSelected ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {idx + 1}
                          </span>
                          <div>
                            <div className="text-sm font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{o.name}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : isNoSale
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {currentStatus}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {o.ownerName} • ĐT: {o.phone || '0903112233'}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate max-w-[220px]">{o.address}</div>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[11px] font-mono font-bold text-rose-600 block">
                            Nợ: {o.currentDebt.toLocaleString('vi-VN')}đ
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Hạn mức: {o.creditLimit.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>

                      {/* HÀNG TIỆN ÍCH NHANH: GỌI ĐIỆN & CHỈ ĐƯỜNG */}
                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`📞 Đang quay số gọi cho chủ tiệm ${o.ownerName} (${o.phone || '0903112233'})...`);
                            }}
                            className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center space-x-1"
                          >
                            <Phone className="w-3 h-3 text-blue-600" />
                            <span>Gọi ĐT</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              alert(`🗺️ Đã định vị điểm bán ${o.name} trên Google Maps (Tọa độ: ${o.latitude}, ${o.longitude})!`);
                            }}
                            className="px-2 py-0.5 rounded bg-teal-50 text-teal-700 hover:bg-teal-100 flex items-center space-x-1"
                          >
                            <Navigation className="w-3 h-3 text-teal-600" />
                            <span>Chỉ đường</span>
                          </button>
                        </div>

                        {!isDone && !isNoSale && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTargetOutletForNoSale(o);
                              setShowNoSaleModal(true);
                            }}
                            className="text-slate-500 hover:text-slate-800 underline text-[10px]"
                          >
                            Báo không mua
                          </button>
                        )}
                      </div>

                      {/* NÚT THAO TÁC NHANH: LÊN ĐƠN NGAY HOẶC 5 BƯỚC */}
                      <div className="flex items-center space-x-2 pt-1 border-t border-slate-200/60">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOutlet(o);
                            setStep(4); // BỎ QUA CÁC BƯỚC ĐẦU ➔ VÀO THẲNG BƯỚC 4
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] flex items-center justify-center space-x-1 shadow-xs transition"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Lên Đơn Nhanh</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOutlet(o);
                            setStep(1); // QUY TRÌNH 5 BƯỚC
                          }}
                          className="flex-1 py-1 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center space-x-1 shadow-xs transition"
                        >
                          <Store className="w-3 h-3" />
                          <span>5 Bước Chuẩn</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
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
                    {mobileTab === 'visit' ? selectedOutlet?.name || 'Chọn điểm bán' : 'Sale: Nguyễn Văn Hùng'}
                  </div>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShowCreateOutletModal(true)}
                    title="Mở thêm tiệm tạp hóa mới trên tuyến"
                    className="px-2 py-1 rounded bg-emerald-700 hover:bg-emerald-800 text-[10px] font-bold text-emerald-100 flex items-center space-x-0.5 border border-emerald-500/50 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Mở Tiệm</span>
                  </button>
                  {mobileTab === 'visit' && selectedOutlet && (
                    <button
                      onClick={() => {
                        setTargetOutletForNoSale(selectedOutlet);
                        setShowNoSaleModal(true);
                      }}
                      className="px-2 py-0.5 rounded bg-emerald-700 hover:bg-emerald-800 text-[10px] font-bold text-emerald-100 flex items-center space-x-1"
                    >
                      <XCircle className="w-3 h-3" />
                      <span>Không mua</span>
                    </button>
                  )}
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
                        onClick={() => setStep(s)}
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
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {s}
                        </span>
                        <span className="hidden sm:inline">
                          {s === 1 ? 'GPS' : s === 2 ? 'Date' : s === 3 ? 'Ảnh' : s === 4 ? 'Đơn' : 'Thu tiền'}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Step Content */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* NÚT MỞ TIỆM MỚI NHANH */}
                    <div className="pb-0.5">
                      <button
                        onClick={() => setShowCreateOutletModal(true)}
                        className="w-full py-2 px-3 rounded-xl border border-dashed border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center space-x-1.5 transition"
                      >
                        <Plus className="w-3.5 h-3.5 text-emerald-600" />
                        <span>+ Mở Điểm Bán Mới Trên Tuyến (Ghé Tiệm Mới)</span>
                      </button>
                    </div>

                    {/* NÚT BỎ QUA CÁC BƯỚC ĐẦU (HIỆN Ở BƯỚC 1, 2, 3 ĐỂ NHẢY THẲNG LÊN ĐƠN) */}
                    {step < 4 && (
                      <div className="pb-1">
                        <button
                          onClick={() => setStep(4)}
                          className="w-full py-2.5 px-3 rounded-xl border border-amber-400 bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center space-x-1.5 shadow-xs transition"
                        >
                          <FastForward className="w-3.5 h-3.5 text-amber-700" />
                          <span>Bỏ qua các bước đầu ➔ Lên Đơn Ngay (Bước 4)</span>
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 1: CHECK-IN GPS */}
                    {step === 1 && (
                      <div className="space-y-4 text-center py-2">
                        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center">
                          <MapPin className="w-8 h-8" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Bước 1: Check-in GPS Tạp Hóa</h4>
                          <p className="text-xs text-slate-500 mt-1">
                            Xác thực vị trí viếng thăm trong bán kính &lt; 100m
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200 text-left text-xs space-y-1.5">
                          <div className="text-slate-500 font-medium">Tọa độ GPS điểm bán:</div>
                          <div className="font-mono font-bold text-slate-800">
                            {selectedOutlet?.latitude || '10.7769'}, {selectedOutlet?.longitude || '106.7009'}
                          </div>
                          <div className="text-[11px] text-emerald-600 font-semibold flex items-center space-x-1 pt-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Đã bắt được tín hiệu vệ tinh GPS độ chính xác cao</span>
                          </div>
                        </div>

                        <button
                          onClick={handlePerformCheckIn}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow"
                        >
                          Xác Nhận Check-in GPS (&lt;100m)
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 2: KIỂM TỒN & DATE QUẦY */}
                    {step === 2 && (
                      <div className="space-y-4 py-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Bước 2: Kiểm Date & Tồn Quầy Bánh</h4>
                          <p className="text-xs text-slate-500">Ghi chú số lượng tồn thực tế và date cận</p>
                        </div>

                        <textarea
                          rows={4}
                          value={shelfDateNotes}
                          onChange={(e) => setShelfDateNotes(e.target.value)}
                          placeholder="Nhập ghi chú tồn quầy bánh kẹo..."
                          className="w-full border border-slate-300 rounded-xl p-3 text-xs bg-white focus:ring-2 focus:ring-emerald-500"
                        />

                        <button
                          onClick={() => setStep(3)}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow"
                        >
                          Tiếp Tục: Chụp Ảnh Quầy Kệ &rarr;
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 3: CHỤP ẢNH */}
                    {step === 3 && (
                      <div className="space-y-4 py-2">
                        <div>
                          <h4 className="text-sm font-bold text-slate-900">Bước 3: Chụp Ảnh Trưng Bày Bánh Kẹo</h4>
                          <p className="text-xs text-slate-500">Ảnh được gắn Watermark GPS & Thời gian thực tế</p>
                        </div>

                        <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner group">
                          <img src={displayPhoto} alt="Display Shelf" className="w-full h-44 object-cover" />
                          <div className="absolute bottom-2 left-2 right-2 bg-black/75 backdrop-blur-xs text-[10px] text-white p-2 rounded-lg flex items-center justify-between">
                            <span className="font-mono">
                              GPS: {selectedOutlet?.latitude || '10.7769'}, {selectedOutlet?.longitude || '106.7009'}
                            </span>
                            <span className="text-emerald-400 font-semibold">{new Date().toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            id="shelf-photo-input"
                            className="hidden"
                            onChange={handlePhotoUpload}
                          />
                          <label
                            htmlFor="shelf-photo-input"
                            className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-500 bg-emerald-50 text-emerald-800 text-xs font-bold flex items-center justify-center space-x-1.5 cursor-pointer hover:bg-emerald-100 transition"
                          >
                            <Camera className="w-4 h-4 text-emerald-600" />
                            <span>Mở Camera Chụp Hoặc Tải Ảnh Quầy</span>
                          </label>
                        </div>

                        <button
                          onClick={() => setStep(4)}
                          className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs uppercase tracking-wider shadow hover:bg-emerald-700 transition"
                        >
                          Tiếp Tục: Lên Đơn Đặt Hàng &rarr;
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 4: GIỎ HÀNG ĐA SẢN PHẨM (MULTI-ITEM CART BÁNH KẸO FMCG) */}
                    {step === 4 && (
                      <div className="space-y-4 py-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">Bước 4: Lên Đơn Bánh Kẹo</h4>
                            <p className="text-[11px] text-slate-500">Chọn nhiều mặt hàng & số lượng vào giỏ</p>
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

                        {/* Danh mục sản phẩm bánh kẹo */}
                        <div className="space-y-2.5">
                          {products.map((p) => {
                            const uomName = cartUoms[p.id] || (p.uoms?.[p.uoms?.length - 1]?.uomName || 'Thùng');
                            const qty = cartQuantities[p.id] || 0;
                            const price = getProductUomPrice(p.id, uomName);
                            const vanCases = getVanStockForProduct(p.code);

                            return (
                              <div
                                key={p.id}
                                className={`p-2.5 rounded-xl border transition text-xs space-y-2 ${
                                  qty > 0
                                    ? 'bg-emerald-50/50 border-emerald-300 shadow-xs'
                                    : 'bg-white border-slate-200'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                                    <div className="flex items-center space-x-2 pt-0.5">
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                        {p.brand || 'Orion'}
                                      </span>
                                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded">
                                        Tồn xe: {vanCases} Thùng
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-1">
                                  {/* Bộ chọn ĐVT */}
                                  <div className="flex items-center space-x-1">
                                    {(p.uoms || [{ uomName: 'Thùng', price: 470000 }, { uomName: 'Hộp', price: 62000 }]).map((u: any) => {
                                      const isSelected = uomName === u.uomName;
                                      return (
                                        <button
                                          key={u.uomName}
                                          type="button"
                                          onClick={() => {
                                            setCartUoms((prev) => ({ ...prev, [p.id]: u.uomName }));
                                          }}
                                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition ${
                                            isSelected
                                              ? 'bg-emerald-600 text-white'
                                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                          }`}
                                        >
                                          {u.uomName} ({(u.price / 1000).toLocaleString('vi-VN')}k)
                                        </button>
                                      );
                                    })}
                                  </div>

                                  {/* Bộ điều khiển số lượng [-] [QTY] [+] */}
                                  <div className="flex items-center space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (qty > 0) {
                                          setCartQuantities((prev) => ({ ...prev, [p.id]: qty - 1 }));
                                        }
                                      }}
                                      className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span
                                      className={`w-6 text-center font-bold text-sm ${
                                        qty > 0 ? 'text-emerald-700' : 'text-slate-400'
                                      }`}
                                    >
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCartQuantities((prev) => ({ ...prev, [p.id]: qty + 1 }));
                                      }}
                                      className="w-6 h-6 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>

                                {qty > 0 && (
                                  <div className="flex justify-between items-center text-[11px] pt-1 border-t border-emerald-200/60">
                                    <span className="text-slate-500">
                                      {qty} {uomName} x {price.toLocaleString('vi-VN')}đ
                                    </span>
                                    <span className="font-bold text-emerald-800">
                                      {(qty * price).toLocaleString('vi-VN')} đ
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Khuyến mãi FMCG */}
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-tight">
                          🎉 Đạt khuyến mãi: Tặng <strong>1 Dây Snack Oishi Bắp Cay</strong> (Miễn phí 0đ)!
                        </div>

                        {/* TỔNG TIỀN GIỎ HÀNG */}
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center text-xs">
                          <div>
                            <span className="text-slate-600 block">Giỏ hàng:</span>
                            <span className="font-bold text-slate-900">
                              {totalCartItemsCount} mặt hàng ({totalCartUnits} kiện/thùng)
                            </span>
                          </div>
                          <span className="text-base font-extrabold text-emerald-700">
                            {calculatedCartTotal.toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        <button
                          onClick={handleSubmitOrder}
                          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs uppercase tracking-wider shadow transition"
                        >
                          Lưu Đơn & Sang Bước 5 (Thanh Toán) &rarr;
                        </button>
                      </div>
                    )}

                    {/* BƯỚC 5: THANH TOÁN & THU TIỀN */}
                    {step === 5 && (
                      <div className="space-y-4 py-2 text-left">
                        <div className="text-center">
                          <h4 className="text-sm font-bold text-slate-900">Bước 5: Thanh Toán & Thu Tiền</h4>
                          <p className="text-xs text-slate-500 mt-0.5">Tiệm: {selectedOutlet?.name}</p>
                        </div>

                        {/* Danh sách các món trong đơn hàng */}
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
                          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide border-b border-slate-100 pb-1">
                            Chi tiết giỏ hàng ({activeCartItems.length} sản phẩm):
                          </div>
                          {activeCartItems.map((it) => (
                            <div key={it.productId} className="flex justify-between items-center text-[11px]">
                              <span>
                                {it.quantity} {it.uomName} x {it.name}
                              </span>
                              <span className="font-bold font-mono">{it.total.toLocaleString('vi-VN')}đ</span>
                            </div>
                          ))}
                        </div>

                        {/* Tổng tiền cần thu */}
                        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-800">SỐ TIỀN CẦN THU:</span>
                          <span className="text-base font-extrabold text-emerald-700">
                            {(orderCreated?.totalAmount || calculatedCartTotal).toLocaleString('vi-VN')} đ
                          </span>
                        </div>

                        {/* Chọn phương thức thanh toán */}
                        <div className="space-y-2">
                          <div className="text-xs font-bold text-slate-700">Hình thức thanh toán:</div>

                          {/* 1. Tiền mặt (Mặc định) */}
                          <div
                            onClick={() => setPaymentMethod('CASH')}
                            className={`p-2.5 rounded-xl border cursor-pointer transition ${
                              paymentMethod === 'CASH'
                                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-base">💵</span>
                                <div>
                                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                                    <span>Tiền Mặt</span>
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded">
                                      Phổ biến nhất
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500">Thu tiền mặt trực tiếp tại tiệm tạp hóa</div>
                                </div>
                              </div>
                              <input type="radio" checked={paymentMethod === 'CASH'} readOnly className="accent-emerald-600" />
                            </div>

                            {paymentMethod === 'CASH' && (
                              <div className="mt-2.5 pt-2.5 border-t border-emerald-200/60 space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="text-slate-600">Tiền khách đưa:</span>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCashGiven(orderCreated?.totalAmount || calculatedCartTotal);
                                    }}
                                    className="text-[10px] text-emerald-700 font-bold bg-emerald-100 hover:bg-emerald-200 px-2 py-0.5 rounded"
                                  >
                                    Đủ 100%
                                  </button>
                                </div>
                                <input
                                  type="number"
                                  value={cashGiven}
                                  onChange={(e) => setCashGiven(parseInt(e.target.value) || 0)}
                                  className="w-full border border-slate-300 rounded-lg p-1.5 text-xs font-bold"
                                />

                                {/* CÁC NÚT BẤM NHANH MỆNH GIÁ */}
                                <div className="flex items-center space-x-1 overflow-x-auto pb-1">
                                  {[500000, 1000000, 2000000, 3000000, 5000000].map((amt) => (
                                    <button
                                      key={amt}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCashGiven(amt);
                                      }}
                                      className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold whitespace-nowrap"
                                    >
                                      {amt / 1000}k
                                    </button>
                                  ))}
                                </div>

                                {/* TÍNH TOÁN TIỀN THỐI HOẶC GỐI ĐẦU NỢ */}
                                {cashGiven >= (orderCreated?.totalAmount || calculatedCartTotal) ? (
                                  <div className="flex justify-between items-center text-xs pt-1">
                                    <span className="text-slate-500 font-medium">Tiền thối lại cho tiệm:</span>
                                    <span className="font-bold text-emerald-700">
                                      {(cashGiven - (orderCreated?.totalAmount || calculatedCartTotal)).toLocaleString('vi-VN')} đ
                                    </span>
                                  </div>
                                ) : (
                                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-[11px] space-y-1">
                                    <div className="flex justify-between items-center">
                                      <span className="text-slate-600">Khách trả trước:</span>
                                      <strong className="text-slate-800">{cashGiven.toLocaleString('vi-VN')} đ</strong>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-rose-600 font-bold">Còn thiếu (Gối đầu nợ):</span>
                                      <strong className="text-rose-700 font-bold">
                                        {((orderCreated?.totalAmount || calculatedCartTotal) - cashGiven).toLocaleString('vi-VN')} đ
                                      </strong>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                      ➔ Số tiền còn thiếu sẽ tự động cộng dồn vào Công nợ gối đầu của tiệm!
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* 2. Chuyển khoản VietQR */}
                          <div
                            onClick={() => setPaymentMethod('TRANSFER')}
                            className={`p-2.5 rounded-xl border cursor-pointer transition ${
                              paymentMethod === 'TRANSFER'
                                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-base">📱</span>
                                <div>
                                  <div className="text-xs font-bold text-slate-900">Chuyển Khoản (VietQR)</div>
                                  <div className="text-[10px] text-slate-500">Chủ tiệm quét mã QR ngân hàng Napas 24/7</div>
                                </div>
                              </div>
                              <input type="radio" checked={paymentMethod === 'TRANSFER'} readOnly className="accent-emerald-600" />
                            </div>

                            {paymentMethod === 'TRANSFER' && (
                              <div className="mt-2.5 pt-2.5 border-t border-slate-200 text-center space-y-1">
                                <img
                                  src={
                                    vietQr?.qrImageUrl ||
                                    `https://img.vietqr.io/image/970422-0988889999-compact2.png?amount=${
                                      orderCreated?.totalAmount || calculatedCartTotal
                                    }&addInfo=TT%20${selectedOutlet?.code}&accountName=NPP%20BANH%20KEO%20AN%20PHAT`
                                  }
                                  alt="QR Code"
                                  className="w-36 h-36 mx-auto rounded-lg border border-slate-200"
                                />
                                <div className="text-[11px] font-bold text-slate-800">
                                  MBBank: 0988889999 • NPP BANH KEO AN PHAT
                                </div>
                                <div className="text-[10px] font-mono text-slate-500">
                                  TT {selectedOutlet?.code} (Số tiền: {(orderCreated?.totalAmount || calculatedCartTotal).toLocaleString('vi-VN')}đ)
                                </div>
                              </div>
                            )}
                          </div>

                          {/* 3. Ghi nợ gối đầu */}
                          <div
                            onClick={() => setPaymentMethod('DEBT')}
                            className={`p-2.5 rounded-xl border cursor-pointer transition ${
                              paymentMethod === 'DEBT'
                                ? 'bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="text-base">📝</span>
                                <div>
                                  <div className="text-xs font-bold text-slate-900">Ghi Nợ Gối Đầu 100%</div>
                                  <div className="text-[10px] text-slate-500">
                                    Nợ hiện tại: {selectedOutlet?.currentDebt?.toLocaleString('vi-VN')}đ / Hạn mức:{' '}
                                    {selectedOutlet?.creditLimit?.toLocaleString('vi-VN')}đ
                                  </div>
                                </div>
                              </div>
                              <input type="radio" checked={paymentMethod === 'DEBT'} readOnly className="accent-emerald-600" />
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={handleCompleteCheckOut}
                          className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition"
                        >
                          {paymentMethod === 'CASH'
                            ? cashGiven >= (orderCreated?.totalAmount || calculatedCartTotal)
                              ? `Xác Nhận Đã Thu Tiền Mặt (${(orderCreated?.totalAmount || calculatedCartTotal).toLocaleString('vi-VN')}đ)`
                              : `Xác Nhận Thu ${cashGiven.toLocaleString('vi-VN')}đ + Gối Nợ ${((orderCreated?.totalAmount || calculatedCartTotal) - cashGiven).toLocaleString('vi-VN')}đ`
                            : paymentMethod === 'TRANSFER'
                            ? 'Xác Nhận Đã Chuyển Khoản Xong'
                            : 'Xác Nhận Ghi Nợ Gối Đầu 100%'}
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
                              <strong className="text-rose-700">
                                {b.quantity} {b.uomName}
                              </strong>
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
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                >
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
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
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
                <h3 className="font-bold text-base text-slate-900">Ghi Chú NỢ Hàng / Giao Bổ Sung Cho Khách</h3>
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
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.address})
                    </option>
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
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
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
                    onChange={(e) =>
                      setBackorderForm({ ...backorderForm, quantity: parseFloat(e.target.value) || 1 })
                    }
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

      {/* MODAL 3: GHI NHẬN ĐIỂM BÁN KHÔNG MUA / ĐÓNG CỬA */}
      {showNoSaleModal && targetOutletForNoSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">Ghi Nhận Không Mua Hàng / Đóng Cửa</h3>
              </div>
              <button onClick={() => setShowNoSaleModal(false)} className="text-slate-400 text-lg font-bold">
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{targetOutletForNoSale.name}</div>
                <div className="text-slate-500 text-[11px]">{targetOutletForNoSale.address}</div>
              </div>

              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Lý do không đặt hàng hôm nay:</label>
                {[
                  'Còn nhiều hàng tồn kho bánh kẹo',
                  'Chủ tiệm vắng mặt / Đi vắng',
                  'Cửa hàng đóng cửa / Đang sửa chữa',
                  'Chê giá cao / Đang chờ khuyến mãi khác',
                  'Không có nhu cầu nhập chuyến này',
                ].map((reason) => (
                  <label
                    key={reason}
                    className={`flex items-center space-x-2 p-2 rounded-lg border cursor-pointer transition ${
                      noSaleReason === reason
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="noSaleReason"
                      value={reason}
                      checked={noSaleReason === reason}
                      onChange={() => setNoSaleReason(reason)}
                      className="accent-emerald-600"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                Ghi nhận viếng thăm giúp hệ thống tính chỉ tiêu KPI ghé thăm và nhắc nhân viên quay lại vào chuyến tuần sau.
              </p>
            </div>

            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowNoSaleModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmNoSale}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
              >
                Xác Nhận & Lưu KPI
              </button>
            </div>
          </div>
        </div>
      )}
      {/* MODAL 4: MỞ ĐIỂM BÁN MỚI TRÊN TUYẾN (THÊM TẠP HÓA MỚI) */}
      {showCreateOutletModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Mở Điểm Bán Mới Trên Tuyến</h3>
                  <p className="text-[11px] text-slate-500">Đăng ký tiệm tạp hóa mới phát sinh khi đi bán hàng</p>
                </div>
              </div>
              <button
                onClick={() => setShowCreateOutletModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateNewOutlet} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Tên cửa hàng / Tiệm tạp hóa <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Tạp Hóa Cô Sáu, Đại Lý Bánh Kẹo Hưng Thịnh..."
                  value={newOutletForm.name}
                  onChange={(e) => setNewOutletForm({ ...newOutletForm, name: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 font-semibold focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Chủ tiệm / Người liên hệ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Chị Sáu, Chú Ba..."
                    value={newOutletForm.ownerName}
                    onChange={(e) => setNewOutletForm({ ...newOutletForm, ownerName: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Số điện thoại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="VD: 0988 123 456"
                    value={newOutletForm.phone}
                    onChange={(e) => setNewOutletForm({ ...newOutletForm, phone: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 font-mono focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Địa chỉ số nhà, tên đường <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 145 Hai Bà Trưng, P. Tân Định, Quận 1, TP.HCM"
                  value={newOutletForm.address}
                  onChange={(e) => setNewOutletForm({ ...newOutletForm, address: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2.5 focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Gán vào Tuyến MCP</label>
                  <select
                    value={newOutletForm.routeCode}
                    onChange={(e) => setNewOutletForm({ ...newOutletForm, routeCode: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="TUYEN-Q1-T2">T2 - Tuyến Q1 (Bến Nghé - Nguyễn Huệ)</option>
                    <option value="TUYEN-BT-T3">T3 - Tuyến Bình Thạnh (Thị Nghè)</option>
                    <option value="TUYEN-Q5-T4">T4 - Tuyến Q5 (Chợ Lớn - An Đông)</option>
                    <option value="TUYEN-Q10-T5">T5 - Tuyến Q10 (Sư Vạn Hạnh)</option>
                    <option value="TUYEN-TB-T6">T6 - Tuyến Tân Bình (Cộng Hòa)</option>
                    <option value="TUYEN-GV-T7">T7 - Tuyến Gò Vấp (Quang Trung)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Hạn mức nợ gối đầu</label>
                  <select
                    value={newOutletForm.creditLimit}
                    onChange={(e) => setNewOutletForm({ ...newOutletForm, creditLimit: Number(e.target.value) })}
                    className="w-full border border-slate-300 rounded-xl p-2.5 bg-white font-semibold text-emerald-700 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value={5000000}>5,000,000 đ</option>
                    <option value={10000000}>10,000,000 đ (Chuẩn)</option>
                    <option value={15000000}>15,000,000 đ</option>
                    <option value={20000000}>20,000,000 đ</option>
                    <option value={30000000}>30,000,000 đ</option>
                    <option value={50000000}>50,000,000 đ (VIP)</option>
                  </select>
                </div>
              </div>

              {/* Tọa độ GPS */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-800 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tọa độ GPS vị trí thực tế tiệm:</span>
                </div>
                <div className="text-[11px] font-mono text-emerald-700">
                  {newOutletForm.latitude.toFixed(6)}, {newOutletForm.longitude.toFixed(6)} (Đã ghim vị trí vệ tinh tự động)
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateOutletModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                  disabled={isSubmittingOutlet}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOutlet}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isSubmittingOutlet ? (
                    <span>Đang lưu...</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Lưu Tiệm & Lên Đơn Ngay</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
