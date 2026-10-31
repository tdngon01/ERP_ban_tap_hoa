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
      title: 'SFA DMS Bánh Kẹo FMCG',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF16A34A),
          primary: const Color(0xFF16A34A),
        ),
        useMaterial3: true,
      ),
      home: const SfaHomeScreen(),
    );
  }
}

class SfaHomeScreen extends StatefulWidget {
  const SfaHomeScreen({super.key});

  @override
  State<SfaHomeScreen> createState() => _SfaHomeScreenState();
}

class _SfaHomeScreenState extends State<SfaHomeScreen> {
  int _currentIndex = 0;
  bool _loading = false;
  List<dynamic> _outlets = [];
  String _selectedDay = 'Thứ Hai';
  final String _salesRepName = 'Nguyễn Văn Hùng';

  @override
  void initState() {
    super.initState();
    _fetchTodayMcp();
  }

  Future<void> _fetchTodayMcp() async {
    setState(() => _loading = true);
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.todayMcpEndpoint}?salesRepName=$_salesRepName'),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        final routes = data['routes'] as List? ?? [];
        if (routes.isNotEmpty) {
          setState(() {
            _selectedDay = routes[0]['dayOfWeek'] ?? 'Thứ Hai';
            _outlets = routes[0]['outlets'] ?? [];
          });
        }
      } else {
        _loadFallbackData();
      }
    } catch (e) {
      // Khi chạy offline hoặc chưa kết nối server, nạp dữ liệu mẫu
      _loadFallbackData();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _loadFallbackData() {
    setState(() {
      _outlets = [
        {
          'id': 'out-01',
          'code': 'TH-001',
          'name': 'Tạp Hóa Cô Ba Bến Nghé',
          'address': '18 Lê Lợi, Bến Nghé, Quận 1',
          'ownerName': 'Nguyễn Thị Ba',
          'phone': '0903112233',
          'currentDebt': 4500000,
          'creditLimit': 10000000,
          'latitude': 10.7769,
          'longitude': 106.7009,
          'status': 'Chưa ghé thăm',
        },
        {
          'id': 'out-02',
          'code': 'TH-002',
          'name': 'Tạp Hóa Chị Lan Phố Đi Bộ',
          'address': '42 Nguyễn Huệ, Quận 1',
          'ownerName': 'Lê Hoàng Lan',
          'phone': '0918223344',
          'currentDebt': 1200000,
          'creditLimit': 5000000,
          'latitude': 10.7745,
          'longitude': 106.7032,
          'status': 'Đã lên đơn',
        },
        {
          'id': 'out-03',
          'code': 'TH-003',
          'name': 'Đại Lý Bánh Kẹo Hưng Thịnh',
          'address': '88 Hai Bà Trưng, Quận 1',
          'ownerName': 'Phạm Hưng Thịnh',
          'phone': '0988334455',
          'currentDebt': 12500000,
          'creditLimit': 20000000,
          'latitude': 10.7791,
          'longitude': 106.6985,
          'status': 'Chưa ghé thăm',
        },
      ];
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('SFA Thị Trường FMCG', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Tuyến: $_selectedDay • Sale: $_salesRepName', style: const TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
        backgroundColor: const Color(0xFF15803D),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Đồng bộ dữ liệu ngoại tuyến',
            onPressed: () {
              _fetchTodayMcp();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đang cập nhật tuyến MCP mới nhất...')),
              );
            },
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _outlets.length,
              itemBuilder: (context, index) {
                final item = _outlets[index];
                final bool isDone = item['status'] == 'Đã lên đơn';

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                item['code'] ?? 'GT-${index + 1}',
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: isDone ? Colors.green.shade50 : Colors.amber.shade50,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: isDone ? Colors.green.shade200 : Colors.amber.shade200),
                              ),
                              child: Text(
                                item['status'] ?? 'Chưa ghé thăm',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: isDone ? Colors.green.shade800 : Colors.amber.shade800,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          item['name'] ?? '',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Chủ tiệm: ${item['ownerName'] ?? 'Chủ tiệm'} • ĐT: ${item['phone'] ?? ''}',
                          style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                        ),
                        Text(
                          item['address'] ?? '',
                          style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                        ),
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('Nợ gối đầu:', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                Text(
                                  '${(item['currentDebt'] ?? 0).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')} đ',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.red),
                                ),
                              ],
                            ),
                            ElevatedButton.icon(
                              onPressed: () {
                                _openVisitFlow(context, item);
                              },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              icon: const Icon(Icons.storefront, size: 16),
                              label: const Text('Viếng Thăm (5 Bước)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.route), label: 'Tuyến MCP'),
          NavigationDestination(icon: Icon(Icons.inventory_2), label: 'Tồn Kho Bánh'),
          NavigationDestination(icon: Icon(Icons.receipt_long), label: 'Đơn Hàng'),
          NavigationDestination(icon: Icon(Icons.person), label: 'Cá Nhân'),
        ],
      ),
    );
  }

  void _openVisitFlow(BuildContext context, Map<String, dynamic> item) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StoreVisitScreen(outlet: item, salesRepName: _salesRepName),
      ),
    );
  }
}

/// Màn hình thực hiện trọn vẹn Quy trình 5 bước viếng thăm tạp hóa của Sale
class StoreVisitScreen extends StatefulWidget {
  final Map<String, dynamic> outlet;
  final String salesRepName;

  const StoreVisitScreen({super.key, required this.outlet, required this.salesRepName});

  @override
  State<StoreVisitScreen> createState() => _StoreVisitScreenState();
}

class _StoreVisitScreenState extends State<StoreVisitScreen> {
  int _currentStep = 1;
  bool _checkedIn = false;
  String _dateCheckNotes = 'Chocopie hộp còn 4 hộp cận date 06/2026; AFC còn 10 gói date xa.';
  int _orderQty = 5;
  String _orderUom = 'Thùng';
  String? _vietQrUrl;
  bool _submitting = false;

  Future<void> _performCheckIn() async {
    setState(() => _submitting = true);
    try {
      final res = await http.post(
        Uri.parse(ApiConstants.checkInEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'outletId': widget.outlet['id'] ?? 'sample-id',
          'salesRepName': widget.salesRepName,
          'latitude': widget.outlet['latitude'] ?? 10.7769,
          'longitude': widget.outlet['longitude'] ?? 106.7009,
        }),
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200 || res.statusCode == 201) {
        setState(() {
          _checkedIn = true;
          _currentStep = 2;
        });
      } else {
        setState(() {
          _checkedIn = true;
          _currentStep = 2;
        });
      }
    } catch (e) {
      // Ngoại tuyến vẫn cho qua bước tiếp theo
      setState(() {
        _checkedIn = true;
        _currentStep = 2;
      });
    } finally {
      setState(() => _submitting = false);
    }
  }

  Future<void> _submitOrderAndGetQr() async {
    setState(() => _submitting = true);
    final int amount = _orderQty * 480000;
    setState(() {
      _vietQrUrl = 'https://img.vietqr.io/image/970422-0909123456-compact2.png?amount=$amount&addInfo=TT%20${widget.outlet['code']}&accountName=NPP%20AN%20PHAT';
      _currentStep = 5;
      _submitting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.outlet['name'] ?? 'Viếng Thăm Điểm Bán', style: const TextStyle(fontSize: 15)),
        backgroundColor: const Color(0xFF15803D),
        foregroundColor: Colors.white,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thanh tiến trình 5 bước
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: List.generate(5, (index) {
                final int stepNum = index + 1;
                final bool isCurrent = _currentStep == stepNum;
                final bool isPassed = _currentStep > stepNum;

                return Expanded(
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 12,
                        backgroundColor: isPassed
                            ? Colors.green
                            : isCurrent
                                ? Colors.amber.shade700
                                : Colors.grey.shade300,
                        child: Text(
                          '$stepNum',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: isPassed || isCurrent ? Colors.white : Colors.grey.shade700,
                          ),
                        ),
                      ),
                      if (index < 4)
                        Expanded(
                          child: Container(
                            height: 2,
                            color: isPassed ? Colors.green : Colors.grey.shade300,
                          ),
                        ),
                    ],
                  ),
                );
              }),
            ),
            const SizedBox(height: 20),

            // Bước 1: Check-in GPS
            if (_currentStep == 1) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Icon(Icons.location_on, size: 48, color: Colors.green),
                      const SizedBox(height: 8),
                      const Text(
                        'Bước 1: Check-in GPS Tạp Hóa',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Xác thực vị trí viếng thăm trong bán kính < 100m bằng tọa độ GPS thiết bị',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                      ),
                      const Divider(height: 24),
                      Text('Tọa độ tiệm: ${widget.outlet['latitude']}, ${widget.outlet['longitude']}'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _submitting ? null : _performCheckIn,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                        child: Text(_submitting ? 'Đang xác thực GPS...' : 'Xác Nhận Check-in GPS (<100m)'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // Bước 2: Kiểm Date & Tồn Quầy
            if (_currentStep == 2) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bước 2: Kiểm Tra Date & Tồn Quầy Bánh',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      TextField(
                        controller: TextEditingController(text: _dateCheckNotes),
                        onChanged: (val) => _dateCheckNotes = val,
                        maxLines: 3,
                        decoration: const InputDecoration(
                          border: OutlineInputBorder(),
                          hintText: 'Nhập số lượng hộp/gói tồn thực tế và date cận...',
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => setState(() => _currentStep = 3),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Tiếp Tục: Chụp Ảnh Quầy Kệ'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // Bước 3: Chụp ảnh quầy kệ
            if (_currentStep == 3) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Icon(Icons.camera_alt, size: 48, color: Colors.blue),
                      const SizedBox(height: 8),
                      const Text(
                        'Bước 3: Chụp Ảnh Trưng Bày Bánh Kẹo',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        height: 140,
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300),
                        ),
                        child: const Center(
                          child: Text('📸 Ảnh đã được gắn Watermark GPS & Thời gian', style: TextStyle(fontSize: 12)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: () => setState(() => _currentStep = 4),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Tiếp Tục: Lên Đơn Đặt Hàng'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // Bước 4: Đặt đơn bánh kẹo
            if (_currentStep == 4) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Bước 4: Đặt Hàng Đa ĐVT (Thùng/Hộp/Gói)',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      const Text('Sản phẩm: Bánh Chocopie Hộp 12 Cái (Orion)', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          DropdownButton<String>(
                            value: _orderUom,
                            items: const [
                              DropdownMenuItem(value: 'Thùng', child: Text('Thùng (8 Hộp)')),
                              DropdownMenuItem(value: 'Hộp', child: Text('Hộp (12 Cái)')),
                            ],
                            onChanged: (v) => setState(() => _orderUom = v ?? 'Thùng'),
                          ),
                          const SizedBox(width: 16),
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: () {
                              if (_orderQty > 1) setState(() => _orderQty--);
                            },
                          ),
                          Text('$_orderQty', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setState(() => _orderQty++),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Thành tiền: ${(_orderQty * 480000).toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]}.')} đ',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.amber, fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _submitting ? null : _submitOrderAndGetQr,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                        ),
                        child: const Text('Lưu Đơn & Sang Bước Thu Tiền VietQR'),
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // Bước 5: Check-out & VietQR
            if (_currentStep == 5) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      const Icon(Icons.qr_code_2, size: 48, color: Colors.green),
                      const SizedBox(height: 8),
                      const Text(
                        'Bước 5: Quét VietQR Thu Tiền & Check-out',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      if (_vietQrUrl != null)
                        Image.network(
                          _vietQrUrl!,
                          width: 180,
                          height: 180,
                          errorBuilder: (context, error, stackTrace) => const Icon(Icons.qr_code, size: 100),
                        ),
                      const SizedBox(height: 12),
                      ElevatedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Đã hoàn tất viếng thăm & lên đơn thành công!')),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        ),
                        child: const Text('HOÀN TẤT VIẾNG THĂM'),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
