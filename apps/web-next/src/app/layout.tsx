import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ERP Phân Phối Bánh Kẹo FMCG & DMS SFA',
  description: 'Hệ thống Quản trị Bán hàng & Phân phối Bánh kẹo FMCG trên nền tảng Supabase Cloud & Next.js Vercel',
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
