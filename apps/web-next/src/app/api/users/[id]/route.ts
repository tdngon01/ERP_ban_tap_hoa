export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { usersService } from '@/lib/services/users.service';

export async function GET() {
  try {
    const rolesData = usersService.getRolesAndPermissions();
    return NextResponse.json(rolesData);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}
