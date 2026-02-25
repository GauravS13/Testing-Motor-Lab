import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { sessionOptions, type SessionData } from './lib/session';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore as any, sessionOptions);

  const { pathname } = request.nextUrl;

  // 1. If user is NOT logged in and trying to access protected routes
  if (!session.isLoggedIn) {
    // List of protected routes
    const protectedRoutes = ['/test-session', '/results'];
    
    if (protectedRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 2. Role-based access: operators (userType 2) can only access /testing
  if (session.isLoggedIn && session.userType === 2) {
    const adminOnlyRoutes = ['/results', '/test-session'];
    if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/testing', request.url));
    }
  }

  // 3. If user IS logged in and trying to access the login page
  if (session.isLoggedIn && pathname === '/login') {
    return NextResponse.redirect(new URL('/testing', request.url));
  }

  // 4. For the root path '/', redirect to appropriate page
  if (pathname === '/') {
    if (session.isLoggedIn) {
      return NextResponse.redirect(new URL('/testing', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
