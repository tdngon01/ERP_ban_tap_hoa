export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { debtService } from '@/lib/services/debt.service';

export async function GET() {
  try {
    const receipts = await debtService.getReceipts();
    return NextResponse.json(receipts);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lấy phiếu thu' }, { status: 500 });
  }
}
