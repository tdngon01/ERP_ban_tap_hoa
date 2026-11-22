export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const lot = await inventoryService.createInboundLot(body);
    return NextResponse.json(lot);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi nhập kho PO' }, { status: 400 });
  }
}
