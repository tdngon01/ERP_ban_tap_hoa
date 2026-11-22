export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { ordersService } from '@/lib/services/orders.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const outletId = searchParams.get('outletId') || undefined;
    const orders = await ordersService.findAll(status, outletId);
    return NextResponse.json(orders);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await ordersService.createOrder(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo đơn hàng' }, { status: 400 });
  }
}
