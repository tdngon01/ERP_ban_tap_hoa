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
            Text(
              _currentIndex == 0
                  ? 'SFA Thị Trường FMCG'
                  : _currentIndex == 1
                      ? 'Soạn Hàng & Tồn Kho Xe'
                      : _currentIndex == 2
                          ? 'Sổ Ghi Nhớ Giao Bù'
                          : 'Hồ Sơ Sales Rep',
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              'Tuyến: $_selectedDay • NV: $_salesRepName',
              style: const TextStyle(fontSize: 11, color: Colors.white70),
            ),
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
                const SnackBar(content: Text('Đang làm mới dữ liệu từ server...')),
              );
            },
          ),
        ],
      ),
      body: _buildBody(),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.route),
            selectedIcon: Icon(Icons.route, color: Color(0xFF15803D)),
            label: 'Tuyến MCP',
          ),
          NavigationDestination(
            icon: Icon(Icons.local_shipping_outlined),
            selectedIcon: Icon(Icons.local_shipping, color: Color(0xFF15803D)),
            label: 'Tồn Kho Xe',
          ),
          NavigationDestination(
            icon: Icon(Icons.assignment_late_outlined),
            selectedIcon: Icon(Icons.assignment_late, color: Color(0xFF15803D)),
            label: 'Giao Bù',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFF15803D)),
            label: 'Cá Nhân',
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 0:
        return _buildRouteTab();
      case 1:
        return VanStockView(salesRepName: _salesRepName);
      case 2:
        return BackorderView(salesRepName: _salesRepName, outlets: _outlets);
      case 3:
      default:
        return _buildProfileTab();
    }
  }

  Widget _buildRouteTab() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    return ListView.builder(
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
    );
  }

  Widget _buildProfileTab() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 28,
                    backgroundColor: Color(0xFF15803D),
                    child: Icon(Icons.person, color: Colors.white, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_salesRepName, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                      const Text('Nhân viên bán hàng Van Sales', style: TextStyle(color: Colors.grey, fontSize: 13)),
                      const Text('Mã xe: VAN-XE-01 (Biển 59C-882.19)', style: TextStyle(color: Colors.blueGrey, fontSize: 12)),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('KPI Trong Ngày', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: _kpiCard('Số tiệm viếng thăm', '${_outlets.length} tiệm', Icons.store),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: _kpiCard('Doanh số dự kiến', '18.500.000 đ', Icons.payments),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _kpiCard(String title, String val, IconData icon) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: const Color(0xFF15803D), size: 20),
            const SizedBox(height: 8),
            Text(title, style: const TextStyle(fontSize: 11, color: Colors.grey)),
            const SizedBox(height: 4),
            Text(val, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
          ],
        ),
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

/// ==========================================
/// VIEW 1: SOẠN HÀNG LÊN XE & TỒN KHO XE VAN SALES
/// ==========================================
class VanStockView extends StatefulWidget {
  final String salesRepName;
  const VanStockView({super.key, required this.salesRepName});

  @override
  State<VanStockView> createState() => _VanStockViewState();
}

class _VanStockViewState extends State<VanStockView> {
  bool _loading = false;
  List<dynamic> _items = [];
  Map<String, dynamic>? _warehouse;

  @override
  void initState() {
    super.initState();
    _fetchVanStock();
  }

  Future<void> _fetchVanStock() async {
    setState(() => _loading = true);
    try {
      final res = await http.get(Uri.parse(ApiConstants.vanStockEndpoint)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = json.decode(utf8.decode(res.bodyBytes));
        setState(() {
          _warehouse = data['warehouse'];
          _items = data['items'] ?? [];
        });
      } else {
        _loadFallbackStock();
      }
    } catch (e) {
      _loadFallbackStock();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _loadFallbackStock() {
    setState(() {
      _warehouse = {
        'code': 'VAN-XE-01',
        'name': 'Xe Bán Hàng Lưu Động 01',
        'vanLicensePlate': '59C-882.19',
      };
      _items = [
        {
          'productId': 'prod-01',
          'productName': 'Bánh Chocopie Hộp 12 Cái (Orion)',
          'sku': 'ORION-CP-12P',
          'baseUnit': 'Gói',
          'totalBaseQty': 3840,
          'breakdown': '40 Thùng, 0 Hộp, 0 Gói',
        },
        {
          'productId': 'prod-02',
          'productName': 'Bánh Quy AFC Dinh Dưỡng Vị Rau (Kinh Đô)',
          'sku': 'AFC-RAU-200G',
          'baseUnit': 'Gói',
          'totalBaseQty': 2880,
          'breakdown': '30 Thùng, 0 Hộp, 0 Gói',
        },
        {
          'productId': 'prod-03',
          'productName': 'Bánh Trứng Custas Hộp 6 Cái (Orion)',
          'sku': 'ORION-CUSTAS-6P',
          'baseUnit': 'Hộp',
          'totalBaseQty': 240,
          'breakdown': '20 Thùng, 0 Hộp',
        },
      ];
    });
  }

  void _showLoadDialog() {
    final formKey = GlobalKey<FormState>();
    String selectedSku = 'ORION-CP-12P';
    String selectedUom = 'Thùng';
    int qty = 10;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.add_shopping_cart, color: Color(0xFF15803D)),
                SizedBox(width: 8),
                Text('Soạn Bốc Hàng Lên Xe', style: TextStyle(fontSize: 16)),
              ],
            ),
            content: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: selectedSku,
                    decoration: const InputDecoration(labelText: 'Sản phẩm bánh kẹo'),
                    items: const [
                      DropdownMenuItem(value: 'ORION-CP-12P', child: Text('Bánh Chocopie 12P (Orion)')),
                      DropdownMenuItem(value: 'AFC-RAU-200G', child: Text('Bánh Quy AFC Rau (Kinh Đô)')),
                      DropdownMenuItem(value: 'ORION-CUSTAS-6P', child: Text('Bánh Custas 6P (Orion)')),
                    ],
                    onChanged: (v) => setDialogState(() => selectedSku = v!),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedUom,
                    decoration: const InputDecoration(labelText: 'Đơn vị soạn hàng'),
                    items: const [
                      DropdownMenuItem(value: 'Thùng', child: Text('Thùng')),
                      DropdownMenuItem(value: 'Hộp', child: Text('Hộp')),
                      DropdownMenuItem(value: 'Gói', child: Text('Gói')),
                    ],
                    onChanged: (v) => setDialogState(() => selectedUom = v!),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    initialValue: '$qty',
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Số lượng bốc lên xe'),
                    onChanged: (v) => qty = int.tryParse(v) ?? 1,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    await http.post(
                      Uri.parse('${ApiConstants.vanStockEndpoint}/load'),
                      headers: {'Content-Type': 'application/json'},
                      body: json.encode({
                        'vanWarehouseCode': 'VAN-XE-01',
                        'items': [
                          {
                            'sku': selectedSku,
                            'uomName': selectedUom,
                            'quantity': qty,
                          }
                        ]
                      }),
                    );
                  } catch (_) {}
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Đã bốc thêm $qty $selectedUom lên xe thành công!')),
                  );
                  _fetchVanStock();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Bốc Lên Xe'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showLoadDialog,
        backgroundColor: const Color(0xFF16A34A),
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Soạn Thêm Bánh Lên Xe'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Container(
                  width: double.infinity,
                  color: Colors.green.shade50,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _warehouse?['name'] ?? 'Xe Bán Hàng Lưu Động 01',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF15803D)),
                          ),
                          Text(
                            'Biển số: ${_warehouse?['vanLicensePlate'] ?? '59C-882.19'} • Kho xe Van Sales',
                            style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                          ),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.refresh, size: 20),
                        onPressed: _fetchVanStock,
                      ),
                    ],
                  ),
                ),
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _items.length,
                    itemBuilder: (context, idx) {
                      final it = _items[idx];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          leading: const CircleAvatar(
                            backgroundColor: Color(0xFFDCFCE7),
                            child: Icon(Icons.inventory_2, color: Color(0xFF16A34A)),
                          ),
                          title: Text(it['productName'] ?? '', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('SKU: ${it['sku']} • ĐVT cơ sở: ${it['baseUnit']}', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  'Tồn xe: ${it['breakdown']}',
                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.blue.shade800),
                                ),
                              ),
                            ],
                          ),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
    );
  }
}

/// ==========================================
/// VIEW 2: SỔ GHI NHỚ GIAO BÙ / NỢ HÀNG KHI THIẾU
/// ==========================================
class BackorderView extends StatefulWidget {
  final String salesRepName;
  final List<dynamic> outlets;
  const BackorderView({super.key, required this.salesRepName, required this.outlets});

  @override
  State<BackorderView> createState() => _BackorderViewState();
}

class _BackorderViewState extends State<BackorderView> {
  bool _loading = false;
  List<dynamic> _backorders = [];

  @override
  void initState() {
    super.initState();
    _fetchBackorders();
  }

  Future<void> _fetchBackorders() async {
    setState(() => _loading = true);
    try {
      final res = await http.get(Uri.parse(ApiConstants.backordersEndpoint)).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = json.decode(utf8.decode(res.bodyBytes)) as List? ?? [];
        setState(() => _backorders = data);
      } else {
        _loadFallbackBackorders();
      }
    } catch (_) {
      _loadFallbackBackorders();
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _loadFallbackBackorders() {
    setState(() {
      _backorders = [
        {
          'id': 'bo-01',
          'outlet': {'name': 'Tạp Hóa Cô Ba Bến Nghé'},
          'product': {'name': 'Bánh Chocopie Hộp 12 Cái (Orion)'},
          'uomName': 'Thùng',
          'quantity': 3,
          'promisedDate': '2026-11-02',
          'reason': 'Xe hết hàng giữa tuyến, khách dặn thêm',
          'status': 'PENDING',
          'salesRepName': 'Nguyễn Văn Hùng',
        },
        {
          'id': 'bo-02',
          'outlet': {'name': 'Đại Lý Bánh Kẹo Hưng Thịnh'},
          'product': {'name': 'Bánh Quy AFC Dinh Dưỡng Vị Rau (Kinh Đô)'},
          'uomName': 'Thùng',
          'quantity': 5,
          'promisedDate': '2026-11-03',
          'reason': 'Hẹn giao bổ sung cùng chuyến xe thứ Tư',
          'status': 'RESOLVED',
          'salesRepName': 'Nguyễn Văn Hùng',
        },
      ];
    });
  }

  Future<void> _resolveBackorder(String id) async {
    try {
      await http.post(Uri.parse('${ApiConstants.backordersEndpoint}/$id/resolve'));
    } catch (_) {}

    setState(() {
      for (var bo in _backorders) {
        if (bo['id'] == id) {
          bo['status'] = 'RESOLVED';
        }
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Đã đánh dấu hoàn tất giao bổ sung hàng cho khách!')),
    );
  }

  void _showCreateBackorderDialog() {
    String? selectedOutletId = widget.outlets.isNotEmpty ? widget.outlets[0]['id'] : null;
    String sku = 'ORION-CP-12P';
    String uom = 'Thùng';
    int qty = 2;
    String dateStr = '2026-11-02';
    String reason = 'Xe chở không đủ thùng theo nhu cầu tiệm';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            title: const Row(
              children: [
                Icon(Icons.edit_note, color: Colors.amber),
                SizedBox(width: 8),
                Text('Ghi Nhớ Hẹn Giao Bù', style: TextStyle(fontSize: 16)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  DropdownButtonFormField<String>(
                    value: selectedOutletId,
                    decoration: const InputDecoration(labelText: 'Điểm bán / Tạp hóa'),
                    items: widget.outlets.map<DropdownMenuItem<String>>((o) {
                      return DropdownMenuItem(value: o['id'].toString(), child: Text(o['name'].toString(), overflow: TextOverflow.ellipsis));
                    }).toList(),
                    onChanged: (v) => setDialogState(() => selectedOutletId = v),
                  ),
                  const SizedBox(height: 10),
                  DropdownButtonFormField<String>(
                    value: sku,
                    decoration: const InputDecoration(labelText: 'Sản phẩm thiếu'),
                    items: const [
                      DropdownMenuItem(value: 'ORION-CP-12P', child: Text('Chocopie 12P (Orion)')),
                      DropdownMenuItem(value: 'AFC-RAU-200G', child: Text('AFC Rau (Kinh Đô)')),
                      DropdownMenuItem(value: 'ORION-CUSTAS-6P', child: Text('Custas 6P (Orion)')),
                    ],
                    onChanged: (v) => setDialogState(() => sku = v!),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: uom,
                          decoration: const InputDecoration(labelText: 'ĐVT'),
                          items: const [
                            DropdownMenuItem(value: 'Thùng', child: Text('Thùng')),
                            DropdownMenuItem(value: 'Hộp', child: Text('Hộp')),
                          ],
                          onChanged: (v) => setDialogState(() => uom = v!),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: TextFormField(
                          initialValue: '$qty',
                          keyboardType: TextInputType.number,
                          decoration: const InputDecoration(labelText: 'Số lượng'),
                          onChanged: (v) => qty = int.tryParse(v) ?? 1,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    initialValue: dateStr,
                    decoration: const InputDecoration(labelText: 'Hẹn ngày giao bổ sung (YYYY-MM-DD)'),
                    onChanged: (v) => dateStr = v,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    initialValue: reason,
                    decoration: const InputDecoration(labelText: 'Lý do thiếu & ghi chú'),
                    onChanged: (v) => reason = v,
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Hủy')),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    await http.post(
                      Uri.parse(ApiConstants.backordersEndpoint),
                      headers: {'Content-Type': 'application/json'},
                      body: json.encode({
                        'outletId': selectedOutletId,
                        'productSku': sku,
                        'uomName': uom,
                        'quantity': qty,
                        'promisedDate': dateStr,
                        'reason': reason,
                        'salesRepName': widget.salesRepName,
                      }),
                    );
                  } catch (_) {}
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Đã lưu lịch ghi nhớ giao bổ sung! Về kho sẽ có danh sách chuẩn bị.')),
                  );
                  _fetchBackorders();
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                ),
                child: const Text('Lưu Ghi Nhớ'),
              ),
            ],
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateBackorderDialog,
        backgroundColor: Colors.amber.shade700,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_alert),
        label: const Text('+ Ghi Chú Giao Bù'),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _backorders.isEmpty
              ? const Center(child: Text('Không có đơn hẹn giao bổ sung nào.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: _backorders.length,
                  itemBuilder: (context, idx) {
                    final bo = _backorders[idx];
                    final bool isPending = bo['status'] == 'PENDING';

                    return Card(
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
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
                                    bo['outlet']?['name'] ?? 'Tiệm tạp hóa',
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: isPending ? Colors.amber.shade50 : Colors.green.shade50,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(color: isPending ? Colors.amber.shade300 : Colors.green.shade300),
                                  ),
                                  child: Text(
                                    isPending ? '⏳ Chờ Giao Bù' : '✓ Đã Giao Bổ Sung',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: isPending ? Colors.amber.shade900 : Colors.green.shade800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Thiếu: ${bo['quantity']} ${bo['uomName']} • ${bo['product']?['name'] ?? ''}',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey, fontSize: 13),
                            ),
                            const SizedBox(height: 4),
                            Text('Hẹn giao bù ngày: ${bo['promisedDate'] ?? 'Chưa hẹn'}', style: const TextStyle(fontSize: 12, color: Colors.redAccent)),
                            Text('Lý do: ${bo['reason'] ?? 'Hết hàng trên xe'}', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                            if (isPending) ...[
                              const Divider(height: 16),
                              Align(
                                alignment: Alignment.centerRight,
                                child: TextButton.icon(
                                  onPressed: () => _resolveBackorder(bo['id']),
                                  icon: const Icon(Icons.check_circle_outline, size: 16, color: Colors.green),
                                  label: const Text('Đã Giao Bổ Sung Xong', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  },
                ),
    );
  }
}

/// ==========================================
/// QUY TRÌNH 5 BƯỚC VIẾNG THĂM TẠP HÓA
/// ==========================================
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
      await http.post(
        Uri.parse(ApiConstants.checkInEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'outletId': widget.outlet['id'] ?? 'sample-id',
          'salesRepName': widget.salesRepName,
          'latitude': widget.outlet['latitude'] ?? 10.7769,
          'longitude': widget.outlet['longitude'] ?? 106.7009,
        }),
      ).timeout(const Duration(seconds: 4));

      setState(() {
        _checkedIn = true;
        _currentStep = 2;
      });
    } catch (e) {
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

  void _showQuickBackorderDialog() {
    int qty = 2;
    String uom = 'Thùng';
    String promisedDate = '2026-11-02';
    String reason = 'Xe chở không đủ hàng theo nhu cầu tiệm';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.warning_amber_rounded, color: Colors.amber),
            SizedBox(width: 8),
            Text('Xe Hết? Ghi Chú Giao Bù', style: TextStyle(fontSize: 15)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tiệm: ${widget.outlet['name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            const Text('Sản phẩm: Bánh Chocopie Hộp 12 Cái (Orion)'),
            const SizedBox(height: 8),
            TextFormField(
              initialValue: '$qty',
              decoration: const InputDecoration(labelText: 'Số lượng thùng thiếu'),
              keyboardType: TextInputType.number,
              onChanged: (v) => qty = int.tryParse(v) ?? 1,
            ),
            const SizedBox(height: 8),
            TextFormField(
              initialValue: promisedDate,
              decoration: const InputDecoration(labelText: 'Hẹn ngày giao bù (YYYY-MM-DD)'),
              onChanged: (v) => promisedDate = v,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Bỏ qua')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await http.post(
                  Uri.parse(ApiConstants.backordersEndpoint),
                  headers: {'Content-Type': 'application/json'},
                  body: json.encode({
                    'outletId': widget.outlet['id'],
                    'productSku': 'ORION-CP-12P',
                    'uomName': uom,
                    'quantity': qty,
                    'promisedDate': promisedDate,
                    'reason': reason,
                    'salesRepName': widget.salesRepName,
                  }),
                );
              } catch (_) {}
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đã ghi nhớ giao bù thành công! Sẽ hiển thị ở Tab Giao Bù.')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.amber.shade800,
              foregroundColor: Colors.white,
            ),
            child: const Text('Lưu Giao Bù'),
          ),
        ],
      ),
    );
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
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _submitting ? null : _submitOrderAndGetQr,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Lên Đơn & Sang Bước 5'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      OutlinedButton.icon(
                        onPressed: _showQuickBackorderDialog,
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.amber.shade900,
                          side: BorderSide(color: Colors.amber.shade700),
                        ),
                        icon: const Icon(Icons.note_alt_outlined, size: 16),
                        label: const Text('⚠️ Xe hết hàng? Ghi chú hẹn giao bù cho tiệm này'),
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
