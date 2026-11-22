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
  List<dynamic> _allOutlets = [];
  String _selectedDay = 'Thứ Hai';
  String _selectedRouteCode = 'TUYEN-Q1-T2';
  final String _salesRepName = 'Nguyễn Văn Hùng';

  // Tìm kiếm và Lọc trạng thái
  String _searchQuery = '';
  String _selectedStatusFilter = 'ALL'; // 'ALL', 'UNVISITED', 'ORDERED', 'NO_SALE'
  final TextEditingController _searchController = TextEditingController();

  final List<Map<String, String>> _routeList = [
    {'code': 'ALL', 'name': 'Tất Cả Các Tuyến', 'day': 'Toàn Bộ'},
    {'code': 'TUYEN-Q1-T2', 'name': 'Tuyến Q.1 (Bến Nghé - Nguyễn Huệ)', 'day': 'Thứ Hai'},
    {'code': 'TUYEN-BT-T3', 'name': 'Tuyến Bình Thạnh (Thị Nghè - Bạch Đằng)', 'day': 'Thứ Ba'},
    {'code': 'TUYEN-Q5-T4', 'name': 'Tuyến Q.5 (Chợ Lớn - An Đông)', 'day': 'Thứ Tư'},
    {'code': 'TUYEN-Q10-T5', 'name': 'Tuyến Q.10 (Sư Vạn Hạnh - Tô Hiến Thành)', 'day': 'Thứ Năm'},
    {'code': 'TUYEN-TB-T6', 'name': 'Tuyến Tân Bình (Cộng Hòa - Hoàng Hoa Thám)', 'day': 'Thứ Sáu'},
    {'code': 'TUYEN-GV-T7', 'name': 'Tuyến Gò Vấp (Quang Trung - Lê Đức Thọ)', 'day': 'Thứ Bảy'},
  ];

  @override
  void initState() {
    super.initState();
    _fetchTodayMcp();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _fetchTodayMcp() async {
    setState(() => _loading = true);
    try {
      final response = await http.get(
        Uri.parse('${ApiConstants.todayMcpEndpoint}?salesRepName=$_salesRepName'),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = json.decode(utf8.decode(response.bodyBytes));
        final routes = data['routes'] as List? ?? [];
        if (routes.isNotEmpty) {
          setState(() {
            _selectedDay = routes[0]['dayOfWeek'] ?? 'Thứ Hai';
            _allOutlets = routes[0]['outlets'] ?? [];
          });
          return;
        }
      }
      _loadFallbackData();
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
      _allOutlets = [
        // Tuyến Q1 - Thứ 2
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
          'routeCode': 'TUYEN-Q1-T2',
          'dayOfWeek': 'Thứ Hai',
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
          'routeCode': 'TUYEN-Q1-T2',
          'dayOfWeek': 'Thứ Hai',
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
          'routeCode': 'TUYEN-Q1-T2',
          'dayOfWeek': 'Thứ Hai',
        },
        // Tuyến Bình Thạnh - Thứ 3
        {
          'id': 'out-04',
          'code': 'TH-004',
          'name': 'Tạp Hóa Bác Năm Thị Nghè',
          'address': '145 Xô Viết Nghệ Tĩnh, Bình Thạnh',
          'ownerName': 'Trần Văn Năm',
          'phone': '0933556677',
          'currentDebt': 2100000,
          'creditLimit': 10000000,
          'latitude': 10.8015,
          'longitude': 106.7123,
          'status': 'Chưa ghé thăm',
          'routeCode': 'TUYEN-BT-T3',
          'dayOfWeek': 'Thứ Ba',
        },
        {
          'id': 'out-05',
          'code': 'TH-005',
          'name': 'Đại Lý Bánh Kẹo Minh Tâm',
          'address': '210 Bạch Đằng, P.24, Bình Thạnh',
          'ownerName': 'Hoàng Minh Tâm',
          'phone': '0944112288',
          'currentDebt': 6800000,
          'creditLimit': 15000000,
          'latitude': 10.8032,
          'longitude': 106.7088,
          'status': 'Chưa ghé thăm',
          'routeCode': 'TUYEN-BT-T3',
          'dayOfWeek': 'Thứ Ba',
        },
        // Tuyến Quận 5 - Thứ 4
        {
          'id': 'out-06',
          'code': 'TH-006',
          'name': 'Tiệm Tạp Hóa Chú Hỏa Chợ Lớn',
          'address': '56 Trần Hưng Đạo, P.7, Quận 5',
          'ownerName': 'Vương Gia Hỏa',
          'phone': '0908889911',
          'currentDebt': 3400000,
          'creditLimit': 12000000,
          'latitude': 10.7541,
          'longitude': 106.6672,
          'status': 'Chưa ghé thăm',
          'routeCode': 'TUYEN-Q5-T4',
          'dayOfWeek': 'Thứ Tư',
        },
        // Tuyến Quận 10 - Thứ 5
        {
          'id': 'out-07',
          'code': 'TH-007',
          'name': 'Tạp Hóa Cô Mai Sư Vạn Hạnh',
          'address': '312 Sư Vạn Hạnh, P.12, Quận 10',
          'ownerName': 'Ngô Thị Tuyết Mai',
          'phone': '0912334455',
          'currentDebt': 1900000,
          'creditLimit': 8000000,
          'latitude': 10.7712,
          'longitude': 106.6698,
          'status': 'Chưa ghé thăm',
          'routeCode': 'TUYEN-Q10-T5',
          'dayOfWeek': 'Thứ Năm',
        },
        // Tuyến Tân Bình - Thứ 6
        {
          'id': 'out-08',
          'code': 'TH-008',
          'name': 'Tạp Hóa Hương Sen Hoàng Hoa Thám',
          'address': '108 Hoàng Hoa Thám, P.12, Tân Bình',
          'ownerName': 'Đặng Hương Sen',
          'phone': '0938445566',
          'currentDebt': 4100000,
          'creditLimit': 10000000,
          'latitude': 10.7988,
          'longitude': 106.6491,
          'status': 'Chưa ghé thăm',
          'routeCode': 'TUYEN-TB-T6',
          'dayOfWeek': 'Thứ Sáu',
        },
        // Tuyến Gò Vấp - Thứ 7
        {
          'id': 'out-09',
          'code': 'TH-009',
          'name': 'Tạp Hóa Kim Oanh Quang Trung',
          'address': '246 Quang Trung, P.10, Gò Vấp',
          'ownerName': 'Vũ Kim Oanh',
          'phone': '0966778899',
          'currentDebt': 2800000,
          'creditLimit': 8000000,
          'latitude': 10.8288,
          'longitude': 106.6651,
          'status': 'Chưa ghé thăm',
          'routeCode': 'TUYEN-GV-T7',
          'dayOfWeek': 'Thứ Bảy',
        },
      ];
    });
  }

  List<dynamic> _getFilteredOutlets() {
    return _allOutlets.where((item) {
      // 1. Lọc theo tuyến
      if (_selectedRouteCode != 'ALL' && item['routeCode'] != _selectedRouteCode) {
        return false;
      }

      // 2. Lọc theo trạng thái
      final status = (item['status'] ?? 'Chưa ghé thăm').toString();
      if (_selectedStatusFilter == 'UNVISITED' && status != 'Chưa ghé thăm') {
        return false;
      }
      if (_selectedStatusFilter == 'ORDERED' && status != 'Đã lên đơn') {
        return false;
      }
      if (_selectedStatusFilter == 'NO_SALE' &&
          !status.startsWith('Không mua') &&
          !status.startsWith('Đóng cửa')) {
        return false;
      }

      // 3. Tìm kiếm theo từ khóa
      if (_searchQuery.trim().isNotEmpty) {
        final query = _searchQuery.trim().toLowerCase();
        final name = (item['name'] ?? '').toString().toLowerCase();
        final code = (item['code'] ?? '').toString().toLowerCase();
        final owner = (item['ownerName'] ?? '').toString().toLowerCase();
        final phone = (item['phone'] ?? '').toString().toLowerCase();
        final address = (item['address'] ?? '').toString().toLowerCase();

        if (!name.contains(query) &&
            !code.contains(query) &&
            !owner.contains(query) &&
            !phone.contains(query) &&
            !address.contains(query)) {
          return false;
        }
      }

      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final routeInfo = _routeList.firstWhere(
      (r) => r['code'] == _selectedRouteCode,
      orElse: () => _routeList[0],
    );

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'SFA Di Động • Bán Hàng FMCG',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            Text(
              'Tuyến: ${routeInfo['name']} (${routeInfo['day']})',
              style: const TextStyle(fontSize: 12, color: Colors.white70),
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
        backgroundColor: const Color(0xFF15803D),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.add_business),
            tooltip: 'Mở điểm bán mới',
            onPressed: _showCreateOutletDialog,
          ),
          IconButton(
            icon: const Icon(Icons.sync),
            tooltip: 'Đồng bộ dữ liệu ngoại tuyến',
            onPressed: () {
              _fetchTodayMcp();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đang làm mới dữ liệu từ máy chủ...')),
              );
            },
          ),
        ],
      ),
      body: _buildBody(),
      floatingActionButton: _currentIndex == 0
          ? FloatingActionButton.extended(
              onPressed: _showCreateOutletDialog,
              backgroundColor: const Color(0xFF15803D),
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add_business),
              label: const Text('Mở Tiệm Mới', style: TextStyle(fontWeight: FontWeight.bold)),
            )
          : null,
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
        return BackorderView(salesRepName: _salesRepName, outlets: _allOutlets);
      case 3:
      default:
        return _buildProfileTab();
    }
  }

  Widget _buildRouteHeader() {
    final outletsInScope = _selectedRouteCode == 'ALL'
        ? _allOutlets
        : _allOutlets.where((o) => o['routeCode'] == _selectedRouteCode).toList();
    final int totalCount = outletsInScope.length;
    final int doneCount = outletsInScope
        .where((o) =>
            o['status'] == 'Đã lên đơn' ||
            o['status']?.toString().startsWith('Không mua') == true ||
            o['status']?.toString().startsWith('Đóng cửa') == true)
        .length;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 8, offset: const Offset(0, 2)),
        ],
        border: Border.all(color: Colors.green.shade100),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Tuyến MCP Dropdown
          Row(
            children: [
              const CircleAvatar(
                radius: 16,
                backgroundColor: Color(0xFFDCFCE7),
                child: Icon(Icons.route, color: Color(0xFF15803D), size: 18),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Chọn Tuyến Đi Thị Trường (MCP):', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    DropdownButton<String>(
                      value: _selectedRouteCode,
                      isExpanded: true,
                      underline: const SizedBox(),
                      icon: const Icon(Icons.arrow_drop_down, color: Color(0xFF15803D)),
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black87),
                      items: _routeList.map((r) {
                        return DropdownMenuItem<String>(
                          value: r['code'],
                          child: Text('${r['day']} - ${r['name']}', maxLines: 1, overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedRouteCode = val;
                            final found = _routeList.firstWhere((r) => r['code'] == val);
                            _selectedDay = found['day']!;
                          });
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Lọc Thứ trong tuần
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: _routeList.map((r) {
                final bool isSelected = _selectedRouteCode == r['code'];
                return Padding(
                  padding: const EdgeInsets.only(right: 6),
                  child: FilterChip(
                    label: Text(r['day'] == 'Toàn Bộ' ? 'Tất Cả Tuyến' : r['day']!),
                    selected: isSelected,
                    selectedColor: const Color(0xFF15803D),
                    labelStyle: TextStyle(
                      fontSize: 11,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                      color: isSelected ? Colors.white : Colors.black87,
                    ),
                    backgroundColor: Colors.grey.shade100,
                    checkmarkColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    onSelected: (_) {
                      setState(() {
                        _selectedRouteCode = r['code']!;
                        _selectedDay = r['day']!;
                      });
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 10),

          // Ô TÌM KIẾM NHANH ĐIỂM BÁN
          Container(
            height: 42,
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: TextField(
              controller: _searchController,
              onChanged: (v) => setState(() => _searchQuery = v),
              style: const TextStyle(fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Tìm theo tên tiệm, chủ tiệm, SĐT, địa chỉ...',
                hintStyle: TextStyle(fontSize: 12, color: Colors.grey.shade500),
                prefixIcon: const Icon(Icons.search, size: 18, color: Colors.grey),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 16, color: Colors.grey),
                        onPressed: () {
                          setState(() {
                            _searchController.clear();
                            _searchQuery = '';
                          });
                        },
                      )
                    : null,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(vertical: 10),
              ),
            ),
          ),
          const SizedBox(height: 8),

          // BỘ LỌC TRẠNG THÁI (TẤT CẢ / CHƯA GHÉ / ĐÃ LÊN ĐƠN / KHÔNG MUA)
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                _statusFilterChip('ALL', 'Tất Cả (${totalCount})', Icons.storefront),
                _statusFilterChip('UNVISITED', 'Chưa Ghé', Icons.schedule),
                _statusFilterChip('ORDERED', 'Đã Lên Đơn', Icons.check_circle_outline),
                _statusFilterChip('NO_SALE', 'Không Mua / Đóng Cửa', Icons.block),
              ],
            ),
          ),

          const Divider(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Tiến độ viếng thăm: $doneCount/$totalCount tiệm',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green.shade800),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: doneCount == totalCount && totalCount > 0 ? Colors.green.shade50 : Colors.amber.shade50,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  '${totalCount > 0 ? ((doneCount / totalCount) * 100).toInt() : 0}% đạt',
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: doneCount == totalCount && totalCount > 0 ? Colors.green.shade800 : Colors.amber.shade900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: _showCreateOutletDialog,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF15803D),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 10),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              icon: const Icon(Icons.add_business, size: 18),
              label: const Text('+ Mở Điểm Bán Mới (Thêm Tạp Hóa Mới)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _statusFilterChip(String code, String label, IconData icon) {
    final bool isSelected = _selectedStatusFilter == code;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: FilterChip(
        avatar: Icon(
          icon,
          size: 14,
          color: isSelected ? Colors.white : Colors.grey.shade700,
        ),
        label: Text(label),
        selected: isSelected,
        selectedColor: const Color(0xFF15803D),
        labelStyle: TextStyle(
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? Colors.white : Colors.black87,
        ),
        backgroundColor: Colors.white,
        side: BorderSide(color: isSelected ? const Color(0xFF15803D) : Colors.grey.shade300),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        onSelected: (_) {
          setState(() => _selectedStatusFilter = code);
        },
      ),
    );
  }

  Widget _buildRouteTab() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    final filtered = _getFilteredOutlets();

    return ListView(
      padding: const EdgeInsets.all(12),
      children: [
        _buildRouteHeader(),
        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.all(32),
            child: Center(
              child: Column(
                children: [
                  Icon(Icons.search_off, size: 48, color: Colors.grey.shade400),
                  const SizedBox(height: 8),
                  Text(
                    _searchQuery.isNotEmpty
                        ? 'Không tìm thấy điểm bán nào khớp với "$_searchQuery"!'
                        : 'Không có điểm bán nào trong bộ lọc này!',
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
          )
        else
          ...filtered.map((item) => _buildOutletCard(item)),
      ],
    );
  }

  Widget _buildOutletCard(Map<String, dynamic> item) {
    final String status = item['status'] ?? 'Chưa ghé thăm';
    final bool isDone = status == 'Đã lên đơn';
    final bool isNoSale = status.startsWith('Không mua') || status.startsWith('Đóng cửa');

    Color badgeColor = Colors.amber.shade800;
    Color badgeBg = Colors.amber.shade50;
    Color badgeBorder = Colors.amber.shade200;
    IconData badgeIcon = Icons.schedule;

    if (isDone) {
      badgeColor = Colors.green.shade800;
      badgeBg = Colors.green.shade50;
      badgeBorder = Colors.green.shade200;
      badgeIcon = Icons.check_circle;
    } else if (isNoSale) {
      badgeColor = Colors.blueGrey.shade700;
      badgeBg = Colors.blueGrey.shade50;
      badgeBorder = Colors.blueGrey.shade200;
      badgeIcon = Icons.cancel_outlined;
    }

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
                    item['code'] ?? '',
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, fontFamily: 'monospace'),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: badgeBorder),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(badgeIcon, size: 12, color: badgeColor),
                      const SizedBox(width: 4),
                      Text(
                        status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: badgeColor,
                        ),
                      ),
                    ],
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
            Row(
              children: [
                Icon(Icons.person_pin, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(
                  '${item['ownerName'] ?? 'Chủ tiệm'} • ĐT: ${item['phone'] ?? ''}',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade700, fontWeight: FontWeight.w500),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Row(
              children: [
                Icon(Icons.location_on_outlined, size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    item['address'] ?? '',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const Divider(height: 18),
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
                // TIỆN ÍCH NHANH: GỌI ĐIỆN & CHỈ ĐƯỜNG
                Row(
                  children: [
                    IconButton.filledTonal(
                      tooltip: 'Gọi điện cho chủ tiệm',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.blue.shade50,
                        foregroundColor: Colors.blue.shade700,
                        padding: const EdgeInsets.all(8),
                        minimumSize: const Size(36, 36),
                      ),
                      icon: const Icon(Icons.phone, size: 16),
                      onPressed: () => _showCallDialog(item),
                    ),
                    const SizedBox(width: 6),
                    IconButton.filledTonal(
                      tooltip: 'Chỉ đường Google Maps',
                      style: IconButton.styleFrom(
                        backgroundColor: Colors.teal.shade50,
                        foregroundColor: Colors.teal.shade700,
                        padding: const EdgeInsets.all(8),
                        minimumSize: const Size(36, 36),
                      ),
                      icon: const Icon(Icons.near_me, size: 16),
                      onPressed: () => _showDirectionsDialog(item),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 12),

            // NÚT BÁO KHÔNG MUA / ĐÓNG CỬA (RẤT QUAN TRỌNG TRONG FMCG)
            if (!isDone && !isNoSale) ...[
              OutlinedButton.icon(
                onPressed: () => _showNoSaleDialog(item),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.blueGrey.shade700,
                  side: BorderSide(color: Colors.blueGrey.shade300),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  minimumSize: const Size(double.infinity, 36),
                ),
                icon: const Icon(Icons.cancel_presentation, size: 15),
                label: const Text('Báo Không Mua Hàng / Đóng Cửa (Lưu KPI)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(height: 8),
            ],

            // 2 NÚT THAO TÁC CHÍNH: LÊN ĐƠN NHANH & QUY TRÌNH 5 BƯỚC
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      _openVisitFlow(context, item, initialStep: 4); // Bỏ qua các bước đầu ➔ Vào thẳng Bước 4
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFFD97706),
                      side: const BorderSide(color: Color(0xFFD97706), width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.bolt, size: 16),
                    label: const Text('Lên Đơn Nhanh', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      _openVisitFlow(context, item, initialStep: 1); // Quy trình tuần tự từ Bước 1
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                    icon: const Icon(Icons.storefront, size: 16),
                    label: const Text('Viếng Thăm (5 Bước)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showNoSaleDialog(Map<String, dynamic> item) {
    String selectedReason = 'Còn nhiều hàng tồn kho bánh kẹo';
    final reasons = [
      'Còn nhiều hàng tồn kho bánh kẹo',
      'Chủ tiệm vắng mặt / Đi vắng',
      'Cửa hàng đóng cửa / Đang sửa chữa',
      'Chê giá cao / Đang chờ khuyến mãi khác',
      'Không có nhu cầu nhập chuyến này',
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.report_problem_outlined, color: Colors.amber.shade800),
              const SizedBox(width: 8),
              const Text('Ghi Nhận Không Mua', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Điểm bán: ${item['name']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 12),
              const Text('Lý do không đặt hàng hôm nay:', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 6),
              ...reasons.map((r) => RadioListTile<String>(
                title: Text(r, style: const TextStyle(fontSize: 13)),
                value: r,
                groupValue: selectedReason,
                dense: true,
                contentPadding: EdgeInsets.zero,
                activeColor: const Color(0xFF15803D),
                onChanged: (val) {
                  if (val != null) setDialogState(() => selectedReason = val);
                },
              )),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Hủy bỏ'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                setState(() {
                  item['status'] = 'Không mua (${selectedReason})';
                });
                try {
                  await http.post(
                    Uri.parse(ApiConstants.checkOutEndpoint),
                    headers: {'Content-Type': 'application/json'},
                    body: json.encode({
                      'visitId': item['id'] ?? 'mock-visit',
                      'hasOrder': false,
                      'noOrderReason': selectedReason,
                      'notes': 'Sales ghi nhận không mua trực tiếp trên app SFA',
                    }),
                  );
                } catch (_) {}
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Đã ghi nhận: ${item['name']} không mua (${selectedReason})'),
                      backgroundColor: Colors.blueGrey.shade800,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF15803D),
                foregroundColor: Colors.white,
              ),
              child: const Text('Lưu Kết Quả'),
            ),
          ],
        ),
      ),
    );
  }

  void _showCallDialog(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.phone, color: Colors.blue),
            SizedBox(width: 8),
            Text('Gọi Điện Cho Khách'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tiệm: ${item['name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('Chủ tiệm: ${item['ownerName']}'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.blue.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  const Icon(Icons.phone_in_talk, color: Colors.blue),
                  const SizedBox(width: 10),
                  Text(
                    item['phone'] ?? 'Chưa có SĐT',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.blue),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Đóng')),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Đang kết nối cuộc gọi tới ${item['phone']}...')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.blue, foregroundColor: Colors.white),
            icon: const Icon(Icons.call, size: 16),
            label: const Text('Bấm Gọi Ngay'),
          ),
        ],
      ),
    );
  }

  void _showDirectionsDialog(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.map, color: Colors.teal),
            SizedBox(width: 8),
            Text('Chỉ Đường Đến Tiệm'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Tiệm: ${item['name']}', style: const TextStyle(fontWeight: FontWeight.bold)),
            Text('Địa chỉ: ${item['address']}'),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.teal.shade50,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Tọa độ GPS: ${item['latitude']}, ${item['longitude']}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                  const SizedBox(height: 4),
                  const Text('Dẫn đường Google Maps tối ưu lộ trình cho xe Van Sales', style: TextStyle(fontSize: 11, color: Colors.grey)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Đóng')),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text('Đã định vị tọa độ GPS điểm bán ${item['name']}')),
              );
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
            icon: const Icon(Icons.directions, size: 16),
            label: const Text('Dẫn Đường'),
          ),
        ],
      ),
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
                child: _kpiCard('Số tiệm viếng thăm', '${_allOutlets.length} tiệm', Icons.store),
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

  void _showCreateOutletDialog() {
    final formKey = GlobalKey<FormState>();
    String storeName = '';
    String ownerName = '';
    String phone = '';
    String address = '';
    String targetRouteCode = _selectedRouteCode == 'ALL' ? 'TUYEN-Q1-T2' : _selectedRouteCode;
    int creditLimit = 10000000;
    const double lat = 10.7769;
    const double lng = 106.7009;
    bool isSubmitting = false;

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Row(
            children: [
              Icon(Icons.add_business, color: Color(0xFF15803D)),
              SizedBox(width: 8),
              Text('Mở Điểm Bán Mới', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Form(
                key: formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Thông tin tiệm tạp hóa mới phát hiện:', style: TextStyle(fontSize: 11, color: Colors.grey)),
                    const SizedBox(height: 10),

                    // Tên tiệm
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Tên Tiệm Tạp Hóa *',
                        hintText: 'VD: Tạp Hóa Bảy Cường',
                        isDense: true,
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.store, size: 18),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập tên tiệm' : null,
                      onChanged: (v) => storeName = v,
                    ),
                    const SizedBox(height: 10),

                    // Chủ tiệm & SĐT
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            decoration: const InputDecoration(
                              labelText: 'Chủ Tiệm *',
                              hintText: 'VD: Nguyễn Văn Cường',
                              isDense: true,
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.person, size: 18),
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Nhập tên chủ' : null,
                            onChanged: (v) => ownerName = v,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextFormField(
                            keyboardType: TextInputType.phone,
                            decoration: const InputDecoration(
                              labelText: 'Số ĐT *',
                              hintText: '0909123456',
                              isDense: true,
                              border: OutlineInputBorder(),
                              prefixIcon: Icon(Icons.phone, size: 18),
                            ),
                            validator: (v) => (v == null || v.trim().isEmpty) ? 'Nhập SĐT' : null,
                            onChanged: (v) => phone = v,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),

                    // Địa chỉ
                    TextFormField(
                      decoration: const InputDecoration(
                        labelText: 'Địa Chỉ Chi Tiết *',
                        hintText: 'Số nhà, tên đường, phường...',
                        isDense: true,
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.location_on, size: 18),
                      ),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Vui lòng nhập địa chỉ' : null,
                      onChanged: (v) => address = v,
                    ),
                    const SizedBox(height: 10),

                    // Gán vào Tuyến MCP nào
                    DropdownButtonFormField<String>(
                      value: targetRouteCode,
                      decoration: const InputDecoration(
                        labelText: 'Gán Vào Tuyến MCP *',
                        isDense: true,
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.route, size: 18),
                      ),
                      items: _routeList.where((r) => r['code'] != 'ALL').map((r) {
                        return DropdownMenuItem<String>(
                          value: r['code'],
                          child: Text('${r['day']} - ${r['name']}', style: const TextStyle(fontSize: 12), overflow: TextOverflow.ellipsis),
                        );
                      }).toList(),
                      onChanged: (v) {
                        if (v != null) targetRouteCode = v;
                      },
                    ),
                    const SizedBox(height: 10),

                    // Hạn mức nợ gối đầu
                    DropdownButtonFormField<int>(
                      value: creditLimit,
                      decoration: const InputDecoration(
                        labelText: 'Hạn Mức Nợ Gối Đầu',
                        isDense: true,
                        border: OutlineInputBorder(),
                        prefixIcon: Icon(Icons.credit_score, size: 18),
                      ),
                      items: const [
                        DropdownMenuItem(value: 5000000, child: Text('5.000.000 đ')),
                        DropdownMenuItem(value: 10000000, child: Text('10.000.000 đ (Chuẩn)')),
                        DropdownMenuItem(value: 20000000, child: Text('20.000.000 đ (Lớn)')),
                        DropdownMenuItem(value: 50000000, child: Text('50.000.000 đ (Đại lý)')),
                      ],
                      onChanged: (v) {
                        if (v != null) creditLimit = v;
                      },
                    ),
                    const SizedBox(height: 10),

                    // Tọa độ GPS định vị
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.green.shade50,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.shade200),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.my_location, size: 16, color: Color(0xFF15803D)),
                          SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'GPS Tự Động: 10.7769, 106.7009 (Đã định vị)',
                              style: TextStyle(fontSize: 11, color: Color(0xFF15803D), fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: isSubmitting ? null : () => Navigator.pop(ctx),
              child: const Text('Hủy'),
            ),
            ElevatedButton.icon(
              onPressed: isSubmitting
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;
                      setDialogState(() => isSubmitting = true);

                      try {
                        final bodyPayload = json.encode({
                          'name': storeName.trim(),
                          'ownerName': ownerName.trim(),
                          'phone': phone.trim(),
                          'address': address.trim(),
                          'routeCode': targetRouteCode,
                          'district': 'Quận 1',
                          'creditLimit': creditLimit,
                          'latitude': lat,
                          'longitude': lng,
                        });

                        final res = await http.post(
                          Uri.parse(ApiConstants.outletsEndpoint),
                          headers: {'Content-Type': 'application/json; charset=utf-8'},
                          body: bodyPayload,
                        ).timeout(const Duration(seconds: 4));

                        Map<String, dynamic> newOutlet;
                        if (res.statusCode == 200 || res.statusCode == 201) {
                          newOutlet = json.decode(utf8.decode(res.bodyBytes));
                        } else {
                          newOutlet = {
                            'id': 'out-${DateTime.now().millisecondsSinceEpoch}',
                            'code': 'TH-00${_allOutlets.length + 1}',
                            'name': storeName.trim(),
                            'ownerName': ownerName.trim(),
                            'phone': phone.trim(),
                            'address': address.trim(),
                            'creditLimit': creditLimit,
                            'latitude': lat,
                            'longitude': lng,
                          };
                        }

                        final targetDay = _routeList.firstWhere(
                          (r) => r['code'] == targetRouteCode,
                          orElse: () => _routeList[1],
                        )['day'] ?? 'Thứ Hai';

                        newOutlet['status'] = 'Chưa ghé thăm';
                        newOutlet['routeCode'] = targetRouteCode;
                        newOutlet['dayOfWeek'] = targetDay;
                        newOutlet['currentDebt'] = newOutlet['currentDebt'] ?? 0;

                        setState(() {
                          _allOutlets.insert(0, newOutlet);
                          _selectedRouteCode = targetRouteCode;
                          _selectedDay = targetDay;
                          _selectedStatusFilter = 'ALL';
                        });

                        if (context.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('🎉 Đã mở tiệm mới: ${newOutlet['name']} và đồng bộ máy chủ thành công!'),
                              backgroundColor: const Color(0xFF15803D),
                              duration: const Duration(seconds: 5),
                              action: SnackBarAction(
                                label: 'Lên Đơn Ngay',
                                textColor: Colors.amber,
                                onPressed: () {
                                  _openVisitFlow(context, newOutlet, initialStep: 4);
                                },
                              ),
                            ),
                          );
                        }
                      } catch (e) {
                        final fallback = {
                          'id': 'out-${DateTime.now().millisecondsSinceEpoch}',
                          'code': 'TH-00${_allOutlets.length + 1}',
                          'name': storeName.trim(),
                          'ownerName': ownerName.trim(),
                          'phone': phone.trim(),
                          'address': address.trim(),
                          'creditLimit': creditLimit,
                          'currentDebt': 0,
                          'latitude': lat,
                          'longitude': lng,
                          'status': 'Chưa ghé thăm',
                          'routeCode': targetRouteCode,
                          'dayOfWeek': _routeList.firstWhere((r) => r['code'] == targetRouteCode)['day'] ?? 'Thứ Hai',
                        };

                        setState(() {
                          _allOutlets.insert(0, fallback);
                          _selectedRouteCode = targetRouteCode;
                          _selectedDay = fallback['dayOfWeek'];
                          _selectedStatusFilter = 'ALL';
                        });

                        if (context.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('🎉 Đã thêm tiệm mới ${fallback['name']}! (Sẽ tự động đồng bộ máy chủ)'),
                              backgroundColor: const Color(0xFF15803D),
                            ),
                          );
                        }
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF15803D),
                foregroundColor: Colors.white,
              ),
              icon: isSubmitting
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Icon(Icons.check, size: 16),
              label: Text(isSubmitting ? 'Đang lưu...' : 'Lưu & Đồng Bộ'),
            ),
          ],
        ),
      ),
    );
  }

  void _openVisitFlow(BuildContext context, Map<String, dynamic> item, {int initialStep = 1}) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => StoreVisitScreen(
          outlet: item,
          salesRepName: _salesRepName,
          initialStep: initialStep,
        ),
      ),
    ).then((_) {
      setState(() {});
    });
  }
}


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

/// ==========================================
/// QUY TRÌNH 5 BƯỚC VIẾNG THĂM TẠP HÓA (FMCG STANDARD)
/// ==========================================
class StoreVisitScreen extends StatefulWidget {
  final Map<String, dynamic> outlet;
  final String salesRepName;
  final int initialStep;

  const StoreVisitScreen({
    super.key,
    required this.outlet,
    required this.salesRepName,
    this.initialStep = 1,
  });

  @override
  State<StoreVisitScreen> createState() => _StoreVisitScreenState();
}

class _StoreVisitScreenState extends State<StoreVisitScreen> {
  late int _currentStep;
  bool _checkedIn = false;
  String _dateCheckNotes = 'Chocopie hộp còn 4 hộp cận date 06/2026; AFC còn 10 gói date xa.';

  // Danh mục 6 sản phẩm bánh kẹo FMCG phổ biến nhất
  final List<Map<String, dynamic>> _catalogProducts = [
    {
      'sku': 'ORION-CP-12P',
      'name': 'Bánh Chocopie Hộp 12 Cái (Orion)',
      'brand': 'Orion',
      'category': 'Bánh Chocopie',
      'vanStock': 40,
      'uoms': [
        {'name': 'Thùng', 'price': 480000, 'label': 'Thùng (8 Hộp)'},
        {'name': 'Hộp', 'price': 62000, 'label': 'Hộp (12 Cái)'},
      ],
    },
    {
      'sku': 'AFC-RAU-200G',
      'name': 'Bánh Quy AFC Dinh Dưỡng Vị Rau (Kinh Đô)',
      'brand': 'Kinh Đô',
      'category': 'Bánh Quy',
      'vanStock': 25,
      'uoms': [
        {'name': 'Thùng', 'price': 360000, 'label': 'Thùng (12 Hộp)'},
        {'name': 'Hộp', 'price': 32000, 'label': 'Hộp (Gói 200g)'},
      ],
    },
    {
      'sku': 'ORION-CUSTAS-6P',
      'name': 'Bánh Custas Kem Trứng 6P (Orion)',
      'brand': 'Orion',
      'category': 'Bánh Trứng',
      'vanStock': 30,
      'uoms': [
        {'name': 'Thùng', 'price': 420000, 'label': 'Thùng (10 Hộp)'},
        {'name': 'Hộp', 'price': 44000, 'label': 'Hộp (6 Cái)'},
      ],
    },
    {
      'sku': 'OISHI-BAP-CAY',
      'name': 'Snack Bắp Ngọt Cay Oishi (Gói lớn)',
      'brand': 'Oishi',
      'category': 'Snack',
      'vanStock': 50,
      'uoms': [
        {'name': 'Thùng', 'price': 240000, 'label': 'Thùng (10 Dây)'},
        {'name': 'Dây', 'price': 25000, 'label': 'Dây (10 Gói)'},
      ],
    },
    {
      'sku': 'COSY-ME-288G',
      'name': 'Bánh Quy Mè Cosy Marie (Kinh Đô)',
      'brand': 'Kinh Đô',
      'category': 'Bánh Quy',
      'vanStock': 20,
      'uoms': [
        {'name': 'Thùng', 'price': 340000, 'label': 'Thùng (12 Hộp)'},
        {'name': 'Hộp', 'price': 30000, 'label': 'Hộp (288g)'},
      ],
    },
    {
      'sku': 'ALPEN-DAU-16P',
      'name': 'Kẹo Ngậm Alpenliebe Hương Dâu (Perfetti)',
      'brand': 'Perfetti',
      'category': 'Kẹo Ngậm',
      'vanStock': 35,
      'uoms': [
        {'name': 'Thùng', 'price': 520000, 'label': 'Thùng (16 Hộp)'},
        {'name': 'Hộp', 'price': 35000, 'label': 'Hộp (16 Thanh)'},
      ],
    },
  ];

  // GIỎ HÀNG ĐA SẢN PHẨM (MULTI-ITEM CART)
  final Map<String, int> _cartQuantities = {};
  final Map<String, String> _cartSelectedUoms = {};

  // Thanh toán: MẶC ĐỊNH LÀ TIỀN MẶT
  String _paymentMethod = 'CASH'; // 'CASH', 'TRANSFER', 'DEBT'
  int _cashGiven = 0;
  String? _vietQrUrl;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _currentStep = widget.initialStep;

    // Khởi tạo giỏ hàng mẫu thực tế (2 Thùng Chocopie, 1 Thùng AFC)
    for (var p in _catalogProducts) {
      final String sku = p['sku'];
      _cartSelectedUoms[sku] = (p['uoms'] as List)[0]['name'];
      _cartQuantities[sku] = 0;
    }
    _cartQuantities['ORION-CP-12P'] = 2;
    _cartQuantities['AFC-RAU-200G'] = 1;

    _cashGiven = _totalAmount;
  }

  int _getItemPrice(String sku, String uomName) {
    final prod = _catalogProducts.firstWhere((p) => p['sku'] == sku);
    final uom = (prod['uoms'] as List).firstWhere(
      (u) => u['name'] == uomName,
      orElse: () => prod['uoms'][0],
    );
    return uom['price'] as int;
  }

  int get _totalAmount {
    int total = 0;
    _cartQuantities.forEach((sku, qty) {
      if (qty > 0) {
        final uomName = _cartSelectedUoms[sku] ?? 'Thùng';
        total += qty * _getItemPrice(sku, uomName);
      }
    });
    return total;
  }

  int get _totalItemsCount {
    int count = 0;
    _cartQuantities.forEach((sku, qty) {
      if (qty > 0) count++;
    });
    return count;
  }

  int get _totalUnitsCount {
    int units = 0;
    _cartQuantities.forEach((sku, qty) {
      units += qty;
    });
    return units;
  }

  List<Map<String, dynamic>> get _cartItemList {
    final list = <Map<String, dynamic>>[];
    for (var prod in _catalogProducts) {
      final sku = prod['sku'];
      final qty = _cartQuantities[sku] ?? 0;
      if (qty > 0) {
        final uom = _cartSelectedUoms[sku] ?? (prod['uoms'][0]['name'] as String);
        final price = _getItemPrice(sku, uom);
        list.add({
          'sku': sku,
          'name': prod['name'],
          'brand': prod['brand'],
          'uom': uom,
          'qty': qty,
          'price': price,
          'total': qty * price,
        });
      }
    }
    return list;
  }

  String _formatVnd(num amount) {
    return amount.toString().replaceAllMapped(
      RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'),
      (Match m) => '${m[1]}.',
    );
  }

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

  void _proceedToPayment() {
    final int amount = _totalAmount;
    setState(() {
      _cashGiven = amount;
      _vietQrUrl = 'https://img.vietqr.io/image/970422-0988889999-compact2.png?amount=$amount&addInfo=TT%20${widget.outlet['code']}&accountName=NPP%20BANH%20KEO%20AN%20PHAT';
      _currentStep = 5;
    });
  }

  Future<void> _finishOrder() async {
    final int total = _totalAmount;
    widget.outlet['status'] = 'Đã lên đơn';

    // Cập nhật công nợ nếu trả thiếu hoặc gối nợ
    if (_paymentMethod == 'CASH') {
      if (_cashGiven < total) {
        final remainingDebt = total - _cashGiven;
        widget.outlet['currentDebt'] = (widget.outlet['currentDebt'] ?? 0) + remainingDebt;
      }
    } else if (_paymentMethod == 'DEBT') {
      widget.outlet['currentDebt'] = (widget.outlet['currentDebt'] ?? 0) + total;
    }

    // Gửi đơn hàng lên Backend NestJS
    try {
      await http.post(
        Uri.parse(ApiConstants.ordersEndpoint),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'outletId': widget.outlet['id'],
          'salesRepName': widget.salesRepName,
          'items': _cartItemList.map((item) => {
            'productSku': item['sku'],
            'uomName': item['uom'],
            'quantity': item['qty'],
          }).toList(),
          'notes': 'Đơn hàng tạo từ Mobile Flutter SFA App',
        }),
      );
    } catch (_) {}

    if (!mounted) return;
    Navigator.pop(context);

    String paymentMsg = '';
    if (_paymentMethod == 'CASH') {
      if (_cashGiven >= total) {
        paymentMsg = 'Đã thu ${_formatVnd(total)} đ Tiền Mặt (Đủ 100%)';
      } else {
        paymentMsg = 'Thu trước ${_formatVnd(_cashGiven)} đ • Gối nợ ${_formatVnd(total - _cashGiven)} đ';
      }
    } else if (_paymentMethod == 'TRANSFER') {
      paymentMsg = 'Đã nhận Chuyển Khoản VietQR ${_formatVnd(total)} đ';
    } else {
      paymentMsg = 'Đã ghi nhận Nợ Gối Đầu 100% (${_formatVnd(total)} đ)';
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🎉 Hoàn tất đơn hàng tiệm ${widget.outlet['name']}!\n$paymentMsg'),
        backgroundColor: const Color(0xFF15803D),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _showQuickBackorderDialog() {
    int qty = 2;
    String uom = 'Thùng';
    String promisedDate = '2026-11-08';
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
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đã ghi nhớ giao bù thành công! Sẽ hiển thị ở Tab Giao Bù.')),
                );
              }
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

  void _showNoSaleInVisit() {
    String selectedReason = 'Còn nhiều hàng tồn kho bánh kẹo';
    final reasons = [
      'Còn nhiều hàng tồn kho bánh kẹo',
      'Chủ tiệm vắng mặt / Đi vắng',
      'Cửa hàng đóng cửa / Đang sửa chữa',
      'Chê giá cao / Đang chờ khuyến mãi khác',
      'Không có nhu cầu nhập chuyến này',
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Row(
            children: [
              Icon(Icons.report_problem_outlined, color: Colors.amber.shade800),
              const SizedBox(width: 8),
              const Text('Báo Không Mua Hàng', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Tiệm: ${widget.outlet['name']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              const SizedBox(height: 12),
              const Text('Lý do không đặt hàng hôm nay:', style: TextStyle(fontSize: 12, color: Colors.grey)),
              const SizedBox(height: 6),
              ...reasons.map((r) => RadioListTile<String>(
                title: Text(r, style: const TextStyle(fontSize: 13)),
                value: r,
                groupValue: selectedReason,
                dense: true,
                contentPadding: EdgeInsets.zero,
                activeColor: const Color(0xFF15803D),
                onChanged: (val) {
                  if (val != null) setDialogState(() => selectedReason = val);
                },
              )),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Quay lại'),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(ctx);
                widget.outlet['status'] = 'Không mua (${selectedReason})';
                try {
                  await http.post(
                    Uri.parse(ApiConstants.checkOutEndpoint),
                    headers: {'Content-Type': 'application/json'},
                    body: json.encode({
                      'visitId': widget.outlet['id'] ?? 'mock-visit',
                      'hasOrder': false,
                      'noOrderReason': selectedReason,
                      'notes': 'Sales ghi nhận không mua trong quy trình viếng thăm',
                    }),
                  );
                } catch (_) {}
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Đã ghi nhận: ${widget.outlet['name']} không mua (${selectedReason})'),
                      backgroundColor: Colors.blueGrey.shade800,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF15803D),
                foregroundColor: Colors.white,
              ),
              child: const Text('Xác Nhận & Thoát'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.outlet['name'] ?? 'Viếng Thăm Điểm Bán', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Text('Bước $_currentStep/5 • ${_getStepTitle(_currentStep)}', style: const TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
        backgroundColor: const Color(0xFF15803D),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.cancel_outlined),
            tooltip: 'Báo tiệm không mua hàng hôm nay',
            onPressed: _showNoSaleInVisit,
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // THANH TIẾN TRÌNH 5 BƯỚC: CHO PHÉP NHẤP TRỰC TIẾP VÀO BẤT KỲ BƯỚC NÀO!
            Container(
              padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: List.generate(5, (index) {
                  final int stepNum = index + 1;
                  final bool isCurrent = _currentStep == stepNum;
                  final bool isPassed = _currentStep > stepNum;

                  return Expanded(
                    child: GestureDetector(
                      onTap: () {
                        setState(() {
                          _currentStep = stepNum;
                          if (stepNum == 5) _proceedToPayment();
                        });
                      },
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              children: [
                                CircleAvatar(
                                  radius: 14,
                                  backgroundColor: isCurrent
                                      ? const Color(0xFFD97706)
                                      : isPassed
                                          ? const Color(0xFF15803D)
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
                                const SizedBox(height: 4),
                                Text(
                                  _getStepShortLabel(stepNum),
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                                    color: isCurrent
                                        ? const Color(0xFFD97706)
                                        : isPassed
                                            ? const Color(0xFF15803D)
                                            : Colors.grey.shade600,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                          if (index < 4)
                            Container(
                              width: 12,
                              height: 2,
                              color: isPassed ? const Color(0xFF15803D) : Colors.grey.shade300,
                            ),
                        ],
                      ),
                    ),
                  );
                }),
              ),
            ),
            const SizedBox(height: 16),

            // NÚT BỎ QUA BƯỚC ĐẦU (HIỆN Ở BƯỚC 1, 2, 3 ĐỂ NHẢY THẲNG LÊN ĐƠN)
            if (_currentStep < 4)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: () => setState(() => _currentStep = 4),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFD97706),
                    side: const BorderSide(color: Color(0xFFD97706), width: 1.5),
                    backgroundColor: const Color(0xFFFFFBEB),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.fast_forward, color: Color(0xFFD97706)),
                  label: const Text(
                    'Bỏ qua các bước đầu ➔ Lên Đơn Ngay (Bước 4)',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
              ),

            // BƯỚC 1: CHECK-IN GPS
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

            // BƯỚC 2: KIỂM DATE & TỒN QUẦY
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
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => setState(() => _currentStep = 3),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Tiếp Tục: Chụp Ảnh Quầy Kệ'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // BƯỚC 3: CHỤP ẢNH QUẦY KỆ
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
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: () => setState(() => _currentStep = 4),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                              ),
                              child: const Text('Tiếp Tục: Lên Đơn Đặt Hàng'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],

            // BƯỚC 4: GIỎ HÀNG ĐA SẢN PHẨM (MULTI-ITEM CART BÁNH KẸO FMCG)
            if (_currentStep == 4) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Bước 4: Lên Đơn Bánh Kẹo',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'Chọn nhiều mặt hàng & số lượng vào giỏ',
                                style: TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(6)),
                            child: Text(
                              'Đa ĐVT (Thùng/Hộp)',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green.shade800),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      // DANH MỤC CÁC SẢN PHẨM BÁNH KẸO
                      ..._catalogProducts.map((prod) {
                        final String sku = prod['sku'];
                        final String currentUom = _cartSelectedUoms[sku] ?? (prod['uoms'][0]['name'] as String);
                        final int qty = _cartQuantities[sku] ?? 0;
                        final int price = _getItemPrice(sku, currentUom);
                        final int lineTotal = qty * price;
                        final int vanStock = prod['vanStock'] as int;

                        return Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: qty > 0 ? const Color(0xFFF0FDF4) : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: qty > 0 ? Colors.green.shade300 : Colors.grey.shade200,
                              width: qty > 0 ? 1.5 : 1,
                            ),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          prod['name'],
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: qty > 0 ? Colors.green.shade900 : Colors.black87,
                                          ),
                                        ),
                                        const SizedBox(height: 2),
                                        Row(
                                          children: [
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.grey.shade200,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                prod['brand'],
                                                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black87),
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: Colors.blue.shade50,
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                              child: Text(
                                                'Tồn xe: $vanStock Thùng',
                                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blue.shade800),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),

                              // CHỌN ĐVT VÀ TĂNG GIẢM SỐ LƯỢNG
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  // Nút bấm chọn ĐVT
                                  Row(
                                    children: (prod['uoms'] as List).map<Widget>((u) {
                                      final bool isUomSelected = currentUom == u['name'];
                                      return Padding(
                                        padding: const EdgeInsets.only(right: 6),
                                        child: InkWell(
                                          onTap: () {
                                            setState(() {
                                              _cartSelectedUoms[sku] = u['name'];
                                              _cashGiven = _totalAmount;
                                            });
                                          },
                                          borderRadius: BorderRadius.circular(8),
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                            decoration: BoxDecoration(
                                              color: isUomSelected ? const Color(0xFF15803D) : Colors.white,
                                              borderRadius: BorderRadius.circular(8),
                                              border: Border.all(
                                                color: isUomSelected ? const Color(0xFF15803D) : Colors.grey.shade300,
                                              ),
                                            ),
                                            child: Text(
                                              '${u['name']} (${_formatVnd(u['price'])})',
                                              style: TextStyle(
                                                fontSize: 11,
                                                fontWeight: isUomSelected ? FontWeight.bold : FontWeight.normal,
                                                color: isUomSelected ? Colors.white : Colors.black87,
                                              ),
                                            ),
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),

                                  // Bộ tăng giảm số lượng [-] [QTY] [+]
                                  Row(
                                    children: [
                                      IconButton.filledTonal(
                                        icon: const Icon(Icons.remove, size: 14),
                                        style: IconButton.styleFrom(
                                          padding: const EdgeInsets.all(4),
                                          minimumSize: const Size(28, 28),
                                        ),
                                        onPressed: () {
                                          if (qty > 0) {
                                            setState(() {
                                              _cartQuantities[sku] = qty - 1;
                                              _cashGiven = _totalAmount;
                                            });
                                          }
                                        },
                                      ),
                                      Padding(
                                        padding: const EdgeInsets.symmetric(horizontal: 8),
                                        child: Text(
                                          '$qty',
                                          style: TextStyle(
                                            fontSize: 15,
                                            fontWeight: FontWeight.bold,
                                            color: qty > 0 ? const Color(0xFF15803D) : Colors.grey,
                                          ),
                                        ),
                                      ),
                                      IconButton.filled(
                                        style: IconButton.styleFrom(
                                          backgroundColor: const Color(0xFF16A34A),
                                          padding: const EdgeInsets.all(4),
                                          minimumSize: const Size(28, 28),
                                        ),
                                        icon: const Icon(Icons.add, size: 14),
                                        onPressed: () {
                                          setState(() {
                                            _cartQuantities[sku] = qty + 1;
                                            _cashGiven = _totalAmount;
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ],
                              ),

                              if (qty > 0) ...[
                                const Divider(height: 14),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Thành tiền ($qty $currentUom x ${_formatVnd(price)}đ):',
                                      style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                                    ),
                                    Text(
                                      '${_formatVnd(lineTotal)} đ',
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        );
                      }),

                      // Thông báo khuyến mãi FMCG
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFFFBEB),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.amber.shade200),
                        ),
                        child: Row(
                          children: [
                            const Text('🎉', style: TextStyle(fontSize: 16)),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                'Khuyến mãi: Tặng 1 Dây Snack Oishi Bắp Cay (0đ) cho đơn hàng từ 1.000.000đ!',
                                style: TextStyle(fontSize: 11, color: Colors.amber.shade900, fontWeight: FontWeight.w600),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // TỔNG TIỀN GIỎ HÀNG
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Giỏ hàng: $_totalItemsCount mặt hàng ($_totalUnitsCount kiện/thùng)',
                                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                                ),
                                Text(
                                  '${_formatVnd(_totalAmount)} đ',
                                  style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF15803D), fontSize: 18),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Nút Sang Bước 5
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: _totalAmount > 0 ? _proceedToPayment : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF16A34A),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              icon: const Icon(Icons.arrow_forward),
                              label: const Text('Tiếp Tục: Sang Bước 5 (Thanh Toán)', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
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

            // BƯỚC 5: THANH TOÁN (CHO CHỌN TIỀN MẶT HOẶC CHUYỂN KHOẢN, MẶC ĐỊNH LÀ TIỀN MẶT)
            if (_currentStep == 5) ...[
              Card(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Bước 5: Thanh Toán & Thu Tiền',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: Colors.green.shade50, borderRadius: BorderRadius.circular(6)),
                            child: const Text(
                              'Đơn Hàng Mới',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF15803D)),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Tiệm: ${widget.outlet['name']}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),

                      // TÓM TẮT GIỎ HÀNG BƯỚC 5
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          children: _cartItemList.map((it) {
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 2),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    '${it['qty']} ${it['uom']} x ${it['name']}',
                                    style: const TextStyle(fontSize: 11, color: Colors.black87),
                                  ),
                                  Text(
                                    '${_formatVnd(it['total'])} đ',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                      const SizedBox(height: 12),

                      // Hộp Tổng Tiền Cần Thu
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF0FDF4),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.green.shade200),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('SỐ TIỀN CẦN THU:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF15803D))),
                            Text(
                              '${_formatVnd(_totalAmount)} đ',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20, color: Color(0xFF15803D)),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),

                      const Text('Chọn Hình Thức Thanh Toán:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      const SizedBox(height: 8),

                      // 1. TIỀN MẶT (MẶC ĐỊNH - PHỔ BIẾN NHẤT)
                      InkWell(
                        onTap: () => setState(() => _paymentMethod = 'CASH'),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: _paymentMethod == 'CASH' ? const Color(0xFFF0FDF4) : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _paymentMethod == 'CASH' ? const Color(0xFF16A34A) : Colors.grey.shade300,
                              width: _paymentMethod == 'CASH' ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Radio<String>(
                                value: 'CASH',
                                groupValue: _paymentMethod,
                                activeColor: const Color(0xFF16A34A),
                                onChanged: (v) => setState(() => _paymentMethod = v!),
                              ),
                              const Icon(Icons.payments, color: Color(0xFF15803D)),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text('Tiền Mặt', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                        SizedBox(width: 6),
                                        Text('(Phổ biến nhất)', style: TextStyle(fontSize: 11, color: Colors.green, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                    Text('Thu tiền mặt trực tiếp tại tiệm tạp hóa', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // CHI TIẾT THU TIỀN MẶT & TÍNH NỢ GỐI ĐẦU NẾU TRẢ THIẾU
                      if (_paymentMethod == 'CASH') ...[
                        Container(
                          margin: const EdgeInsets.only(top: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.green.shade100),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Số tiền khách đưa:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  Expanded(
                                    child: TextFormField(
                                      key: ValueKey(_cashGiven),
                                      initialValue: '$_cashGiven',
                                      keyboardType: TextInputType.number,
                                      decoration: const InputDecoration(
                                        suffixText: 'đ',
                                        isDense: true,
                                        border: OutlineInputBorder(),
                                      ),
                                      onChanged: (v) {
                                        setState(() {
                                          _cashGiven = int.tryParse(v) ?? 0;
                                        });
                                      },
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  ElevatedButton(
                                    onPressed: () => setState(() => _cashGiven = _totalAmount),
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: const Color(0xFFDCFCE7),
                                      foregroundColor: const Color(0xFF15803D),
                                      elevation: 0,
                                    ),
                                    child: const Text('Đủ 100%'),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),

                              // CÁC NÚT BẤM NHANH MỆNH GIÁ TIỀN
                              SingleChildScrollView(
                                scrollDirection: Axis.horizontal,
                                child: Row(
                                  children: [500000, 1000000, 2000000, 3000000, 5000000].map((amt) {
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 6),
                                      child: ActionChip(
                                        label: Text('${amt ~/ 1000}k'),
                                        backgroundColor: Colors.grey.shade100,
                                        onPressed: () => setState(() => _cashGiven = amt),
                                      ),
                                    );
                                  }).toList(),
                                ),
                              ),
                              const SizedBox(height: 8),

                              // TÍNH TOÁN TIỀN THỐI HOẶC GỐI ĐẦU NỢ
                              if (_cashGiven >= _totalAmount) ...[
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text('Tiền thối lại cho tiệm:', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                                    Text(
                                      '${_formatVnd(_cashGiven - _totalAmount)} đ',
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.green.shade800,
                                      ),
                                    ),
                                  ],
                                ),
                              ] else ...[
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: Colors.amber.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: Colors.amber.shade200),
                                  ),
                                  child: Column(
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('Khách trả trước:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                                          Text('${_formatVnd(_cashGiven)} đ', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          const Text('Còn thiếu (Gối đầu nợ):', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.red)),
                                          Text(
                                            '${_formatVnd(_totalAmount - _cashGiven)} đ',
                                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.red),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 2),
                                      const Text(
                                        '➔ Số tiền còn thiếu sẽ được tự động cộng dồn vào Công nợ gối đầu của tiệm!',
                                        style: TextStyle(fontSize: 10, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),

                      // 2. CHUYỂN KHOẢN (VIETQR)
                      InkWell(
                        onTap: () => setState(() => _paymentMethod = 'TRANSFER'),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: _paymentMethod == 'TRANSFER' ? const Color(0xFFF0FDF4) : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _paymentMethod == 'TRANSFER' ? const Color(0xFF16A34A) : Colors.grey.shade300,
                              width: _paymentMethod == 'TRANSFER' ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Radio<String>(
                                value: 'TRANSFER',
                                groupValue: _paymentMethod,
                                activeColor: const Color(0xFF16A34A),
                                onChanged: (v) => setState(() => _paymentMethod = v!),
                              ),
                              const Icon(Icons.qr_code_2, color: Colors.blue),
                              const SizedBox(width: 8),
                              const Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('Chuyển Khoản (VietQR)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    Text('Chủ tiệm quét mã QR ngân hàng Napas 24/7', style: TextStyle(fontSize: 11, color: Colors.grey)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),

                      // CHI TIẾT MÃ VIETQR
                      if (_paymentMethod == 'TRANSFER') ...[
                        Container(
                          margin: const EdgeInsets.only(top: 10),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: Colors.blue.shade100),
                          ),
                          child: Column(
                            children: [
                              if (_vietQrUrl != null)
                                Image.network(
                                  _vietQrUrl!,
                                  width: 170,
                                  height: 170,
                                  errorBuilder: (context, error, stackTrace) => const Icon(Icons.qr_code, size: 90),
                                ),
                              const SizedBox(height: 8),
                              const Text(
                                'MBBank • STK: 0988889999\nNPP BANH KEO AN PHAT',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 10),

                      // 3. GHI NỢ GỐI ĐẦU 100%
                      InkWell(
                        onTap: () => setState(() => _paymentMethod = 'DEBT'),
                        borderRadius: BorderRadius.circular(12),
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: _paymentMethod == 'DEBT' ? const Color(0xFFF0FDF4) : Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _paymentMethod == 'DEBT' ? const Color(0xFF16A34A) : Colors.grey.shade300,
                              width: _paymentMethod == 'DEBT' ? 2 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Radio<String>(
                                value: 'DEBT',
                                groupValue: _paymentMethod,
                                activeColor: const Color(0xFF16A34A),
                                onChanged: (v) => setState(() => _paymentMethod = v!),
                              ),
                              const Icon(Icons.receipt_long, color: Colors.orange),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('Ghi Nợ Gối Đầu 100%', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    Text('Nợ hiện tại: ${_formatVnd(widget.outlet['currentDebt'] ?? 0)} đ', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),

                      // NÚT HOÀN TẤT ĐƠN HÀNG
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          onPressed: _finishOrder,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF16A34A),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          icon: const Icon(Icons.check_circle_outline),
                          label: Text(
                            _paymentMethod == 'CASH'
                                ? (_cashGiven >= _totalAmount
                                    ? 'XÁC NHẬN ĐÃ THU TIỀN MẶT (${_formatVnd(_totalAmount)} đ)'
                                    : 'XÁC NHẬN THU ${_formatVnd(_cashGiven)} đ + GỐI NỢ ${_formatVnd(_totalAmount - _cashGiven)} đ')
                                : _paymentMethod == 'TRANSFER'
                                    ? 'XÁC NHẬN ĐÃ CHUYỂN KHOẢN XONG'
                                    : 'XÁC NHẬN GHI NỢ GỐI ĐẦU 100%',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                        ),
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

  String _getStepTitle(int step) {
    switch (step) {
      case 1:
        return 'Check-in GPS';
      case 2:
        return 'Kiểm Date & Tồn';
      case 3:
        return 'Chụp Ảnh Quầy Kệ';
      case 4:
        return 'Lên Đơn Bánh Kẹo';
      case 5:
      default:
        return 'Thanh Toán & Thu Tiền';
    }
  }

  String _getStepShortLabel(int step) {
    switch (step) {
      case 1:
        return 'Check-in';
      case 2:
        return 'Date & Tồn';
      case 3:
        return 'Chụp ảnh';
      case 4:
        return 'Lên đơn';
      case 5:
      default:
        return 'Thu tiền';
    }
  }
}
