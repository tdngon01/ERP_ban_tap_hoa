export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { debtService } from '@/lib/services/debt.service';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await debtService.generateVietQr(body);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi sinh mã VietQR' }, { status: 400 });
  }
}
