export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/services/google-sheets.service';

export async function GET() {
  try {
    const result = await googleSheetsService.exportOrdersToSheet();
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi xuất đơn hàng' }, { status: 500 });
  }
}
