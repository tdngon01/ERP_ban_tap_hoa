export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { debtService } from '@/lib/services/debt.service';
import { requireAuth } from '@/lib/auth';

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req, ['ADMIN', 'ACCOUNTANT', 'SALES_REP']);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.errorMessage }, { status: auth.errorStatus });
    }

    const body = await req.json();
    const result = await debtService.recordPayment(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi lập phiếu thu nợ' }, { status: 400 });
  }
}
