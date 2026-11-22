export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { settingsService } from '@/lib/services/settings.service';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'orders') as 'orders' | 'inventory' | 'debt';
    const csvContent = await settingsService.exportReportCsv(type);
    const filename = `bao_cao_${type}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Lỗi xuất báo cáo CSV' }, { status: 500 });
  }
}
