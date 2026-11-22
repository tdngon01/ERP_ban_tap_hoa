export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || undefined;
    const salesRepName = searchParams.get('salesRepName') || undefined;
    const list = await inventoryService.getBackorders(status, salesRepName);
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lấy nợ hàng' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const item = await inventoryService.createBackorder(body);
    return NextResponse.json(item);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo ghi nhớ nợ hàng' }, { status: 400 });
  }
}
