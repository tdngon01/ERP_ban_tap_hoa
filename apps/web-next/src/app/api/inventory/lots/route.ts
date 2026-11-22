export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const warehouseId = searchParams.get('warehouseId') || undefined;
    const fefoFilter = searchParams.get('fefoFilter') || undefined;

    const lots = await inventoryService.findAllLots(warehouseId, fefoFilter);
    return NextResponse.json(lots);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}
