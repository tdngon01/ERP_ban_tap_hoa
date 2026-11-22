export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'CONFIRMED';
    const data = await inventoryService.getPickingList(status);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lấy picking list' }, { status: 500 });
  }
}
