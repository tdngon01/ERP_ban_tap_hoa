export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function GET() {
  try {
    const warehouses = await inventoryService.getWarehouses();
    return NextResponse.json(warehouses);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const warehouse = await inventoryService.createWarehouse(body);
    return NextResponse.json(warehouse);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo kho hàng' }, { status: 400 });
  }
}
