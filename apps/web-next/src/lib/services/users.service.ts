import prisma from '../prisma';
import { hashPassword, SAFE_USER_SELECT, ROLE_DEFINITIONS } from '../auth';

export const usersService = {
  async ensureDefaultUsers() {
    const count = await prisma.user.count();
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || '123456';

    if (count === 0) {
      const defaultUsers = [
        {
          username: 'admin',
          fullName: 'Trần Đại Nghĩa (Chủ NPP)',
          role: 'ADMIN',
          phone: '0908123456',
          email: 'admin@anphatfmcg.vn',
          password: hashPassword(defaultPassword),
        },
        {
          username: 'ketoan',
          fullName: 'Nguyễn Thu Hương',
          role: 'ACCOUNTANT',
          phone: '0912345678',
          email: 'huong.ketoan@anphatfmcg.vn',
          password: hashPassword(defaultPassword),
        },
        {
          username: 'thukho',
          fullName: 'Trần Văn Khoa',
          role: 'WAREHOUSE',
          phone: '0933456789',
          email: 'khoa.kho@anphatfmcg.vn',
          password: hashPassword(defaultPassword),
        },
        {
          username: 'giamsat',
          fullName: 'Lê Hoàng Nam',
          role: 'SUPERVISOR',
          phone: '0977889900',
          email: 'nam.giamsat@anphatfmcg.vn',
          password: hashPassword(defaultPassword),
        },
        {
          username: 'sale01',
          fullName: 'Nguyễn Văn Hùng',
          role: 'SALES_REP',
          phone: '0909123456',
          email: 'hung.sales@anphatfmcg.vn',
          password: hashPassword(defaultPassword),
        },
      ];

      for (const u of defaultUsers) {
        await prisma.user.create({ data: u });
      }
    } else {
      const existingUsers = await prisma.user.findMany();
      for (const u of existingUsers) {
        if (!u.password || !u.password.includes(':')) {
          await prisma.user.update({
            where: { id: u.id },
            data: { password: hashPassword(u.password || defaultPassword) },
          });
        }
      }
    }
  },

  async findAll() {
    await this.ensureDefaultUsers();
    return prisma.user.findMany({
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  },

  async findOne(id: string) {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id }, { username: id }],
      },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new Error('Không tìm thấy tài khoản người dùng');
    return user;
  },

  async create(data: {
    username: string;
    fullName: string;
    role: string;
    phone?: string;
    email?: string;
    password?: string;
  }) {
    const existing = await prisma.user.findUnique({
      where: { username: data.username.toLowerCase().trim() },
    });
    if (existing) {
      throw new Error(`Tên đăng nhập "${data.username}" đã tồn tại trên hệ thống`);
    }

    const validRole = ROLE_DEFINITIONS[data.role] ? data.role : 'SALES_REP';
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || '123456';
    const rawPass = data.password?.trim() || defaultPassword;

    return prisma.user.create({
      data: {
        username: data.username.toLowerCase().trim(),
        fullName: data.fullName.trim(),
        role: validRole,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        password: hashPassword(rawPass),
      },
      select: SAFE_USER_SELECT,
    });
  },

  async update(id: string, data: any) {
    await this.findOne(id);
    const updateData: any = {
      fullName: data.fullName,
      role: data.role,
      phone: data.phone,
      email: data.email,
      isActive: data.isActive,
    };
    if (data.password && data.password.trim()) {
      updateData.password = hashPassword(data.password.trim());
    }

    return prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_USER_SELECT,
    });
  },

  async delete(id: string) {
    const user = await this.findOne(id);
    if (user.username === 'admin') {
      throw new Error('Không thể xóa tài khoản Quản trị viên tối cao (admin)');
    }
    return prisma.user.delete({ where: { id } });
  },

  getRolesAndPermissions() {
    return {
      roles: Object.values(ROLE_DEFINITIONS),
      permissionsList: [
        { id: 'canViewDashboard', label: 'Xem Bảng Điều Hành & Chỉ Số Quản Trị KPI' },
        { id: 'canManageProducts', label: 'Quản lý Sản Phẩm, Bảng Giá & Đa ĐVT' },
        { id: 'canManageInventory', label: 'Quản trị Kho Bãi & Lô HSD FEFO' },
        { id: 'canManagePicking', label: 'Bảng Kê Soạn Hàng Xe Tải (Picking List)' },
        { id: 'canManageOutlets', label: 'Hồ Sơ Khách Hàng 360° & Mở Tiệm Mới' },
        { id: 'canManageRoutes', label: 'Lịch Trình Tuyến Bán Hàng MCP & GPS' },
        { id: 'canManageOrders', label: 'Lên Đơn Hàng & Áp Dụng Khuyến Mãi' },
        { id: 'canProcessReturns', label: 'Lập Phiếu Đổi Trả & Thu Hồi Hàng Lỗi' },
        { id: 'canManageDebtVietQr', label: 'Sổ Nợ Tạp Hóa & Gạch Nợ VietQR Tự Động' },
        { id: 'canSyncGoogleSheets', label: 'Đồng Bộ Hai Chiều Với Google Sheets' },
        { id: 'canManageSettings', label: 'Cài Đặt Hệ Thống & Ngân Hàng NPP' },
        { id: 'canBackupDatabase', label: 'Tạo Bản Sao Lưu CSDL (Snapshot DB)' },
        { id: 'canManageUsers', label: 'Phân Quyền & Quản Lý Người Dùng' },
      ],
    };
  },
};
