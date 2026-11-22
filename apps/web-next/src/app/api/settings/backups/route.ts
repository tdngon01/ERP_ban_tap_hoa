export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings.service';

export async function GET() {
  try {
    const list = await settingsService.listBackups();
    return NextResponse.json(list);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}
