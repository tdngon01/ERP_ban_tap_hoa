import 'package:flutter/material.dart';

void main() {
  runApp(const SfaDmsApp());
}

class SfaDmsApp extends StatelessWidget {
  const SfaDmsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SFA DMS Bánh Kẹo',
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

  final List<Map<String, dynamic>> _mockOutlets = [
    {
      'code': 'TH-001',
      'name': 'Tạp Hóa Cô Ba Bến Nghé',
      'address': '18 Lê Lợi, Bến Nghé, Quận 1',
      'owner': 'Nguyễn Thị Ba',
      'debt': '4.500.000 đ',
      'status': 'Chưa ghé thăm',
    },
    {
      'code': 'TH-002',
      'name': 'Tạp Hóa Chị Lan Phố Đi Bộ',
      'address': '42 Nguyễn Huệ, Quận 1',
      'owner': 'Lê Hoàng Lan',
      'debt': '1.200.000 đ',
      'status': 'Đã lên đơn',
    },
    {
      'code': 'TH-003',
      'name': 'Đại Lý Bánh Kẹo Hưng Thịnh',
      'address': '88 Hai Bà Trưng, Quận 1',
      'owner': 'Phạm Hưng Thịnh',
      'debt': '12.500.000 đ',
      'status': 'Chưa ghé thăm',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('SFA Thị Trường', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            Text('Tuyến Thứ Hai • Sale: Nguyễn Văn Hùng', style: TextStyle(fontSize: 11, color: Colors.white70)),
          ],
        ),
        backgroundColor: const Color(0xFF15803D),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Đang đồng bộ dữ liệu ngoại tuyến (Offline Sync)...')),
              );
            },
          ),
        ],
      ),
      body: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: _mockOutlets.length,
        itemBuilder: (context, index) {
          final item = _mockOutlets[index];
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
                          item['code'],
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
                          item['status'],
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
                    item['name'],
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Chủ tiệm: ${item['owner']} • ${item['address']}',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
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
                            item['debt'],
                            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.red),
                          ),
                        ],
                      ),
                      ElevatedButton.icon(
                        onPressed: () {
                          _showVisitModal(context, item);
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF16A34A),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.location_on, size: 16),
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

  void _showVisitModal(BuildContext context, Map<String, dynamic> item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(24),
          height: 450,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Quy Trình 5 Bước: ${item['name']}',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 16),
              _buildStepTile(1, 'Check-in GPS & Xác thực khoảng cách', 'Kiểm tra tọa độ < 100m'),
              _buildStepTile(2, 'Kiểm Date & Tồn Quầy Bánh Kẹo', 'Ghi nhận hộp/gói cận date'),
              _buildStepTile(3, 'Chụp Ảnh Quầy Kệ Trưng Bày', 'Watermark GPS & thời gian'),
              _buildStepTile(4, 'Lên Đơn Nhanh Đa Đơn Vị Tính', 'Thùng/Hộp/Gói + Khuyến mãi'),
              _buildStepTile(5, 'Check-out & Quét VietQR Thu Nợ', 'Gạch nợ tự động'),
              const Spacer(),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Bắt đầu Check-in tại ${item['name']}')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('BẮT ĐẦU CHECK-IN GPS', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildStepTile(int stepNumber, String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          CircleAvatar(
            radius: 12,
            backgroundColor: Colors.green.shade100,
            child: Text('$stepNumber', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green.shade800)),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Text(subtitle, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
            ],
          ),
        ],
      ),
    );
  }
}

