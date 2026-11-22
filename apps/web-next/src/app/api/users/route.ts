export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { usersService } from '@/lib/services/users.service';
import { requireAuth } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const auth = requireAuth(req);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.errorMessage }, { status: auth.errorStatus });
    }

    const users = await usersService.findAll();
    return NextResponse.json(users);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // Chỉ Chủ NPP (ADMIN) mới có quyền tạo thêm tài khoản người dùng
    const auth = requireAuth(req, ['ADMIN']);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.errorMessage }, { status: auth.errorStatus });
    }

    const body = await req.json();
    const user = await usersService.create(body);
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo tài khoản' }, { status: 400 });
  }
}
