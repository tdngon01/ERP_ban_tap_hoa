export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, oldPassword, newPassword } = body;

    if (!userId || !newPassword) {
      return NextResponse.json({ message: 'Thiếu thông tin đổi mật khẩu' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ message: 'Không tìm thấy người dùng' }, { status: 404 });
    }

    if (oldPassword && !verifyPassword(oldPassword, user.password)) {
      return NextResponse.json({ message: 'Mật khẩu cũ không chính xác' }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashPassword(newPassword) },
    });

    return NextResponse.json({ success: true, message: 'Đổi mật khẩu thành công!' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}
