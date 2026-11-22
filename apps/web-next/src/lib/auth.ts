import crypto from 'crypto';

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

const JWT_SECRET = process.env.JWT_SECRET || 'fmcg_erp_dms_jwt_secret_anphat_2026_super_key_security';

export function generateToken(user: any): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 3600, // 7 ngày
    })
  ).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token: string): any {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${payload}`)
    .digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (
    sigBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * Trích xuất và xác thực người dùng từ Authorization Header của request
 */
export function getAuthUser(req: Request): any {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  return verifyToken(token);
}

/**
 * Middleware bảo vệ API Backend: Kiểm tra Token hợp lệ & Phân quyền Vai Trò (RBAC)
 */
export function requireAuth(req: Request, allowedRoles?: string[]): {
  isAuthorized: boolean;
  user: any | null;
  errorStatus?: number;
  errorMessage?: string;
} {
  const user = getAuthUser(req);
  if (!user) {
    return {
      isAuthorized: false,
      user: null,
      errorStatus: 401,
      errorMessage: 'Yêu cầu đăng nhập. Thiếu token hoặc token đã hết hạn.',
    };
  }

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return {
        isAuthorized: false,
        user,
        errorStatus: 403,
        errorMessage: `Quyền truy cập bị từ chối: Vai trò [${user.role}] không được phép thực hiện thao tác này.`,
      };
    }
  }

  return {
    isAuthorized: true,
    user,
  };
}

// Bộ lưu trữ bộ nhớ bảo vệ chống Brute-force mật khẩu (5 lần sai -> khóa 15 phút)
const loginAttemptsMap = new Map<string, { attempts: number; blockedUntil: number }>();

export function checkLoginRateLimit(identifier: string): { allowed: boolean; waitMinutes?: number } {
  const key = identifier.toLowerCase().trim();
  const record = loginAttemptsMap.get(key);
  if (!record) return { allowed: true };

  const now = Date.now();
  if (record.blockedUntil > now) {
    const remaining = Math.ceil((record.blockedUntil - now) / 60000);
    return { allowed: false, waitMinutes: remaining };
  }

  // Hết thời gian phạt, reset lại
  if (record.blockedUntil > 0 && record.blockedUntil <= now) {
    loginAttemptsMap.delete(key);
  }

  return { allowed: true };
}

export function recordFailedLogin(identifier: string) {
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const record = loginAttemptsMap.get(key) || { attempts: 0, blockedUntil: 0 };
  record.attempts += 1;

  if (record.attempts >= 5) {
    record.blockedUntil = now + 15 * 60 * 1000; // Khóa 15 phút
  }
  loginAttemptsMap.set(key, record);
}

export function clearLoginRateLimit(identifier: string) {
  loginAttemptsMap.delete(identifier.toLowerCase().trim());
}
