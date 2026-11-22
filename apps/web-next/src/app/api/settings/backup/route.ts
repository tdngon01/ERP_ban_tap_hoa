export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings.service';

export async function POST() {
  try {
    const backup = await settingsService.createDatabaseBackup();
    return NextResponse.json(backup);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi tạo backup' }, { status: 500 });
  }
}
