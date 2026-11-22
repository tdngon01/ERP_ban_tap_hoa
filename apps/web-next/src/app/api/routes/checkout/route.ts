export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { routesService } from '@/lib/services/routes.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await routesService.checkOut(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi check-out' }, { status: 400 });
  }
}
