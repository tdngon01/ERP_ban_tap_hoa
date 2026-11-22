export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, requiredBaseQty, warehouseId } = body;
    const allocations = await inventoryService.recommendFefoAllocation(
      productId,
      Number(requiredBaseQty),
      warehouseId
    );
    return NextResponse.json(allocations);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi đề xuất FEFO' }, { status: 400 });
  }
}
