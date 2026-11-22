export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { routesService } from '@/lib/services/routes.service';

export async function GET() {
  try {
    const routes = await routesService.findAll();
    return NextResponse.json(routes);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const route = await routesService.createRoute(body);
    return NextResponse.json(route);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo tuyến' }, { status: 400 });
  }
}
