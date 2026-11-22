export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { productsService } from '@/lib/services/products.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, uomName, quantity } = body;
    const result = await productsService.convertUom(productId, uomName, Number(quantity));
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi quy đổi đơn vị tính' }, { status: 400 });
  }
}
