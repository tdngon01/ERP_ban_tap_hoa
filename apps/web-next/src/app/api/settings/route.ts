export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings.service';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    const settings = await settingsService.getSettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi server' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = requireAuth(req, ['ADMIN']);
    if (!auth.isAuthorized) {
      return NextResponse.json({ message: auth.errorMessage }, { status: auth.errorStatus });
    }

    const body = await req.json();
    const settings = await settingsService.updateSettings(body);
    return NextResponse.json(settings);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi cập nhật cấu hình' }, { status: 400 });
  }
}
