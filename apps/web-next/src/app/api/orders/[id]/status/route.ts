export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { ordersService } from '@/lib/services/orders.service';

export async function GET() {
  try {
    const history = await ordersService.getReturnHistory();
    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lấy lịch sử đổi trả' }, { status: 500 });
  }
}
