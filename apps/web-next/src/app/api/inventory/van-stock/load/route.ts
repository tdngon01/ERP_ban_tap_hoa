export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = await inventoryService.loadItemsToVan(body);
    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi bốc hàng lên xe' }, { status: 400 });
  }
}
