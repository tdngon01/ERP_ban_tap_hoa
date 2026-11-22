import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as crypto from 'crypto';

export function hashPassword(plain: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(plain, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (!stored) return false;
  if (!stored.includes(':')) {
    return plain === stored; // Hỗ trợ tài khoản cũ trước khi mã hóa
  }
  const [salt, hash] = stored.split(':');
  const calculated = crypto.scryptSync(plain, salt, 64).toString('hex');
  return calculated === hash;
}

export const SAFE_USER_SELECT = {
  id: true,
  username: true,
  fullName: true,
  role: true,
  phone: true,
  email: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
};

export interface UserRoleDefinition {
  key: string;
  name: string;
  badge: string;
  color: string;
  description: string;
  allowedTabs: string[];
  permissions: {
    canViewDashboard: boolean;
    canManageProducts: boolean;
    canManageInventory: boolean;
    canManagePicking: boolean;
    canManageOutlets: boolean;
    canManageRoutes: boolean;
    canManageOrders: boolean;
    canProcessReturns: boolean;
    canManageDebtVietQr: boolean;
    canSyncGoogleSheets: boolean;
    canManageSettings: boolean;
    canBackupDatabase: boolean;
    canManageUsers: boolean;
  };
}

export const ROLE_DEFINITIONS: Record<string, UserRoleDefinition> = {
  ADMIN: {
    key: 'ADMIN',
    name: 'Chủ NPP / Giám Đốc',
    badge: '👑 Toàn Quyền',
    color: 'amber',
    description: 'Toàn quyền quản trị toàn bộ hệ thống ERP, chỉ số doanh thu, tài chính, kho bãi và nhân sự.',
    allowedTabs: [
      'dashboard',
      'products',
      'inventory',
      'picking-list',
      'outlets',
      'routes',
      'orders',
      'debt',
      'google-sheets',
      'users',
      'settings',
      'mobile-sfa',
    ],
    permissions: {
      canViewDashboard: true,
      canManageProducts: true,
      canManageInventory: true,
      canManagePicking: true,
      canManageOutlets: true,
      canManageRoutes: true,
      canManageOrders: true,
      canProcessReturns: true,
      canManageDebtVietQr: true,
      canSyncGoogleSheets: true,
      canManageSettings: true,
      canBackupDatabase: true,
      canManageUsers: true,
    },
  },
  ACCOUNTANT: {
    key: 'ACCOUNTANT',
    name: 'Kế Toán / Thu Ngân',
    badge: '💼 Kế Toán',
    color: 'blue',
    description: 'Quản lý đơn hàng, công nợ gối đầu, sinh mã VietQR thu tiền, xuất hóa đơn giao hàng và xử lý đổi trả hàng.',
    allowedTabs: [
      'dashboard',
      'orders',
      'debt',
      'outlets',
      'products',
    ],
    permissions: {
      canViewDashboard: true,
      canManageProducts: false,
      canManageInventory: false,
      canManagePicking: false,
      canManageOutlets: true,
      canManageRoutes: false,
      canManageOrders: true,
      canProcessReturns: true,
      canManageDebtVietQr: true,
      canSyncGoogleSheets: false,
      canManageSettings: false,
      canBackupDatabase: false,
      canManageUsers: false,
    },
  },
  WAREHOUSE: {
    key: 'WAREHOUSE',
    name: 'Thủ Kho / Điều Phối',
    badge: '📦 Thủ Kho',
    color: 'emerald',
    description: 'Quản lý kho tổng, kiểm soát hạn sử dụng FEFO, bảng kê soạn hàng xe tải (Picking List) và xuất nhập tồn hàng.',
    allowedTabs: [
      'inventory',
      'picking-list',
      'products',
      'dashboard',
    ],
    permissions: {
      canViewDashboard: true,
      canManageProducts: true,
      canManageInventory: true,
      canManagePicking: true,
      canManageOutlets: false,
      canManageRoutes: false,
      canManageOrders: false,
      canProcessReturns: true,
      canManageDebtVietQr: false,
      canSyncGoogleSheets: false,
      canManageSettings: false,
      canBackupDatabase: false,
      canManageUsers: false,
    },
  },
  SUPERVISOR: {
    key: 'SUPERVISOR',
    name: 'Giám Sát Bán Hàng',
    badge: '🗺️ Giám Sát Tuyến',
    color: 'purple',
    description: 'Giám sát tuyến MCP Thứ 2 - Thứ 7, theo dõi GPS nhân viên, xem bảng thi đua chỉ tiêu doanh số & duyệt đơn.',
    allowedTabs: [
      'routes',
      'outlets',
      'dashboard',
      'orders',
      'mobile-sfa',
    ],
    permissions: {
      canViewDashboard: true,
      canManageProducts: false,
      canManageInventory: false,
      canManagePicking: false,
      canManageOutlets: true,
      canManageRoutes: true,
      canManageOrders: true,
      canProcessReturns: false,
      canManageDebtVietQr: false,
      canSyncGoogleSheets: false,
      canManageSettings: false,
      canBackupDatabase: false,
      canManageUsers: false,
    },
  },
  SALES_REP: {
    key: 'SALES_REP',
    name: 'Nhân Viên Van Sales',
    badge: '📱 Sale Thị Trường',
    color: 'teal',
    description: 'Sử dụng ứng dụng Mobile SFA: Check-in GPS điểm bán, lên đơn nhanh, mở tiệm mới trên tuyến và thu tiền VietQR.',
    allowedTabs: [
      'mobile-sfa',
      'outlets',
      'products',
    ],
    permissions: {
      canViewDashboard: false,
      canManageProducts: false,
      canManageInventory: false,
      canManagePicking: false,
      canManageOutlets: true,
      canManageRoutes: true,
      canManageOrders: true,
      canProcessReturns: true,
      canManageDebtVietQr: true,
      canSyncGoogleSheets: false,
      canManageSettings: false,
      canBackupDatabase: false,
      canManageUsers: false,
    },
  },
};

@Injectable()
export class UsersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  /**
   * Đảm bảo luôn có các tài khoản mặc định chuẩn FMCG
   */
  async ensureDefaultUsers() {
    const count = await this.prisma.user.count();
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
        await this.prisma.user.create({ data: u });
      }
    } else {
      // Tự động nâng cấp các tài khoản lưu dạng plaintext lên dạng băm an toàn
      const existingUsers = await this.prisma.user.findMany();
      for (const u of existingUsers) {
        if (!u.password || !u.password.includes(':')) {
          await this.prisma.user.update({
            where: { id: u.id },
            data: { password: hashPassword(u.password || defaultPassword) },
          });
        }
      }
    }
  }

  async findAll() {
    await this.ensureDefaultUsers();
    return this.prisma.user.findMany({
      select: SAFE_USER_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ id }, { username: id }],
      },
      select: SAFE_USER_SELECT,
    });
    if (!user) throw new NotFoundException('Không tìm thấy tài khoản người dùng');
    return user;
  }

  async create(data: {
    username: string;
    fullName: string;
    role: string;
    phone?: string;
    email?: string;
    password?: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { username: data.username.toLowerCase().trim() },
    });
    if (existing) {
      throw new BadRequestException(`Tên đăng nhập "${data.username}" đã tồn tại trên hệ thống`);
    }

    const validRole = ROLE_DEFINITIONS[data.role] ? data.role : 'SALES_REP';
    const defaultPassword = process.env.DEFAULT_USER_PASSWORD || '123456';
    const rawPass = data.password?.trim() || defaultPassword;

    return this.prisma.user.create({
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
  }

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

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: SAFE_USER_SELECT,
    });
  }

  async delete(id: string) {
    const user = await this.findOne(id);
    if (user.username === 'admin') {
      throw new BadRequestException('Không thể xóa tài khoản Quản trị viên tối cao (admin)');
    }
    return this.prisma.user.delete({ where: { id } });
  }

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
  }
}
