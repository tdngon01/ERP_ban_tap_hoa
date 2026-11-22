export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { debtService } from '@/lib/services/debt.service';

export async function GET() {
  try {
    const ledger = await debtService.getLedger();
    return NextResponse.json(ledger);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lấy sổ nợ' }, { status: 500 });
  }
}
