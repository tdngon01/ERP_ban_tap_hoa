export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { routesService } from '@/lib/services/routes.service';

export async function GET() {
  try {
    const visits = await routesService.getVisitHistory();
    return NextResponse.json(visits);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lấy lịch sử viếng thăm' }, { status: 500 });
  }
}
