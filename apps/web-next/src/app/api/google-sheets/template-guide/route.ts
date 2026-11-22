export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { googleSheetsService } from '@/lib/services/google-sheets.service';

export async function GET() {
  try {
    const guide = googleSheetsService.getTemplateInstructions();
    return NextResponse.json(guide);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}
