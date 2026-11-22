export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const salesRepName = searchParams.get('salesRepName') || undefined;
    const data = await inventoryService.getVanStock(salesRepName);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lấy tồn kho xe' }, { status: 500 });
  }
}
