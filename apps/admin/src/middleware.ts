import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const isLoginPage = request.nextUrl.pathname === '/login';
  
  // Redirect root to /events
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/events', request.url));
  }

  // Let client-side AuthGuard handle authentication checks
  // since we use localStorage which is not accessible in middleware
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
