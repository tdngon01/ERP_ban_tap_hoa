export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { ordersService } from '@/lib/services/orders.service';

export async function GET() {
  try {
    const promos = await ordersService.getPromotions();
    return NextResponse.json(promos);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const promo = await ordersService.createPromotion(body);
    return NextResponse.json(promo);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo chương trình khuyến mãi' }, { status: 400 });
  }
}
