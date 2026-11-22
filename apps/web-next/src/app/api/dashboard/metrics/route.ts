export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { dashboardService } from '@/lib/services/dashboard.service';

export async function GET() {
  try {
    const data = await dashboardService.getMetrics();
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tải chỉ số dashboard' }, { status: 500 });
  }
}
