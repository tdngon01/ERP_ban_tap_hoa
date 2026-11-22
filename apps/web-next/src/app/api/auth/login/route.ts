export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
  verifyPassword,
  generateToken,
  ROLE_DEFINITIONS,
  checkLoginRateLimit,
  recordFailedLogin,
  clearLoginRateLimit,
} from '@/lib/auth';
import { usersService } from '@/lib/services/users.service';

export async function POST(req: Request) {
  try {
    await usersService.ensureDefaultUsers();

    const body = await req.json();
    const { username, password } = body;

    if (!username) {
      return NextResponse.json({ message: 'Vui lòng nhập tên đăng nhập' }, { status: 400 });
    }

    const cleanUsername = username.toLowerCase().trim();

    // 1. Kiểm tra phòng chống Brute-force rate limit
    const rateCheck = checkLoginRateLimit(cleanUsername);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          message: `Tài khoản tạm thời bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ${rateCheck.waitMinutes} phút.`,
        },
        { status: 429 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { username: cleanUsername },
    });

    if (!user) {
      recordFailedLogin(cleanUsername);
      return NextResponse.json(
        { message: `Tài khoản "${cleanUsername}" không tồn tại trên hệ thống` },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { message: 'Tài khoản này đã bị khóa hoặc tạm ngưng hoạt động' },
        { status: 403 }
      );
    }

    // 2. Kiểm tra mật khẩu
    if (password) {
      const isMatch = verifyPassword(password, user.password);
      if (!isMatch) {
        recordFailedLogin(cleanUsername);
        return NextResponse.json({ message: 'Mật khẩu không chính xác' }, { status: 401 });
      }
    }

    // Đăng nhập thành công -> Xóa bộ đếm sai
    clearLoginRateLimit(cleanUsername);

    const token = generateToken(user);
    const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.ADMIN;

    const safeUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      email: user.email,
      avatarUrl: user.avatarUrl,
    };

    return NextResponse.json({
      message: 'Đăng nhập thành công',
      token,
      user: safeUser,
      roleInfo: roleDef,
      allowedTabs: roleDef.allowedTabs,
      permissions: roleDef.permissions,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}
