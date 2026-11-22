export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { productsService } from '@/lib/services/products.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;

    const products = await productsService.findAll(search, category);
    return NextResponse.json(products);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const product = await productsService.create(body);
    return NextResponse.json(product);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo sản phẩm' }, { status: 400 });
  }
}
