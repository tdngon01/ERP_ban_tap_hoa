export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/services/google-sheets.service';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = await googleSheetsService.syncProductsFromSheet(body?.spreadsheetId);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi đồng bộ sản phẩm' }, { status: 400 });
  }
}
