import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    '/login',
    '/api/login',
    '/favicon.ico',
  ];

  const isPublic =
    publicPaths.includes(pathname) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public');

  if (isPublic) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get('pdzc_auth');

  if (authCookie?.value === 'ok') {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!api/dashboard).*)'],
};