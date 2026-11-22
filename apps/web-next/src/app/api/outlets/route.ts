export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { outletsService } from '@/lib/services/outlets.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const routeId = searchParams.get('routeId') || undefined;
    const search = searchParams.get('search') || undefined;
    const outlets = await outletsService.findAll(routeId, search);
    return NextResponse.json(outlets);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const outlet = await outletsService.create(body);
    return NextResponse.json(outlet);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo điểm bán' }, { status: 400 });
  }
}
