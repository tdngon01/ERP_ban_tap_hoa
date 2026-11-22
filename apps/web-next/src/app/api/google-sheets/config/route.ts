export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/services/google-sheets.service';

export async function GET() {
  try {
    const config = await googleSheetsService.getMaskedConfig();
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const config = await googleSheetsService.updateConfig(body);
    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi cập nhật cấu hình Google Sheets' }, { status: 400 });
  }
}
