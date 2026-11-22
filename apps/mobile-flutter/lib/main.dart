import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'core/constants/api_constants.dart';

void main() {
  runApp(const SfaDmsApp());
}

class SfaDmsApp extends StatelessWidget {
  const SfaDmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SFA Bán Hàng Thị Trường',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF10B981), // Emerald
          primary: const Color(0xFF059669),
          secondary: const Color(0xFF0284C7),
          surface: Colors.white,
        ),
        scaffoldBackgroundColor: const Color(0xFFF8FAFC),
        appBarTheme: const AppBarTheme(
          elevation: 0,
          backgroundColor: Color(0xFF059669),
          foregroundColor: Colors.white,
          centerTitle: false,
          titleTextStyle: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        cardTheme: CardTheme(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: Color(0xFFE2E8F0)),
          ),
          color: Colors.white,
        ),
      ),
      home: const SfaMainTerminalScreen(),
    );
  }
}

class SfaMainTerminalScreen extends StatefulWidget {
  const SfaMainTerminalScreen({super.key});

  @override
  State<SfaMainTerminalScreen> createState() => _SfaMainTerminalScreenState();
}

class _SfaMainTerminalScreenState extends State<SfaMainTerminalScreen> {
  int _currentTabIndex = 0;
  bool _loading = false;
  final String _salesRepName = 'Nguyễn Văn Hùng';

  // --- DỮ LIỆU TUYẾN ĐƯỢC PHÂN CÔNG (MCP) ---
  String _selectedDay = 'Thứ Hai';
  final List<String> _daysOfWeek = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  String _searchQuery = '';
  List<Map<String, dynamic>> _outlets = [];

  // --- DỮ LIỆU SẢN PHẨM ---
  List<Map<String, dynamic>> _products = [];

  // --- 1. KIỂM SOÁT HÀNG TRÊN XE (VAN STOCK) ---
  List<Map<String, dynamic>> _vanItems = [];

  // --- 2. QUẢN LÝ DOANH THU CỦA TÔI ---
  double _myRevenueToday = 0;
  double _myCashCollected = 0;
  double _myCreditAmount = 0;
  List<Map<String, dynamic>> _myOrdersToday = [];

  // --- 3. BÁO THIẾU HÀNG TRÊN XE (BACKORDERS) ---
  List<Map<String, dynamic>> _shortageReports = [];

  @override
  void initState() {
    super.initState();
    _initDefaultData();
    _fetchOnlineData();
  }

  void _initDefaultData() {
    // Sản phẩm bánh kẹo mẫu
    _products = [
      {
        'id': 'prod-01',
        'code': 'CHOCO-PIE-ORION',
        'name': 'Bánh Chocopie Orion 12P (360g)',
        'price': 580000,
        'uom': 'Thùng',
        'unitsPerCase': 8,
      },
      {
        'id': 'prod-02',
        'code': 'CUSTAS-ORION-6P',
        'name': 'Bánh Trứng Custas Orion 6P',
        'price': 460000,
        'uom': 'Thùng',
        'unitsPerCase': 12,
      },
      {
        'id': 'prod-03',
        'code': 'AFC-LUA-MI',
        'name': 'Bánh Quy AFC Lúa Mì Kinh Đô',
        'price': 390000,
        'uom': 'Thùng',
        'unitsPerCase': 10,
      },
      {
        'id': 'prod-04',
        'code': 'COSY-ME-KDC',
        'name': 'Bánh Quy Cosy Mè Kinh Đô',
        'price': 340000,
        'uom': 'Thùng',
        'unitsPerCase': 12,
      },
      {
        'id': 'prod-05',
        'code': 'OISHI-BAP-NGOT',
        'name': 'Snack Bắp Ngọt Oishi',
        'price': 220000,
        'uom': 'Thùng',
        'unitsPerCase': 20,
      },
    ];

    // Hàng đưa lên xe bán lúc sáng
    _vanItems = [
      {
        'productId': 'prod-01',
        'productCode': 'CHOCO-PIE-ORION',
        'name': 'Bánh Chocopie Orion 12P',
        'initialCases': 20,
        'soldCases': 6,
        'remainingCases': 14,
        'price': 580000,
      },
      {
        'productId': 'prod-02',
        'productCode': 'CUSTAS-ORION-6P',
        'name': 'Bánh Trứng Custas Orion 6P',
        'initialCases': 15,
        'soldCases': 7,
        'remainingCases': 8,
        'price': 460000,
      },
      {
        'productId': 'prod-03',
        'productCode': 'AFC-LUA-MI',
        'name': 'Bánh Quy AFC Lúa Mì Kinh Đô',
        'initialCases': 25,
        'soldCases': 15,
        'remainingCases': 10,
        'price': 390000,
      },
      {
        'productId': 'prod-04',
        'productCode': 'COSY-ME-KDC',
        'name': 'Bánh Quy Cosy Mè Kinh Đô',
        'initialCases': 18,
        'soldCases': 5,
        'remainingCases': 13,
        'price': 340000,
      },
      {
        'productId': 'prod-05',
        'productCode': 'OISHI-BAP-NGOT',
        'name': 'Snack Bắp Ngọt Oishi',
        'initialCases': 30,
        'soldCases': 18,
        'remainingCases': 12,
        'price': 220000,
      },
    ];

    // Tuyến điểm bán phân công hôm nay
    _outlets = [
      {
        'id': 'out-01',
        'code': 'TH-001',
        'name': 'Tạp Hóa Cô Ba Bến Nghé',
        'address': '18 Lê Lợi, Bến Nghé, Quận 1',
        'ownerName': 'Nguyễn Thị Ba',
        'phone': '0903112233',
        'currentDebt': 2500000,
        'creditLimit': 10000000,
        'dayOfWeek': 'Thứ Hai',
        'status': 'ĐÃ LÊN ĐƠN',
        'orderTotal': 2320000,
      },
      {
        'id': 'out-02',
        'code': 'TH-002',
        'name': 'Tạp Hóa Chị Lan Phố Đi Bộ',
        'address': '42 Nguyễn Huệ, Quận 1',
        'ownerName': 'Lê Hoàng Lan',
        'phone': '0918223344',
        'currentDebt': 0,
        'creditLimit': 8000000,
        'dayOfWeek': 'Thứ Hai',
        'status': 'ĐÃ LÊN ĐƠN',
        'orderTotal': 1840000,
      },
      {
        'id': 'out-03',
        'code': 'TH-003',
        'name': 'Đại Lý Bánh Kẹo Hưng Thịnh',
        'address': '88 Hai Bà Trưng, Quận 1',
        'ownerName': 'Phạm Hưng Thịnh',
        'phone': '0988334455',
        'currentDebt': 11500000,
        'creditLimit': 25000000,
        'dayOfWeek': 'Thứ Hai',
        'status': 'CHƯA GHÉ',
        'orderTotal': 0,
      },
      {
        'id': 'out-04',
        'code': 'TH-004',
        'name': 'Cửa Hàng Tạp Hóa Minh Tâm',
        'address': '125 Đinh Tiên Hoàng, Đa Kao, Q.1',
        'ownerName': 'Trần Minh Tâm',
        'phone': '0937445566',
        'currentDebt': 1500000,
        'creditLimit': 7000000,
        'dayOfWeek': 'Thứ Hai',
        'status': 'CHƯA GHÉ',
        'orderTotal': 0,
      },
      {
        'id': 'out-05',
        'code': 'TH-005',
        'name': 'Tạp Hóa Bác Bảy Tân Định',
        'address': '210 Hai Bà Trưng, Tân Định, Q.1',
        'ownerName': 'Võ Văn Bảy',
        'phone': '0909556677',
        'currentDebt': 4200000,
        'creditLimit': 12000000,
        'dayOfWeek': 'Thứ Hai',
        'status': 'CHƯA GHÉ',
        'orderTotal': 0,
      },
      // Thứ 3
      {
        'id': 'out-06',
        'code': 'TH-006',
        'name': 'Tạp Hóa Chị Nga Cầu Thị Nghè',
        'address': '45 Xô Viết Nghệ Tĩnh, Bình Thạnh',
        'ownerName': 'Trịnh Thị Nga',
        'phone': '0908778899',
        'currentDebt': 900000,
        'creditLimit': 6000000,
        'dayOfWeek': 'Thứ Ba',
        'status': 'CHƯA GHÉ',
        'orderTotal': 0,
      },
      {
        'id': 'out-07',
        'code': 'TH-007',
        'name': 'Đại Lý Bánh Kẹo Hàng Xanh',
        'address': '320 Bạch Đằng, Bình Thạnh',
        'ownerName': 'Hoàng Văn Hưng',
        'phone': '0977113355',
        'currentDebt': 7500000,
        'creditLimit': 15000000,
        'dayOfWeek': 'Thứ Ba',
        'status': 'CHƯA GHÉ',
        'orderTotal': 0,
      },
    ];

    // Doanh số cá nhân hôm nay ban đầu
    _myOrdersToday = [
      {
        'orderCode': 'DH-SFA-101',
        'outletName': 'Tạp Hóa Cô Ba Bến Nghé',
        'amount': 2320000,
        'paymentMethod': 'TIỀN MẶT',
        'time': '08:35',
        'itemsCount': 4,
      },
      {
        'orderCode': 'DH-SFA-102',
        'outletName': 'Tạp Hóa Chị Lan Phố Đi Bộ',
        'amount': 1840000,
        'paymentMethod': 'VIETQR',
        'time': '09:20',
        'itemsCount': 3,
      },
    ];

    _recalculateRevenue();

    // Báo thiếu hàng ban đầu
    _shortageReports = [
      {
        'id': 'bo-01',
        'outletName': 'Tạp Hóa Cô Ba Bến Nghé',
        'productName': 'Bánh Chocopie Orion 12P',
        'quantity': 3,
        'promisedDate': 'Sáng mai',
        'reason': 'Hết hàng trên xe lúc giao',
        'status': 'CHỜ XUẤT KHO',
      },
    ];
  }

  void _recalculateRevenue() {
    double total = 0;
    double cash = 0;
    double credit = 0;

    for (var o in _myOrdersToday) {
      double amt = (o['amount'] as num).toDouble();
      total += amt;
      if (o['paymentMethod'] == 'TIỀN MẶT') {
        cash += amt;
      } else {
        credit += amt;
      }
    }

    setState(() {
      _myRevenueToday = total;
      _myCashCollected = cash;
      _myCreditAmount = credit;
    });
  }

  Future<void> _fetchOnlineData() async {
    setState(() => _loading = true);
    try {
      final res = await http.get(
        Uri.parse('${ApiConstants.todayMcpEndpoint}?salesRepName=$_salesRepName'),
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = json.decode(utf8.decode(res.bodyBytes));
        final routes = data['routes'] as List? ?? [];
        if (routes.isNotEmpty && routes[0]['outlets'] != null) {
          final serverOutlets = routes[0]['outlets'] as List;
          if (serverOutlets.isNotEmpty) {
            setState(() {
              _outlets = serverOutlets.map((o) => Map<String, dynamic>.from(o)).toList();
            });
          }
        }
      }
    } catch (_) {
      // Giữ dữ liệu offline dự phòng để Sales Rep không bao giờ bị gián đoạn
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // --- HÀNH ĐỘNG: LÊN ĐƠN TẠI ĐIỂM BÁN ---
  void _openCreateOrderSheet(Map<String, dynamic> outlet) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _QuickOrderBottomSheet(
        outlet: outlet,
        vanItems: _vanItems,
        onOrderConfirmed: (newOrder, updatedVan) {
          setState(() {
            _vanItems = updatedVan;
            _myOrdersToday.insert(0, newOrder);
            _recalculateRevenue();

            // Cập nhật trạng thái tiệm
            final idx = _outlets.indexWhere((o) => o['id'] == outlet['id']);
            if (idx != -1) {
              _outlets[idx]['status'] = 'ĐÃ LÊN ĐƠN';
              _outlets[idx]['orderTotal'] = newOrder['amount'];
            }
          });

          // Gửi đơn lên server chạy ngầm
          _submitOrderToServer(outlet, newOrder);

          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              backgroundColor: const Color(0xFF059669),
              content: Text('🎉 Đã chốt đơn ${(newOrder['amount'] as num).toInt()}đ cho ${outlet['name']}!'),
            ),
          );
        },
      ),
    );
  }

  Future<void> _submitOrderToServer(Map<String, dynamic> outlet, Map<String, dynamic> order) async {
    try {
      await http.post(
        Uri.parse(ApiConstants.ordersEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'outletId': outlet['id'],
          'salesRepName': _salesRepName,
          'orderType': 'VAN_SALES',
          'items': order['itemsPayload'],
          'notes': 'Lên đơn từ Mobile App SFA (Bán hàng trên xe)',
        }),
      ).timeout(const Duration(seconds: 4));
    } catch (_) {}
  }

  // --- HÀNH ĐỘNG: BÁO THIẾU HÀNG TRÊN XE VỀ HỆ THỐNG ---
  void _openStockShortageDialog({Map<String, dynamic>? preselectedOutlet}) {
    String selectedOutletId = preselectedOutlet?['id'] ?? (_outlets.isNotEmpty ? _outlets.first['id'] : '');
    String selectedProductId = _products.isNotEmpty ? _products.first['id'] : '';
    int shortageQty = 2;
    String promisedDate = 'Sáng mai';
    String reason = 'Hết hàng trên xe lúc giao';
    final notesController = TextEditingController(text: 'Khách dặn giao bổ sung trước 10h');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
            left: 20,
            right: 20,
            top: 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEF3C7),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706)),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Báo Thiếu Hàng Trên Xe',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          'Gửi thông báo về Kho & Kế toán để giao bù',
                          style: TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(ctx),
                  )
                ],
              ),
              const Divider(height: 24),

              // Chọn tiệm
              const Text('Tiệm tạp hóa cần giao bù:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: selectedOutletId,
                isExpanded: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: _outlets.map((o) => DropdownMenuItem(
                  value: o['id'].toString(),
                  child: Text('${o['name']} (${o['phone']})', overflow: TextOverflow.ellipsis),
                )).toList(),
                onChanged: (val) => setModalState(() => selectedOutletId = val!),
              ),
              const SizedBox(height: 12),

              // Chọn mặt hàng thiếu
              const Text('Mặt hàng bị thiếu trên xe:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: selectedProductId,
                isExpanded: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                ),
                items: _products.map((p) => DropdownMenuItem(
                  value: p['id'].toString(),
                  child: Text('${p['name']} (${p['uom']})', overflow: TextOverflow.ellipsis),
                )).toList(),
                onChanged: (val) => setModalState(() => selectedProductId = val!),
              ),
              const SizedBox(height: 12),

              // Số lượng thiếu
              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Số lượng thiếu (Thùng):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            IconButton.filledTonal(
                              icon: const Icon(Icons.remove),
                              onPressed: shortageQty > 1 ? () => setModalState(() => shortageQty--) : null,
                            ),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 16),
                              child: Text(
                                '$shortageQty',
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                              ),
                            ),
                            IconButton.filledTonal(
                              icon: const Icon(Icons.add),
                              onPressed: () => setModalState(() => shortageQty++),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Hẹn ngày giao:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 6),
                        DropdownButtonFormField<String>(
                          value: promisedDate,
                          decoration: InputDecoration(
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          ),
                          items: const [
                            DropdownMenuItem(value: 'Sáng mai', child: Text('Sáng mai')),
                            DropdownMenuItem(value: 'Chiều mai', child: Text('Chiều mai')),
                            DropdownMenuItem(value: 'Chuyến kế tiếp', child: Text('Chuyến kế tiếp')),
                          ],
                          onChanged: (val) => setModalState(() => promisedDate = val!),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Ghi chú
              const Text('Ghi chú dặn dò:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              TextField(
                controller: notesController,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                ),
              ),
              const SizedBox(height: 20),

              // Nút gửi báo thiếu
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFFD97706),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.send_rounded),
                  label: const Text('GỬI BÁO THIẾU VỀ HỆ THỐNG', style: TextStyle(fontWeight: FontWeight.bold)),
                  onPressed: () {
                    final targetOutlet = _outlets.firstWhere((o) => o['id'] == selectedOutletId);
                    final targetProd = _products.firstWhere((p) => p['id'] == selectedProductId);

                    final newReport = {
                      'id': 'bo-${DateTime.now().millisecondsSinceEpoch}',
                      'outletName': targetOutlet['name'],
                      'productName': targetProd['name'],
                      'quantity': shortageQty,
                      'promisedDate': promisedDate,
                      'reason': reason,
                      'notes': notesController.text,
                      'status': 'CHỜ XUẤT KHO',
                    };

                    setState(() {
                      _shortageReports.insert(0, newReport);
                    });

                    // Gửi API
                    http.post(
                      Uri.parse(ApiConstants.backordersEndpoint),
                      headers: {'Content-Type': 'application/json'},
                      body: json.encode({
                        'outletId': selectedOutletId,
                        'productId': selectedProductId,
                        'quantity': shortageQty,
                        'promisedDate': promisedDate,
                        'reason': reason,
                        'notes': notesController.text,
                      }),
                    ).catchError((_) {});

                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        backgroundColor: const Color(0xFFD97706),
                        content: Text('⚠️ Đã báo thiếu $shortageQty thùng ${targetProd['name']} về hệ thống!'),
                      ),
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // --- HÀNH ĐỘNG: BỐC HÀNG LÊN XE ĐẦU NGÀY ---
  void _openLoadStockDialog() {
    String selectedProductId = _products.first['id'];
    int addCases = 10;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.local_shipping_rounded, color: Color(0xFF0284C7)),
              SizedBox(width: 8),
              Text('Bốc Thêm Hàng Lên Xe', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Chọn mặt hàng nhận từ kho:', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 6),
              DropdownButtonFormField<String>(
                value: selectedProductId,
                isExpanded: true,
                decoration: InputDecoration(
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                ),
                items: _products.map((p) => DropdownMenuItem(
                  value: p['id'].toString(),
                  child: Text(p['name'], overflow: TextOverflow.ellipsis),
                )).toList(),
                onChanged: (val) => setDialogState(() => selectedProductId = val!),
              ),
              const SizedBox(height: 16),
              const Text('Số lượng bốc thêm (Thùng):', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton.filledTonal(
                    icon: const Icon(Icons.remove),
                    onPressed: addCases > 1 ? () => setDialogState(() => addCases -= 5) : null,
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text('+$addCases', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF0284C7))),
                  ),
                  IconButton.filledTonal(
                    icon: const Icon(Icons.add),
                    onPressed: () => setDialogState(() => addCases += 5),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFF0284C7)),
              onPressed: () {
                setState(() {
                  final idx = _vanItems.indexWhere((i) => i['productId'] == selectedProductId);
                  if (idx != -1) {
                    _vanItems[idx]['initialCases'] += addCases;
                    _vanItems[idx]['remainingCases'] += addCases;
                  } else {
                    final p = _products.firstWhere((p) => p['id'] == selectedProductId);
                    _vanItems.add({
                      'productId': p['id'],
                      'productCode': p['code'],
                      'name': p['name'],
                      'initialCases': addCases,
                      'soldCases': 0,
                      'remainingCases': addCases,
                      'price': p['price'],
                    });
                  }
                });
                Navigator.pop(ctx);
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    backgroundColor: const Color(0xFF0284C7),
                    content: Text('🚚 Đã nhận thêm $addCases thùng bốc lên xe!'),
                  ),
                );
              },
              child: const Text('Xác Nhận Bốc Lên Xe'),
            ),
          ],
        ),
      ),
    );
  }

  // --- DIALOG ĐỔI ĐỊA CHỈ SERVER API ---
  void _openSettingsDialog() {
    final controller = TextEditingController(text: ApiConstants.baseUrl);
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cấu Hình Máy Chủ API', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Địa chỉ Next.js Serverless API:', style: TextStyle(fontSize: 12, color: Colors.grey)),
            const SizedBox(height: 8),
            TextField(
              controller: controller,
              decoration: InputDecoration(
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                hintText: 'https://your-domain.vercel.app/api',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
          FilledButton(
            onPressed: () {
              ApiConstants.setBaseUrl(controller.text);
              Navigator.pop(ctx);
              _fetchOnlineData();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã cập nhật cấu hình API!')),
              );
            },
            child: const Text('Lưu'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Icon(Icons.storefront_rounded, size: 22),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('SFA Đi Tuyến Thị Trường', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                Text('Sales Rep: $_salesRepName', style: const TextStyle(fontSize: 11, color: Colors.white70)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: _fetchOnlineData,
            tooltip: 'Đồng bộ',
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: _openSettingsDialog,
            tooltip: 'Cài đặt IP',
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : IndexedStack(
              index: _currentTabIndex,
              children: [
                _buildRoutesTab(),     // 1. Tuyến được phân công
                _buildVanStockTab(),   // 2. Kiểm soát hàng trên xe
                _buildMyRevenueTab(),  // 3. Quản lý doanh thu cá nhân
                _buildBackordersTab(), // 4. Báo thiếu hàng
              ],
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentTabIndex,
        onDestinationSelected: (idx) => setState(() => _currentTabIndex = idx),
        indicatorColor: const Color(0xFFD1FAE5),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.alt_route_outlined),
            selectedIcon: const Icon(Icons.alt_route_rounded, color: Color(0xFF059669)),
            label: 'Tuyến Đi',
          ),
          NavigationDestination(
            icon: const Icon(Icons.local_shipping_outlined),
            selectedIcon: const Icon(Icons.local_shipping_rounded, color: Color(0xFF0284C7)),
            label: 'Hàng Trên Xe',
          ),
          NavigationDestination(
            icon: const Icon(Icons.monetization_on_outlined),
            selectedIcon: const Icon(Icons.monetization_on_rounded, color: Color(0xFF059669)),
            label: 'Doanh Thu',
          ),
          NavigationDestination(
            icon: Badge(
              label: Text('${_shortageReports.length}'),
              isLabelVisible: _shortageReports.isNotEmpty,
              child: const Icon(Icons.assignment_late_outlined),
            ),
            selectedIcon: const Icon(Icons.assignment_late_rounded, color: Color(0xFFD97706)),
            label: 'Báo Thiếu',
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // TAB 1: XEM TUYẾN ĐƯỢC PHÂN CÔNG (MCP) & LÊN ĐƠN NHANH
  // =========================================================================
  Widget _buildRoutesTab() {
    final filtered = _outlets.where((o) {
      final matchesDay = o['dayOfWeek'] == _selectedDay;
      final q = _searchQuery.toLowerCase().trim();
      final matchesSearch = q.isEmpty ||
          (o['name'] as String).toLowerCase().contains(q) ||
          (o['phone'] as String).contains(q) ||
          (o['address'] as String).toLowerCase().contains(q);
      return matchesDay && matchesSearch;
    }).toList();

    int totalInDay = _outlets.where((o) => o['dayOfWeek'] == _selectedDay).length;
    int visitedInDay = _outlets.where((o) => o['dayOfWeek'] == _selectedDay && o['status'] == 'ĐÃ LÊN ĐƠN').length;

    return Column(
      children: [
        // Thanh chọn ngày trong tuần
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
          child: SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _daysOfWeek.map((day) {
                final isSelected = day == _selectedDay;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(day),
                    selected: isSelected,
                    selectedColor: const Color(0xFFD1FAE5),
                    checkmarkColor: const Color(0xFF059669),
                    labelStyle: TextStyle(
                      color: isSelected ? const Color(0xFF059669) : Colors.black87,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      fontSize: 12,
                    ),
                    onSelected: (_) => setState(() => _selectedDay = day),
                  ),
                );
              }).toList(),
            ),
          ),
        ),

        // Thống kê tiến độ ngày & tìm kiếm
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Tiến độ đi tuyến $_selectedDay:',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF334155)),
                  ),
                  Text(
                    'Đã ghé: $visitedInDay / $totalInDay tiệm',
                    style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: totalInDay > 0 ? visitedInDay / totalInDay : 0,
                  minHeight: 6,
                  backgroundColor: const Color(0xFFE2E8F0),
                  valueColor: const AlwaysStoppedAnimation(Color(0xFF059669)),
                ),
              ),
              const SizedBox(height: 10),
              // Search input
              TextField(
                onChanged: (val) => setState(() => _searchQuery = val),
                decoration: InputDecoration(
                  hintText: 'Tìm tiệm tạp hóa theo tên, số ĐT, địa chỉ...',
                  hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
                  prefixIcon: const Icon(Icons.search, size: 20),
                  contentPadding: const EdgeInsets.symmetric(vertical: 10),
                  filled: true,
                  fillColor: const Color(0xFFF1F5F9),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Danh sách tiệm trên tuyến
        Expanded(
          child: filtered.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.store_mall_directory_outlined, size: 48, color: Colors.grey.shade400),
                      const SizedBox(height: 8),
                      Text('Không tìm thấy tiệm nào trên tuyến $_selectedDay', style: const TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: filtered.length,
                  itemBuilder: (ctx, i) {
                    final o = filtered[i];
                    final isDone = o['status'] == 'ĐÃ LÊN ĐƠN';
                    final debt = (o['currentDebt'] as num).toDouble();

                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Dòng tiêu đề tiệm & trạng thái
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        o['name'],
                                        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        'Chủ tiệm: ${o['ownerName']} • ${o['phone']}',
                                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                      ),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isDone ? const Color(0xFFD1FAE5) : const Color(0xFFF1F5F9),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    o['status'],
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: isDone ? const Color(0xFF059669) : const Color(0xFF64748B),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Địa chỉ
                            Row(
                              children: [
                                const Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                                const SizedBox(width: 4),
                                Expanded(
                                  child: Text(
                                    o['address'],
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF475569)),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),

                            // Công nợ
                            Row(
                              children: [
                                const Icon(Icons.account_balance_wallet_outlined, size: 14, color: Colors.grey),
                                const SizedBox(width: 4),
                                Text(
                                  'Nợ gối đầu: ${debt.toInt()} đ / Hạn mức ${(o['creditLimit'] as num).toInt()} đ',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: debt > 0 ? const Color(0xFFDC2626) : const Color(0xFF059669),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            // 2 NÚT TÁC NGHIỆP: LÊN ĐƠN & BÁO THIẾU
                            Row(
                              children: [
                                Expanded(
                                  child: FilledButton.icon(
                                    style: FilledButton.styleFrom(
                                      backgroundColor: const Color(0xFF059669),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                      padding: const EdgeInsets.symmetric(vertical: 10),
                                    ),
                                    icon: const Icon(Icons.add_shopping_cart_rounded, size: 16),
                                    label: const Text('LÊN ĐƠN', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                    onPressed: () => _openCreateOrderSheet(o),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: const Color(0xFFD97706),
                                    side: const BorderSide(color: Color(0xFFD97706)),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
                                  ),
                                  icon: const Icon(Icons.report_problem_outlined, size: 16),
                                  label: const Text('Báo Thiếu', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                  onPressed: () => _openStockShortageDialog(preselectedOutlet: o),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }

  // =========================================================================
  // TAB 2: KIỂM SOÁT HÀNG TRÊN XE BÁN HÀNG (VAN STOCK)
  // =========================================================================
  Widget _buildVanStockTab() {
    int totalInitial = _vanItems.fold(0, (sum, i) => sum + (i['initialCases'] as int));
    int totalSold = _vanItems.fold(0, (sum, i) => sum + (i['soldCases'] as int));
    int totalRemaining = _vanItems.fold(0, (sum, i) => sum + (i['remainingCases'] as int));

    return Column(
      children: [
        // Thẻ tổng kết trên xe
        Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [Color(0xFF0284C7), Color(0xFF0369A1)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF0284C7).withOpacity(0.3),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Row(
                    children: [
                      Icon(Icons.local_shipping, color: Colors.white, size: 20),
                      SizedBox(width: 8),
                      Text('TỒN XE BÁN HÀNG (VAN STOCK)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    ],
                  ),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: const BorderSide(color: Colors.white),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      visualDensity: VisualDensity.compact,
                    ),
                    icon: const Icon(Icons.add, size: 14),
                    label: const Text('Bốc Thêm', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                    onPressed: _openLoadStockDialog,
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _vanStatCol('Bốc Lên Sáng', '$totalInitial Thùng', Colors.white70),
                  Container(width: 1, height: 35, color: Colors.white24),
                  _vanStatCol('Đã Xuất Bán', '$totalSold Thùng', const Color(0xFFFDE047)),
                  Container(width: 1, height: 35, color: Colors.white24),
                  _vanStatCol('Còn Trên Xe', '$totalRemaining Thùng', Colors.white),
                ],
              ),
            ],
          ),
        ),

        // Danh sách chi tiết từng sản phẩm trên xe
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Danh sách bánh kẹo chở trên xe:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              Text('${_vanItems.length} mặt hàng', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
        ),

        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: _vanItems.length,
            itemBuilder: (ctx, i) {
              final item = _vanItems[i];
              final rem = item['remainingCases'] as int;
              final init = item['initialCases'] as int;
              final sold = item['soldCases'] as int;
              final ratio = init > 0 ? rem / init : 0.0;

              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              item['name'],
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: rem > 3 ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'Còn: $rem Thùng',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: rem > 3 ? const Color(0xFF059669) : const Color(0xFFDC2626),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                          value: ratio,
                          minHeight: 6,
                          backgroundColor: const Color(0xFFE2E8F0),
                          valueColor: AlwaysStoppedAnimation(
                            rem > 3 ? const Color(0xFF0284C7) : const Color(0xFFDC2626),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Bốc sáng: $init thùng', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          Text('Đã bán: $sold thùng', style: const TextStyle(fontSize: 12, color: Color(0xFFD97706), fontWeight: FontWeight.w600)),
                          Text('Đơn giá: ${(item['price'] as num).toInt()} đ', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _vanStatCol(String label, String val, Color valColor) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 11)),
        const SizedBox(height: 4),
        Text(val, style: TextStyle(color: valColor, fontSize: 15, fontWeight: FontWeight.bold)),
      ],
    );
  }

  // =========================================================================
  // TAB 3: QUẢN LÝ DOANH THU CÁ NHÂN (MY REVENUE)
  // =========================================================================
  Widget _buildMyRevenueTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Thẻ lớn tổng doanh số hôm nay
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF059669), Color(0xFF047857)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF059669).withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('TỔNG DOANH THU CỦA BẠN HÔM NAY', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 6),
                Text(
                  '${_myRevenueToday.toInt()} đ',
                  style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 14),
                const Divider(color: Colors.white24),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('💵 Tiền Mặt Đang Giữ:', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        Text('${_myCashCollected.toInt()} đ', style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Text('💳 Chuyển Khoản / Nợ:', style: TextStyle(color: Colors.white70, fontSize: 11)),
                        Text('${_myCreditAmount.toInt()} đ', style: const TextStyle(color: Color(0xFFFDE047), fontSize: 14, fontWeight: FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // Hiệu suất bán hàng
          const Text('Hiệu Suất Đi Tuyến Hôm Nay:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Số đơn chốt', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 4),
                        Text('${_myOrdersToday.length} đơn', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF059669))),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Thùng đã giao', style: TextStyle(fontSize: 11, color: Colors.grey)),
                        const SizedBox(height: 4),
                        Text(
                          '${_vanItems.fold(0, (sum, i) => sum + (i['soldCases'] as int))} thùng',
                          style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF0284C7)),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Lịch sử các đơn đã chốt hôm nay
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Lịch sử đơn hàng hôm nay:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              Text('${_myOrdersToday.length} đơn', style: const TextStyle(fontSize: 12, color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 10),

          if (_myOrdersToday.isEmpty)
            Container(
              padding: const EdgeInsets.all(30),
              alignment: Alignment.center,
              child: const Text('Chưa có đơn hàng nào hôm nay. Hãy bắt đầu lên đơn tại điểm bán!'),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _myOrdersToday.length,
              itemBuilder: (ctx, i) {
                final o = _myOrdersToday[i];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                    leading: CircleAvatar(
                      backgroundColor: const Color(0xFFD1FAE5),
                      child: Text('${i + 1}', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold)),
                    ),
                    title: Text(o['outletName'], style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                    subtitle: Text('Lúc ${o['time']} • Hình thức: ${o['paymentMethod']}', style: const TextStyle(fontSize: 12)),
                    trailing: Text(
                      '${(o['amount'] as num).toInt()} đ',
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  // =========================================================================
  // TAB 4: BÁO THIẾU HÀNG TRÊN XE VỀ HỆ THỐNG (BACKORDERS)
  // =========================================================================
  Widget _buildBackordersTab() {
    return Column(
      children: [
        // Thanh banner giải thích
        Container(
          color: const Color(0xFFFEF3C7),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              const Icon(Icons.info_outline, color: Color(0xFFD97706), size: 20),
              const SizedBox(width: 10),
              const Expanded(
                child: Text(
                  'Khi tiệm cần mua nhưng trên xe hết hàng, hãy lập phiếu báo thiếu để Kho chuẩn bị xuất bù vào chuyến sau.',
                  style: TextStyle(fontSize: 12, color: Color(0xFF92400E)),
                ),
              ),
              FilledButton.icon(
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFFD97706),
                  visualDensity: VisualDensity.compact,
                ),
                icon: const Icon(Icons.add, size: 14),
                label: const Text('Báo Thiếu', style: TextStyle(fontSize: 12)),
                onPressed: () => _openStockShortageDialog(),
              ),
            ],
          ),
        ),

        // Danh sách phiếu báo thiếu
        Expanded(
          child: _shortageReports.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.check_circle_outline, size: 50, color: Colors.green.shade300),
                      const SizedBox(height: 10),
                      const Text('Không có điểm bán nào bị thiếu hàng trên xe!', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _shortageReports.length,
                  itemBuilder: (ctx, i) {
                    final b = _shortageReports[i];
                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    b['outletName'],
                                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFFEF3C7),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    b['status'],
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFD97706)),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Thiếu: ${b['quantity']} Thùng • ${b['productName']}',
                              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              'Hẹn giao bù: ${b['promisedDate']} • Lý do: ${b['reason']}',
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                            ),
                            if (b['notes'] != null && (b['notes'] as String).isNotEmpty)
                              Padding(
                                padding: const EdgeInsets.only(top: 4),
                                child: Text('Ghi chú: ${b['notes']}', style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic)),
                              ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}

// ===========================================================================
// BOTTOM SHEET LÊN ĐƠN NHANH TẠI ĐIỂM BÁN (QUICK ORDER SHEET)
// ===========================================================================
class _QuickOrderBottomSheet extends StatefulWidget {
  final Map<String, dynamic> outlet;
  final List<Map<String, dynamic>> vanItems;
  final Function(Map<String, dynamic> order, List<Map<String, dynamic>> updatedVan) onOrderConfirmed;

  const _QuickOrderBottomSheet({
    required this.outlet,
    required this.vanItems,
    required this.onOrderConfirmed,
  });

  @override
  State<_QuickOrderBottomSheet> createState() => _QuickOrderBottomSheetState();
}

class _QuickOrderBottomSheetState extends State<_QuickOrderBottomSheet> {
  late List<Map<String, dynamic>> _tempVanItems;
  final Map<String, int> _cartQuantities = {};
  String _paymentMethod = 'TIỀN MẶT'; // 'TIỀN MẶT', 'VIETQR', 'GỐI NỢ'
  double _cashReceived = 0;

  @override
  void initState() {
    super.initState();
    _tempVanItems = widget.vanItems.map((item) => Map<String, dynamic>.from(item)).toList();
    // Khởi tạo giỏ hàng = 0
    for (var item in _tempVanItems) {
      _cartQuantities[item['productId']] = 0;
    }
  }

  double get _orderTotal {
    double sum = 0;
    for (var item in _tempVanItems) {
      int qty = _cartQuantities[item['productId']] ?? 0;
      sum += qty * (item['price'] as num).toDouble();
    }
    return sum;
  }

  int get _totalItemsInCart {
    return _cartQuantities.values.fold(0, (sum, q) => sum + q);
  }

  void _increaseQty(Map<String, dynamic> item) {
    String pId = item['productId'];
    int currentInCart = _cartQuantities[pId] ?? 0;
    int remainingOnTruck = item['remainingCases'] as int;

    if (currentInCart < remainingOnTruck) {
      setState(() {
        _cartQuantities[pId] = currentInCart + 1;
        _cashReceived = _orderTotal;
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('⚠️ Trên xe chỉ còn $remainingOnTruck thùng ${item['name']}! Hãy dùng chức năng Báo Thiếu Hàng.'),
          duration: const Duration(seconds: 2),
        ),
      );
    }
  }

  void _decreaseQty(Map<String, dynamic> item) {
    String pId = item['productId'];
    int currentInCart = _cartQuantities[pId] ?? 0;
    if (currentInCart > 0) {
      setState(() {
        _cartQuantities[pId] = currentInCart - 1;
        _cashReceived = _orderTotal;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final outlet = widget.outlet;

    return Container(
      height: MediaQuery.of(context).size.height * 0.88,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Header tiệm
          Container(
            padding: const EdgeInsets.all(16),
            decoration: const BoxDecoration(
              color: Color(0xFFF8FAFC),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              border: Border(bottom: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.storefront_rounded, size: 18, color: Color(0xFF059669)),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              outlet['name'],
                              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Nợ hiện tại: ${(outlet['currentDebt'] as num).toInt()} đ • Hạn mức: ${(outlet['creditLimit'] as num).toInt()} đ',
                        style: const TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          // Danh sách chọn hàng có kiểm soát tồn xe
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _tempVanItems.length,
              itemBuilder: (ctx, i) {
                final item = _tempVanItems[i];
                final pId = item['productId'];
                final qty = _cartQuantities[pId] ?? 0;
                final remaining = item['remainingCases'] as int;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item['name'], style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                              const SizedBox(height: 2),
                              Text('Đơn giá: ${(item['price'] as num).toInt()} đ/Thùng', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                              const SizedBox(height: 2),
                              Text(
                                'Còn trên xe: $remaining Thùng',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: remaining > 3 ? const Color(0xFF0284C7) : const Color(0xFFDC2626),
                                ),
                              ),
                            ],
                          ),
                        ),
                        // Bộ chọn số lượng
                        Row(
                          children: [
                            IconButton.filledTonal(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.remove, size: 16),
                              onPressed: qty > 0 ? () => _decreaseQty(item) : null,
                            ),
                            Container(
                              constraints: const BoxConstraints(minWidth: 32),
                              alignment: Alignment.center,
                              child: Text(
                                '$qty',
                                style: TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: qty > 0 ? const Color(0xFF059669) : Colors.black87,
                                ),
                              ),
                            ),
                            IconButton.filledTonal(
                              visualDensity: VisualDensity.compact,
                              icon: const Icon(Icons.add, size: 16),
                              onPressed: () => _increaseQty(item),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Tóm tắt đơn hàng & Phương thức thanh toán
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.06),
                  blurRadius: 10,
                  offset: const Offset(0, -4),
                ),
              ],
            ),
            child: Column(
              children: [
                // Chọn phương thức thanh toán
                Row(
                  children: [
                    const Text('Thanh toán:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Expanded(
                      child: SegmentedButton<String>(
                        segments: const [
                          ButtonSegment(value: 'TIỀN MẶT', label: Text('Tiền Mặt', style: TextStyle(fontSize: 11))),
                          ButtonSegment(value: 'VIETQR', label: Text('VietQR', style: TextStyle(fontSize: 11))),
                          ButtonSegment(value: 'GỐI NỢ', label: Text('Gối Nợ', style: TextStyle(fontSize: 11))),
                        ],
                        selected: {_paymentMethod},
                        onSelectionChanged: (set) => setState(() => _paymentMethod = set.first),
                        style: ButtonStyle(
                          visualDensity: VisualDensity.compact,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Dòng tổng tiền
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Đã chọn $_totalItemsInCart thùng', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                        const Text('TỔNG THANH TOÁN:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    Text(
                      '${_orderTotal.toInt()} đ',
                      style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF059669)),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Nút xác nhận đơn
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF059669),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.check_circle_rounded),
                    label: const Text('XÁC NHẬN CHỐT ĐƠN & XUẤT XE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    onPressed: _orderTotal <= 0
                        ? null
                        : () {
                            // Cập nhật tồn kho xe
                            final updatedVan = _tempVanItems.map((item) {
                              final pId = item['productId'];
                              final bought = _cartQuantities[pId] ?? 0;
                              return {
                                ...item,
                                'soldCases': (item['soldCases'] as int) + bought,
                                'remainingCases': (item['remainingCases'] as int) - bought,
                              };
                            }).toList();

                            final itemsPayload = _tempVanItems
                                .where((i) => (_cartQuantities[i['productId']] ?? 0) > 0)
                                .map((i) => {
                                      'productId': i['productId'],
                                      'quantity': _cartQuantities[i['productId']],
                                      'uomName': 'Thùng',
                                    })
                                .toList();

                            final newOrder = {
                              'orderCode': 'DH-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}',
                              'outletName': outlet['name'],
                              'amount': _orderTotal,
                              'paymentMethod': _paymentMethod,
                              'time': '${DateTime.now().hour.toString().padLeft(2, '0')}:${DateTime.now().minute.toString().padLeft(2, '0')}',
                              'itemsCount': _totalItemsInCart,
                              'itemsPayload': itemsPayload,
                            };

                            widget.onOrderConfirmed(newOrder, updatedVan);
                            Navigator.pop(context);
                          },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
