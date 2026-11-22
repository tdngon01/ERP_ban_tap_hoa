'use client';
import React, { useEffect, useState } from 'react';
import {
  MapPin,
  Truck,
  DollarSign,
  AlertTriangle,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle2,
  Phone,
  Search,
  Calendar,
  Clock,
  Send,
  X,
  CreditCard,
  Banknote,
  QrCode,
  PackageCheck,
  RefreshCw,
  Building2,
  ChevronRight,
} from 'lucide-react';
import {
  getTodayMcp,
  createOrder,
  generateVietQr,
  getProducts,
  getVanStock,
  loadItemsToVan,
  getBackorders,
  createBackorder,
} from '../api';

export const MobileSfaSimulator: React.FC = () => {
  const STORE_PHOTOS = [
    'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=300&q=80',
    'https://images.unsplash.com/photo-1534723452862-4c874018d66d?w=300&q=80',
    'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?w=300&q=80',
    'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=300&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&q=80',
  ];

  const getProductImage = (code?: string) => {
    if (code?.includes('CHOCO')) return 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=100&q=80';
    if (code?.includes('CUSTAS')) return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&q=80';
    if (code?.includes('AFC')) return 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=100&q=80';
    if (code?.includes('COSY')) return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100&q=80';
    if (code?.includes('OISHI')) return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=100&q=80';
    return 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=100&q=80';
  };

  // Tab chính: 'routes' (Tuyến đi) | 'vanStock' (Hàng trên xe) | 'revenue' (Doanh thu của tôi) | 'shortages' (Báo thiếu hàng)
  const [activeTab, setActiveTab] = useState<'routes' | 'vanStock' | 'revenue' | 'shortages'>('routes');
  const [loading, setLoading] = useState(true);

  // Người dùng hiện tại
  const [salesRepName, setSalesRepName] = useState('Nguyễn Văn Hùng');

  // 1. Tuyến phân công (MCP)
  const [selectedDay, setSelectedDay] = useState('Thứ Hai');
  const daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const [searchQuery, setSearchQuery] = useState('');
  const [outlets, setOutlets] = useState<any[]>([]);

  // 2. Hàng trên xe (Van Stock)
  const [vanItems, setVanItems] = useState<any[]>([]);
  const [showLoadVanModal, setShowLoadVanModal] = useState(false);
  const [loadProduct, setLoadProduct] = useState('');
  const [loadQty, setLoadQty] = useState(10);

  // 3. Doanh thu của tôi (My Revenue)
  const [myOrdersToday, setMyOrdersToday] = useState<any[]>([
    {
      orderCode: 'DH-SFA-101',
      outletName: 'Tạp Hóa Cô Ba Bến Nghé',
      amount: 2320000,
      paymentMethod: 'TIỀN MẶT',
      time: '08:35',
      itemsCount: 4,
    },
    {
      orderCode: 'DH-SFA-102',
      outletName: 'Tạp Hóa Chị Lan Phố Đi Bộ',
      amount: 1840000,
      paymentMethod: 'VIETQR',
      time: '09:20',
      itemsCount: 3,
    },
  ]);

  // 4. Báo thiếu hàng (Stock Shortages / Backorders)
  const [shortageReports, setShortageReports] = useState<any[]>([
    {
      id: 'bo-01',
      outletName: 'Tạp Hóa Cô Ba Bến Nghé',
      productName: 'Bánh Chocopie Orion 12P',
      quantity: 3,
      promisedDate: 'Sáng mai',
      reason: 'Hết hàng trên xe lúc giao',
      status: 'CHỜ XUẤT KHO',
    },
  ]);
  const [showShortageModal, setShowShortageModal] = useState(false);
  const [shortageForm, setShortageForm] = useState({
    outletId: '',
    productId: '',
    quantity: 2,
    promisedDate: 'Sáng mai',
    reason: 'Hết hàng trên xe lúc giao',
    notes: 'Khách dặn giao bổ sung trước 10h',
  });

  // Modal Lên Đơn Nhanh
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderOutlet, setOrderOutlet] = useState<any>(null);
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [orderPaymentMethod, setOrderPaymentMethod] = useState<'CASH' | 'VIETQR' | 'DEBT'>('CASH');
  const [vietQrData, setVietQrData] = useState<any>(null);

  // Danh mục sản phẩm
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [mcpData, productsData, vanData, backorderData] = await Promise.all([
        getTodayMcp(),
        getProducts(),
        getVanStock(salesRepName),
        getBackorders('PENDING'),
      ]);

      if (productsData && productsData.length > 0) {
        setProducts(productsData);
        setLoadProduct(productsData[0].id);
        setShortageForm((prev) => ({ ...prev, productId: productsData[0].id }));
      }

      // Khởi tạo hàng trên xe
      if (vanData && vanData.items && vanData.items.length > 0) {
        setVanItems(vanData.items);
      } else if (productsData && productsData.length > 0) {
        // Fallback thực tế
        const initialVan = productsData.slice(0, 5).map((p: any, idx: number) => ({
          productId: p.id,
          productCode: p.code,
          name: p.name,
          initialCases: 20 - idx * 2,
          soldCases: idx * 3,
          remainingCases: 20 - idx * 2 - idx * 3,
          price: p.uoms?.[p.uoms.length - 1]?.price || 480000,
        }));
        setVanItems(initialVan);
      }

      // Khởi tạo điểm bán
      const rawOutlets = mcpData?.routes?.flatMap((r: any) => r.outlets || []) || [];
      if (rawOutlets.length > 0) {
        setOutlets(rawOutlets);
        setShortageForm((prev) => ({ ...prev, outletId: rawOutlets[0].id }));
      } else {
        // Dữ liệu mẫu thực tế
        const defaultOutlets = [
          {
            id: 'out-01',
            code: 'TH-001',
            name: 'Tạp Hóa Cô Ba Bến Nghé',
            address: '18 Lê Lợi, Bến Nghé, Quận 1',
            ownerName: 'Nguyễn Thị Ba',
            phone: '0903112233',
            currentDebt: 2500000,
            creditLimit: 10000000,
            dayOfWeek: 'Thứ Hai',
            status: 'ĐÃ LÊN ĐƠN',
            orderTotal: 2320000,
          },
          {
            id: 'out-02',
            code: 'TH-002',
            name: 'Tạp Hóa Chị Lan Phố Đi Bộ',
            address: '42 Nguyễn Huệ, Quận 1',
            ownerName: 'Lê Hoàng Lan',
            phone: '0918223344',
            currentDebt: 0,
            creditLimit: 8000000,
            dayOfWeek: 'Thứ Hai',
            status: 'ĐÃ LÊN ĐƠN',
            orderTotal: 1840000,
          },
          {
            id: 'out-03',
            code: 'TH-003',
            name: 'Đại Lý Bánh Kẹo Hưng Thịnh',
            address: '88 Hai Bà Trưng, Quận 1',
            ownerName: 'Phạm Hưng Thịnh',
            phone: '0988334455',
            currentDebt: 11500000,
            creditLimit: 25000000,
            dayOfWeek: 'Thứ Hai',
            status: 'CHƯA GHÉ',
            orderTotal: 0,
          },
          {
            id: 'out-04',
            code: 'TH-004',
            name: 'Cửa Hàng Tạp Hóa Minh Tâm',
            address: '125 Đinh Tiên Hoàng, Đa Kao, Q.1',
            ownerName: 'Trần Minh Tâm',
            phone: '0937445566',
            currentDebt: 1500000,
            creditLimit: 7000000,
            dayOfWeek: 'Thứ Hai',
            status: 'CHƯA GHÉ',
            orderTotal: 0,
          },
          {
            id: 'out-05',
            code: 'TH-005',
            name: 'Tạp Hóa Bác Bảy Tân Định',
            address: '210 Hai Bà Trưng, Tân Định, Q.1',
            ownerName: 'Võ Văn Bảy',
            phone: '0909556677',
            currentDebt: 4200000,
            creditLimit: 12000000,
            dayOfWeek: 'Thứ Hai',
            status: 'CHƯA GHÉ',
            orderTotal: 0,
          },
          {
            id: 'out-06',
            code: 'TH-006',
            name: 'Tạp Hóa Chị Nga Cầu Thị Nghè',
            address: '45 Xô Viết Nghệ Tĩnh, Bình Thạnh',
            ownerName: 'Trịnh Thị Nga',
            phone: '0908778899',
            currentDebt: 900000,
            creditLimit: 6000000,
            dayOfWeek: 'Thứ Ba',
            status: 'CHƯA GHÉ',
            orderTotal: 0,
          },
        ];
        setOutlets(defaultOutlets);
        setShortageForm((prev) => ({ ...prev, outletId: defaultOutlets[0].id }));
      }

      if (backorderData && backorderData.length > 0) {
        setShortageReports(backorderData);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Tính doanh thu cá nhân
  const myTotalRevenue = myOrdersToday.reduce((sum, o) => sum + (o.amount || 0), 0);
  const myCashCollected = myOrdersToday
    .filter((o) => o.paymentMethod === 'TIỀN MẶT')
    .reduce((sum, o) => sum + (o.amount || 0), 0);
  const myCreditRevenue = myOrdersToday
    .filter((o) => o.paymentMethod !== 'TIỀN MẶT')
    .reduce((sum, o) => sum + (o.amount || 0), 0);

  // Mở modal lên đơn
  const handleOpenOrder = (outlet: any) => {
    setOrderOutlet(outlet);
    const initialCart: Record<string, number> = {};
    vanItems.forEach((item) => {
      initialCart[item.productId] = 0;
    });
    setCartQuantities(initialCart);
    setOrderPaymentMethod('CASH');
    setVietQrData(null);
    setShowOrderModal(true);
  };

  // Tính tổng tiền giỏ hàng trong modal lên đơn
  const calculatedOrderTotal = Object.entries(cartQuantities).reduce((sum, [pId, qty]) => {
    if (qty <= 0) return sum;
    const vanItem = vanItems.find((i) => i.productId === pId);
    return sum + qty * (vanItem?.price || 480000);
  }, 0);

  const totalCartCases = Object.values(cartQuantities).reduce((sum, q) => sum + (q > 0 ? q : 0), 0);

  // Xác nhận lên đơn
  const handleConfirmOrder = async () => {
    if (!orderOutlet || totalCartCases <= 0) return;

    try {
      const itemsPayload = Object.entries(cartQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([pId, qty]) => ({
          productId: pId,
          quantity: qty,
          uomName: 'Thùng',
        }));

      // Trừ tồn kho trên xe
      setVanItems((prev) =>
        prev.map((item) => {
          const qtyBought = cartQuantities[item.productId] || 0;
          return {
            ...item,
            soldCases: (item.soldCases || 0) + qtyBought,
            remainingCases: Math.max(0, (item.remainingCases || 0) - qtyBought),
          };
        }),
      );

      // Thêm vào đơn hàng cá nhân hôm nay
      const newOrder = {
        orderCode: `DH-${Date.now().toString().slice(-6)}`,
        outletName: orderOutlet.name,
        amount: calculatedOrderTotal,
        paymentMethod: orderPaymentMethod === 'CASH' ? 'TIỀN MẶT' : orderPaymentMethod === 'VIETQR' ? 'VIETQR' : 'GỐI NỢ',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        itemsCount: totalCartCases,
      };

      setMyOrdersToday((prev) => [newOrder, ...prev]);

      // Cập nhật trạng thái điểm bán
      setOutlets((prev) =>
        prev.map((o) =>
          o.id === orderOutlet.id ? { ...o, status: 'ĐÃ LÊN ĐƠN', orderTotal: calculatedOrderTotal } : o,
        ),
      );

      // Gửi đơn lên server
      createOrder({
        outletId: orderOutlet.id,
        salesRepName: salesRepName,
        orderType: 'VAN_SALES',
        items: itemsPayload,
        notes: 'Lên đơn từ Mobile Terminal SFA thị trường',
      }).catch(() => {});

      setShowOrderModal(false);
      alert(`🎉 Đã chốt đơn ${calculatedOrderTotal.toLocaleString('vi-VN')} đ cho ${orderOutlet.name}!`);
    } catch (err: any) {
      alert(err.message || 'Lỗi khi đặt đơn');
    }
  };

  // Mở modal báo thiếu hàng
  const handleOpenShortage = (outlet?: any) => {
    if (outlet) {
      setShortageForm((prev) => ({ ...prev, outletId: outlet.id }));
    }
    setShowShortageModal(true);
  };

  // Xác nhận báo thiếu hàng về hệ thống
  const handleConfirmShortage = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetOutlet = outlets.find((o) => o.id === shortageForm.outletId) || outlets[0];
    const targetProduct = products.find((p) => p.id === shortageForm.productId) || products[0];

    const newReport = {
      id: `bo-${Date.now()}`,
      outletName: targetOutlet?.name || 'Tạp Hóa',
      productName: targetProduct?.name || 'Bánh kẹo',
      quantity: shortageForm.quantity,
      promisedDate: shortageForm.promisedDate,
      reason: shortageForm.reason,
      notes: shortageForm.notes,
      status: 'CHỜ XUẤT KHO',
    };

    setShortageReports((prev) => [newReport, ...prev]);

    // Gửi API
    createBackorder({
      outletId: shortageForm.outletId,
      productId: shortageForm.productId,
      quantity: shortageForm.quantity,
      promisedDate: shortageForm.promisedDate,
      reason: shortageForm.reason,
      notes: shortageForm.notes,
    }).catch(() => {});

    setShowShortageModal(false);
    alert(`⚠️ Đã báo thiếu ${shortageForm.quantity} thùng ${targetProduct?.name} về hệ thống!`);
  };

  // Xác nhận bốc thêm hàng lên xe
  const handleConfirmLoadVan = (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === loadProduct);
    if (!prod) return;

    setVanItems((prev) => {
      const idx = prev.findIndex((i) => i.productId === loadProduct);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].initialCases += loadQty;
        updated[idx].remainingCases += loadQty;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: prod.id,
            productCode: prod.code,
            name: prod.name,
            initialCases: loadQty,
            soldCases: 0,
            remainingCases: loadQty,
            price: prod.uoms?.[prod.uoms.length - 1]?.price || 480000,
          },
        ];
      }
    });

    setShowLoadVanModal(false);
    alert(`🚚 Đã bốc thêm ${loadQty} thùng ${prod.name} lên xe!`);
  };

  // Lọc điểm bán theo ngày và tìm kiếm
  const currentDayOutlets = outlets.filter((o) => {
    const matchDay = o.dayOfWeek ? o.dayOfWeek === selectedDay : true;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      q === '' ||
      o.name?.toLowerCase().includes(q) ||
      o.ownerName?.toLowerCase().includes(q) ||
      o.phone?.includes(q) ||
      o.address?.toLowerCase().includes(q);
    return matchDay && matchSearch;
  });

  const totalInDay = outlets.filter((o) => (o.dayOfWeek ? o.dayOfWeek === selectedDay : true)).length;
  const visitedInDay = outlets.filter(
    (o) => (o.dayOfWeek ? o.dayOfWeek === selectedDay : true) && o.status === 'ĐÃ LÊN ĐƠN',
  ).length;

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-12">
      {/* HEADER CỔNG BÁN HÀNG SFA */}
      <div className="bg-emerald-600 text-white p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Truck className="w-5 h-5 text-emerald-200" />
            <h2 className="text-lg font-bold">Cổng Bán Hàng SFA Thị Trường (Mobile Terminal)</h2>
          </div>
          <p className="text-xs text-emerald-100 mt-0.5">
            Nhân viên: <strong className="text-white">{salesRepName}</strong> • Tác nghiệp đi tuyến, kiểm tồn xe tải và quản lý doanh thu
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start sm:self-auto px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Đồng Bộ Dữ Liệu</span>
        </button>
      </div>

      {/* 4 TAB TÁC NGHIỆP TINH GỌN */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          onClick={() => setActiveTab('routes')}
          className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
            activeTab === 'routes'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <MapPin className="w-5 h-5 text-emerald-600" />
          <span>1. Tuyến Bán Hàng</span>
        </button>

        <button
          onClick={() => setActiveTab('vanStock')}
          className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
            activeTab === 'vanStock'
              ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Truck className="w-5 h-5 text-blue-600" />
          <span>2. Hàng Trên Xe ({vanItems.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
            activeTab === 'revenue'
              ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <DollarSign className="w-5 h-5 text-emerald-600" />
          <span>3. Doanh Thu Của Tôi</span>
        </button>

        <button
          onClick={() => setActiveTab('shortages')}
          className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-col items-center space-y-1.5 transition ${
            activeTab === 'shortages'
              ? 'border-amber-600 bg-amber-50 text-amber-800 ring-2 ring-amber-500/20'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="relative">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            {shortageReports.length > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-amber-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {shortageReports.length}
              </span>
            )}
          </div>
          <span>4. Báo Thiếu Hàng</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TUYẾN BÁN HÀNG PHÂN CÔNG (MCP) */}
      {/* ========================================================================= */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          {/* Thanh chọn ngày & Tìm kiếm */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Chọn ngày đi tuyến:</span>
              <span className="text-xs font-bold text-emerald-600">
                Đã ghé: {visitedInDay} / {totalInDay} tiệm ({totalInDay > 0 ? Math.round((visitedInDay / totalInDay) * 100) : 0}%)
              </span>
            </div>

            {/* Các ngày trong tuần */}
            <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {daysOfWeek.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedDay === day
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Thanh tiến độ */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${totalInDay > 0 ? (visitedInDay / totalInDay) * 100 : 0}%` }}
              />
            </div>

            {/* Ô tìm kiếm tiệm */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Tìm tiệm tạp hóa theo tên, số ĐT, địa chỉ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Danh sách điểm bán */}
          <div className="space-y-3">
            {currentDayOutlets.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
                Không tìm thấy tiệm tạp hóa nào trên tuyến {selectedDay}.
              </div>
            ) : (
              currentDayOutlets.map((outlet, idx) => {
                const isDone = outlet.status === 'ĐÃ LÊN ĐƠN';
                const debt = Number(outlet.currentDebt || 0);
                const storePhoto = STORE_PHOTOS[idx % STORE_PHOTOS.length];

                return (
                  <div
                    key={outlet.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <img
                        src={storePhoto}
                        alt={outlet.name}
                        className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 shadow-xs mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{outlet.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {outlet.status || 'CHƯA GHÉ'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Chủ tiệm: <strong>{outlet.ownerName}</strong> • SĐT:{' '}
                          <a href={`tel:${outlet.phone}`} className="text-emerald-600 font-semibold underline">
                            {outlet.phone}
                          </a>
                        </p>
                      </div>

                      {isDone && outlet.orderTotal && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg shrink-0">
                          +{outlet.orderTotal.toLocaleString('vi-VN')} đ
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex items-center space-x-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{outlet.address}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500">
                        Nợ gối đầu:{' '}
                        <strong className={debt > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {debt.toLocaleString('vi-VN')} đ
                        </strong>{' '}
                        / Hạn mức: {Number(outlet.creditLimit || 0).toLocaleString('vi-VN')} đ
                      </span>

                      {/* 2 NÚT TÁC NGHIỆP CHÍNH */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenShortage(outlet)}
                          className="px-2.5 py-1.5 rounded-xl border border-amber-500 text-amber-700 hover:bg-amber-50 text-xs font-bold flex items-center space-x-1 transition"
                        >
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Báo Thiếu</span>
                        </button>

                        <button
                          onClick={() => handleOpenOrder(outlet)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Lên Đơn</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KIỂM SOÁT HÀNG TRÊN XE BÁN HÀNG (VAN STOCK) */}
      {/* ========================================================================= */}
      {activeTab === 'vanStock' && (
        <div className="space-y-4">
          {/* Card tổng kết thùng hàng */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-200" />
                <h3 className="font-bold text-sm uppercase tracking-wider">Tồn Xe Bán Hàng (Van Stock)</h3>
              </div>
              <button
                onClick={() => setShowLoadVanModal(true)}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center space-x-1 backdrop-blur-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Bốc Thêm Lên Xe</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="bg-white/10 p-2.5 rounded-xl">
                <div className="text-[11px] text-blue-100">Bốc Lên Sáng</div>
                <div className="text-base font-bold">
                  {vanItems.reduce((sum, i) => sum + (i.initialCases || 0), 0)} Thùng
                </div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl">
                <div className="text-[11px] text-amber-200">Đã Xuất Bán</div>
                <div className="text-base font-bold text-amber-200">
                  {vanItems.reduce((sum, i) => sum + (i.soldCases || 0), 0)} Thùng
                </div>
              </div>
              <div className="bg-white/10 p-2.5 rounded-xl">
                <div className="text-[11px] text-emerald-200">Còn Trên Xe</div>
                <div className="text-base font-bold text-emerald-200">
                  {vanItems.reduce((sum, i) => sum + (i.remainingCases || 0), 0)} Thùng
                </div>
              </div>
            </div>
          </div>

          {/* Bảng chi tiết từng mặt hàng */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Chi tiết số lượng bánh kẹo đang chở trên xe:
              </h4>
              <span className="text-xs text-slate-400">{vanItems.length} sản phẩm</span>
            </div>

            <div className="divide-y divide-slate-100">
              {vanItems.map((item) => {
                const rem = item.remainingCases || 0;
                const init = item.initialCases || 1;
                const ratio = Math.min(1, Math.max(0, rem / init));

                return (
                  <div key={item.productId} className="p-4 space-y-2 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 min-w-0">
                        <img
                          src={getProductImage(item.productId + ' ' + item.name)}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs"
                        />
                        <div className="truncate">
                          <span className="font-bold text-xs text-slate-900 block truncate">{item.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">Thùng 12 gói</span>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-xs font-bold shrink-0 ${
                          rem > 3 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        Còn {rem} Thùng
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          rem > 3 ? 'bg-blue-600' : 'bg-rose-500'
                        }`}
                        style={{ width: `${ratio * 100}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Bốc sáng: <strong>{item.initialCases} thùng</strong></span>
                      <span className="text-amber-600 font-semibold">Đã bán: {item.soldCases || 0} thùng</span>
                      <span>Đơn giá: {Number(item.price || 0).toLocaleString('vi-VN')} đ</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: QUẢN LÝ DOANH THU CỦA TÔI */}
      {/* ========================================================================= */}
      {activeTab === 'revenue' && (
        <div className="space-y-4">
          {/* Card lớn tổng doanh thu */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm space-y-4">
            <div>
              <div className="text-xs text-emerald-100 uppercase tracking-wider font-semibold">
                Tổng doanh thu của bạn hôm nay:
              </div>
              <div className="text-3xl font-extrabold mt-1">
                {myTotalRevenue.toLocaleString('vi-VN')} <span className="text-lg font-normal">VNĐ</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-emerald-500/40">
              <div className="bg-white/10 p-3 rounded-xl">
                <div className="text-[11px] text-emerald-100">💵 Tiền Mặt Đang Giữ (Cần nộp)</div>
                <div className="text-base font-bold text-white mt-0.5">
                  {myCashCollected.toLocaleString('vi-VN')} đ
                </div>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <div className="text-[11px] text-amber-200">💳 VietQR / Gối Nợ</div>
                <div className="text-base font-bold text-amber-200 mt-0.5">
                  {myCreditRevenue.toLocaleString('vi-VN')} đ
                </div>
              </div>
            </div>
          </div>

          {/* Lịch sử các đơn đã chốt hôm nay */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Danh sách đơn hàng đã chốt hôm nay:
              </h4>
              <span className="text-xs font-bold text-emerald-600">{myOrdersToday.length} đơn</span>
            </div>

            {myOrdersToday.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có đơn hàng nào hôm nay. Hãy chọn điểm bán trên tuyến để lên đơn!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myOrdersToday.map((order, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-xs text-slate-900">{order.outletName}</span>
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                          {order.orderCode}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Lúc {order.time} • Hình thức: <strong className="text-slate-700">{order.paymentMethod}</strong> • {order.itemsCount} thùng
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-emerald-700">
                        +{Number(order.amount).toLocaleString('vi-VN')} đ
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-end space-x-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Thành công</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: BÁO THIẾU HÀNG TRÊN XE VỀ HỆ THỐNG (BACKORDERS) */}
      {/* ========================================================================= */}
      {activeTab === 'shortages' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs text-amber-900">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                Khi tiệm cần mua mà trên xe hết hàng, hãy lập phiếu báo thiếu để Kho chuẩn bị xuất bù vào chuyến kế tiếp.
              </span>
            </div>
            <button
              onClick={() => handleOpenShortage()}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold whitespace-nowrap transition shadow-sm"
            >
              + Tạo Báo Thiếu
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                Danh sách các tiệm đang báo thiếu hàng trên xe:
              </h4>
              <span className="text-xs text-slate-400">{shortageReports.length} phiếu</span>
            </div>

            {shortageReports.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Không có điểm bán nào bị thiếu hàng trên xe!
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {shortageReports.map((report, idx) => (
                  <div key={idx} className="p-4 space-y-1.5 hover:bg-slate-50 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{report.outletName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        {report.status}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-rose-600">
                      Thiếu: {report.quantity} Thùng • {report.productName}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Hẹn giao bù: <strong>{report.promisedDate}</strong></span>
                      <span>Lý do: {report.reason}</span>
                    </div>

                    {report.notes && (
                      <p className="text-[11px] text-slate-400 italic">Ghi chú: {report.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL LÊN ĐƠN NHANH TẠI ĐIỂM BÁN */}
      {/* ========================================================================= */}
      {showOrderModal && orderOutlet && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header Modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center space-x-1.5">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-bold text-sm text-slate-900">Lên Đơn Tại Điểm Bán</h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tiệm: <strong className="text-slate-800">{orderOutlet.name}</strong> • Nợ gối đầu:{' '}
                  {Number(orderOutlet.currentDebt || 0).toLocaleString('vi-VN')} đ
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>

            {/* Danh sách chọn sản phẩm (Có kiểm tra tồn xe) */}
            <div className="p-4 overflow-y-auto divide-y divide-slate-100 space-y-3 flex-1">
              {vanItems.map((item) => {
                const qty = cartQuantities[item.productId] || 0;
                const rem = item.remainingCases || 0;

                return (
                  <div key={item.productId} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <img
                        src={getProductImage(item.productId + ' ' + item.name)}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 shadow-xs"
                      />
                      <div className="space-y-0.5 truncate">
                        <div className="font-bold text-xs text-slate-900 truncate">{item.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Đơn giá: {Number(item.price || 0).toLocaleString('vi-VN')} đ/Thùng
                        </div>
                        <div
                          className={`text-[10px] font-bold ${
                            rem > 3 ? 'text-blue-600' : 'text-rose-600'
                          }`}
                        >
                          Còn trên xe: {rem} Thùng
                        </div>
                      </div>
                    </div>

                    {/* Bộ tăng/giảm số lượng */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() =>
                          setCartQuantities((prev) => ({
                            ...prev,
                            [item.productId]: Math.max(0, (prev[item.productId] || 0) - 1),
                          }))
                        }
                        disabled={qty <= 0}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 font-bold flex items-center justify-center transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="w-8 text-center font-bold text-sm text-slate-900">{qty}</span>

                      <button
                        onClick={() => {
                          if (qty < rem) {
                            setCartQuantities((prev) => ({
                              ...prev,
                              [item.productId]: (prev[item.productId] || 0) + 1,
                            }));
                          } else {
                            alert(`⚠️ Trên xe chỉ còn ${rem} thùng! Hãy dùng chức năng Báo Thiếu Hàng nếu khách cần thêm.`);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center shadow-xs transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Modal: Tổng tiền & Phương thức thanh toán */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-3">
              {/* Chọn phương thức thanh toán */}
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Hình thức:</span>
                <div className="flex space-x-1.5">
                  {(['CASH', 'VIETQR', 'DEBT'] as const).map((method) => (
                    <button
                      key={method}
                      onClick={() => setOrderPaymentMethod(method)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        orderPaymentMethod === method
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {method === 'CASH' ? 'Tiền Mặt' : method === 'VIETQR' ? 'VietQR' : 'Gối Nợ'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dòng tổng tiền */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <div className="text-[11px] text-slate-500">Đã chọn: {totalCartCases} Thùng</div>
                  <div className="font-bold text-xs text-slate-700 uppercase">Tổng Thanh Toán:</div>
                </div>
                <div className="text-xl font-extrabold text-emerald-600">
                  {calculatedOrderTotal.toLocaleString('vi-VN')} đ
                </div>
              </div>

              {/* Nút chốt đơn */}
              <button
                onClick={handleConfirmOrder}
                disabled={totalCartCases <= 0}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition"
              >
                Xác Nhận Chốt Đơn & Xuất Xe
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL BÁO THIẾU HÀNG TRÊN XE (BACKORDERS) */}
      {/* ========================================================================= */}
      {showShortageModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-900">Báo Thiếu Hàng Trên Xe</h3>
              </div>
              <button
                onClick={() => setShowShortageModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmShortage} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Tiệm tạp hóa cần giao bù:</label>
                <select
                  value={shortageForm.outletId}
                  onChange={(e) => setShortageForm({ ...shortageForm, outletId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                >
                  {outlets.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name} ({o.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Mặt hàng bị thiếu trên xe:</label>
                <select
                  value={shortageForm.productId}
                  onChange={(e) => setShortageForm({ ...shortageForm, productId: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Số lượng thiếu (Thùng):</label>
                  <input
                    type="number"
                    min={1}
                    value={shortageForm.quantity}
                    onChange={(e) => setShortageForm({ ...shortageForm, quantity: Number(e.target.value) })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white font-bold text-center"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-bold mb-1">Hẹn ngày giao bù:</label>
                  <select
                    value={shortageForm.promisedDate}
                    onChange={(e) => setShortageForm({ ...shortageForm, promisedDate: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                  >
                    <option value="Sáng mai">Sáng mai</option>
                    <option value="Chiều mai">Chiều mai</option>
                    <option value="Chuyến kế tiếp">Chuyến kế tiếp</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Ghi chú dặn dò:</label>
                <input
                  type="text"
                  value={shortageForm.notes}
                  onChange={(e) => setShortageForm({ ...shortageForm, notes: e.target.value })}
                  placeholder="Khách dặn giao trước 10h sáng..."
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl uppercase tracking-wider shadow transition mt-2"
              >
                Gửi Báo Thiếu Về Hệ Thống
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL BỐC THÊM HÀNG LÊN XE (LOAD VAN STOCK) */}
      {/* ========================================================================= */}
      {showLoadVanModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-3">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Bốc Thêm Hàng Lên Xe</h3>
              </div>
              <button
                onClick={() => setShowLoadVanModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleConfirmLoadVan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-bold mb-1">Mặt hàng bốc lên xe:</label>
                <select
                  value={loadProduct}
                  onChange={(e) => setLoadProduct(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 bg-slate-50 focus:bg-white"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-bold mb-1">Số lượng bốc thêm (Thùng):</label>
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={() => setLoadQty(Math.max(5, loadQty - 5))}
                    className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-base hover:bg-slate-200"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-bold text-lg text-blue-600">+{loadQty}</span>
                  <button
                    type="button"
                    onClick={() => setLoadQty(loadQty + 5)}
                    className="w-10 h-10 rounded-xl bg-slate-100 font-bold text-base hover:bg-slate-200"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl uppercase tracking-wider shadow transition mt-2"
              >
                Xác Nhận Bốc Lên Xe
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
