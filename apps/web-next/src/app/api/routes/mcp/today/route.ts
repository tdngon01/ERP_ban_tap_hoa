export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { routesService } from '@/lib/services/routes.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dayOfWeek = searchParams.get('dayOfWeek') || undefined;
    const salesRepName = searchParams.get('salesRepName') || undefined;
    const data = await routesService.getTodayMcp(dayOfWeek, salesRepName);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}
