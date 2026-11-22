import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'KIM ĐÔ FMCG ERP - Hệ Thống Quản Trị & Phân Phối Bánh Kẹo Doanh Nghiệp',
  description: 'Giải pháp ERP & DMS chuyên sâu ngành Bánh kẹo & FMCG: Kho vận FEFO, Tuyến bán hàng MCP, Lên đơn nhanh & Gạch nợ VietQR 24/7',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
