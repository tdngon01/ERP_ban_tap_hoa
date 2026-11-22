import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. Chống Clickjacking
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');

  // 2. Chống MIME-sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // 3. Chính sách Referrer an toàn
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // 4. Giới hạn quyền truy cập phần cứng (Chỉ cho phép GPS và Camera chụp ảnh tiệm)
  response.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()');

  // 5. Chống XSS trên trình duyệt cũ
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // 6. Cho phép CORS gọi từ Mobile Flutter hoặc các domain được ủy quyền
  response.headers.set('Access-Control-Allow-Origin', '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: response.headers,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
