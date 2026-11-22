export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { ordersService } from '@/lib/services/orders.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await ordersService.createReturnOrder(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lập phiếu đổi trả' }, { status: 400 });
  }
}
